# Tasks-002: WhatsApp Product Ingestion Pipeline

> Task breakdown for [Plan-002](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/specs/plans/plan-002-whatsapp-ingestion.md) · [PRD-002](file:///Users/hadi/workspace-v2/orgs/family-stationary/docs/prds/PRD-002-whatsapp-product-ingestion.md)

---

## Phase 1: Webhook Foundation

### Task 2.1: Set up Meta Cloud API app

- **Files**: `.env` (WA_TOKEN, WA_PHONE_ID, WA_VERIFY_TOKEN, WA_AUTHORIZED_NUMBERS)
- **Work**: Create Meta Business app, configure WhatsApp product, generate system user token, whitelist founder phone numbers
- **Depends on**: None (external setup)
- **Verify**: Meta developer dashboard shows active WhatsApp app

### Task 2.2: Create webhook Edge Function

- **Files**: `supabase/functions/whatsapp-webhook/index.ts`
- **Work**: GET handler for verification challenge, POST handler to receive messages, extract sender number, message type (text/image/link), and content. Authorization check (whitelist)
- **Depends on**: 2.1
- **Verify**: Meta webhook verification succeeds, incoming messages logged

### Task 2.3: Create WhatsApp send helper

- **Files**: `supabase/functions/_shared/whatsapp.ts`
- **Work**: Shared module – `sendTextMessage(to, text)`, `sendTemplateMessage(to, template, params)`. Uses Meta Cloud API v21.0
- **Depends on**: 2.1
- **Verify**: Bot can reply to founder messages

---

## Phase 2: Link-Based Ingestion

### Task 2.4: Create link parser Edge Function

- **Files**: `supabase/functions/parse-product-link/index.ts`
- **Work**: Receive URL, fetch page HTML, extract Open Graph / meta tags (title, price, image, description). Fallback to basic HTML parsing
- **Depends on**: 2.2, 1.1 (products table)
- **Verify**: Send URL in WhatsApp → product draft created with scraped data

### Task 2.5: Wire link detection in webhook

- **Files**: `supabase/functions/whatsapp-webhook/index.ts` (extend)
- **Work**: Detect URLs in message text, route to `parse-product-link`, send confirmation or error reply
- **Depends on**: 2.2, 2.3, 2.4
- **Verify**: End-to-end: send URL → receive confirmation with product summary

---

## Phase 3: Manual Text + Image Ingestion

### Task 2.6: Create text parser Edge Function

- **Files**: `supabase/functions/parse-product-text/index.ts`
- **Work**: Extract product name (first line), price (regex for EGP patterns), description (remaining text). Handle missing fields by prompting
- **Depends on**: 2.2, 1.1
- **Verify**: Send "قلم حبر أزرق\n15 جنيه" → product draft created

### Task 2.7: Implement image download pipeline

- **Files**: `supabase/functions/_shared/media.ts`
- **Work**: Download image from Meta CDN (requires auth token), convert to WebP, upload to Supabase Storage, return public URL
- **Depends on**: 2.1
- **Verify**: Image sent in WhatsApp → stored in Supabase Storage, URL accessible

### Task 2.8: Wire manual creation in webhook

- **Files**: `supabase/functions/whatsapp-webhook/index.ts` (extend)
- **Work**: Detect text-only messages (no URL), route to text parser, handle images attached with text, send confirmation or missing-field prompt
- **Depends on**: 2.6, 2.7, 2.3
- **Verify**: End-to-end: send text + image → product draft created with image

---

## Phase 4: Conversation State

### Task 2.9: Implement multi-message state tracking

- **Files**: `supabase/functions/_shared/conversation-state.ts`
- **Work**: Track pending product creation (missing fields). Store state in Supabase table `wa_conversations`. Handle follow-up messages (e.g., founder replies with price after name)
- **Depends on**: 2.6, 2.8
- **Verify**: Send product name → bot asks for price → send price → product created

---

## Checkpoint: Ingestion Pipeline Complete

- [ ] Link-based: send URL → scraped product draft created
- [ ] Manual: send text + images → product draft created
- [ ] Missing fields prompts work (name, price)
- [ ] Images downloaded and stored in Supabase
- [ ] Only authorized numbers can ingest
- [ ] Error messages in Arabic
- [ ] Multi-message state tracking works
