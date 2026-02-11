import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, ['tools/db-validate.mjs'], { stdio: 'inherit' });
if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log('migration sanity checks passed. Apply SQL files with your Supabase/Postgres pipeline.');
