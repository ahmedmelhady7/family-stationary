import { APP_CONFIG, STORAGE_KEYS } from '../config.js';
import { safeJsonParse } from '../utils/dom.js';

const EVENT_NAME = 'cart:changed';

function readCart() {
  const data = safeJsonParse(localStorage.getItem(STORAGE_KEYS.cart), []);
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter((item) => item && typeof item.productId === 'string');
}

function writeCart(cart) {
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  window.dispatchEvent(
    new CustomEvent(EVENT_NAME, {
      detail: {
        count: getCartCount(),
        cart,
      },
    }),
  );
}

export function getCart() {
  return readCart();
}

export function getCartItem(productId) {
  return readCart().find((item) => item.productId === productId) || null;
}

export function addToCart(productId, quantity = 1) {
  const cart = readCart();
  const existing = cart.find((item) => item.productId === productId);

  if (existing) {
    existing.quantity = Math.min(APP_CONFIG.maxCartItems, existing.quantity + quantity);
  } else {
    cart.push({ productId, quantity: Math.max(1, Math.min(APP_CONFIG.maxCartItems, quantity)) });
  }

  writeCart(cart);
  return cart;
}

export function removeFromCart(productId) {
  const cart = readCart().filter((item) => item.productId !== productId);
  writeCart(cart);
  return cart;
}

export function updateQuantity(productId, quantity) {
  const safeQuantity = Math.max(0, Math.min(APP_CONFIG.maxCartItems, Number(quantity || 0)));
  const cart = readCart();
  const item = cart.find((entry) => entry.productId === productId);

  if (!item) {
    return cart;
  }

  if (safeQuantity === 0) {
    return removeFromCart(productId);
  }

  item.quantity = safeQuantity;
  writeCart(cart);
  return cart;
}

export function clearCart() {
  writeCart([]);
}

export function getCartCount() {
  return readCart().reduce((total, item) => total + item.quantity, 0);
}

export function subscribeToCartChanges(listener) {
  const handler = (event) => listener(event.detail);
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
