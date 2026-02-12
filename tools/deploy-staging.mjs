import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

if (!fs.existsSync('dist/index.html')) {
  console.error('dist build missing. Run npm run build first.');
  process.exit(1);
}

const status = runCommand('npx', ['-y', 'netlify', 'status']);
const statusOutput = `${status.stdout || ''}${status.stderr || ''}`;
const notLoggedIn = /not logged in/i.test(statusOutput);

if (status.status !== 0 || notLoggedIn) {
  console.error('Netlify CLI is not authenticated.');
  console.error('Run: npx netlify login');
  process.exit(1);
}

const args = ['-y', 'netlify', 'deploy', '--dir', 'dist'];
if (process.env.NETLIFY_SITE_ID) {
  args.push('--site', process.env.NETLIFY_SITE_ID);
}
if (process.env.NETLIFY_AUTH_TOKEN) {
  args.push('--auth', process.env.NETLIFY_AUTH_TOKEN);
}

const deployResult = spawnSync('npx', args, {
  stdio: 'inherit',
  env: process.env,
});

if (deployResult.error) {
  throw deployResult.error;
}

if (deployResult.status !== 0) {
  process.exit(deployResult.status ?? 1);
}
