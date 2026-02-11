# PRD-002: WhatsApp Product Ingestion Pipeline & Manual Creation

| Field            | Value                  |
| ---------------- | ---------------------- |
| **Author**       | Family Stationary Team |
| **Status**       | Draft                  |
| **Priority**     | P0                     |
| **Created**      | 2026-02-11             |
| **Last Updated** | 2026-02-11             |

---

## 1. Overview

The WhatsApp Product Ingestion system provides **two ways** for founders to add products to the platform via WhatsApp:

1. **Link Ingestion (Automatic)** — Send a product link; the backend parses it, extracts product details, and inserts the product automatically.
2. **Manual Creation** — Send a message with the product name, price, and photos; the backend creates the product directly from the provided information.

Both methods make the product immediately visible on the storefront.

### 1.1 Goals

- Zero-friction product addition via two WhatsApp-based methods
- **Link flow**: Automatic extraction of product metadata from external URLs
- **Manual flow**: Founders type product name & price and attach images — no link needed
- Support for multiple link sources (supplier websites, social media product posts, etc.)
- Minimal manual intervention — founders can optionally edit after ingestion via the dashboard (PRD-003)

### 1.2 Non-Goals

- Bulk import from CSV/Excel (Phase 2)
- Automatic pricing adjustments or margin calculations
- Inventory quantity tracking (Phase 1 uses simple in-stock / out-of-stock)

---

## 2. User Stories

| ID    | As a…   | I want to…                                                      | So that…                                            |
| ----- | ------- | --------------------------------------------------------------- | --------------------------------------------------- |
| US-01 | Founder | Send a product link to a specific WhatsApp group/number         | The product is automatically added to the website   |
| US-02 | Founder | Receive a confirmation message after the product is parsed      | I know the product was added successfully           |
| US-03 | Founder | See the parsed product details in the confirmation              | I can verify correctness before it goes live        |
| US-04 | Founder | Send a link with an optional Arabic caption as the product name | I can override the auto-parsed name                 |
| US-05 | Founder | Get an error notification if parsing fails                      | I can add the product manually via WhatsApp         |
| US-06 | Founder | Send a message with product name, price, and photos             | I can add a product manually without needing a link |
| US-07 | Founder | Attach multiple images to a manual product message              | The product has proper visuals from day one         |
| US-08 | Founder | Use a simple format like "اسم: ... / سعر: ..." to add products  | I don't need to use any special app or dashboard    |

---

## 3. Architecture

```
┌─────────────────────────────────────────────┐
│              Founder (WhatsApp)              │
└──────────┬──────────────────┬───────────────┘
           │                  │
     Sends link          Sends text + images
     message             (name, price, photos)
           │                  │
           ▼                  ▼
┌────────────────────────────────────────────┐
│        WhatsApp Business API / Webhook     │
└──────────┬──────────────────┬──────────────┘
           │                  │
           ▼                  ▼
┌────────────────────────────────────────────┐
│              Message Router                │
│   (Detect: link? text+image? other?)       │
└──────┬──────────────────────┬──────────────┘
       │                      │
  Link detected          Manual product msg
       │                      │
       ▼                      ▼
┌──────────────┐    ┌───────────────────┐
│ Link Parser  │    │ Manual Product    │
│ Service      │    │ Parser            │
│ (OG, JSON-LD │    │ (Extract name,    │
│  heuristics) │    │  price from text; │
└──────┬───────┘    │  download images) │
       │            └────────┬──────────┘
       │                     │
       ▼                     ▼
┌────────────────────────────────────────────┐
│  Product Service (Validate & Save)         │
└──────────┬─────────────────────────────────┘
           │                    │
           ▼                    ▼
   ┌─────────────┐    ┌────────────────────┐
   │  Database   │    │  Image Storage     │
   │  (Products) │    │  (CDN)             │
   └─────────────┘    └────────────────────┘
           │
           ▼
┌────────────────────┐
│  WhatsApp Reply    │
│  (Confirmation)    │
└────────────────────┘
```

---

## 4. Functional Requirements

### 4.1 WhatsApp Message Handling

| Req ID | Requirement                                                                                    | Priority |
| ------ | ---------------------------------------------------------------------------------------------- | -------- |
| FR-01  | Register a WhatsApp Business API webhook to receive messages from an authorized group/number   | P0       |
| FR-02  | Whitelist only authorized phone numbers (founders) to prevent spam                             | P0       |
| FR-03  | Detect URLs in incoming messages using regex/URL parsing                                       | P0       |
| FR-04  | If the message contains text alongside the URL, treat it as the product name override (Arabic) | P1       |
| FR-05  | If message has no URL and no image, reply with usage instructions in Arabic                    | P1       |

### 4.2 Link Parsing Engine (Automatic Flow)

| Req ID | Requirement                                                                               | Priority |
| ------ | ----------------------------------------------------------------------------------------- | -------- |
| FR-06  | Fetch the page content from the provided URL                                              | P0       |
| FR-07  | Extract product name from: `og:title`, `<title>`, JSON-LD `name`, or `<h1>`               | P0       |
| FR-08  | Extract product price from: JSON-LD `offers.price`, meta tags, or page content heuristics | P0       |
| FR-09  | Extract product description from: `og:description`, `meta[name=description]`, or JSON-LD  | P0       |
| FR-10  | Extract product images from: `og:image`, JSON-LD `image`, or primary content images       | P0       |
| FR-11  | Download and re-host images to the platform's storage (don't hotlink)                     | P0       |
| FR-12  | Support a plugin architecture for specific supplier websites (custom parsers)             | P2       |
| FR-13  | Set a timeout (10s) and handle parsing failures gracefully                                | P0       |

### 4.3 Manual Product Creation (Text + Images Flow)

Founders can send a WhatsApp message with product details and attached images to create a product without needing an external link.

#### 4.3.1 Message Format

The founder sends a message in the following format (flexible, Arabic):

```
📦 منتج جديد
الاسم: دفتر ملاحظات A5 فاخر
السعر: 25
الوصف: دفتر ملاحظات بغلاف جلدي فاخر مع 200 صفحة
```

Or a simpler format:

```
دفتر ملاحظات A5 فاخر / 25
```

Attach 1–5 images with the message.

#### 4.3.2 Requirements

| Req ID | Requirement                                                                                     | Priority |
| ------ | ----------------------------------------------------------------------------------------------- | -------- |
| FR-M01 | Detect manual product creation when message contains image(s) without a URL                     | P0       |
| FR-M02 | Parse product name from message text (first line, or after "الاسم:" label)                      | P0       |
| FR-M03 | Parse product price from message text (after "السعر:" label, or after `/` separator)            | P0       |
| FR-M04 | Parse optional description from message text (after "الوصف:" label)                             | P1       |
| FR-M05 | Accept 1–5 attached images per product                                                          | P0       |
| FR-M06 | Download all attached images.and store them in the platform's image storage (CDN)               | P0       |
| FR-M07 | First attached image becomes the primary product image                                          | P0       |
| FR-M08 | If price is missing from the message, reply asking for the price before creating                | P0       |
| FR-M09 | If product name is missing or unclear, reply asking for clarification                           | P0       |
| FR-M10 | Support the simple format: `[product name] / [price]` with attached images                      | P0       |
| FR-M11 | Reply with confirmation including the product name, price, image thumbnail, and storefront link | P0       |

### 4.4 Product Creation (Shared)

| Req ID | Requirement                                                           | Priority |
| ------ | --------------------------------------------------------------------- | -------- |
| FR-14  | Create the product with status `active` by default                    | P0       |
| FR-15  | Auto-assign category if detectable, otherwise set as "Uncategorized"  | P1       |
| FR-16  | Store the original `source_url` for link-ingested products            | P0       |
| FR-17  | Generate Arabic slug from the product name                            | P0       |
| FR-18  | For link flow: prevent duplicates by checking `source_url` uniqueness | P0       |
| FR-19  | Tag product with `source_type`: `link` or `manual_whatsapp`           | P0       |

### 4.5 Confirmation & Error Handling

| Req ID | Requirement                                                                                                              | Priority |
| ------ | ------------------------------------------------------------------------------------------------------------------------ | -------- |
| FR-20  | Reply with a formatted WhatsApp message containing: product name, price, image thumbnail, and a link to the product page | P0       |
| FR-21  | On failure, reply with a clear Arabic error message explaining what went wrong                                           | P0       |
| FR-22  | Include a "Edit in Dashboard" link in the confirmation message                                                           | P1       |
| FR-23  | Log all ingestion attempts (both link and manual) for debugging and audit                                                | P0       |

---

## 5. Data Flow

### 5.1 Link Ingestion Flow

| Step | Action                                | System          |
| ---- | ------------------------------------- | --------------- |
| 1    | Founder sends message with URL        | WhatsApp        |
| 2    | Webhook receives message event        | Backend API     |
| 3    | Message router identifies URL         | Message Router  |
| 4    | Link parser fetches and extracts data | Parser Service  |
| 5    | Product service validates and saves   | Product Service |
| 6    | Images downloaded and stored          | Storage Service |
| 7    | Confirmation sent back via WhatsApp   | WhatsApp API    |
| 8    | Product appears on storefront         | Frontend (auto) |

### 5.2 Manual Creation Flow

| Step | Action                                 | System          |
| ---- | -------------------------------------- | --------------- |
| 1    | Founder sends text + images (no URL)   | WhatsApp        |
| 2    | Webhook receives message event         | Backend API     |
| 3    | Message router detects manual creation | Message Router  |
| 4    | Text parser extracts name, price, desc | Manual Parser   |
| 5    | If name or price missing, ask founder  | WhatsApp Reply  |
| 6    | Images downloaded and stored in CDN    | Storage Service |
| 7    | Product service validates and saves    | Product Service |
| 8    | Confirmation sent back via WhatsApp    | WhatsApp API    |
| 9    | Product appears on storefront          | Frontend (auto) |

---

## 6. Supported Link Sources (Initial)

| Source Type              | Parsing Strategy                     |
| ------------------------ | ------------------------------------ |
| Generic e-commerce sites | Open Graph + JSON-LD                 |
| Instagram product posts  | Instagram oEmbed API                 |
| Facebook Marketplace     | Open Graph tags                      |
| AliExpress / Amazon      | JSON-LD structured data              |
| Custom supplier websites | Configurable CSS selectors (Phase 2) |

---

## 7. Non-Functional Requirements

| Req ID | Requirement                                     | Target       |
| ------ | ----------------------------------------------- | ------------ |
| NFR-01 | End-to-end ingestion time (link → product live) | < 30 seconds |
| NFR-02 | Parser success rate on supported sources        | ≥ 80%        |
| NFR-03 | WhatsApp webhook message processing             | < 5 seconds  |
| NFR-04 | All error messages in Arabic                    | 100%         |
| NFR-05 | Image storage with CDN delivery                 | Required     |

---

## 8. Security Considerations

| Concern                          | Mitigation                                          |
| -------------------------------- | --------------------------------------------------- |
| Unauthorized users sending links | Whitelist founder phone numbers                     |
| Malicious URLs                   | URL validation, sandboxed fetching, no JS execution |
| SSRF attacks via URL fetching    | Restrict to public IPs, block internal ranges       |
| Rate limiting                    | Max 20 product additions per hour per user          |

---

## 9. Dependencies

| Dependency                      | PRD            |
| ------------------------------- | -------------- |
| Product data model              | PRD-001        |
| Product editing after ingestion | PRD-003        |
| WhatsApp Business API account   | Infrastructure |

---

## 10. Success Metrics

| Metric                                     | Target            |
| ------------------------------------------ | ----------------- |
| Products successfully parsed from links    | ≥ 80%             |
| Average ingestion time                     | < 30 seconds      |
| Founder satisfaction (qualitative)         | Positive          |
| Manual corrections needed after auto-parse | < 30% of products |

---

## 11. Open Questions

1. Which WhatsApp Business API provider will be used? (Meta Cloud API, Twilio, etc.)
2. Should product additions require a second founder's approval before going live?
3. How to handle products where the price is not parseable from the link? (Manual flow is now the fallback)
4. Should there be a max image file size for the manual creation flow?
5. Should the manual format support additional fields (e.g., category)?
