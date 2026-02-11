import fs from 'node:fs';

if (!fs.existsSync('dist/index.html')) {
  console.error('dist build missing. Run npm run build first.');
  process.exit(1);
}

console.log('production deploy contract ready: use Hetzner Docker Compose pipeline.');
console.log('artifact: dist/');
