import { bootstrapPage } from '../app-shell.js';
import { listCategories, listProducts } from '../services/catalog.js';
import { renderProductCard } from '../components/product-card.js';
import { addToCart } from '../services/cart.js';
import { showToast } from '../components/toast.js';
import { translateDom } from '../i18n.js';

function readFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return {
    category: params.get('category') || '',
    q: params.get('q') || '',
    page: Number(params.get('page') || '1'),
    sort: params.get('sort') || 'newest',
  };
}

function updateUrl(filters) {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.q) params.set('q', filters.q);
  if (filters.page > 1) params.set('page', String(filters.page));
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  const query = params.toString();
  window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
}

async function renderFilters(filters) {
  const categories = await listCategories();
  const select = document.querySelector('#category-filter');
  if (!select) {
    return;
  }

  select.innerHTML = '<option value="" data-i18n="products:listing.all_categories"></option>';

  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name_ar;
    option.selected = filters.category === category.id;
    select.append(option);
  });

  const qInput = document.querySelector('#search-input');
  const sortSelect = document.querySelector('#sort-filter');
  if (qInput) qInput.value = filters.q;
  if (sortSelect) sortSelect.value = filters.sort;

  translateDom(select);
}

async function renderProducts(filters) {
  const root = document.querySelector('#products-grid');
  const pagination = document.querySelector('#products-pagination');
  if (!root || !pagination) {
    return;
  }

  const result = await listProducts(filters);
  root.innerHTML = '';

  result.items.forEach((product) => {
    const card = renderProductCard(product, {
      onAddToCart: () => {
        addToCart(product.id, 1);
        showToast('success', 'admin:toast.saved');
      },
    });
    root.append(card);
  });

  pagination.innerHTML = `
    <button type="button" class="button button--secondary" data-page="${Math.max(1, result.page - 1)}" ${result.page <= 1 ? 'disabled' : ''} data-i18n="common:pagination.previous"></button>
    <span>${result.page} / ${result.totalPages}</span>
    <button type="button" class="button button--secondary" data-page="${Math.min(result.totalPages, result.page + 1)}" ${result.page >= result.totalPages ? 'disabled' : ''} data-i18n="common:pagination.next"></button>
  `;

  pagination.querySelectorAll('button[data-page]').forEach((button) => {
    button.addEventListener('click', async () => {
      filters.page = Number(button.dataset.page);
      updateUrl(filters);
      await renderProducts(filters);
    });
  });

  translateDom(pagination);
}

async function initProductsPage() {
  await bootstrapPage({ activePath: '/products.html' });
  const filters = readFiltersFromUrl();
  await renderFilters(filters);
  await renderProducts(filters);

  const form = document.querySelector('#products-filter-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    filters.category = String(data.get('category') || '');
    filters.q = String(data.get('q') || '').trim();
    filters.sort = String(data.get('sort') || 'newest');
    filters.page = 1;
    updateUrl(filters);
    await renderProducts(filters);
  });
}

initProductsPage();
