import { APP_CONFIG } from '../config.js';

let timeoutId = null;

export function isEgyptianPhone(phone) {
  return /^\+20\d{10}$/.test(String(phone || '').trim());
}

async function callValidationEndpoint(phone) {
  try {
    const response = await fetch('/functions/v1/validate-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      return { valid: false, wa_id: null, fallback: true };
    }

    return await response.json();
  } catch (_error) {
    return { valid: isEgyptianPhone(phone), wa_id: null, fallback: true };
  }
}

export function validateWhatsAppNumberDebounced(phone) {
  clearTimeout(timeoutId);
  return new Promise((resolve) => {
    timeoutId = setTimeout(async () => {
      const response = await callValidationEndpoint(phone);
      resolve(response);
    }, APP_CONFIG.whatsappDebounceMs);
  });
}
