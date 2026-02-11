import { bootstrapPage } from '../app-shell.js';
import { translateDom } from '../i18n.js';

async function initConfirmationPage() {
  await bootstrapPage({ activePath: '/products.html' });
  const orderNumber = new URLSearchParams(window.location.search).get('order') || 'FS-0000';
  const target = document.querySelector('#order-number');
  if (target) {
    target.textContent = orderNumber;
  }
  translateDom(document);
}

initConfirmationPage();
