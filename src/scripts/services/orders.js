import { APP_CONFIG, STORAGE_KEYS } from '../config.js';
import { getProductById, saveProduct } from './catalog.js';
import { safeJsonParse } from '../utils/dom.js';

function readOrders() {
  const orders = safeJsonParse(localStorage.getItem(STORAGE_KEYS.orders), []);
  return Array.isArray(orders) ? orders : [];
}

function writeOrders(orders) {
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
}

function nextOrderNumber() {
  const current = Number(localStorage.getItem(STORAGE_KEYS.orderCounter) || '0') + 1;
  localStorage.setItem(STORAGE_KEYS.orderCounter, String(current));
  return `FS-${String(current).padStart(4, '0')}`;
}

function validateCustomer(customer) {
  if (!customer.name || customer.name.trim().length < 3) {
    return { valid: false, code: 'name_required' };
  }
  if (!customer.phone || !/^\+20\d{10}$/.test(customer.phone)) {
    return { valid: false, code: 'phone_required' };
  }
  if (!customer.city) {
    return { valid: false, code: 'city_required' };
  }
  if (!customer.address || customer.address.trim().length < 10) {
    return { valid: false, code: 'address_required' };
  }
  return { valid: true, code: null };
}

export async function createOrder({ customer, items, idempotencyKey }) {
  const customerValidation = validateCustomer(customer);
  if (!customerValidation.valid) {
    return { error: customerValidation.code, data: null };
  }

  const orders = readOrders();
  const existing = orders.find((order) => order.idempotency_key === idempotencyKey);
  if (existing) {
    return { data: existing, error: null, duplicate: true };
  }

  const orderItems = [];
  let total = 0;

  for (const cartItem of items) {
    const product = await getProductById(cartItem.productId);
    if (!product || product.status !== 'active') {
      return { error: 'out_of_stock', data: null };
    }

    if (Number(product.stock_quantity) < cartItem.quantity) {
      return { error: 'out_of_stock', data: null };
    }

    const subtotal = Number(product.price) * Number(cartItem.quantity);
    total += subtotal;
    orderItems.push({
      product_id: product.id,
      product_name_ar: product.name_ar,
      quantity: cartItem.quantity,
      unit_price: Number(product.price),
      subtotal,
    });

    await saveProduct({
      ...product,
      stock_quantity: Number(product.stock_quantity) - Number(cartItem.quantity),
      status: Number(product.stock_quantity) - Number(cartItem.quantity) <= 0 ? 'out_of_stock' : product.status,
    });
  }

  total += APP_CONFIG.deliveryFee;

  const order = {
    id: crypto.randomUUID(),
    order_number: nextOrderNumber(),
    customer_name: customer.name,
    customer_phone: customer.phone,
    customer_address: customer.address,
    city: customer.city,
    notes: customer.notes || '',
    payment_method: 'cod',
    status: 'pending',
    total,
    currency: APP_CONFIG.defaultCurrency,
    items: orderItems,
    idempotency_key: idempotencyKey,
    wa_confirmation_sent: true,
    wa_group_alert_sent: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  orders.unshift(order);
  writeOrders(orders);
  return { error: null, data: order, duplicate: false };
}

export function listOrders() {
  return readOrders();
}

export function getOrderByNumber(orderNumber) {
  return readOrders().find((order) => order.order_number === orderNumber) || null;
}

export function updateOrderStatus(orderNumber, status, patch = {}) {
  const orders = readOrders();
  const item = orders.find((order) => order.order_number === orderNumber);
  if (!item) {
    return null;
  }
  item.status = status;
  Object.assign(item, patch);
  item.updated_at = new Date().toISOString();
  writeOrders(orders);
  return item;
}
