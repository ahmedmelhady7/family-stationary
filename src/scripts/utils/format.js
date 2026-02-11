import { APP_CONFIG } from '../config.js';

export function formatPrice(amount, currency = APP_CONFIG.defaultCurrency) {
  const value = Number(amount || 0);
  return new Intl.NumberFormat('ar-EG-u-nu-latn', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('ar-EG-u-nu-latn').format(Number(value || 0));
}

export function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
