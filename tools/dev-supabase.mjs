import fs from 'node:fs';

const required = [
  'supabase/config.toml',
  'supabase/seed.sql',
  'supabase/migrations/001_products.sql',
  'supabase/functions/whatsapp-webhook/index.ts',
];

const missing = required.filter((file) => !fs.existsSync(file));

if (missing.length) {
  console.error('supabase preflight failed. Missing files:');
  missing.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

console.log('supabase preflight ok');
console.log('Run docker compose -f docker/docker-compose.yml up -d to start local dependencies.');
