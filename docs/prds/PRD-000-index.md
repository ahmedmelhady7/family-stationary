# Family Stationary — PRD Index

> E-commerce platform for a family-owned stationary business, targeting Arabic-speaking customers with an Islamic design identity.

| PRD                                                  | Title                                      | Priority | Status |
| ---------------------------------------------------- | ------------------------------------------ | -------- | ------ |
| [PRD-001](./PRD-001-product-catalog-storefront.md)   | Product Catalog & Storefront               | P0       | Draft  |
| [PRD-002](./PRD-002-whatsapp-product-ingestion.md)   | WhatsApp Product Ingestion Pipeline        | P0       | Draft  |
| [PRD-003](./PRD-003-product-management-dashboard.md) | Product Management Dashboard               | P0       | Draft  |
| [PRD-004](./PRD-004-order-management-whatsapp.md)    | Order Management via WhatsApp              | P0       | Draft  |
| [PRD-005](./PRD-005-cash-on-delivery-checkout.md)    | Cash on Delivery Checkout Flow             | P0       | Draft  |
| [PRD-006](./PRD-006-islamic-theme-arabic-design.md)  | Islamic Theme & Arabic-First Design System | P0       | Draft  |
| [PRD-007](./PRD-007-i18n-a11y-pwa.md)                | Internationalization, Accessibility & PWA  | P0       | Draft  |

---

## Cross-Cutting Concerns

| Concern                          | Addressed In              |
| -------------------------------- | ------------------------- |
| RTL Layout & Arabic Typography   | PRD-006, PRD-007          |
| WhatsApp Integration             | PRD-002, PRD-004, PRD-005 |
| WhatsApp Number Validation       | PRD-005                   |
| Customer Notifications (Auto)    | PRD-004                   |
| Fulfillment ↔ Customer Messaging | PRD-004                   |
| PWA / Offline Support            | PRD-007                   |
| Accessibility (a11y)             | PRD-007                   |
| i18n Framework                   | PRD-007                   |
| Islamic Visual Identity          | PRD-006                   |
| Product Lifecycle                | PRD-002, PRD-003          |
| Payment & Checkout               | PRD-005                   |

## Architecture Overview

```
┌───────────────────────────────────────────────────────────┐
│                      Customer (PWA)                       │
│           Arabic-first · Islamic Theme · a11y             │
└─────────┬────────────────────────┬────────────────────────┘
          │ Browse / Order         │ Install PWA
          ▼                        ▼
┌───────────────────────────────────────────────────────────┐
│                  E-commerce Backend API                    │
├───────────┬──────────────┬──────────────┬─────────────────┤
│ Product   │  Order       │  WhatsApp    │  WA Number      │
│ Catalog   │  Management  │  Gateway     │  Validation     │
└─────┬─────┴──────┬───────┴──────┬───────┴────────┬────────┘
      │            │              │                │
      ▼            ▼              ▼                ▼
┌──────────┐ ┌───────────┐ ┌────────────┐  ┌─────────────┐
│ Database │ │ Notif.    │ │ WhatsApp   │  │ WA Contacts │
│(Products,│ │ Engine    │ │ Business   │  │ API         │
│  Orders) │ │           │ │ API        │  │ (Validate)  │
└──────────┘ └─────┬─────┘ └─────┬──────┘  └─────────────┘
                   │             │
        ┌──────────┼─────────────┤
        ▼          ▼             ▼
  ┌───────────────────────────────────────┐
  │        Outbound WhatsApp Messages     │
  ├───────────────────────────────────────┤
  │ 1. Auto order confirmation → Customer │
  │ 2. Order alert → Fulfillment Group    │
  │ 3. Prefilled wa.me → Team → Customer  │
  └───────────────────────────────────────┘

Founders (WhatsApp)              Fulfillment Team (WhatsApp)
  │ Send product link              │ Receive order notifications
  │   — OR —                       │ Reply to claim order
  │ Send text + images             │ Reply "تواصل {id}" → get
  ▼                                │   prefilled wa.me link
┌──────────────┐                   ▼
│ Product      │            ┌──────────────────┐
│ Ingestion    │            │ Order Fulfillment│
│ Bot/Webhook  │            │ Group            │
│ (Links +     │            │                  │
│  Manual)     │            └──────────────────┘
└──────────────┘
```
