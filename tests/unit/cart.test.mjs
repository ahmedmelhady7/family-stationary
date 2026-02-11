import test from 'node:test';
import assert from 'node:assert/strict';
import './setup-browser-env.mjs';

const cart = await import('../../src/scripts/services/cart.js');

test('cart add/update/remove and count', () => {
  cart.clearCart();

  cart.addToCart('prd-1', 2);
  cart.addToCart('prd-2', 1);
  cart.addToCart('prd-1', 1);

  assert.equal(cart.getCartCount(), 4);
  assert.equal(cart.getCart().length, 2);

  cart.updateQuantity('prd-2', 5);
  assert.equal(cart.getCartItem('prd-2')?.quantity, 5);

  cart.removeFromCart('prd-1');
  assert.equal(cart.getCartCount(), 5);
  assert.equal(cart.getCartItem('prd-1'), null);

  cart.clearCart();
  assert.equal(cart.getCartCount(), 0);
});
