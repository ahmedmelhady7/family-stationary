import i18next from './vendor-i18next-lite.js';

const DEFAULT_NAMESPACES = ['common', 'products', 'checkout', 'errors', 'admin'];

export async function initI18n() {
  await i18next.init({
    lng: 'ar',
    fallbackLng: 'ar',
    ns: DEFAULT_NAMESPACES,
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
  });

  applyDirectionMetadata();
  translateDom(document);
  return i18next;
}

export function t(key, vars) {
  return i18next.t(key, vars);
}

export function translateDom(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((element) => {
    const key = element.dataset.i18n;
    if (!key) {
      return;
    }
    element.textContent = t(key);
  });

  root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    const key = element.dataset.i18nPlaceholder;
    if (!key) {
      return;
    }
    element.setAttribute('placeholder', t(key));
  });

  root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    const key = element.dataset.i18nAriaLabel;
    if (!key) {
      return;
    }
    element.setAttribute('aria-label', t(key));
  });

  root.querySelectorAll('[data-i18n-title]').forEach((element) => {
    const key = element.dataset.i18nTitle;
    if (!key) {
      return;
    }
    element.setAttribute('title', t(key));
  });
}

function applyDirectionMetadata() {
  document.documentElement.lang = 'ar';
  document.documentElement.dir = 'rtl';
}
