import { translateDom } from '../i18n.js';

const LINKS = [
  { href: '/admin/dashboard.html', key: 'admin:dashboard.title' },
  { href: '/admin/products.html', key: 'admin:products.title' },
  { href: '/admin/product-edit.html', key: 'admin:products.add_product' },
  { href: '/admin/categories.html', key: 'admin:categories.title' },
];

function renderLinks(activePath) {
  return LINKS.map((link) => {
    const current = activePath.endsWith(link.href);
    return `<a class="admin-nav__link" href="${link.href}" data-i18n="${link.key}" ${current ? 'aria-current="page"' : ''}></a>`;
  }).join('');
}

export function renderAdminNav(activePath = '') {
  const sidebar = document.querySelector('[data-admin-sidebar]');
  const bottom = document.querySelector('[data-admin-bottom-nav]');

  if (sidebar) {
    sidebar.innerHTML = renderLinks(activePath);
    translateDom(sidebar);
  }

  if (bottom) {
    bottom.innerHTML = LINKS.map((link) => {
      const current = activePath.endsWith(link.href);
      return `<a class="admin-bottom-nav__link" href="${link.href}" data-i18n="${link.key}" ${current ? 'aria-current="page"' : ''}></a>`;
    }).join('');
    translateDom(bottom);
  }
}
