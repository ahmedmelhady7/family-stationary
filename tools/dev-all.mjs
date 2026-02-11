import { spawn } from 'node:child_process';

const preflight = spawn(process.execPath, ['tools/dev-supabase.mjs'], { stdio: 'inherit' });
preflight.on('exit', (code) => {
  if (code !== 0) {
    process.exit(code || 1);
  }
  const server = spawn(process.execPath, ['tools/dev-server.mjs'], { stdio: 'inherit' });
  server.on('exit', (serverCode) => process.exit(serverCode || 0));
});
