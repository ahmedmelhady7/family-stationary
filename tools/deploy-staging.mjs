import fs from 'node:fs';

if (!fs.existsSync('dist/index.html')) {
  console.error('dist build missing. Run npm run build first.');
  process.exit(1);
}

console.log('staging deploy contract ready: use Netlify CLI or CI workflow.');
console.log('artifact: dist/');
