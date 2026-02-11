# WhatsApp Business API — Provider Comparison

| Field       | Value                                              |
| ----------- | -------------------------------------------------- |
| **Created** | 2026-02-11                                         |
| **Context** | Family Stationary e-commerce platform (Egypt, EGP) |

---

## Summary Recommendation

> [!TIP]
> **Meta Cloud API (direct)** is the recommended choice for Family Stationary. It's the cheapest option, requires no BSP middleman, and gives direct access to the newest features. The only trade-off is you need to build your own webhook server — which we're already doing since Docker + self-hosted is a requirement.

---

## Provider Comparison

| Factor                      | Meta Cloud API (Direct)              | Twilio                           | 360dialog                   |
| --------------------------- | ------------------------------------ | -------------------------------- | --------------------------- |
| **Type**                    | Direct from Meta                     | BSP (middleman)                  | BSP (middleman)             |
| **Platform fee**            | **$0/msg**                           | **$0.005/msg** (send + receive)  | **€19–500/mo** flat license |
| **Meta fee markup**         | None (you pay Meta directly)         | None (pass-through)              | None (pass-through)         |
| **Free service convos**     | 1,000/mo                             | 1,000/mo (+ $0.005 platform fee) | 1,000/mo                    |
| **Setup time**              | ~1 week (Meta Business verification) | 2–4 weeks                        | 10–15 min                   |
| **Hosting**                 | Meta-hosted API, self-hosted webhook | Twilio-hosted                    | 360dialog-hosted            |
| **Omnichannel**             | WhatsApp only                        | WhatsApp + SMS + Voice + Email   | WhatsApp only               |
| **Green tick verification** | Via Meta directly                    | Via Twilio                       | Via 360dialog               |
| **API documentation**       | Official Meta docs                   | Twilio docs (excellent)          | 360dialog docs              |
| **Feature freshness**       | First to get new features            | Lags behind Meta                 | Early beta access           |
| **Best for**                | Cost-conscious, technical teams      | Enterprise, multi-channel        | Marketing-focused SMBs      |

---

## Egypt-Specific Pricing (EGP, as of Jan 2026)

| Message Category                       | Cost per Message                                      | Notes                                          |
| -------------------------------------- | ----------------------------------------------------- | ---------------------------------------------- |
| **Service** (customer-initiated)       | **Free**                                              | Unlimited free-form replies within 24hr window |
| **Utility** (order confirm, shipping)  | **Free** within service window; **~0.48 EGP** outside | Volume discounts available                     |
| **Authentication** (OTP, verification) | **~0.48 EGP**                                         | Volume discounts available                     |
| **Marketing** (promotions, broadcasts) | **3.18 EGP**                                          | Down from 5.31 EGP (40% reduction in Jan 2026) |

> [!NOTE]
> For our use case, most messages are **Utility** (order confirmations, shipping updates) or **Service** (customer replies). Marketing is Phase 2. This means our WhatsApp costs will be minimal — most messages fall within the free service window.

---

## Cost Projection (Monthly — 100 orders/month scenario)

| Message Type                                 | Count | Meta Cloud API | Twilio               | 360dialog (€19 plan) |
| -------------------------------------------- | ----- | -------------- | -------------------- | -------------------- |
| Auto order confirmation (Utility, in-window) | 100   | Free           | 100 × $0.005 = $0.50 | Free                 |
| Fulfillment group alert (Utility, in-window) | 100   | Free           | 100 × $0.005 = $0.50 | Free                 |
| Customer contact prefilled (Service)         | 50    | Free           | 50 × $0.005 = $0.25  | Free                 |
| Product ingestion replies (Service)          | 200   | Free           | 200 × $0.005 = $1.00 | Free                 |
| **Platform fee**                             | —     | **$0**         | —                    | **~$20/mo**          |
| **Total**                                    |       | **≈ $0/mo**    | **≈ $2.25/mo**       | **≈ $20/mo**         |

At 1,000 orders/month:

|           | Meta Cloud API | Twilio          | 360dialog    |
| --------- | -------------- | --------------- | ------------ |
| **Total** | **≈ $0/mo**    | **≈ $22.50/mo** | **≈ $20/mo** |

> [!IMPORTANT]
> Meta Cloud API is essentially free for our use case because:
>
> 1. Service conversations (customer-initiated) are free
> 2. Utility templates within the 24hr service window are free
> 3. We're not sending marketing messages in Phase 1

---

## Pros & Cons Detail

### Meta Cloud API (Direct) ⭐ Recommended

**Pros:**

- Zero per-message platform cost
- Zero monthly fee
- Direct access — no BSP dependency
- First to receive new WhatsApp features
- 80 msg/sec default rate (upgradable to 1,000 msg/sec)
- Meta handles API uptime and scaling
- Native integration with Meta Business Suite

**Cons:**

- Must build and host your own webhook receiver (we're doing this already)
- Meta Business verification takes ~1 week
- No built-in dashboard/inbox (we're building our own)
- No omnichannel (WhatsApp only — fine for us)
- Documentation can be complex for beginners

---

### Twilio

**Pros:**

- Excellent developer documentation and SDKs
- Omnichannel — easy to add SMS, voice, email later
- Battle-tested at enterprise scale
- Rich analytics and monitoring
- Programmable Messaging API abstracts complexity

**Cons:**

- **$0.005/msg on EVERY message** (both directions) — adds up
- Additional fees: click tracking ($0.015/msg), failed message processing ($0.001/msg)
- 2–4 week setup time
- Encourages using their phone numbers over yours
- Overkill for WhatsApp-only use case

---

### 360dialog

**Pros:**

- Very fast setup (10–15 minutes)
- No per-message markup
- Early access to WhatsApp beta features
- Good for marketing automation
- Use your own existing phone number

**Cons:**

- **Monthly license fee** (€19–500) even with low volume
- Less developer-focused than Meta Cloud API or Twilio
- Smaller community and fewer integration examples
- Support quality varies by plan tier

---

## Decision

**Provider: Meta WhatsApp Cloud API (Direct)**

Rationale:

1. **Cost**: Effectively $0/month for our Phase 1 use case
2. **Control**: Direct API access, no BSP dependency or lock-in
3. **Docker fit**: We're already building self-hosted infrastructure — adding a webhook receiver is trivial
4. **Security**: Direct connection to Meta, no data passing through third-party BSPs
5. **Feature access**: First to get new capabilities
6. **Scalability**: Can handle growth without per-message costs eating into margins
