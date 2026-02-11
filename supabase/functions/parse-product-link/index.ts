import { jsonResponse, parseJsonSafe } from '../_shared/http.ts';

function getMeta(html: string, name: string) {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return null;
}

function getTitle(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1]?.trim() || null;
}

function getJsonLdProduct(html: string) {
  const jsonLdBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of jsonLdBlocks) {
    try {
      const value = JSON.parse(block[1]);
      const entries = Array.isArray(value) ? value : [value];
      for (const entry of entries) {
        if (entry?.['@type'] === 'Product') {
          return entry;
        }
      }
    } catch (_error) {
      // continue to next block
    }
  }
  return null;
}

function getPrice(html: string, jsonLd: Record<string, unknown> | null) {
  const fromJsonLd = (jsonLd?.offers as Record<string, unknown> | undefined)?.price;
  if (typeof fromJsonLd === 'string' || typeof fromJsonLd === 'number') {
    return Number(fromJsonLd);
  }

  const metaPrice = getMeta(html, 'product:price:amount') || getMeta(html, 'price');
  if (metaPrice) {
    const normalized = metaPrice.replace(/[^\d.]/g, '');
    if (normalized) {
      return Number(normalized);
    }
  }

  const freeText = html.match(/(\d+(?:\.\d{1,2})?)\s*(?:جنيه|ج\.م|EGP|LE)/i)?.[1];
  return freeText ? Number(freeText) : null;
}

export async function parseLink(url: string) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`fetch_failed_${response.status}`);
  }

  const html = await response.text();
  const jsonLd = getJsonLdProduct(html);

  const title =
    getMeta(html, 'og:title') ||
    (jsonLd?.name as string | undefined) ||
    getTitle(html) ||
    null;

  const description =
    getMeta(html, 'og:description') ||
    getMeta(html, 'description') ||
    (jsonLd?.description as string | undefined) ||
    null;

  const image =
    getMeta(html, 'og:image') ||
    (Array.isArray(jsonLd?.image) ? String(jsonLd?.image?.[0]) : (jsonLd?.image as string | undefined)) ||
    null;

  const price = getPrice(html, jsonLd);

  return {
    source_url: url,
    name_ar: title,
    description_ar: description,
    image,
    price,
  };
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const payload = parseJsonSafe<{ url?: string }>(await request.text(), {});
  if (!payload.url || !/^https?:\/\//i.test(payload.url)) {
    return jsonResponse({ error: 'invalid_url' }, 400);
  }

  try {
    const parsed = await parseLink(payload.url);
    return jsonResponse(parsed);
  } catch (error) {
    return jsonResponse(
      {
        error: 'scrape_failed',
        detail: error instanceof Error ? error.message : String(error),
      },
      422,
    );
  }
});
