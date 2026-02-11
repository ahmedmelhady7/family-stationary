import { getCartCount, subscribeToCartChanges } from '../services/cart.js';

function updateBadge(target, value) {
  target.textContent = String(value);
  target.classList.toggle('hidden', value <= 0);
  target.setAttribute('aria-label', `${value}`);
}

export function initCartBadge(container) {
  if (!container) {
    return () => {};
  }

  let badge = container.querySelector('.cart-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'cart-badge';
    badge.setAttribute('aria-live', 'polite');
    container.append(badge);
  }

  updateBadge(badge, getCartCount());

  return subscribeToCartChanges(({ count }) => {
    updateBadge(badge, count);
  });
}
