import fs from 'node:fs';

if (!fs.existsSync('supabase/seed.sql')) {
  console.error('seed.sql not found');
  process.exit(1);
}

const sql = fs.readFileSync('supabase/seed.sql', 'utf8');
if (!sql.includes('insert into public.products')) {
  console.error('seed.sql missing products seed data');
  process.exit(1);
}

console.log('seed sanity checks passed.');
