import { formatPrice } from '../utils/format.js';
import { t, translateDom } from '../i18n.js';

export function renderProductCard(product, options = {}) {
  const stockStatus = Number(product.stock_quantity) > 0 ? 'products:badges.in_stock' : 'products:badges.out_of_stock';

  const article = document.createElement('article');
  article.className = 'card product-card';
  article.setAttribute('role', 'article');
  article.dataset.productId = product.id;

  article.innerHTML = `
    <div class="product-card__image" aria-hidden="true">
      <img src="${product.images?.[0] || '/assets/icons/lantern.svg'}" alt="" loading="lazy" />
    </div>
    <div class="card__body">
      <h3 class="card__title">${product.name_ar}</h3>
      <p class="card__meta">${product.description_ar || ''}</p>
      <p class="product-card__price">${formatPrice(product.price, product.currency)}</p>
      <span class="badge badge--in-stock" data-i18n="${stockStatus}"></span>
      <div class="product-card__actions">
        <a class="button button--secondary" href="/product.html?slug=${encodeURIComponent(product.slug)}" data-i18n="common:actions.view_details"></a>
        <button class="button button--gold" type="button" data-action="add-to-cart" data-product-id="${product.id}" ${Number(product.stock_quantity) <= 0 ? 'disabled aria-disabled="true"' : ''}>${t('common:actions.add_to_cart')}</button>
      </div>
    </div>
  `;

  translateDom(article);
  if (typeof options.onAddToCart === 'function') {
    article.querySelector('[data-action="add-to-cart"]')?.addEventListener('click', () => {
      options.onAddToCart(product);
    });
  }

  return article;
}
