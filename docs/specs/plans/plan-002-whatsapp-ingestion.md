# Plan-002: WhatsApp Product Ingestion Pipeline

> Technical implementation plan for [PRD-002](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/prds/PRD-002-whatsapp-product-ingestion.md)

---

## Architecture

### Webhook Flow

```
Meta Cloud API → Webhook (Supabase Edge Function) → Parser → Supabase DB
                                                    ↓
                                         WhatsApp Reply (confirmation)
```

### Supabase Edge Functions

```
supabase/functions/
├── whatsapp-webhook/         # Receives all WhatsApp events
│   └── index.ts
├── parse-product-link/       # Scrapes product data from URL
│   └── index.ts
├── parse-product-text/       # Parses manual text+image messages
│   └── index.ts
└── whatsapp-send/            # Sends WhatsApp replies
    └── index.ts
```

### Webhook Verification

```typescript
// whatsapp-webhook/index.ts
// GET: Meta verification challenge
// POST: Incoming message processing

Deno.serve(async (req) => {
  if (req.method === "GET") {
    // Verify webhook with hub.verify_token
    const params = new URL(req.url).searchParams;
    if (params.get("hub.verify_token") === Deno.env.get("WA_VERIFY_TOKEN")) {
      return new Response(params.get("hub.challenge"));
    }
    return new Response("Forbidden", { status: 403 });
  }

  // POST: Process incoming message
  const body = await req.json();
  // Route to link parser or text parser based on message type
});
```

---

## Dual-Path Ingestion

### Path 1: Link-Based

| Step | Action                                                                |
| ---- | --------------------------------------------------------------------- |
| 1    | Founder sends URL in WhatsApp                                         |
| 2    | Webhook detects URL pattern                                           |
| 3    | `parse-product-link` scrapes page (title, price, images, description) |
| 4    | Creates product draft in DB                                           |
| 5    | Sends confirmation with scraped data summary                          |
| 6    | Founder confirms or corrects                                          |

### Path 2: Manual (Text + Images)

| Step | Action                                                                   |
| ---- | ------------------------------------------------------------------------ |
| 1    | Founder sends text message with product details                          |
| 2    | Webhook detects text (no URL)                                            |
| 3    | `parse-product-text` extracts: name, price, description                  |
| 4    | If images attached, downloads from Meta CDN to Supabase Storage          |
| 5    | Creates product draft                                                    |
| 6    | If missing required fields (name or price), sends prompt asking for them |
| 7    | Sends confirmation with parsed data summary                              |

### Text Parsing Logic

```typescript
// Regex patterns for Arabic product text
const PRICE_PATTERN = /(\d+(?:\.\d{2})?)\s*(?:جنيه|ج\.م|EGP|LE)/i;
const NAME_PATTERN = /^(.+?)(?:\n|$)/; // First line = product name

function parseProductText(text: string) {
  const price = text.match(PRICE_PATTERN)?.[1];
  const name = text.match(NAME_PATTERN)?.[1]?.trim();
  const description = text
    .split("\n")
    .slice(1)
    .join("\n")
    .replace(PRICE_PATTERN, "")
    .trim();

  return {
    name_ar: name || null,
    price: price ? parseFloat(price) : null,
    description_ar: description || null,
  };
}
```

---

## Image Pipeline

```
WhatsApp Media → Meta CDN URL → Download → Resize (800×800) → Supabase Storage
```

```typescript
// Download image from Meta CDN
async function downloadWhatsAppMedia(mediaId: string): Promise<ArrayBuffer> {
  // 1. Get media URL from Meta API
  const mediaUrl = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${WA_TOKEN}` },
  }).then((r) => r.json());

  // 2. Download binary
  return fetch(mediaUrl.url, {
    headers: { Authorization: `Bearer ${WA_TOKEN}` },
  }).then((r) => r.arrayBuffer());
}

// Upload to Supabase Storage
async function uploadProductImage(imageBuffer: ArrayBuffer, productId: string) {
  const path = `product-images/${productId}/${Date.now()}.webp`;
  await supabase.storage.from("products").upload(path, imageBuffer, {
    contentType: "image/webp",
  });
  return path;
}
```

---

## Error Handling

| Scenario              | Response                                                    |
| --------------------- | ----------------------------------------------------------- |
| Invalid URL           | "❌ لم نتمكن من قراءة الرابط. يرجى إرسال رابط صحيح"         |
| Scrape failed         | "❌ تعذر استخراج بيانات المنتج. يرجى إرسال التفاصيل يدوياً" |
| Missing name          | "❓ ما اسم المنتج؟"                                         |
| Missing price         | "❓ ما سعر المنتج بالجنيه المصري؟"                          |
| Image download failed | "⚠️ تعذر تحميل الصورة. يرجى إرسالها مرة أخرى"               |
| Success               | "✅ تم إضافة المنتج: {name} — {price} ج.م"                  |

---

## Authorized Users

Only whitelisted phone numbers (founders) can ingest products. Stored in Supabase config table or environment variable.

```typescript
const AUTHORIZED_NUMBERS =
  Deno.env.get("WA_AUTHORIZED_NUMBERS")?.split(",") || [];

function isAuthorized(phoneNumber: string): boolean {
  return AUTHORIZED_NUMBERS.includes(phoneNumber);
}
```

---

## Dependencies

| Dependency                    | Source PRD   |
| ----------------------------- | ------------ |
| Product DB schema             | PRD-001      |
| WhatsApp API (Meta Cloud API) | Constitution |
| Supabase Storage              | Constitution |
