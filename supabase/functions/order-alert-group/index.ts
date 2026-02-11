import { jsonResponse, parseJsonSafe, requireEnv } from '../_shared/http.ts';
import { restPatch, restSelect } from '../_shared/rest.ts';
import { sendTextMessage } from '../_shared/whatsapp.ts';

async function getOrder(orderId: string) {
  const rows = await restSelect(
    'orders',
    `?id=eq.${encodeURIComponent(orderId)}&select=id,order_number,customer_name,city,total,wa_group_alert_sent,status`,
  );
  return rows?.[0] || null;
}

async function getItems(orderId: string) {
  return await restSelect(
    'order_items',
    `?order_id=eq.${encodeURIComponent(orderId)}&select=product_name_ar,quantity,subtotal`,
  );
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const payload = parseJsonSafe<{ order_id?: string }>(await request.text(), {});
  if (!payload.order_id) {
    return jsonResponse({ error: 'missing_order_id' }, 400);
  }

  const order = await getOrder(payload.order_id);
  if (!order) {
    return jsonResponse({ error: 'order_not_found' }, 404);
  }

  if (order.wa_group_alert_sent) {
    return jsonResponse({ ok: true, duplicate: true });
  }

  const items = await getItems(order.id);
  const itemsList = items
    .map((item: Record<string, unknown>) => `• ${item.product_name_ar} × ${item.quantity} — ${item.subtotal} ج.م`)
    .join('\n');

  const groupText = [
    '🆕 طلب جديد!',
    '',
    `رقم: ${order.order_number}`,
    `العميل: ${order.customer_name}`,
    `المنطقة: ${order.city}`,
    `الإجمالي: ${order.total} ج.م`,
    '',
    'المنتجات:',
    itemsList,
    '',
    `للاستلام أرسل: استلام ${order.order_number}`,
  ].join('\n');

  await sendTextMessage(requireEnv('WA_GROUP_ID'), groupText);

  await restPatch('orders', `?id=eq.${encodeURIComponent(order.id)}`, {
    wa_group_alert_sent: true,
  });

  return jsonResponse({ ok: true, order_number: order.order_number });
});
