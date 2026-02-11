import { jsonResponse, parseJsonSafe } from '../_shared/http.ts';

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const payload = parseJsonSafe<{ product_id?: string; image_path?: string }>(await request.text(), {});
  if (!payload.product_id || !payload.image_path) {
    return jsonResponse({ error: 'invalid_payload' }, 400);
  }

  const base = payload.image_path.replace(/\.[^.]+$/, '');
  return jsonResponse({
    product_id: payload.product_id,
    source: payload.image_path,
    generated: {
      thumb: `${base}-400.webp`,
      detail: `${base}-800.webp`,
    },
  });
});
