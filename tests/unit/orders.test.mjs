import test from 'node:test';
import assert from 'node:assert/strict';
import './setup-browser-env.mjs';

const catalog = await import('../../src/scripts/services/catalog.js');
const cart = await import('../../src/scripts/services/cart.js');
const orders = await import('../../src/scripts/services/orders.js');

test('create order with idempotency', async () => {
  localStorage.clear();
  await catalog.listProducts();

  cart.clearCart();
  cart.addToCart('prd-001', 1);

  const resultA = await orders.createOrder({
    customer: {
      name: 'test customer',
      phone: '+201234567890',
      city: 'cairo',
      address: 'test address with enough length',
      notes: '',
    },
    items: [{ productId: 'prd-001', quantity: 1 }],
    idempotencyKey: 'same-key',
  });

  const resultB = await orders.createOrder({
    customer: {
      name: 'test customer',
      phone: '+201234567890',
      city: 'cairo',
      address: 'test address with enough length',
      notes: '',
    },
    items: [{ productId: 'prd-001', quantity: 1 }],
    idempotencyKey: 'same-key',
  });

  assert.equal(resultA.error, null);
  assert.equal(resultB.error, null);
  assert.equal(resultA.data.order_number, resultB.data.order_number);
  assert.equal(resultB.duplicate, true);
});
