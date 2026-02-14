import { ENV } from '../config.js';
import { getAccessToken } from './auth.js';

export const PRODUCT_IMAGE_RULES = {
  maxFiles: 5,
  maxBytesPerFile: 5 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
};

function supabaseBaseUrl() {
  return String(ENV.supabaseUrl || '').replace(/\/+$/, '');
}

function hasRemoteStorage() {
  return Boolean(supabaseBaseUrl() && ENV.supabaseAnonKey);
}

function buildAuthHeaders(accessToken) {
  return {
    apikey: ENV.supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
  };
}

function buildStorageUploadHeaders(contentType, accessToken) {
  return {
    ...buildAuthHeaders(accessToken),
    'Content-Type': contentType,
    'x-upsert': 'true',
  };
}

function createUploadError(message, translationKey = 'admin:upload.failed', status = 500) {
  const error = new Error(message);
  error.translationKey = translationKey;
  error.status = status;
  return error;
}

function readUploadTranslationKey(status) {
  if (status === 413) {
    return 'admin:upload.file_too_large';
  }

  if (status === 401 || status === 403) {
    return 'errors:general.unauthorized';
  }

  return 'admin:upload.failed';
}

const RETRYABLE_UPLOAD_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_UPLOAD_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 250;

function extForMimeType(mimeType) {
  if (mimeType === 'image/jpeg') {
    return 'jpg';
  }

  if (mimeType === 'image/png') {
    return 'png';
  }

  if (mimeType === 'image/webp') {
    return 'webp';
  }

  if (mimeType === 'image/gif') {
    return 'gif';
  }

  return 'bin';
}

function safeFilenameStem(fileName) {
  return String(fileName || 'image')
    .replace(/\.[^.]+$/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'image';
}

function randomId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 12);
}

function toArray(files) {
  if (!files) {
    return [];
  }

  return Array.from(files);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function safePathSegment(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'draft';
}

function encodeStoragePath(rawPath) {
  return String(rawPath)
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
}

function parseEncodedPathFromPublicUrl(publicUrl) {
  const prefix = `${supabaseBaseUrl()}/storage/v1/object/public/products/`;
  const normalized = String(publicUrl || '');
  if (!normalized.startsWith(prefix)) {
    return '';
  }
  return normalized.slice(prefix.length);
}

export function validateProductImageFiles(files, rules = PRODUCT_IMAGE_RULES) {
  const selected = toArray(files);
  const allowed = new Set((rules.allowedMimeTypes || []).map((value) => String(value)));

  const errors = [];
  const limited = selected.slice(0, Number(rules.maxFiles || PRODUCT_IMAGE_RULES.maxFiles));
  if (selected.length > limited.length) {
    errors.push({ translationKey: 'admin:upload.too_many_files' });
  }

  const validFiles = [];
  limited.forEach((file) => {
    if (!allowed.has(String(file.type || ''))) {
      errors.push({ translationKey: 'admin:upload.invalid_type', fileName: file.name || '' });
      return;
    }

    if (Number(file.size || 0) > Number(rules.maxBytesPerFile || PRODUCT_IMAGE_RULES.maxBytesPerFile)) {
      errors.push({ translationKey: 'admin:upload.file_too_large', fileName: file.name || '' });
      return;
    }

    validFiles.push(file);
  });

  return { validFiles, errors };
}

async function responseErrorMessage(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => ({}));
    return String(payload.message || payload.error || 'upload failed');
  }

  const text = await response.text().catch(() => 'upload failed');
  return String(text || 'upload failed');
}

async function uploadToStorage(file, { productId, accessToken }) {
  const extension = extForMimeType(String(file.type || ''));
  const stem = safeFilenameStem(file.name);
  const pathPrefix = safePathSegment(productId);
  const rawObjectPath = `product-images/${pathPrefix}/${Date.now()}-${stem}-${randomId()}.${extension}`;
  const encodedObjectPath = encodeStoragePath(rawObjectPath);

  let response;
  try {
    response = await fetch(
      `${supabaseBaseUrl()}/storage/v1/object/products/${encodedObjectPath}`,
      {
        method: 'POST',
        headers: buildStorageUploadHeaders(String(file.type || 'application/octet-stream'), accessToken),
        body: file,
      },
    );
  } catch (error) {
    throw createUploadError(String(error?.message || 'upload request failed'), 'admin:upload.failed', 0);
  }

  if (!response.ok) {
    const message = await responseErrorMessage(response);
    throw createUploadError(message, readUploadTranslationKey(response.status), response.status);
  }

  return `${supabaseBaseUrl()}/storage/v1/object/public/products/${encodedObjectPath}`;
}

async function uploadToStorageWithRetry(file, context) {
  for (let attempt = 0; attempt < MAX_UPLOAD_ATTEMPTS; attempt += 1) {
    try {
      return await uploadToStorage(file, context);
    } catch (error) {
      const status = Number(error?.status || 0);
      const canRetry = status === 0 || RETRYABLE_UPLOAD_STATUS.has(status);
      const exhausted = attempt >= MAX_UPLOAD_ATTEMPTS - 1;
      if (!canRetry || exhausted) {
        throw error;
      }
      await delay(RETRY_BASE_DELAY_MS * (2 ** attempt));
    }
  }

  throw createUploadError('Upload retry budget exhausted', 'admin:upload.failed', 500);
}

async function deleteObjectByEncodedPath(encodedPath, accessToken) {
  const response = await fetch(`${supabaseBaseUrl()}/storage/v1/object/products/${encodedPath}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(accessToken),
  });

  if (!response.ok && response.status !== 404) {
    const message = await responseErrorMessage(response);
    throw createUploadError(message, readUploadTranslationKey(response.status), response.status);
  }
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (typeof FileReader === 'undefined') {
      reject(createUploadError('FileReader is unavailable', 'admin:upload.failed', 500));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(createUploadError('Failed to read image file', 'admin:upload.failed', 500));
    reader.readAsDataURL(file);
  });
}

export async function uploadProductImages(files, options = {}) {
  const selected = toArray(files).slice(0, PRODUCT_IMAGE_RULES.maxFiles);
  if (selected.length === 0) {
    return [];
  }

  const { validFiles, errors } = validateProductImageFiles(selected);
  if (errors.length > 0 || validFiles.length !== selected.length) {
    const first = errors[0] || { translationKey: 'admin:upload.failed' };
    throw createUploadError('Image validation failed', first.translationKey, 400);
  }

  const productId = String(options.productId || `draft-${randomId()}`);

  if (!hasRemoteStorage()) {
    return Promise.all(validFiles.map((file) => readAsDataUrl(file)));
  }

  const accessToken = options.accessToken || (await getAccessToken({ requireAdmin: true }));
  const uploaded = [];

  for (const file of validFiles) {
    const url = await uploadToStorageWithRetry(file, { productId, accessToken });
    uploaded.push(url);
  }

  return uploaded;
}

export async function cleanupUploadedProductImages(urls, options = {}) {
  if (!hasRemoteStorage()) {
    return;
  }

  const selected = toArray(urls);
  if (selected.length === 0) {
    return;
  }

  const encodedPaths = selected
    .map((url) => parseEncodedPathFromPublicUrl(url))
    .filter(Boolean);

  if (encodedPaths.length === 0) {
    return;
  }

  const accessToken = options.accessToken || (await getAccessToken({ requireAdmin: true }));
  await Promise.allSettled(encodedPaths.map((encodedPath) => deleteObjectByEncodedPath(encodedPath, accessToken)));
}

export function createUploadMessageKey(error) {
  return error?.translationKey || 'admin:upload.failed';
}
