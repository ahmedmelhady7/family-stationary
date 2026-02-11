export const APP_CONFIG = {
  appName: 'family-stationary',
  maxCartItems: 50,
  defaultCurrency: 'EGP',
  pageSize: 8,
  deliveryFee: 0,
  whatsappDebounceMs: 800,
  egyptPhonePrefix: '+20',
};

export const STORAGE_KEYS = {
  cart: 'family-stationary-cart',
  catalog: 'family-stationary-catalog',
  orders: 'family-stationary-orders',
  customerDraft: 'family-stationary-customer-draft',
  auth: 'family-stationary-admin-auth',
  orderCounter: 'family-stationary-order-counter',
  ingestionAttempts: 'family-stationary-ingestion-attempts',
  waConversations: 'family-stationary-wa-conversations',
};

export const ENV = {
  supabaseUrl: globalThis?.__APP_ENV__?.SUPABASE_URL || '',
  supabaseAnonKey: globalThis?.__APP_ENV__?.SUPABASE_ANON_KEY || '',
};
