import { APP_CONFIG, STORAGE_KEYS } from '../config.js';
import { safeJsonParse } from '../utils/dom.js';

let catalogCache = null;

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function makeSlug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
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

export async function listCategories() {
  const catalog = await ensureCatalog();
  return clone(catalog.categories).sort((a, b) => a.sort_order - b.sort_order);
}

export async function listProducts(options = {}) {
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

export async function listFeaturedProducts(limit = 6) {
  const catalog = await ensureCatalog();
  return clone(catalog.products)
    .filter((product) => product.is_featured && product.status === 'active')
    .slice(0, limit);
}

export async function getProductBySlug(slug) {
  const catalog = await ensureCatalog();
  return clone(catalog.products.find((product) => product.slug === slug) || null);
}

export async function getProductById(id) {
  const catalog = await ensureCatalog();
  return clone(catalog.products.find((product) => product.id === id) || null);
}

export async function saveProduct(payload) {
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

export async function deleteProduct(productId) {
  const catalog = await ensureCatalog();
  catalog.products = catalog.products.filter((product) => product.id !== productId);
  persistCatalog(catalog);
}

export async function updateProductStatus(productId, status) {
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

export async function saveCategory(category) {
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

export async function reorderCategories(idsInOrder) {
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

export async function deleteCategory(categoryId) {
  const catalog = await ensureCatalog();
  const hasProducts = catalog.products.some((product) => product.category_id === categoryId);
  if (hasProducts) {
    return { deleted: false, hasProducts: true };
  }

  catalog.categories = catalog.categories.filter((category) => category.id !== categoryId);
  persistCatalog(catalog);
  return { deleted: true, hasProducts: false };
}

export async function getCatalogStats() {
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
