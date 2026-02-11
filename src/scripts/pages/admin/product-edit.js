import { bootstrapPage } from '../../app-shell.js';
import { ensureAdminAuth } from '../../utils/auth-guard.js';
import { renderAdminNav } from '../../components/admin-nav.js';
import { getProductById, listCategories, saveProduct } from '../../services/catalog.js';
import { showToast } from '../../components/toast.js';

function queryProductId() {
  return new URLSearchParams(window.location.search).get('id');
}

async function hydrateCategories() {
  const select = document.querySelector('#product-category');
  if (!select) {
    return;
  }

  const categories = await listCategories();
  select.innerHTML = categories
    .map((category) => `<option value="${category.id}">${category.name_ar}</option>`)
    .join('');
}

async function hydrateProduct() {
  const productId = queryProductId();
  if (!productId) {
    return;
  }

  const product = await getProductById(productId);
  if (!product) {
    return;
  }

  const form = document.querySelector('#admin-product-form');
  if (!form) {
    return;
  }

  const fields = {
    id: product.id,
    name_ar: product.name_ar,
    price: String(product.price),
    description_ar: product.description_ar,
    category_id: product.category_id,
    stock_quantity: String(product.stock_quantity),
    status: product.status,
    is_featured: product.is_featured ? 'on' : '',
  };

  Object.entries(fields).forEach(([key, value]) => {
    const input = form.elements.namedItem(key);
    if (!input) {
      return;
    }
    if (input instanceof HTMLInputElement && input.type === 'checkbox') {
      input.checked = value === 'on';
      return;
    }
    input.value = value;
  });

  const previews = document.querySelector('#image-preview-list');
  if (previews) {
    previews.innerHTML = (product.images || [])
      .map((src) => `<img src="${src}" alt="preview" />`)
      .join('');
  }
}

function initDropZone() {
  const dropZone = document.querySelector('#image-drop-zone');
  const fileInput = document.querySelector('#product-images');
  const previews = document.querySelector('#image-preview-list');

  if (!dropZone || !fileInput || !previews) {
    return;
  }

  const renderFiles = (files) => {
    previews.innerHTML = '';
    [...files].slice(0, 5).forEach((file) => {
      const url = URL.createObjectURL(file);
      const image = document.createElement('img');
      image.src = url;
      image.alt = 'preview';
      previews.append(image);
    });
  };

  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
  });

  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (!files) {
      return;
    }
    fileInput.files = files;
    renderFiles(files);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files) {
      renderFiles(fileInput.files);
    }
  });
}

async function initProductEditPage() {
  if (!ensureAdminAuth()) {
    return;
  }

  await bootstrapPage({ activePath: '/admin/product-edit.html' });
  renderAdminNav('/admin/product-edit.html');

  await hydrateCategories();
  await hydrateProduct();
  initDropZone();

  const form = document.querySelector('#admin-product-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);

    const payload = {
      id: String(data.get('id') || `prd-${Math.random().toString(36).slice(2, 9)}`),
      name_ar: String(data.get('name_ar') || '').trim(),
      price: Number(data.get('price') || 0),
      description_ar: String(data.get('description_ar') || '').trim(),
      category_id: String(data.get('category_id') || ''),
      stock_quantity: Number(data.get('stock_quantity') || 0),
      status: String(data.get('status') || 'active'),
      is_featured: data.get('is_featured') === 'on',
      images: [],
    };

    const fileInput = form.querySelector('#product-images');
    if (fileInput?.files?.length) {
      payload.images = [...fileInput.files].slice(0, 5).map((file) => URL.createObjectURL(file));
    }

    await saveProduct(payload);
    showToast('success', 'admin:toast.saved');
    window.location.href = '/admin/products.html';
  });
}

initProductEditPage();
