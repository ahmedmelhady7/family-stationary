import { isAuthenticated } from '../services/auth.js';

export function ensureAdminAuth() {
  if (isAuthenticated()) {
    return true;
  }

  if (typeof window !== 'undefined') {
    const destination = encodeURIComponent(window.location.pathname);
    window.location.href = `/admin/login.html?next=${destination}`;
  }
  return false;
}
