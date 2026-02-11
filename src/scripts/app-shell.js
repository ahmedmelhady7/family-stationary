import { initI18n, translateDom } from './i18n.js';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { initFocusRing } from './utils/focus-ring.js';
import { initPwaInstallPrompt, registerServiceWorker } from './pwa.js';

export async function bootstrapPage(options = {}) {
  await initI18n();
  renderNavbar(options.activePath || window.location.pathname);
  renderFooter();
  initFocusRing();
  initPwaInstallPrompt();
  registerServiceWorker();
  translateDom(document);
}
