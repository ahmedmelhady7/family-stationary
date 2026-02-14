import { requireAdminSession } from '../services/auth.js';

export async function ensureAdminAuth() {
  const session = await requireAdminSession({ redirectToLogin: true });
  return Boolean(session?.accessToken);
}
