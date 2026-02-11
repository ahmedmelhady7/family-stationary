import { bootstrapPage } from '../app-shell.js';
import { getCart, clearCart } from '../services/cart.js';
import { getProductById } from '../services/catalog.js';
import { createOrder } from '../services/orders.js';
import { validateWhatsAppNumberDebounced, isEgyptianPhone } from '../services/whatsapp-validate.js';
import { APP_CONFIG, STORAGE_KEYS } from '../config.js';
import { formatPrice } from '../utils/format.js';
import { t, translateDom } from '../i18n.js';
import { showToast } from '../components/toast.js';

const STEP_IDS = ['step-review', 'step-info', 'step-confirm'];

const state = {
  step: 0,
  cartRows: [],
  customer: {
    name: '',
    phone: '',
    city: '',
    address: '',
    building: '',
    landmark: '',
    notes: '',
    whatsappValid: false,
  },
};

function setStep(step) {
  state.step = Math.max(0, Math.min(STEP_IDS.length - 1, step));

  STEP_IDS.forEach((id, index) => {
    const section = document.querySelector(`#${id}`);
    if (!section) {
      return;
    }
    section.classList.toggle('hidden', index !== state.step);
  });

  document.querySelectorAll('.checkout-progress__step').forEach((node, index) => {
    node.dataset.active = index <= state.step ? 'true' : 'false';
  });
}

async function loadCartRows() {
  const cart = getCart();
  const rows = [];

  for (const item of cart) {
    const product = await getProductById(item.productId);
    if (!product || product.status !== 'active' || Number(product.stock_quantity) <= 0) {
      continue;
    }
    const quantity = Math.min(item.quantity, Number(product.stock_quantity));
    rows.push({
      product,
      quantity,
      subtotal: quantity * Number(product.price),
    });
  }

  state.cartRows = rows;
  return rows;
}

function cartTotal() {
  return state.cartRows.reduce((sum, row) => sum + row.subtotal, 0) + APP_CONFIG.deliveryFee;
}

function renderSidebarSummary() {
  const node = document.querySelector('#checkout-summary');
  if (!node) {
    return;
  }

  const list = state.cartRows
    .map((row) => `<li>${row.product.name_ar} × ${row.quantity} — ${formatPrice(row.subtotal)}</li>`)
    .join('');

  node.innerHTML = `
    <h2 data-i18n="products:cart.summary_title"></h2>
    <ul>${list}</ul>
    <p><span data-i18n="common:labels.total"></span>: <strong>${formatPrice(cartTotal())}</strong></p>
  `;
  translateDom(node);
}

function renderStepReview() {
  const node = document.querySelector('#step-review-list');
  if (!node) {
    return;
  }

  if (!state.cartRows.length) {
    node.innerHTML = `<p data-i18n="products:cart.empty_description"></p>`;
    translateDom(node);
    return;
  }

  node.innerHTML = state.cartRows
    .map((row) => {
      return `<article class="card"><div class="card__body"><h3>${row.product.name_ar}</h3><p>${row.quantity} × ${formatPrice(row.product.price)} = ${formatPrice(row.subtotal)}</p></div></article>`;
    })
    .join('');
}

function syncCustomerDraft() {
  localStorage.setItem(STORAGE_KEYS.customerDraft, JSON.stringify(state.customer));
}

function readCustomerDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(STORAGE_KEYS.customerDraft) || 'null');
    if (!draft) {
      return;
    }
    state.customer = {
      ...state.customer,
      ...draft,
    };
  } catch (_error) {
    // ignore invalid JSON
  }
}

function applyCustomerDraftToForm() {
  const form = document.querySelector('#customer-form');
  if (!form) {
    return;
  }

  Object.entries(state.customer).forEach(([field, value]) => {
    const input = form.elements.namedItem(field);
    if (input && typeof value === 'string') {
      input.value = value;
    }
  });
}

async function validateCustomerInfo() {
  const errors = [];
  if (!state.customer.name || state.customer.name.trim().length < 3) {
    errors.push('checkout:validation.name_required');
  }
  if (!isEgyptianPhone(state.customer.phone)) {
    errors.push('checkout:validation.phone_required');
  }
  if (!state.customer.city) {
    errors.push('checkout:validation.city_required');
  }
  if (!state.customer.address || state.customer.address.trim().length < 10) {
    errors.push('checkout:validation.address_required');
  }

  if (!state.customer.whatsappValid) {
    errors.push('checkout:validation.whatsapp_invalid');
  }

  const errorNode = document.querySelector('#checkout-form-errors');
  if (errorNode) {
    errorNode.innerHTML = errors.map((key) => `<li>${t(key)}</li>`).join('');
  }

  return errors.length === 0;
}

function fillConfirmation() {
  const root = document.querySelector('#step-confirm-content');
  if (!root) {
    return;
  }

  root.innerHTML = `
    <p>${state.customer.name}</p>
    <p>${state.customer.phone}</p>
    <p>${state.customer.city} - ${state.customer.address}</p>
    <p data-i18n="checkout:summary.payment_method"></p>
    <p><strong>${formatPrice(cartTotal())}</strong></p>
  `;
  translateDom(root);
}

async function placeOrder() {
  const idempotencyKey = crypto.randomUUID();
  const result = await createOrder({
    customer: {
      name: state.customer.name,
      phone: state.customer.phone,
      city: state.customer.city,
      address: state.customer.address,
      notes: state.customer.notes,
    },
    items: state.cartRows.map((row) => ({ productId: row.product.id, quantity: row.quantity })),
    idempotencyKey,
  });

  if (result.error || !result.data) {
    showToast('error', 'admin:toast.error');
    return;
  }

  clearCart();
  syncCustomerDraft();
  window.location.href = `/order-confirmation.html?order=${encodeURIComponent(result.data.order_number)}`;
}

async function initCheckoutEvents() {
  const form = document.querySelector('#customer-form');
  const nextButtons = document.querySelectorAll('[data-step-next]');
  const backButtons = document.querySelectorAll('[data-step-back]');

  nextButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      if (state.step === 0) {
        if (!state.cartRows.length) {
          showToast('error', 'checkout:validation.address_required');
          return;
        }
        setStep(1);
        return;
      }

      if (state.step === 1) {
        const valid = await validateCustomerInfo();
        if (!valid) {
          return;
        }
        fillConfirmation();
        setStep(2);
      }
    });
  });

  backButtons.forEach((button) => {
    button.addEventListener('click', () => {
      setStep(state.step - 1);
    });
  });

  form?.addEventListener('input', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      return;
    }

    state.customer[target.name] = target.value;

    if (target.name === 'phone') {
      const statusNode = document.querySelector('#whatsapp-status');
      if (statusNode) {
        statusNode.className = 'validation-pill';
        statusNode.textContent = t('checkout:validation.whatsapp_checking');
      }

      const validation = await validateWhatsAppNumberDebounced(target.value);
      state.customer.whatsappValid = Boolean(validation.valid);

      if (statusNode) {
        statusNode.className = `validation-pill ${state.customer.whatsappValid ? 'validation-pill--valid' : 'validation-pill--invalid'}`;
        statusNode.textContent = state.customer.whatsappValid
          ? t('checkout:validation.whatsapp_valid')
          : t('checkout:validation.whatsapp_invalid');
      }
    }

    syncCustomerDraft();
  });

  document.querySelector('#confirm-order-btn')?.addEventListener('click', placeOrder);
}

async function initCheckoutPage() {
  await bootstrapPage({ activePath: '/checkout.html' });
  readCustomerDraft();
  applyCustomerDraftToForm();
  await loadCartRows();
  renderStepReview();
  renderSidebarSummary();
  await initCheckoutEvents();
  setStep(0);
}

initCheckoutPage();
