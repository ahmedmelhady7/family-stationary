import { bootstrapPage } from '../app-shell.js';
import { getProductBySlug, listProducts } from '../services/catalog.js';
import { addToCart } from '../services/cart.js';
import { renderProductCard } from '../components/product-card.js';
import { showToast } from '../components/toast.js';
import { formatPrice } from '../utils/format.js';
import { t, translateDom } from '../i18n.js';

async function renderProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');
  const container = document.querySelector('#product-detail');
  const related = document.querySelector('#related-products');

  if (!container || !slug) {
    return;
  }

  const product = await getProductBySlug(slug);
  if (!product) {
    container.innerHTML = `<p>${t('common:labels.empty')}</p>`;
    return;
  }

  container.innerHTML = `
    <section class="product-layout">
      <div class="product-gallery">
        <div class="product-gallery__main">
          <img src="${product.images?.[0] || '/assets/icons/lantern.svg'}" alt="${product.name_ar}" />
        </div>
      </div>
      <div class="product-info">
        <h1>${product.name_ar}</h1>
        <p>${product.description_ar || ''}</p>
        <p class="product-card__price">${formatPrice(product.price, product.currency)}</p>
        <p>
          <span class="badge ${Number(product.stock_quantity) > 0 ? 'badge--in-stock' : 'badge--error'}" data-i18n="${Number(product.stock_quantity) > 0 ? 'products:detail.in_stock' : 'products:detail.out_of_stock'}"></span>
        </p>
        <div>
          <button type="button" id="pdp-add" class="button button--gold" ${Number(product.stock_quantity) <= 0 ? 'disabled' : ''} data-i18n="common:actions.add_to_cart"></button>
          <a class="button button--secondary" href="https://wa.me/?text=${encodeURIComponent(window.location.href)}" target="_blank" rel="noreferrer" data-i18n="products:detail.share_whatsapp"></a>
        </div>
      </div>
    </section>
  `;

  document.querySelector('#pdp-add')?.addEventListener('click', () => {
    addToCart(product.id, 1);
    showToast('success', 'admin:toast.saved');
  });

  if (related) {
    const sameCategory = await listProducts({ category: product.category_id, pageSize: 4 });
    related.innerHTML = '';
    sameCategory.items
      .filter((item) => item.id !== product.id)
      .slice(0, 3)
      .forEach((item) => {
        related.append(
          renderProductCard(item, {
            onAddToCart: () => {
              addToCart(item.id, 1);
              showToast('success', 'admin:toast.saved');
            },
          }),
        );
      });
  }

  translateDom(container);
  translateDom(related || container);
}

async function initProductPage() {
  await bootstrapPage({ activePath: '/products.html' });
  await renderProductDetail();
}

initProductPage();
