import { bootstrapPage } from '../../app-shell.js';
import { t } from '../../i18n.js';
import { renderAdminNav } from '../../components/admin-nav.js';
import { showToast } from '../../components/toast.js';
import { getProductById, listCategories, saveProduct } from '../../services/catalog.js';
import {
  cleanupUploadedProductImages,
  createUploadMessageKey,
  PRODUCT_IMAGE_RULES,
  uploadProductImages,
  validateProductImageFiles,
} from '../../services/product-images.js';
import { ensureAdminAuth } from '../../utils/auth-guard.js';

const state = {
  existingImages: [],
  selectedFiles: [],
  previewUrls: [],
  isSaving: false,
};

function randomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 12);
}

function queryProductId() {
  return new URLSearchParams(window.location.search).get('id');
}

function releasePreviewUrls() {
  state.previewUrls.forEach((url) => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
  state.previewUrls = [];
}

function clearUploadMessages() {
  const errorNode = document.querySelector('#product-upload-error');
  if (errorNode) {
    errorNode.textContent = '';
  }

  const statusNode = document.querySelector('#product-upload-status');
  if (statusNode) {
    statusNode.textContent = '';
  }
}

function setUploadError(messageKey) {
  const errorNode = document.querySelector('#product-upload-error');
  if (errorNode) {
    errorNode.textContent = t(messageKey);
  }
}

function setUploadStatus(messageKey) {
  const statusNode = document.querySelector('#product-upload-status');
  if (statusNode) {
    statusNode.textContent = t(messageKey);
  }
}

function renderImagePreviews(urls) {
  const previews = document.querySelector('#image-preview-list');
  if (!previews) {
    return;
  }

  previews.innerHTML = urls
    .map((src) => `<img src="${src}" alt="preview" />`)
    .join('');
}

function renderExistingPreviews() {
  renderImagePreviews(state.existingImages);
}

function renderSelectedFilePreviews(files) {
  releasePreviewUrls();
  state.previewUrls = files.map((file) => URL.createObjectURL(file));
  renderImagePreviews(state.previewUrls);
}

function normalizeIncomingFiles(fileList) {
  const { validFiles, errors } = validateProductImageFiles(fileList, PRODUCT_IMAGE_RULES);

  if (errors.length > 0) {
    const firstKey = errors[0].translationKey || 'admin:upload.failed';
    setUploadError(firstKey);
    showToast('error', firstKey);
  } else {
    clearUploadMessages();
  }

  state.selectedFiles = validFiles;
  if (state.selectedFiles.length > 0) {
    renderSelectedFilePreviews(state.selectedFiles);
  } else {
    renderExistingPreviews();
  }
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

  const product = await getProductById(productId, { adminMode: true });
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

  state.existingImages = Array.isArray(product.images) ? product.images.slice(0, PRODUCT_IMAGE_RULES.maxFiles) : [];
  renderExistingPreviews();
}

function initDropZone() {
  const dropZone = document.querySelector('#image-drop-zone');
  const fileInput = document.querySelector('#product-images');

  if (!(dropZone instanceof HTMLElement) || !(fileInput instanceof HTMLInputElement)) {
    return;
  }

  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
  });

  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    normalizeIncomingFiles(event.dataTransfer?.files || []);
  });

  fileInput.addEventListener('change', () => {
    normalizeIncomingFiles(fileInput.files || []);
  });
}

function buildProductPayload(formData) {
  return {
    id: String(formData.get('id') || '').trim() || undefined,
    name_ar: String(formData.get('name_ar') || '').trim(),
    price: Number(formData.get('price') || 0),
    description_ar: String(formData.get('description_ar') || '').trim(),
    category_id: String(formData.get('category_id') || ''),
    stock_quantity: Number(formData.get('stock_quantity') || 0),
    status: String(formData.get('status') || 'active'),
    is_featured: formData.get('is_featured') === 'on',
    images: state.existingImages.slice(0, PRODUCT_IMAGE_RULES.maxFiles),
  };
}

async function resolveImagesForSave(payload) {
  if (state.selectedFiles.length === 0) {
    return {
      images: payload.images,
      uploadedUrls: [],
    };
  }

  setUploadStatus('admin:upload.uploading');
  try {
    const uploadedUrls = await uploadProductImages(state.selectedFiles, {
      productId: payload.id || `draft-${randomId()}`,
    });

    setUploadStatus('');
    return {
      images: uploadedUrls,
      uploadedUrls,
    };
  } catch (error) {
    setUploadStatus('');
    throw error;
  }
}

async function onSubmit(event) {
  event.preventDefault();
  if (state.isSaving) {
    return;
  }

  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  clearUploadMessages();
  state.isSaving = true;
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton instanceof HTMLButtonElement) {
    submitButton.disabled = true;
  }

  try {
    const payload = buildProductPayload(new FormData(form));
    const imageResult = await resolveImagesForSave(payload);
    payload.images = imageResult.images;

    try {
      await saveProduct(payload);
    } catch (saveError) {
      if (imageResult.uploadedUrls.length > 0) {
        await cleanupUploadedProductImages(imageResult.uploadedUrls).catch(() => null);
      }
      throw saveError;
    }

    showToast('success', 'admin:toast.saved');
    window.location.href = '/admin/products.html';
  } catch (error) {
    const messageKey = createUploadMessageKey(error);
    if (messageKey.startsWith('admin:upload.')) {
      setUploadError(messageKey);
      showToast('error', messageKey);
    } else {
      showToast('error', error.translationKey || 'admin:toast.error');
    }
  } finally {
    state.isSaving = false;
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = false;
    }
  }
}

async function initProductEditPage() {
  if (!(await ensureAdminAuth())) {
    return;
  }

  await bootstrapPage({ activePath: '/admin/product-edit.html' });
  renderAdminNav('/admin/product-edit.html');

  await hydrateCategories();
  await hydrateProduct();
  initDropZone();

  const form = document.querySelector('#admin-product-form');
  form?.addEventListener('submit', onSubmit);

  window.addEventListener('beforeunload', releasePreviewUrls);
}

initProductEditPage();
