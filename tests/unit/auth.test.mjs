import assert from 'node:assert/strict';
import test from 'node:test';
import './setup-browser-env.mjs';

const AUTH_STORAGE_KEY = 'family-stationary-admin-auth';

function loadAuthModule() {
  return import(`../../src/scripts/services/auth.js?test=${Date.now()}-${Math.random()}`);
}

function setWindowLocation(pathname = '/admin/login.html', search = '', hash = '') {
  const location = {
    pathname,
    search,
    hash,
    origin: 'https://app.example',
    href: `${pathname}${search}${hash}`,
  };

  window.location = location;
  window.history = {
    replaceState: (_state, _title, url) => {
      const parsed = new URL(String(url), location.origin);
      location.pathname = parsed.pathname;
      location.search = parsed.search;
      location.hash = parsed.hash;
      location.href = `${location.pathname}${location.search}${location.hash}`;
    },
  };
}

const originalFetch = globalThis.fetch;
const originalEnv = globalThis.__APP_ENV__;

test.beforeEach(() => {
  localStorage.clear();
  globalThis.__APP_ENV__ = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'anon-key',
  };
  setWindowLocation();
  globalThis.fetch = originalFetch;
});

test.after(() => {
  globalThis.fetch = originalFetch;
  globalThis.__APP_ENV__ = originalEnv;
});

test('signInWithMagicLink enforces create_user=false and safe redirect', async () => {
  const auth = await loadAuthModule();

  let capturedBody = null;
  let capturedUrl = '';

  globalThis.fetch = async (input, init = {}) => {
    capturedUrl = typeof input === 'string' ? input : String(input?.url || '');
    capturedBody = JSON.parse(String(init.body || '{}'));
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  await auth.signInWithMagicLink('Admin@Example.com', { nextPath: 'https://evil.example.com/next' });

  assert.match(capturedUrl, /\/auth\/v1\/otp$/);
  assert.equal(capturedBody.email, 'admin@example.com');
  assert.equal(capturedBody.create_user, false);
  assert.equal(
    capturedBody.options.emailRedirectTo,
    'https://app.example/admin/login.html?next=%2Fadmin%2Fdashboard.html',
  );
});

test('requireAdminSession clears session when user is not in admin_users', async () => {
  const auth = await loadAuthModule();

  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      accessToken: 'token-1',
      refreshToken: 'refresh-1',
      expiresAt: Date.now() + 30 * 60 * 1000,
      userId: '',
      email: '',
      adminVerifiedAt: 0,
    }),
  );

  const calls = [];
  globalThis.fetch = async (input) => {
    const url = typeof input === 'string' ? input : String(input?.url || '');
    calls.push(url);

    if (url.endsWith('/auth/v1/user')) {
      return new Response(JSON.stringify({ id: '00000000-0000-0000-0000-000000000001', email: 'a@b.com' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.includes('/rest/v1/admin_users')) {
      return new Response('[]', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('not_found', { status: 404 });
  };

  const session = await auth.requireAdminSession({ redirectToLogin: false });

  assert.equal(session, null);
  assert.equal(localStorage.getItem(AUTH_STORAGE_KEY), null);
  assert.equal(calls.length, 2);
});
