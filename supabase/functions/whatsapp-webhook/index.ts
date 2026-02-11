import { jsonResponse, parseJsonSafe, requireEnv } from '../_shared/http.ts';
import { restInsert, restPatch, restSelect, restUpsert } from '../_shared/rest.ts';
import { t } from '../_shared/messages.ts';
import { sendTextMessage } from '../_shared/whatsapp.ts';
import { downloadMetaMedia, uploadProductImage } from '../_shared/media.ts';
import {
  clearConversationState,
  getConversationState,
  setConversationState,
} from '../_shared/conversation-state.ts';

const URL_PATTERN = /(https?:\/\/[^\s]+)/i;
const CLAIM_PATTERN = /^استلام\s+(FS-\d{4,})$/i;
const CONTACT_PATTERN = /^تواصل\s+(FS-\d{4,})$/i;
const STATUS_PATTERN = /^حالة\s+(FS-\d{4,})$/i;
const DELIVER_PATTERN = /^تسليم\s+(FS-\d{4,})$/i;

function getAuthorizedNumbers() {
  return requireEnv('WA_AUTHORIZED_NUMBERS')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function isAuthorized(sender: string) {
  return getAuthorizedNumbers().includes(sender);
}

function parseIncomingMessage(payload: Record<string, unknown>) {
  const entry = (payload.entry as Array<Record<string, unknown>> | undefined)?.[0];
  const change = (entry?.changes as Array<Record<string, unknown>> | undefined)?.[0];
  const value = change?.value as Record<string, unknown> | undefined;
  const message = (value?.messages as Array<Record<string, unknown>> | undefined)?.[0];
  if (!message) {
    return null;
  }

  const contacts = value?.contacts as Array<Record<string, unknown>> | undefined;
  const senderProfileName = contacts?.[0]?.profile && typeof contacts[0].profile === 'object'
    ? (contacts[0].profile as Record<string, unknown>).name
    : null;

  return {
    senderPhone: String(message.from || ''),
    senderName: String(senderProfileName || message.from || ''),
    messageId: String(message.id || ''),
    messageType: String(message.type || ''),
    message,
  };
}

async function createProductDraft(input: {
  senderPhone: string;
  sourceType: 'link' | 'manual_whatsapp';
  nameAr: string;
  price: number;
  descriptionAr?: string | null;
  sourceUrl?: string | null;
  images?: string[];
}) {
  const slugBase = input.nameAr
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  const rows = await restInsert('products', {
    name_ar: input.nameAr,
    slug: `${slugBase || 'product'}-${Date.now()}`,
    description_ar: input.descriptionAr || null,
    price: input.price,
    currency: 'EGP',
    images: input.images || [],
    status: 'active',
    stock_quantity: 1,
    source_type: input.sourceType,
    source_url: input.sourceUrl || null,
  });

  await restInsert('ingestion_attempts', {
    sender_phone: input.senderPhone,
    source_type: input.sourceType,
    source_value: input.sourceUrl || input.nameAr,
    status: 'success',
    payload: rows?.[0] || {},
  });

  return rows?.[0] || null;
}

async function parseViaFunction(functionName: string, payload: Record<string, unknown>) {
  const response = await fetch(`${requireEnv('SUPABASE_URL')}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireEnv('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return await response.json();
}

async function findOrder(orderNumber: string) {
  const rows = await restSelect('orders', `?order_number=eq.${encodeURIComponent(orderNumber)}&select=*`);
  return rows?.[0] || null;
}

async function handleGroupOrderCommands(text: string, senderName: string, senderPhone: string) {
  let match = text.match(CLAIM_PATTERN);
  if (match) {
    const order = await findOrder(match[1]);
    if (!order) {
      await sendTextMessage(senderPhone, await t('errors.unknown'));
      return;
    }

    if (order.status === 'claimed') {
      await sendTextMessage(senderPhone, await t('errors.unknown'));
      return;
    }

    await restPatch('orders', `?id=eq.${encodeURIComponent(order.id)}`, {
      status: 'claimed',
      claimed_by: senderName,
      claimed_at: new Date().toISOString(),
    });

    await sendTextMessage(senderPhone, await t('success.order_claimed', { order_number: order.order_number }));
    return;
  }

  match = text.match(CONTACT_PATTERN);
  if (match) {
    const order = await findOrder(match[1]);
    if (!order) {
      await sendTextMessage(senderPhone, await t('errors.unknown'));
      return;
    }

    const prefilled = [
      `السلام عليكم ${order.customer_name}`,
      `طلبك رقم ${order.order_number}`,
      'موعد التوصيل المتوقع: ____',
    ].join('\n');

    const link = `https://wa.me/${encodeURIComponent(order.customer_phone)}?text=${encodeURIComponent(prefilled)}`;

    await restPatch('orders', `?id=eq.${encodeURIComponent(order.id)}`, {
      status: 'customer_contacted',
      customer_contacted_at: new Date().toISOString(),
    });

    await sendTextMessage(senderPhone, `${await t('success.order_contact')}\n${link}`);
    return;
  }

  match = text.match(STATUS_PATTERN);
  if (match) {
    const order = await findOrder(match[1]);
    if (!order) {
      await sendTextMessage(senderPhone, await t('errors.unknown'));
      return;
    }

    const summary = [
      `رقم الطلب: ${order.order_number}`,
      `الحالة: ${order.status}`,
      `العميل: ${order.customer_name}`,
      `الإجمالي: ${order.total} ج.م`,
      `المستلم: ${order.claimed_by || '-'}`,
    ].join('\n');

    await sendTextMessage(senderPhone, summary);
    return;
  }

  match = text.match(DELIVER_PATTERN);
  if (match) {
    const order = await findOrder(match[1]);
    if (!order) {
      await sendTextMessage(senderPhone, await t('errors.unknown'));
      return;
    }

    await restPatch('orders', `?id=eq.${encodeURIComponent(order.id)}`, {
      status: 'delivered',
      delivered_at: new Date().toISOString(),
    });

    await sendTextMessage(senderPhone, await t('success.order_delivered', { order_number: order.order_number }));
  }
}

async function handleManualConversation(message: Record<string, unknown>, senderPhone: string) {
  const text = String((message.text as Record<string, unknown> | undefined)?.body || '');
  const media = message.image as Record<string, unknown> | undefined;
  const mediaId = media?.id ? String(media.id) : null;

  const existing = await getConversationState(senderPhone);
  const parsed = await parseViaFunction('parse-product-text', { text });

  const pending = {
    ...(existing?.pending_payload || {}),
    name_ar: parsed.name_ar || (existing?.pending_payload?.name_ar as string | undefined) || null,
    price: parsed.price || (existing?.pending_payload?.price as number | undefined) || null,
    description_ar:
      parsed.description_ar || (existing?.pending_payload?.description_ar as string | undefined) || null,
    images: (existing?.pending_payload?.images as string[] | undefined) || [],
  };

  if (mediaId) {
    try {
      const binary = await downloadMetaMedia(mediaId);
      const uploaded = await uploadProductImage(`manual-${Date.now()}`, binary);
      pending.images = [...pending.images, uploaded.publicUrl].slice(0, 5);
    } catch (_error) {
      await sendTextMessage(senderPhone, await t('errors.image_failed'));
    }
  }

  if (!pending.name_ar) {
    await setConversationState({ sender_phone: senderPhone, state: 'awaiting_name', pending_payload: pending });
    await sendTextMessage(senderPhone, await t('errors.missing_name'));
    return;
  }

  if (!pending.price) {
    await setConversationState({ sender_phone: senderPhone, state: 'awaiting_price', pending_payload: pending });
    await sendTextMessage(senderPhone, await t('errors.missing_price'));
    return;
  }

  const product = await createProductDraft({
    senderPhone,
    sourceType: 'manual_whatsapp',
    nameAr: pending.name_ar,
    price: Number(pending.price),
    descriptionAr: pending.description_ar,
    images: pending.images,
  });

  await clearConversationState(senderPhone);
  await sendTextMessage(
    senderPhone,
    await t('success.product_created', {
      name: product?.name_ar || pending.name_ar,
      price: Number(pending.price).toFixed(2),
    }),
  );
}

async function handleLinkIngestion(text: string, senderPhone: string) {
  const url = text.match(URL_PATTERN)?.[1];
  if (!url) {
    await sendTextMessage(senderPhone, await t('errors.invalid_url'));
    return;
  }

  try {
    const parsed = await parseViaFunction('parse-product-link', { url });

    if (!parsed?.name_ar || !parsed?.price) {
      await sendTextMessage(senderPhone, await t('errors.scrape_failed'));
      return;
    }

    const product = await createProductDraft({
      senderPhone,
      sourceType: 'link',
      nameAr: parsed.name_ar,
      price: Number(parsed.price),
      descriptionAr: parsed.description_ar,
      sourceUrl: parsed.source_url,
      images: parsed.image ? [parsed.image] : [],
    });

    await sendTextMessage(
      senderPhone,
      await t('success.product_created', {
        name: product?.name_ar || parsed.name_ar,
        price: Number(parsed.price).toFixed(2),
      }),
    );
  } catch (_error) {
    await restInsert('ingestion_attempts', {
      sender_phone: senderPhone,
      source_type: 'link',
      source_value: url,
      status: 'error',
      error_code: 'scrape_failed',
      payload: {},
    });
    await sendTextMessage(senderPhone, await t('errors.scrape_failed'));
  }
}

async function handleIncoming(payload: Record<string, unknown>) {
  const parsed = parseIncomingMessage(payload);
  if (!parsed?.senderPhone) {
    return jsonResponse({ ok: true, ignored: true });
  }

  if (!isAuthorized(parsed.senderPhone)) {
    await sendTextMessage(parsed.senderPhone, await t('errors.unauthorized'));
    return jsonResponse({ ok: true, unauthorized: true });
  }

  const textBody = String((parsed.message.text as Record<string, unknown> | undefined)?.body || '').trim();

  if (textBody && (CLAIM_PATTERN.test(textBody) || CONTACT_PATTERN.test(textBody) || STATUS_PATTERN.test(textBody) || DELIVER_PATTERN.test(textBody))) {
    await handleGroupOrderCommands(textBody, parsed.senderName, parsed.senderPhone);
    return jsonResponse({ ok: true, routed: 'group_command' });
  }

  if (URL_PATTERN.test(textBody)) {
    await handleLinkIngestion(textBody, parsed.senderPhone);
    return jsonResponse({ ok: true, routed: 'link' });
  }

  if (parsed.messageType === 'text' || parsed.messageType === 'image') {
    await handleManualConversation(parsed.message, parsed.senderPhone);
    return jsonResponse({ ok: true, routed: 'manual' });
  }

  await sendTextMessage(parsed.senderPhone, await t('instructions.usage'));
  return jsonResponse({ ok: true, routed: 'instructions' });
}

Deno.serve(async (request) => {
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === requireEnv('WA_VERIFY_TOKEN') && challenge) {
      return new Response(challenge, { status: 200 });
    }

    return new Response('Forbidden', { status: 403 });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const payload = parseJsonSafe<Record<string, unknown>>(await request.text(), {});
  return await handleIncoming(payload);
});
