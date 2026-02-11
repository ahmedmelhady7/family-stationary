import { jsonResponse, parseJsonSafe } from '../_shared/http.ts';
import { restPatch, restSelect } from '../_shared/rest.ts';
import { sendTemplateMessage } from '../_shared/whatsapp.ts';

async function fetchOrder(orderId: string) {
  const rows = await restSelect(
    'orders',
    `?id=eq.${encodeURIComponent(orderId)}&select=id,order_number,total,customer_phone,wa_confirmation_sent`,
  );
  return rows?.[0] || null;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const body = parseJsonSafe<{ order_id?: string }>(await request.text(), {});
  if (!body.order_id) {
    return jsonResponse({ error: 'missing_order_id' }, 400);
  }

  const order = await fetchOrder(body.order_id);
  if (!order) {
    return jsonResponse({ error: 'order_not_found' }, 404);
  }

  if (order.wa_confirmation_sent) {
    return jsonResponse({ ok: true, duplicate: true });
  }

  await sendTemplateMessage(order.customer_phone, 'order_confirmation_ar', [order.order_number, String(order.total)]);

  await restPatch('orders', `?id=eq.${encodeURIComponent(order.id)}`, {
    wa_confirmation_sent: true,
    status: order.status === 'pending' ? 'confirmed' : order.status,
  });

  return jsonResponse({ ok: true, order_number: order.order_number });
});
