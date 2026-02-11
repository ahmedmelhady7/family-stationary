import { bootstrapPage } from '../app-shell.js';
import { listCategories, listFeaturedProducts } from '../services/catalog.js';
import { addToCart } from '../services/cart.js';
import { renderProductCard } from '../components/product-card.js';
import { showToast } from '../components/toast.js';
import { translateDom } from '../i18n.js';

async function renderCategories() {
  const root = document.querySelector('#home-categories');
  if (!root) {
    return;
  }

  const categories = await listCategories();
  root.innerHTML = '';

  for (const category of categories) {
    const node = document.createElement('a');
    node.className = 'category-card';
    node.href = `/products.html?category=${encodeURIComponent(category.id)}`;
    node.innerHTML = `
      <h3>${category.name_ar}</h3>
      <p class="text-muted" data-i18n="products:listing.filters"></p>
    `;
    root.append(node);
  }

  translateDom(root);
}

async function renderFeatured() {
  const root = document.querySelector('#home-featured');
  if (!root) {
    return;
  }

  const products = await listFeaturedProducts();
  root.innerHTML = '';

  products.forEach((product) => {
    const card = renderProductCard(product, {
      onAddToCart: () => {
        addToCart(product.id, 1);
        showToast('success', 'admin:toast.saved');
      },
    });
    root.append(card);
  });
}

async function initHomePage() {
  await bootstrapPage({ activePath: '/index.html' });
  await renderCategories();
  await renderFeatured();
}

initHomePage();
