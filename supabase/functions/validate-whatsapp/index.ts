import { jsonResponse, parseJsonSafe } from '../_shared/http.ts';
import { validateWhatsAppContact } from '../_shared/whatsapp.ts';

const requestCounter = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string) {
  const now = Date.now();
  const key = ip || 'unknown';
  const current = requestCounter.get(key);

  if (!current || now > current.resetAt) {
    requestCounter.set(key, {
      count: 1,
      resetAt: now + 60_000,
    });
    return false;
  }

  if (current.count >= 30) {
    return true;
  }

  current.count += 1;
  return false;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (rateLimited(ip)) {
    return jsonResponse({ valid: false, wa_id: null, error: 'rate_limited' }, 429);
  }

  const body = parseJsonSafe<{ phone?: string }>(await request.text(), {});
  const phone = String(body.phone || '').trim();

  if (!/^\+20\d{10}$/.test(phone)) {
    return jsonResponse({ valid: false, wa_id: null, error: 'invalid_format' }, 200);
  }

  try {
    const response = await validateWhatsAppContact(phone);
    const contact = response.contacts?.[0] || {};
    return jsonResponse({
      valid: contact.status === 'valid',
      wa_id: contact.wa_id || null,
      source: 'meta_contacts',
    });
  } catch (_error) {
    return jsonResponse({
      valid: true,
      wa_id: null,
      source: 'fallback_format_only',
    });
  }
});
