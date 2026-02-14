import fs from 'node:fs';

const requiredMigrations = [
  '001_products.sql',
  '002_rls_products.sql',
  '003_fts.sql',
  '004_orders.sql',
  '005_rls_orders.sql',
  '006_order_triggers.sql',
  '007_create_order_rpc.sql',
  '008_whatsapp_ingestion.sql',
  '009_admin_authz_and_storage.sql',
];

const migrationDir = 'supabase/migrations';
const existing = fs.readdirSync(migrationDir).filter((entry) => entry.endsWith('.sql')).sort();
const missing = requiredMigrations.filter((name) => !existing.includes(name));

if (missing.length) {
  console.error('Missing migration files:');
  missing.forEach((item) => console.error(`- ${item}`));
  process.exit(1);
}

const seed = fs.readFileSync('supabase/seed.sql', 'utf8');
if (!seed.includes('insert into public.categories') || !seed.includes('insert into public.products')) {
  console.error('Seed file missing required inserts for categories/products.');
  process.exit(1);
}

const productCount = (seed.match(/\('.*?'.*?\)/g) || []).length;
if (productCount < 10) {
  console.error('Seed must contain at least 10 products.');
  process.exit(1);
}

const rpcMigration = fs.readFileSync('supabase/migrations/007_create_order_rpc.sql', 'utf8');
if (!rpcMigration.includes('create_order') || !rpcMigration.includes('idempotency')) {
  console.error('create_order RPC migration missing idempotency logic.');
  process.exit(1);
}

console.log('db validation passed');
