import { ENV, STORAGE_KEYS } from '../config.js';

const subscribers = new Set();
const REFRESH_SKEW_MS = 60_000;
const ADMIN_REVERIFY_MS = 5 * 60 * 1000;

function nowMs() {
  return Date.now();
}

function normalizedSupabaseUrl() {
  return String(ENV.supabaseUrl || '').replace(/\/+$/, '');
}

function hasSupabaseConfig() {
  return Boolean(normalizedSupabaseUrl() && ENV.supabaseAnonKey);
}

function getStoredAuth() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.auth) || 'null');
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (!parsed.accessToken || !parsed.refreshToken) {
      return null;
    }

    return {
      accessToken: String(parsed.accessToken),
      refreshToken: String(parsed.refreshToken),
      expiresAt: Number(parsed.expiresAt || 0),
      userId: parsed.userId ? String(parsed.userId) : '',
      email: parsed.email ? String(parsed.email) : '',
      adminVerifiedAt: Number(parsed.adminVerifiedAt || 0),
    };
  } catch (_error) {
    return null;
  }
}

function setStoredAuth(data) {
  if (!data) {
    localStorage.removeItem(STORAGE_KEYS.auth);
    subscribers.forEach((callback) => callback(null));
    return;
  }

  const payload = {
    accessToken: String(data.accessToken || ''),
    refreshToken: String(data.refreshToken || ''),
    expiresAt: Number(data.expiresAt || 0),
    userId: data.userId ? String(data.userId) : '',
    email: data.email ? String(data.email) : '',
    adminVerifiedAt: Number(data.adminVerifiedAt || 0),
  };

  localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(payload));
  subscribers.forEach((callback) => callback(payload));
}

function createAuthError(message, translationKey = 'admin:toast.error', status = 500) {
  const error = new Error(message);
  error.translationKey = translationKey;
  error.status = status;
  return error;
}

function buildHeaders(headers = {}, accessToken = '') {
  const token = accessToken || ENV.supabaseAnonKey;
  return {
    Accept: 'application/json',
    apikey: ENV.supabaseAnonKey,
    Authorization: `Bearer ${token}`,
    ...headers,
  };
}

async function readErrorMessage(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const payload = await response.json().catch(() => ({}));
    return String(payload.msg || payload.error_description || payload.message || payload.error || 'request failed');
  }

  const text = await response.text().catch(() => 'request failed');
  return String(text || 'request failed');
}

function mapAuthFailure(status, message) {
  const lower = String(message || '').toLowerCase();

  if (status === 401 || status === 403) {
    return 'admin:auth.session_expired';
  }

  if (lower.includes('otp') || lower.includes('expired')) {
    return 'admin:auth.magic_link_expired';
  }

  if (lower.includes('create_user') || lower.includes('signups not allowed') || lower.includes('user not found')) {
    return 'admin:auth.not_admin';
  }

  if (status === 429) {
    return 'admin:auth.rate_limited';
  }

  return 'admin:auth.login_failed';
}

async function supabaseFetch(path, { method = 'GET', headers = {}, body, accessToken = '' } = {}) {
  if (!hasSupabaseConfig()) {
    throw createAuthError('Supabase auth is not configured', 'admin:auth.missing_config', 500);
  }

  const response = await fetch(`${normalizedSupabaseUrl()}${path}`, {
    method,
    headers: buildHeaders(headers, accessToken),
    body,
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    const translationKey = path.startsWith('/auth/')
      ? mapAuthFailure(response.status, message)
      : response.status === 401 || response.status === 403
        ? 'admin:auth.not_admin'
        : 'admin:toast.error';
    throw createAuthError(message, translationKey, response.status);
  }

  return response;
}

function sessionNeedsRefresh(session) {
  return Number(session.expiresAt || 0) <= nowMs() + REFRESH_SKEW_MS;
}

async function refreshSession(session) {
  if (!session?.refreshToken) {
    throw createAuthError('No refresh token', 'admin:auth.session_expired', 401);
  }

  const response = await supabaseFetch('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refreshToken }),
  });

  const payload = await response.json();
  const expiresAt = payload.expires_at
    ? Number(payload.expires_at) * 1000
    : nowMs() + Number(payload.expires_in || 3600) * 1000;

  return {
    ...session,
    accessToken: String(payload.access_token || session.accessToken),
    refreshToken: String(payload.refresh_token || session.refreshToken),
    expiresAt,
    userId: String(payload.user?.id || session.userId || ''),
    email: String(payload.user?.email || session.email || ''),
    adminVerifiedAt: 0,
  };
}

async function fetchCurrentUser(accessToken) {
  const response = await supabaseFetch('/auth/v1/user', {
    method: 'GET',
    accessToken,
  });
  return response.json();
}

async function fetchAdminMembership(accessToken, userId) {
  const params = new URLSearchParams({
    select: 'user_id,is_active,role',
    user_id: `eq.${userId}`,
    is_active: 'eq.true',
    limit: '1',
  });

  const response = await supabaseFetch(`/rest/v1/admin_users?${params.toString()}`, {
    method: 'GET',
    accessToken,
  });

  const rows = await response.json();
  return rows[0] || null;
}

async function verifyAdminSession(session, { force = false } = {}) {
  const lastVerified = Number(session.adminVerifiedAt || 0);
  if (!force && lastVerified > 0 && nowMs() - lastVerified < ADMIN_REVERIFY_MS && session.userId) {
    return session;
  }

  const user = await fetchCurrentUser(session.accessToken);
  if (!user?.id) {
    throw createAuthError('Session user is missing', 'admin:auth.session_expired', 401);
  }

  const membership = await fetchAdminMembership(session.accessToken, user.id);
  if (!membership) {
    throw createAuthError('Admin membership not found', 'admin:auth.not_admin', 403);
  }

  return {
    ...session,
    userId: String(user.id),
    email: String(user.email || session.email || ''),
    adminVerifiedAt: nowMs(),
  };
}

async function ensureValidSession({ forceAdminCheck = false } = {}) {
  let session = getStoredAuth();
  if (!session) {
    return null;
  }

  if (sessionNeedsRefresh(session)) {
    session = await refreshSession(session);
  }

  session = await verifyAdminSession(session, { force: forceAdminCheck });
  setStoredAuth(session);
  return session;
}

function loginRedirectUrl() {
  const current = `${window.location.pathname}${window.location.search}`;
  return `/admin/login.html?next=${encodeURIComponent(current)}`;
}

function redirectToLogin() {
  if (typeof window === 'undefined') {
    return;
  }
  window.location.href = loginRedirectUrl();
}

function sanitizeRedirectPath(nextPath) {
  if (!nextPath || typeof nextPath !== 'string') {
    return '/admin/dashboard.html';
  }

  if (!nextPath.startsWith('/')) {
    return '/admin/dashboard.html';
  }

  if (nextPath.startsWith('//')) {
    return '/admin/dashboard.html';
  }

  return nextPath;
}

function buildMagicLinkRedirect(nextPath) {
  const safeNext = sanitizeRedirectPath(nextPath);
  if (typeof window === 'undefined') {
    return '';
  }

  const url = new URL('/admin/login.html', window.location.origin);
  url.searchParams.set('next', safeNext);
  return url.toString();
}

function clearAuthErrorsFromQuery() {
  if (typeof window === 'undefined') {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (!params.get('error') && !params.get('error_description') && !params.get('error_code')) {
    return;
  }

  params.delete('error');
  params.delete('error_description');
  params.delete('error_code');
  const nextQuery = params.toString();
  const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}`;
  window.history.replaceState({}, '', nextUrl);
}

function parseAuthCallbackHash() {
  if (typeof window === 'undefined') {
    return null;
  }

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  if (!hash) {
    return null;
  }

  const params = new URLSearchParams(hash);
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) {
    return null;
  }

  const expiresIn = Number(params.get('expires_in') || 3600);
  return {
    accessToken,
    refreshToken,
    expiresAt: nowMs() + expiresIn * 1000,
    userId: '',
    email: '',
    adminVerifiedAt: 0,
  };
}

function clearAuthHashFromUrl() {
  if (typeof window === 'undefined') {
    return;
  }

  const clean = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState({}, '', clean);
}

export function getSession() {
  return getStoredAuth();
}

export function isAuthenticated() {
  const session = getStoredAuth();
  return Boolean(session?.accessToken && Number(session.expiresAt || 0) > nowMs());
}

export async function signInWithMagicLink(email, options = {}) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw createAuthError('Email is required', 'admin:auth.login_failed', 400);
  }

  const nextPath = sanitizeRedirectPath(options.nextPath || '/admin/dashboard.html');

  await supabaseFetch('/auth/v1/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: normalizedEmail,
      create_user: false,
      options: {
        emailRedirectTo: buildMagicLinkRedirect(nextPath),
      },
    }),
  });

  return { email: normalizedEmail, nextPath };
}

export async function completeSignInFromUrl() {
  if (typeof window === 'undefined') {
    return { handled: false, success: false };
  }

  const callbackSession = parseAuthCallbackHash();
  if (callbackSession) {
    setStoredAuth(callbackSession);
    clearAuthHashFromUrl();

    try {
      const session = await ensureValidSession({ forceAdminCheck: true });
      if (!session) {
        throw createAuthError('Session not found', 'admin:auth.session_expired', 401);
      }
      return { handled: true, success: true, session };
    } catch (error) {
      setStoredAuth(null);
      return {
        handled: true,
        success: false,
        errorKey: error.translationKey || 'admin:auth.not_admin',
      };
    }
  }

  const query = new URLSearchParams(window.location.search);
  if (query.get('error') || query.get('error_description') || query.get('error_code')) {
    clearAuthErrorsFromQuery();
    return { handled: true, success: false, errorKey: 'admin:auth.magic_link_expired' };
  }

  return { handled: false, success: false };
}

export async function requireAdminSession(options = {}) {
  const shouldRedirect = Boolean(options.redirectToLogin);
  if (!hasSupabaseConfig()) {
    if (shouldRedirect) {
      redirectToLogin();
    }
    return null;
  }

  try {
    const session = await ensureValidSession({ forceAdminCheck: true });
    if (session?.accessToken) {
      return session;
    }
  } catch (_error) {
    setStoredAuth(null);
  }

  if (shouldRedirect) {
    redirectToLogin();
  }
  return null;
}

export async function getAccessToken(options = {}) {
  const session = options.requireAdmin
    ? await requireAdminSession({ redirectToLogin: false })
    : await ensureValidSession({ forceAdminCheck: Boolean(options.forceAdminCheck) });

  if (!session?.accessToken) {
    throw createAuthError('Admin session required', 'admin:auth.session_expired', 401);
  }

  return session.accessToken;
}

export async function signOut() {
  const session = getStoredAuth();

  if (session?.accessToken && hasSupabaseConfig()) {
    await fetch(`${normalizedSupabaseUrl()}/auth/v1/logout`, {
      method: 'POST',
      headers: buildHeaders({}, session.accessToken),
    }).catch(() => null);
  }

  setStoredAuth(null);
}

export function onAuthStateChange(callback) {
  subscribers.add(callback);
  callback(getStoredAuth());
  return () => subscribers.delete(callback);
}
