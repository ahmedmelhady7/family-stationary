import { initI18n, translateDom } from '../../i18n.js';
import { signInWithMagicLink, isAuthenticated } from '../../services/auth.js';
import { showToast } from '../../components/toast.js';

function redirectAfterAuth() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next') || '/admin/dashboard.html';
  window.location.href = next;
}

async function initLoginPage() {
  await initI18n();
  translateDom(document);

  if (isAuthenticated()) {
    redirectAfterAuth();
    return;
  }

  const form = document.querySelector('#admin-login-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = String(new FormData(form).get('email') || '').trim();
    if (!email) {
      return;
    }

    await signInWithMagicLink(email);
    showToast('success', 'admin:toast.saved');
    redirectAfterAuth();
  });
}

initLoginPage();
