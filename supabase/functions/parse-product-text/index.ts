import { jsonResponse, parseJsonSafe } from '../_shared/http.ts';

const PRICE_PATTERN = /(\d+(?:\.\d{1,2})?)\s*(?:جنيه|ج\.م|egp|le)?/i;
const NAME_LINE_PATTERN = /^(.+?)(?:\n|$)/;

function normalizeText(input: string) {
  return input.replace(/\r\n/g, '\n').trim();
}

function extractLabelValue(text: string, label: string) {
  const pattern = new RegExp(`${label}\s*:\s*([^\\n]+)`, 'i');
  return text.match(pattern)?.[1]?.trim() || null;
}

function parseSimpleSlashFormat(text: string) {
  const slashIndex = text.indexOf('/');
  if (slashIndex === -1) {
    return null;
  }

  const name = text.slice(0, slashIndex).trim();
  const priceCandidate = text.slice(slashIndex + 1).trim();
  const price = priceCandidate.match(PRICE_PATTERN)?.[1] || null;

  return {
    name,
    price,
  };
}

export function parseProductText(text: string) {
  const normalized = normalizeText(text);
  const simple = parseSimpleSlashFormat(normalized);

  const fromNameLabel = extractLabelValue(normalized, 'الاسم');
  const fromPriceLabel = extractLabelValue(normalized, 'السعر');
  const fromDescriptionLabel = extractLabelValue(normalized, 'الوصف');

  const fallbackName = normalized.match(NAME_LINE_PATTERN)?.[1]?.trim() || null;
  const fallbackPrice = normalized.match(PRICE_PATTERN)?.[1] || null;

  const name = fromNameLabel || simple?.name || fallbackName;
  const priceRaw = fromPriceLabel || simple?.price || fallbackPrice;
  const description = fromDescriptionLabel || normalized.split('\n').slice(1).join('\n').trim() || null;

  return {
    name_ar: name || null,
    price: priceRaw ? Number(priceRaw) : null,
    description_ar: description,
  };
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const body = parseJsonSafe<{ text?: string }>(await request.text(), {});
  const parsed = parseProductText(body.text || '');
  return jsonResponse(parsed);
});
