import { bootstrapPage } from '../../app-shell.js';
import { ensureAdminAuth } from '../../utils/auth-guard.js';
import { renderAdminNav } from '../../components/admin-nav.js';
import { getCatalogStats } from '../../services/catalog.js';
import { listOrders } from '../../services/orders.js';

async function initDashboardPage() {
  if (!(await ensureAdminAuth())) {
    return;
  }

  await bootstrapPage({ activePath: '/admin/dashboard.html' });
  renderAdminNav('/admin/dashboard.html');

  const stats = await getCatalogStats({ adminMode: true });
  const recentOrders = listOrders().slice(0, 10).length;

  const nodes = {
    total: document.querySelector('#stat-total-products'),
    active: document.querySelector('#stat-active-products'),
    outOfStock: document.querySelector('#stat-out-of-stock'),
    orders: document.querySelector('#stat-recent-orders'),
  };

  if (nodes.total) nodes.total.textContent = String(stats.totalProducts);
  if (nodes.active) nodes.active.textContent = String(stats.activeProducts);
  if (nodes.outOfStock) nodes.outOfStock.textContent = String(stats.outOfStock);
  if (nodes.orders) nodes.orders.textContent = String(recentOrders);
}

initDashboardPage();
