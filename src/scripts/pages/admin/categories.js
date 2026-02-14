import { bootstrapPage } from '../../app-shell.js';
import { ensureAdminAuth } from '../../utils/auth-guard.js';
import { renderAdminNav } from '../../components/admin-nav.js';
import { deleteCategory, listCategories, saveCategory, reorderCategories } from '../../services/catalog.js';
import { showToast } from '../../components/toast.js';

let categoriesState = [];

function renderCategories() {
  const root = document.querySelector('#categories-list');
  if (!root) {
    return;
  }

  root.innerHTML = categoriesState
    .map((category) => {
      return `
        <article class="category-row" data-category-id="${category.id}">
          <div>
            <strong>${category.name_ar}</strong>
            <div class="text-muted">${category.slug}</div>
          </div>
          <div>
            <button type="button" class="button button--secondary" data-action="up">↑</button>
            <button type="button" class="button button--secondary" data-action="down">↓</button>
            <button type="button" class="button button--danger" data-action="delete">×</button>
          </div>
        </article>
      `;
    })
    .join('');

  root.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const row = button.closest('[data-category-id]');
      if (!row) {
        return;
      }
      const result = await deleteCategory(row.dataset.categoryId);
      if (result.hasProducts) {
        showToast('error', 'admin:toast.error');
        return;
      }
      categoriesState = await listCategories();
      renderCategories();
      showToast('success', 'admin:toast.deleted');
    });
  });

  root.querySelectorAll('[data-action="up"], [data-action="down"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const row = button.closest('[data-category-id]');
      if (!row) {
        return;
      }
      const id = row.dataset.categoryId;
      const index = categoriesState.findIndex((item) => item.id === id);
      const direction = button.dataset.action === 'up' ? -1 : 1;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= categoriesState.length) {
        return;
      }
      const target = categoriesState[nextIndex];
      categoriesState[nextIndex] = categoriesState[index];
      categoriesState[index] = target;
      await reorderCategories(categoriesState.map((entry) => entry.id));
      categoriesState = await listCategories();
      renderCategories();
      showToast('success', 'admin:toast.saved');
    });
  });
}

async function initCategoriesPage() {
  if (!(await ensureAdminAuth())) {
    return;
  }

  await bootstrapPage({ activePath: '/admin/categories.html' });
  renderAdminNav('/admin/categories.html');

  categoriesState = await listCategories();
  renderCategories();

  const form = document.querySelector('#add-category-form');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const nameAr = String(data.get('name_ar') || '').trim();
    if (!nameAr) {
      return;
    }

    await saveCategory({ name_ar: nameAr });
    categoriesState = await listCategories();
    renderCategories();
    form.reset();
    showToast('success', 'admin:toast.saved');
  });
}

initCategoriesPage();
