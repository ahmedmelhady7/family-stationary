import { bootstrapPage } from '../../app-shell.js';
import { ensureAdminAuth } from '../../utils/auth-guard.js';
import { renderAdminNav } from '../../components/admin-nav.js';
import { listCategories, listProducts, updateProductStatus, deleteProduct } from '../../services/catalog.js';
import { formatPrice } from '../../utils/format.js';
import { showToast } from '../../components/toast.js';
import { translateDom } from '../../i18n.js';

const filters = {
  q: '',
  category: '',
  status: '',
  page: 1,
  sort: 'newest',
};

async function renderCategoryFilter() {
  const categories = await listCategories();
  const select = document.querySelector('#admin-category-filter');
  if (!select) {
    return;
  }

  select.innerHTML = '<option value="" data-i18n="products:listing.all_categories"></option>';
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name_ar;
    select.append(option);
  });

  translateDom(select);
}

function statusLabel(status, stock) {
  if (Number(stock) <= 0 || status === 'out_of_stock') {
    return 'admin:products.status_out_of_stock';
  }
  if (status === 'active') {
    return 'admin:products.status_active';
  }
  return 'admin:products.status_inactive';
}

async function renderTable() {
  const body = document.querySelector('#admin-products-body');
  if (!body) {
    return;
  }

  const result = await listProducts({
    q: filters.q,
    category: filters.category,
    status: filters.status || undefined,
    page: filters.page,
    sort: filters.sort,
    pageSize: 12,
    adminMode: true,
  });

  body.innerHTML = result.items
    .map((product) => {
      return `
        <tr data-product-id="${product.id}">
          <td>${product.name_ar}</td>
          <td>${formatPrice(product.price, product.currency)}</td>
          <td><span data-i18n="${statusLabel(product.status, product.stock_quantity)}"></span></td>
          <td>
            <button type="button" class="button button--secondary" data-action="toggle"></button>
            <a class="button button--secondary" href="/admin/product-edit.html?id=${product.id}"></a>
            <button type="button" class="button button--danger" data-action="delete"></button>
          </td>
        </tr>
      `;
    })
    .join('');

  body.querySelectorAll('[data-action="toggle"]').forEach((button) => {
    button.dataset.i18n = 'common:actions.save';
    button.addEventListener('click', async () => {
      const row = button.closest('tr');
      const productId = row?.dataset.productId;
      if (!productId) {
        return;
      }
      const product = result.items.find((item) => item.id === productId);
      const nextStatus = product.status === 'active' ? 'inactive' : 'active';
      await updateProductStatus(productId, nextStatus);
      showToast('success', 'admin:toast.saved');
      await renderTable();
    });
  });

  body.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.dataset.i18n = 'admin:products.delete_product';
    button.addEventListener('click', async () => {
      const row = button.closest('tr');
      const productId = row?.dataset.productId;
      if (!productId) {
        return;
      }
      await deleteProduct(productId);
      showToast('success', 'admin:toast.deleted');
      await renderTable();
    });
  });

  body.querySelectorAll('a[href^="/admin/product-edit.html"]').forEach((link) => {
    link.dataset.i18n = 'admin:products.edit_product';
  });

  translateDom(body.closest('table') || body);
}

async function initProductsPage() {
  if (!(await ensureAdminAuth())) {
    return;
  }

  await bootstrapPage({ activePath: '/admin/products.html' });
  renderAdminNav('/admin/products.html');

  await renderCategoryFilter();
  await renderTable();

  const filterForm = document.querySelector('#admin-products-filter-form');
  filterForm?.addEventListener('input', async () => {
    const data = new FormData(filterForm);
    filters.q = String(data.get('q') || '');
    filters.category = String(data.get('category') || '');
    filters.status = String(data.get('status') || '');
    filters.sort = String(data.get('sort') || 'newest');
    filters.page = 1;
    await renderTable();
  });
}

initProductsPage();
