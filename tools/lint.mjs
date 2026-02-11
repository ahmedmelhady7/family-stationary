import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const errors = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.git') || entry.name === 'dist' || entry.name === 'node_modules') {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function pushError(file, message) {
  errors.push(`${path.relative(ROOT, file)}: ${message}`);
}

const files = walk(ROOT);

const javaScriptFiles = files.filter((item) => item.endsWith('.js') || item.endsWith('.mjs'));
const typeScriptFiles = files.filter((item) => item.endsWith('.ts'));
const arabicAllowlist = new Set([
  path.join(ROOT, 'src/scripts/services/order-commands.js'),
  path.join(ROOT, 'supabase/functions/whatsapp-webhook/index.ts'),
  path.join(ROOT, 'supabase/functions/order-alert-group/index.ts'),
]);

for (const file of javaScriptFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    pushError(file, `syntax error\n${result.stderr.trim()}`);
  }

  const text = fs.readFileSync(file, 'utf8');
  if (/TODO|FIXME/.test(text) && !file.endsWith('tools/lint.mjs')) {
    pushError(file, 'contains TODO/FIXME');
  }

  if (/\p{Script=Arabic}/u.test(text) && !arabicAllowlist.has(file)) {
    pushError(file, 'contains hardcoded Arabic text outside locale/messages files');
  }
}

for (const file of typeScriptFiles) {
  const text = fs.readFileSync(file, 'utf8');
  if (/TODO|FIXME/.test(text) && !file.endsWith('tools/lint.mjs')) {
    pushError(file, 'contains TODO/FIXME');
  }
}

const forbiddenCssPatterns = [
  /margin-left/,
  /margin-right/,
  /padding-left/,
  /padding-right/,
  /left\s*:/,
  /right\s*:/,
  /float\s*:/,
  /letter-spacing\s*:/,
];

for (const file of files.filter((item) => item.endsWith('.css'))) {
  const text = fs.readFileSync(file, 'utf8');
  forbiddenCssPatterns.forEach((pattern) => {
    if (pattern.test(text)) {
      pushError(file, `forbidden CSS pattern ${pattern}`);
    }
  });
}

for (const file of files.filter((item) => item.endsWith('.html'))) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes('<html lang="ar" dir="rtl">')) {
    pushError(file, 'missing html lang/dir metadata');
  }
  if (!text.includes('id="main-content"')) {
    pushError(file, 'missing main-content id');
  }
  if (!text.includes('skip-link') && !file.endsWith('offline.html') && !file.endsWith('login.html')) {
    pushError(file, 'missing skip link');
  }
  if (/\p{Script=Arabic}/u.test(text)) {
    pushError(file, 'contains hardcoded Arabic text in HTML');
  }
}

if (errors.length > 0) {
  console.error('Lint failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`lint passed (${files.length} files checked)`);
