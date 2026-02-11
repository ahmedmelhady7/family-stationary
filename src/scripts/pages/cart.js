import { bootstrapPage } from '../app-shell.js';
import { getCart, removeFromCart, updateQuantity } from '../services/cart.js';
import { getProductById } from '../services/catalog.js';
import { formatPrice } from '../utils/format.js';
import { translateDom } from '../i18n.js';

async function buildCartEntries() {
  const cart = getCart();
  const entries = [];

  for (const item of cart) {
    const product = await getProductById(item.productId);
    if (!product) {
      continue;
    }
    entries.push({ item, product });
  }

  return entries;
}

async function renderCartPage() {
  const root = document.querySelector('#cart-root');
  if (!root) {
    return;
  }

  const entries = await buildCartEntries();

  if (!entries.length) {
    root.innerHTML = `
      <section class="cart-empty">
        <img src="/assets/icons/lantern.svg" class="confirmation__icon" alt="lantern" />
        <h1 data-i18n="products:cart.empty_title"></h1>
        <p data-i18n="products:cart.empty_description"></p>
        <a href="/products.html" class="button button--gold" data-i18n="common:actions.continue_shopping"></a>
      </section>
    `;
    translateDom(root);
    return;
  }

  let total = 0;
  const rows = entries
    .map(({ item, product }) => {
      const subtotal = product.price * item.quantity;
      total += subtotal;
      return `
        <article class="cart-item" data-product-id="${product.id}">
          <div class="cart-item__image"><img src="${product.images?.[0] || '/assets/icons/lantern.svg'}" alt="${product.name_ar}" /></div>
          <div class="cart-item__meta">
            <h2>${product.name_ar}</h2>
            <p>${formatPrice(product.price, product.currency)}</p>
            <label>
              <span data-i18n="common:labels.quantity"></span>
              <input class="form-control" type="number" min="1" max="50" value="${item.quantity}" data-action="qty" />
            </label>
          </div>
          <div>
            <p>${formatPrice(subtotal, product.currency)}</p>
            <button type="button" class="button button--danger" data-action="remove" data-i18n="common:actions.remove"></button>
          </div>
        </article>
      `;
    })
    .join('');

  root.innerHTML = `
    <section>
      <h1 data-i18n="products:cart.title"></h1>
      <div class="cart-list">${rows}</div>
      <aside class="cart-summary">
        <p><span data-i18n="common:labels.subtotal"></span>: <strong>${formatPrice(total)}</strong></p>
        <p><span data-i18n="common:labels.delivery_fee"></span>: <strong data-i18n="common:labels.free"></strong></p>
        <p><span data-i18n="common:labels.total"></span>: <strong>${formatPrice(total)}</strong></p>
        <a class="button button--gold" href="/checkout.html" data-i18n="common:actions.proceed_checkout"></a>
      </aside>
    </section>
  `;

  root.querySelectorAll('[data-action="remove"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const row = button.closest('[data-product-id]');
      removeFromCart(row?.dataset.productId || '');
      await renderCartPage();
    });
  });

  root.querySelectorAll('[data-action="qty"]').forEach((input) => {
    input.addEventListener('change', async () => {
      const row = input.closest('[data-product-id]');
      updateQuantity(row?.dataset.productId || '', Number(input.value || 1));
      await renderCartPage();
    });
  });

  translateDom(root);
}

async function initCartPage() {
  await bootstrapPage({ activePath: '/cart.html' });
  await renderCartPage();
}

initCartPage();
