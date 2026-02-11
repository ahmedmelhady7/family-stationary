import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(source, target) {
  ensureDir(path.dirname(target));
  fs.copyFileSync(source, target);
}

function copyDir(sourceDir, targetDir) {
  ensureDir(targetDir);
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(sourcePath, targetPath);
    } else {
      copyFile(sourcePath, targetPath);
    }
  }
}

if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}
ensureDir(dist);

copyDir(path.join(root, 'src/styles'), path.join(dist, 'styles'));
copyDir(path.join(root, 'src/scripts'), path.join(dist, 'scripts'));
copyDir(path.join(root, 'src/locales'), path.join(dist, 'locales'));
copyDir(path.join(root, 'src/assets'), path.join(dist, 'assets'));
copyDir(path.join(root, 'src/workers'), path.join(dist, 'workers'));
copyDir(path.join(root, 'public/icons'), path.join(dist, 'icons'));
copyFile(path.join(root, 'public/manifest.json'), path.join(dist, 'manifest.json'));

const pageMappings = [
  ['src/pages/index.html', 'dist/index.html'],
  ['src/pages/products.html', 'dist/products.html'],
  ['src/pages/product.html', 'dist/product.html'],
  ['src/pages/cart.html', 'dist/cart.html'],
  ['src/pages/checkout.html', 'dist/checkout.html'],
  ['src/pages/order-confirmation.html', 'dist/order-confirmation.html'],
  ['src/pages/offline.html', 'dist/offline.html'],
  ['src/pages/admin/login.html', 'dist/admin/login.html'],
  ['src/pages/admin/dashboard.html', 'dist/admin/dashboard.html'],
  ['src/pages/admin/products.html', 'dist/admin/products.html'],
  ['src/pages/admin/product-edit.html', 'dist/admin/product-edit.html'],
  ['src/pages/admin/categories.html', 'dist/admin/categories.html']
];

for (const [sourceRel, targetRel] of pageMappings) {
  copyFile(path.join(root, sourceRel), path.join(root, targetRel));
}

console.log('build complete: dist/');
