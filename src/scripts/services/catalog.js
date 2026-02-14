import { APP_CONFIG, ENV, STORAGE_KEYS } from '../config.js';
import { getAccessToken } from './auth.js';
import { safeJsonParse } from '../utils/dom.js';

let catalogCache = null;

const PRODUCT_SELECT =
  'id,name_ar,slug,description_ar,price,currency,images,category_id,status,stock_quantity,is_featured,source_type,created_at,updated_at';
const CATEGORY_SELECT = 'id,name_ar,slug,sort_order';

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function supabaseBaseUrl() {
  return String(ENV.supabaseUrl || '').replace(/\/+$/, '');
}

function hasRemoteCatalog() {
  return Boolean(supabaseBaseUrl() && ENV.supabaseAnonKey);
}

function buildSupabaseHeaders(headers = {}, accessToken = '') {
  const token = accessToken || ENV.supabaseAnonKey;
  return {
    Accept: 'application/json',
    apikey: ENV.supabaseAnonKey,
    Authorization: `Bearer ${token}`,
    ...headers,
  };
}

function createCatalogError(message, translationKey = 'admin:toast.error', status = 500) {
  const error = new Error(message);
  error.translationKey = translationKey;
  error.status = status;
  return error;
}

async function readErrorMessage(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => ({}));
    return String(payload.message || payload.error_description || payload.error || 'request failed');
  }

  const text = await response.text().catch(() => 'request failed');
  return String(text || 'request failed');
}

async function supabaseRequest(path, options = {}) {
  const method = options.method || 'GET';
  const response = await fetch(`${supabaseBaseUrl()}${path}`, {
    method,
    headers: buildSupabaseHeaders(options.headers || {}, options.accessToken || ''),
    body: options.body,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    const translationKey = response.status === 401 || response.status === 403
      ? 'errors:general.unauthorized'
      : 'admin:toast.error';
    throw createCatalogError(message, translationKey, response.status);
  }

  if (method === 'HEAD' || response.status === 204) {
    return { data: null, response };
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return { data: await response.text(), response };
  }

  const text = await response.text();
  return {
    data: text ? JSON.parse(text) : null,
    response,
  };
}

function parseCount(response, fallback = 0) {
  const range = response.headers.get('content-range') || '';
  const [, totalRaw] = range.split('/');
  const total = Number(totalRaw);
  return Number.isFinite(total) && total >= 0 ? total : fallback;
}

function makeSlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function sanitizeSearchTerm(query) {
  return String(query || '')
    .trim()
    .replace(/[,*()]/g, ' ')
    .replace(/\s+/g, ' ');
}

function normalizeProduct(product) {
  if (!product) {
    return null;
  }

  return {
    ...product,
    price: Number(product.price || 0),
    stock_quantity: Number(product.stock_quantity || 0),
    is_featured: Boolean(product.is_featured),
    images: Array.isArray(product.images) ? product.images : [],
  };
}

function normalizeCategory(category) {
  if (!category) {
    return null;
  }

  return {
    ...category,
    sort_order: Number(category.sort_order || 0),
  };
}

function normalizeProductWritePayload(payload) {
  const price = Number(payload.price || 0);
  const stockQuantity = Number(payload.stock_quantity || 0);
  const nameAr = String(payload.name_ar || '').trim();

  if (!nameAr) {
    throw createCatalogError('Product name is required', 'admin:toast.error', 400);
  }

  return {
    name_ar: nameAr,
    slug: String(payload.slug || makeSlug(nameAr)),
    description_ar: String(payload.description_ar || '').trim() || null,
    price: Number.isFinite(price) ? price : 0,
    currency: String(payload.currency || APP_CONFIG.defaultCurrency),
    images: Array.isArray(payload.images) ? payload.images.filter(Boolean).slice(0, 5) : [],
    category_id: payload.category_id ? String(payload.category_id) : null,
    status: String(payload.status || 'active'),
    stock_quantity: Number.isFinite(stockQuantity) ? Math.max(0, stockQuantity) : 0,
    is_featured: Boolean(payload.is_featured),
    source_type: String(payload.source_type || 'dashboard'),
  };
}

async function listCategoriesRemote() {
  const { data } = await supabaseRequest(
    `/rest/v1/categories?select=${encodeURIComponent(CATEGORY_SELECT)}&order=sort_order.asc`,
  );

  return Array.isArray(data) ? data.map(normalizeCategory).filter(Boolean) : [];
}

function productOrderForSort(sort) {
  if (sort === 'price_asc') {
    return 'price.asc';
  }
  if (sort === 'price_desc') {
    return 'price.desc';
  }
  if (sort === 'name') {
    return 'name_ar.asc';
  }
  return 'created_at.desc';
}

async function listProductsRemote(options = {}) {
  const page = Math.max(1, Number(options.page || 1));
  const pageSize = Math.max(1, Number(options.pageSize || APP_CONFIG.pageSize));
  const accessToken = options.adminMode ? await getAccessToken({ requireAdmin: true }) : '';

  const params = new URLSearchParams({
    select: PRODUCT_SELECT,
    limit: String(pageSize),
    offset: String((page - 1) * pageSize),
    order: productOrderForSort(options.sort || 'newest'),
  });

  if (options.status) {
    params.set('status', `eq.${options.status}`);
  } else {
    params.set('status', 'neq.archived');
  }

  if (options.category) {
    params.set('category_id', `eq.${options.category}`);
  }

  if (options.inStockOnly) {
    params.set('stock_quantity', 'gt.0');
  }

  const query = sanitizeSearchTerm(options.q);
  if (query) {
    params.set('or', `(name_ar.ilike.*${query}*,description_ar.ilike.*${query}*)`);
  }

  const { data, response } = await supabaseRequest(`/rest/v1/products?${params.toString()}`, {
    headers: { Prefer: 'count=exact' },
    accessToken,
  });

  const items = Array.isArray(data) ? data.map(normalizeProduct).filter(Boolean) : [];
  const total = parseCount(response, items.length);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
  };
}

async function listFeaturedProductsRemote(limit = 6) {
  const params = new URLSearchParams({
    select: PRODUCT_SELECT,
    status: 'eq.active',
    is_featured: 'eq.true',
    limit: String(Math.max(1, Number(limit || 6))),
    order: 'created_at.desc',
  });

  const { data } = await supabaseRequest(`/rest/v1/products?${params.toString()}`);
  return Array.isArray(data) ? data.map(normalizeProduct).filter(Boolean) : [];
}

async function getProductBySlugRemote(slug) {
  const params = new URLSearchParams({
    select: PRODUCT_SELECT,
    slug: `eq.${String(slug || '')}`,
    limit: '1',
  });

  const { data } = await supabaseRequest(`/rest/v1/products?${params.toString()}`);
  return normalizeProduct(Array.isArray(data) ? data[0] : null);
}

async function getProductByIdRemote(id, options = {}) {
  const accessToken = options.adminMode ? await getAccessToken({ requireAdmin: true }) : '';
  const params = new URLSearchParams({
    select: PRODUCT_SELECT,
    id: `eq.${String(id || '')}`,
    limit: '1',
  });

  const { data } = await supabaseRequest(`/rest/v1/products?${params.toString()}`, {
    accessToken,
  });
  return normalizeProduct(Array.isArray(data) ? data[0] : null);
}

async function saveProductRemote(payload) {
  const accessToken = await getAccessToken({ requireAdmin: true });
  const body = normalizeProductWritePayload(payload);

  if (payload.id) {
    const params = new URLSearchParams({
      id: `eq.${String(payload.id)}`,
      select: PRODUCT_SELECT,
    });

    const { data } = await supabaseRequest(`/rest/v1/products?${params.toString()}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      accessToken,
      body: JSON.stringify(body),
    });

    return normalizeProduct(Array.isArray(data) ? data[0] : null);
  }

  const { data } = await supabaseRequest('/rest/v1/products?select=id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    accessToken,
    body: JSON.stringify(body),
  });

  const createdId = Array.isArray(data) && data[0] ? data[0].id : null;
  if (!createdId) {
    throw createCatalogError('Product create failed', 'admin:toast.error', 500);
  }

  const created = await getProductByIdRemote(createdId, { adminMode: true });
  if (!created) {
    throw createCatalogError('Product not returned after create', 'admin:toast.error', 500);
  }

  return created;
}

async function deleteProductRemote(productId) {
  const accessToken = await getAccessToken({ requireAdmin: true });
  const params = new URLSearchParams({ id: `eq.${String(productId)}` });

  await supabaseRequest(`/rest/v1/products?${params.toString()}`, {
    method: 'DELETE',
    accessToken,
  });
}

async function updateProductStatusRemote(productId, status) {
  const accessToken = await getAccessToken({ requireAdmin: true });
  const params = new URLSearchParams({
    id: `eq.${String(productId)}`,
    select: PRODUCT_SELECT,
  });

  const { data } = await supabaseRequest(`/rest/v1/products?${params.toString()}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    accessToken,
    body: JSON.stringify({ status: String(status || 'inactive') }),
  });

  return normalizeProduct(Array.isArray(data) ? data[0] : null);
}

async function saveCategoryRemote(category) {
  const accessToken = await getAccessToken({ requireAdmin: true });
  const payload = {
    name_ar: String(category.name_ar || '').trim(),
    slug: String(category.slug || makeSlug(category.name_ar)),
  };

  if (!payload.name_ar) {
    throw createCatalogError('Category name is required', 'admin:toast.error', 400);
  }

  if (category.id) {
    const params = new URLSearchParams({
      id: `eq.${String(category.id)}`,
      select: CATEGORY_SELECT,
    });

    const { data } = await supabaseRequest(`/rest/v1/categories?${params.toString()}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      accessToken,
      body: JSON.stringify(payload),
    });

    return normalizeCategory(Array.isArray(data) ? data[0] : null);
  }

  const categories = await listCategoriesRemote();
  payload.sort_order =
    typeof category.sort_order === 'number' ? Number(category.sort_order) : categories.length + 1;

  const { data } = await supabaseRequest(`/rest/v1/categories?select=${encodeURIComponent(CATEGORY_SELECT)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    accessToken,
    body: JSON.stringify(payload),
  });

  return normalizeCategory(Array.isArray(data) ? data[0] : null);
}

async function reorderCategoriesRemote(idsInOrder) {
  const accessToken = await getAccessToken({ requireAdmin: true });
  await Promise.all(
    idsInOrder.map((id, index) => {
      const params = new URLSearchParams({ id: `eq.${String(id)}` });
      return supabaseRequest(`/rest/v1/categories?${params.toString()}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        accessToken,
        body: JSON.stringify({ sort_order: index + 1 }),
      });
    }),
  );

  return listCategoriesRemote();
}

async function deleteCategoryRemote(categoryId) {
  const productsParams = new URLSearchParams({
    select: 'id',
    category_id: `eq.${String(categoryId)}`,
    limit: '1',
  });

  const { data: products } = await supabaseRequest(`/rest/v1/products?${productsParams.toString()}`);
  if (Array.isArray(products) && products.length > 0) {
    return { deleted: false, hasProducts: true };
  }

  const accessToken = await getAccessToken({ requireAdmin: true });
  const categoryParams = new URLSearchParams({ id: `eq.${String(categoryId)}` });
  await supabaseRequest(`/rest/v1/categories?${categoryParams.toString()}`, {
    method: 'DELETE',
    accessToken,
  });

  return { deleted: true, hasProducts: false };
}

async function countProductsRemote(filter = {}, options = {}) {
  const accessToken = options.adminMode ? await getAccessToken({ requireAdmin: true }) : '';
  const params = new URLSearchParams({ select: 'id', limit: '1' });
  Object.entries(filter).forEach(([key, value]) => {
    params.set(key, value);
  });

  const { data, response } = await supabaseRequest(`/rest/v1/products?${params.toString()}`, {
    headers: { Prefer: 'count=exact' },
    accessToken,
  });

  const fallback = Array.isArray(data) ? data.length : 0;
  return parseCount(response, fallback);
}

async function getCatalogStatsRemote(options = {}) {
  const totalProducts = await countProductsRemote({ status: 'neq.archived' }, options);
  const activeProducts = await countProductsRemote({ status: 'eq.active' }, options);
  const outOfStock = await countProductsRemote({ status: 'eq.out_of_stock' }, options);

  return {
    totalProducts,
    activeProducts,
    outOfStock,
  };
}

function persistCatalog(catalog) {
  localStorage.setItem(STORAGE_KEYS.catalog, JSON.stringify(catalog));
}

async function loadSeedCatalog() {
  const response = await fetch('/assets/mock/catalog.json');
  if (!response.ok) {
    return { categories: [], products: [] };
  }

  const data = await response.json();
  return {
    categories: data.categories || [],
    products: data.products || [],
  };
}

async function ensureCatalog() {
  if (catalogCache) {
    return catalogCache;
  }

  const saved = safeJsonParse(localStorage.getItem(STORAGE_KEYS.catalog), null);
  if (saved?.categories && saved?.products) {
    catalogCache = saved;
    return catalogCache;
  }

  catalogCache = await loadSeedCatalog();
  persistCatalog(catalogCache);
  return catalogCache;
}

async function listCategoriesLocal() {
  const catalog = await ensureCatalog();
  return clone(catalog.categories).sort((a, b) => a.sort_order - b.sort_order);
}

async function listProductsLocal(options = {}) {
  const catalog = await ensureCatalog();
  const page = Number(options.page || 1);
  const pageSize = Number(options.pageSize || APP_CONFIG.pageSize);

  let products = clone(catalog.products).filter((product) => product.status !== 'archived');

  if (options.status) {
    products = products.filter((product) => product.status === options.status);
  }

  if (options.category) {
    products = products.filter((product) => product.category_id === options.category);
  }

  if (options.q) {
    const query = String(options.q).trim().toLowerCase();
    products = products.filter((product) => {
      return (
        String(product.name_ar || '').toLowerCase().includes(query) ||
        String(product.description_ar || '').toLowerCase().includes(query)
      );
    });
  }

  if (options.inStockOnly) {
    products = products.filter((product) => Number(product.stock_quantity) > 0);
  }

  const sort = options.sort || 'newest';
  if (sort === 'price_asc') {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    products.sort((a, b) => b.price - a.price);
  } else if (sort === 'name') {
    products.sort((a, b) => a.name_ar.localeCompare(b.name_ar, 'ar'));
  } else {
    products.sort((a, b) => (a.id < b.id ? 1 : -1));
  }

  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;

  return {
    items: products.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

async function listFeaturedProductsLocal(limit = 6) {
  const catalog = await ensureCatalog();
  return clone(catalog.products)
    .filter((product) => product.is_featured && product.status === 'active')
    .slice(0, limit);
}

async function getProductBySlugLocal(slug) {
  const catalog = await ensureCatalog();
  return clone(catalog.products.find((product) => product.slug === slug) || null);
}

async function getProductByIdLocal(id) {
  const catalog = await ensureCatalog();
  return clone(catalog.products.find((product) => product.id === id) || null);
}

async function saveProductLocal(payload) {
  const catalog = await ensureCatalog();
  const now = new Date().toISOString();
  const existingIndex = catalog.products.findIndex((product) => product.id === payload.id);

  const safePayload = {
    ...payload,
    slug: payload.slug || makeSlug(payload.name_ar),
    updated_at: now,
  };

  if (existingIndex >= 0) {
    catalog.products[existingIndex] = {
      ...catalog.products[existingIndex],
      ...safePayload,
    };
  } else {
    catalog.products.push({
      id: payload.id || `prd-${Math.random().toString(36).slice(2, 10)}`,
      status: 'active',
      currency: APP_CONFIG.defaultCurrency,
      stock_quantity: 0,
      is_featured: false,
      images: [],
      created_at: now,
      ...safePayload,
    });
  }

  persistCatalog(catalog);
  return clone(catalog.products.find((product) => product.id === safePayload.id) || safePayload);
}

async function deleteProductLocal(productId) {
  const catalog = await ensureCatalog();
  catalog.products = catalog.products.filter((product) => product.id !== productId);
  persistCatalog(catalog);
}

async function updateProductStatusLocal(productId, status) {
  const catalog = await ensureCatalog();
  const item = catalog.products.find((product) => product.id === productId);
  if (!item) {
    return null;
  }

  item.status = status;
  item.updated_at = new Date().toISOString();
  persistCatalog(catalog);
  return clone(item);
}

async function saveCategoryLocal(category) {
  const catalog = await ensureCatalog();
  const existing = catalog.categories.findIndex((entry) => entry.id === category.id);
  const payload = {
    id: category.id || `cat-${Math.random().toString(36).slice(2, 10)}`,
    name_ar: category.name_ar,
    slug: category.slug || makeSlug(category.name_ar),
    sort_order:
      typeof category.sort_order === 'number' ? category.sort_order : catalog.categories.length + 1,
  };

  if (existing >= 0) {
    catalog.categories[existing] = {
      ...catalog.categories[existing],
      ...payload,
    };
  } else {
    catalog.categories.push(payload);
  }

  persistCatalog(catalog);
  return clone(payload);
}

async function reorderCategoriesLocal(idsInOrder) {
  const catalog = await ensureCatalog();
  idsInOrder.forEach((id, index) => {
    const category = catalog.categories.find((entry) => entry.id === id);
    if (category) {
      category.sort_order = index + 1;
    }
  });

  persistCatalog(catalog);
  return clone(catalog.categories);
}

async function deleteCategoryLocal(categoryId) {
  const catalog = await ensureCatalog();
  const hasProducts = catalog.products.some((product) => product.category_id === categoryId);
  if (hasProducts) {
    return { deleted: false, hasProducts: true };
  }

  catalog.categories = catalog.categories.filter((category) => category.id !== categoryId);
  persistCatalog(catalog);
  return { deleted: true, hasProducts: false };
}

async function getCatalogStatsLocal() {
  const catalog = await ensureCatalog();
  const totalProducts = catalog.products.length;
  const activeProducts = catalog.products.filter((product) => product.status === 'active').length;
  const outOfStock = catalog.products.filter((product) => Number(product.stock_quantity) <= 0).length;
  return {
    totalProducts,
    activeProducts,
    outOfStock,
  };
}

export async function listCategories() {
  if (hasRemoteCatalog()) {
    return listCategoriesRemote();
  }

  return listCategoriesLocal();
}

export async function listProducts(options = {}) {
  if (hasRemoteCatalog()) {
    return listProductsRemote(options);
  }

  return listProductsLocal(options);
}

export async function listFeaturedProducts(limit = 6) {
  if (hasRemoteCatalog()) {
    return listFeaturedProductsRemote(limit);
  }

  return listFeaturedProductsLocal(limit);
}

export async function getProductBySlug(slug) {
  if (hasRemoteCatalog()) {
    return getProductBySlugRemote(slug);
  }

  return getProductBySlugLocal(slug);
}

export async function getProductById(id, options = {}) {
  if (hasRemoteCatalog()) {
    return getProductByIdRemote(id, options);
  }

  return getProductByIdLocal(id);
}

export async function saveProduct(payload) {
  if (hasRemoteCatalog()) {
    return saveProductRemote(payload);
  }

  return saveProductLocal(payload);
}

export async function deleteProduct(productId) {
  if (hasRemoteCatalog()) {
    return deleteProductRemote(productId);
  }

  return deleteProductLocal(productId);
}

export async function updateProductStatus(productId, status) {
  if (hasRemoteCatalog()) {
    return updateProductStatusRemote(productId, status);
  }

  return updateProductStatusLocal(productId, status);
}

export async function saveCategory(category) {
  if (hasRemoteCatalog()) {
    return saveCategoryRemote(category);
  }

  return saveCategoryLocal(category);
}

export async function reorderCategories(idsInOrder) {
  if (hasRemoteCatalog()) {
    return reorderCategoriesRemote(idsInOrder);
  }

  return reorderCategoriesLocal(idsInOrder);
}

export async function deleteCategory(categoryId) {
  if (hasRemoteCatalog()) {
    return deleteCategoryRemote(categoryId);
  }

  return deleteCategoryLocal(categoryId);
}

export async function getCatalogStats(options = {}) {
  if (hasRemoteCatalog()) {
    return getCatalogStatsRemote(options);
  }

  return getCatalogStatsLocal();
}
