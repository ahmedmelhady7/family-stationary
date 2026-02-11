import { requireEnv } from './http.ts';

const META_BASE = 'https://graph.facebook.com/v21.0';

function waHeaders() {
  return {
    Authorization: `Bearer ${requireEnv('WA_TOKEN')}`,
    'Content-Type': 'application/json',
  };
}

export async function sendTextMessage(to: string, text: string) {
  const phoneId = requireEnv('WA_PHONE_ID');
  const response = await fetch(`${META_BASE}/${phoneId}/messages`, {
    method: 'POST',
    headers: waHeaders(),
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body: text },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`sendTextMessage failed: ${detail}`);
  }

  return await response.json();
}

export async function sendTemplateMessage(to: string, template: string, params: string[] = []) {
  const phoneId = requireEnv('WA_PHONE_ID');
  const bodyParameters = params.map((value) => ({ type: 'text', text: value }));

  const response = await fetch(`${META_BASE}/${phoneId}/messages`, {
    method: 'POST',
    headers: waHeaders(),
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: template,
        language: { code: 'ar' },
        components: [
          {
            type: 'body',
            parameters: bodyParameters,
          },
        ],
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`sendTemplateMessage failed: ${detail}`);
  }

  return await response.json();
}

export async function sendMediaMessage(to: string, imageUrl: string, caption: string) {
  const phoneId = requireEnv('WA_PHONE_ID');
  const response = await fetch(`${META_BASE}/${phoneId}/messages`, {
    method: 'POST',
    headers: waHeaders(),
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        caption,
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`sendMediaMessage failed: ${detail}`);
  }

  return await response.json();
}

export async function validateWhatsAppContact(phone: string) {
  const phoneId = requireEnv('WA_PHONE_ID');
  const response = await fetch(`${META_BASE}/${phoneId}/contacts`, {
    method: 'POST',
    headers: waHeaders(),
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      blocking: 'wait',
      contacts: [phone],
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}
