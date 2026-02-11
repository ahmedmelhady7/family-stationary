import { t, translateDom } from '../i18n.js';

let region = null;

function ensureRegion() {
  if (region) {
    return region;
  }

  region = document.createElement('div');
  region.className = 'toast-region';
  region.setAttribute('aria-live', 'assertive');
  region.setAttribute('aria-atomic', 'true');
  region.setAttribute('id', 'toast-region');
  document.body.append(region);
  return region;
}

export function showToast(type, keyOrText, options = {}) {
  const holder = ensureRegion();
  const item = document.createElement('article');
  item.className = `toast toast--${type}`;
  item.setAttribute('role', 'alert');

  if (options.translationKey || keyOrText.includes('.')) {
    item.dataset.i18n = options.translationKey || keyOrText;
  } else {
    item.textContent = keyOrText;
  }

  if (item.dataset.i18n) {
    item.textContent = t(item.dataset.i18n);
  }

  holder.append(item);
  translateDom(item);

  setTimeout(() => {
    item.remove();
  }, Number(options.timeoutMs || 5000));

  return item;
}
