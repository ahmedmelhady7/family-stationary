import { initI18n, translateDom } from '../i18n.js';

async function initOfflinePage() {
  await initI18n();
  translateDom(document);

  const retry = document.querySelector('#offline-retry');
  retry?.addEventListener('click', () => {
    window.location.reload();
  });
}

initOfflinePage();
