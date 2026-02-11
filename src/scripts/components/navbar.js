import { translateDom } from '../i18n.js';
import { initCartBadge } from './cart-badge.js';

const NAV_LINKS = [
  { href: '/index.html', i18n: 'common:nav.home' },
  { href: '/products.html', i18n: 'common:nav.products' },
  { href: '/admin/login.html', i18n: 'common:nav.admin' },
];

export function renderNavbar(activePath = '') {
  const header = document.querySelector('#site-header');
  if (!header) {
    return;
  }

  const links = NAV_LINKS.map((entry) => {
    const current = activePath.endsWith(entry.href) || (entry.href === '/index.html' && activePath === '/');
    return `<li><a class="navbar__link" href="${entry.href}" ${current ? 'aria-current="page"' : ''} data-i18n="${entry.i18n}"></a></li>`;
  }).join('');

  header.innerHTML = `
    <a class="skip-link" href="#main-content" data-i18n="common:skip.to_content"></a>
    <div class="navbar" role="banner">
      <div class="navbar__pattern" aria-hidden="true"></div>
      <div class="navbar__inner">
        <button class="navbar__hamburger" type="button" aria-expanded="false" aria-controls="primary-nav" data-i18n-aria-label="common:nav.menu"></button>
        <a class="navbar__logo" href="/index.html">
          <span data-i18n="common:app.name"></span>
        </a>
        <ul id="primary-nav" class="navbar__menu" role="navigation" aria-label="Primary Navigation">
          ${links}
        </ul>
        <div class="navbar__actions">
          <a href="/cart.html" class="cart-icon-wrap" aria-label="cart">
            <span aria-hidden="true">🛒</span>
          </a>
        </div>
      </div>
    </div>
  `;

  const menuButton = header.querySelector('.navbar__hamburger');
  const menu = header.querySelector('.navbar__menu');
  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const expanded = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      menu.dataset.open = expanded ? 'false' : 'true';
    });
  }

  const cartWrap = header.querySelector('.cart-icon-wrap');
  initCartBadge(cartWrap);
  translateDom(header);
}
