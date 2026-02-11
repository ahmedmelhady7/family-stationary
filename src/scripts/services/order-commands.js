import { getOrderByNumber, updateOrderStatus } from './orders.js';

const CLAIM_PATTERN = /^استلام\s+(FS-\d{4,})$/i;
const CONTACT_PATTERN = /^تواصل\s+(FS-\d{4,})$/i;
const STATUS_PATTERN = /^حالة\s+(FS-\d{4,})$/i;
const DELIVER_PATTERN = /^تسليم\s+(FS-\d{4,})$/i;

function toWaMeLink(phone, text) {
  const cleanPhone = String(phone || '').replace(/[^\d+]/g, '');
  return `https://wa.me/${encodeURIComponent(cleanPhone)}?text=${encodeURIComponent(text)}`;
}

export function processGroupCommand(message, senderName) {
  const text = String(message || '').trim();

  let match = text.match(CLAIM_PATTERN);
  if (match) {
    const order = getOrderByNumber(match[1]);
    if (!order) {
      return { type: 'error', code: 'orders.not_found' };
    }
    if (order.status === 'claimed') {
      return { type: 'error', code: 'orders.already_claimed', order };
    }
    const updated = updateOrderStatus(order.order_number, 'claimed', {
      claimed_by: senderName,
      claimed_at: new Date().toISOString(),
    });
    return { type: 'claimed', order: updated };
  }

  match = text.match(CONTACT_PATTERN);
  if (match) {
    const order = getOrderByNumber(match[1]);
    if (!order) {
      return { type: 'error', code: 'orders.not_found' };
    }
    const prefilled = `order.contact_intro ${order.order_number}`;
    const link = toWaMeLink(order.customer_phone, prefilled);
    const updated = updateOrderStatus(order.order_number, 'customer_contacted', {
      customer_contacted_at: new Date().toISOString(),
    });
    return { type: 'contact', order: updated, link };
  }

  match = text.match(STATUS_PATTERN);
  if (match) {
    const order = getOrderByNumber(match[1]);
    if (!order) {
      return { type: 'error', code: 'orders.not_found' };
    }
    return { type: 'status', order };
  }

  match = text.match(DELIVER_PATTERN);
  if (match) {
    const updated = updateOrderStatus(match[1], 'delivered', {
      delivered_at: new Date().toISOString(),
    });
    if (!updated) {
      return { type: 'error', code: 'orders.not_found' };
    }
    return { type: 'delivered', order: updated };
  }

  return { type: 'ignored' };
}
