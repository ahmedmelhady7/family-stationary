import { initI18n, translateDom } from '../../i18n.js';
import { completeSignInFromUrl, requireAdminSession, signInWithMagicLink } from '../../services/auth.js';
import { showToast } from '../../components/toast.js';

function sanitizeNextPath(next) {
  const value = String(next || '');
  if (!value.startsWith('/') || value.startsWith('//')) {
    return '/admin/dashboard.html';
  }
  return value;
}

function redirectAfterAuth() {
  const params = new URLSearchParams(window.location.search);
  const next = sanitizeNextPath(params.get('next') || '/admin/dashboard.html');
  window.location.href = next;
}

async function initLoginPage() {
  await initI18n();
  translateDom(document);

  const callbackState = await completeSignInFromUrl();
  if (callbackState.handled && callbackState.success) {
    showToast('success', 'admin:auth.logged_in');
    redirectAfterAuth();
    return;
  }

  if (callbackState.handled && !callbackState.success) {
    showToast('error', callbackState.errorKey || 'admin:auth.login_failed');
  }

  const session = await requireAdminSession({ redirectToLogin: false });
  if (session?.accessToken) {
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

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
    }

    try {
      await signInWithMagicLink(email, {
        nextPath: sanitizeNextPath(new URLSearchParams(window.location.search).get('next') || '/admin/dashboard.html'),
      });
      showToast('success', 'admin:auth.magic_link_sent');
    } catch (error) {
      showToast('error', error.translationKey || 'admin:auth.login_failed');
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
      }
    }
  });
}

initLoginPage();
