import { t } from './i18n.js';

let deferredPrompt = null;

function renderInstallBanner() {
  if (document.querySelector('#install-banner')) {
    return;
  }

  const banner = document.createElement('aside');
  banner.id = 'install-banner';
  banner.className = 'card';
  banner.style.position = 'fixed';
  banner.style.insetInline = '1rem';
  banner.style.insetBlockEnd = '1rem';
  banner.style.zIndex = '500';
  banner.style.padding = '1rem';

  banner.innerHTML = `
    <div class="card__body">
      <p>${t('common:pwa.prompt')}</p>
      <button type="button" class="button button--gold" id="install-app-btn">${t('common:actions.install')}</button>
    </div>
  `;

  document.body.append(banner);

  const button = banner.querySelector('#install-app-btn');
  button?.addEventListener('click', async () => {
    if (!deferredPrompt) {
      banner.remove();
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    banner.remove();
  });
}

export function initPwaInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    renderInstallBanner();
  });
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/workers/sw.js');
    } catch (_error) {
      // Fail silently to avoid blocking checkout and storefront flows.
    }
  });
}
