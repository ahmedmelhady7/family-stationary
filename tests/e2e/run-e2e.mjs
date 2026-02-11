import assert from 'node:assert/strict';
import { startServer } from '../../tools/server-lib.mjs';

const pages = [
  '/',
  '/products.html',
  '/product.html?slug=luxury-blue-ink-pen',
  '/cart.html',
  '/checkout.html',
  '/order-confirmation.html?order=FS-0001',
  '/offline.html',
  '/admin/login.html',
  '/admin/dashboard.html',
  '/admin/products.html',
  '/admin/product-edit.html',
  '/admin/categories.html',
];

const { server, port } = await startServer({ mode: 'src', port: 3900 });

try {
  for (const page of pages) {
    const response = await fetch(`http://localhost:${port}${page}`);
    assert.equal(response.status, 200, `Expected 200 for ${page}`);
    const html = await response.text();
    assert.match(html, /<html lang="ar" dir="rtl">/);
  }

  const manifestResponse = await fetch(`http://localhost:${port}/manifest.json`);
  assert.equal(manifestResponse.status, 200);
  const manifest = await manifestResponse.json();
  assert.equal(manifest.dir, 'rtl');

  console.log('e2e checks passed');
} finally {
  await new Promise((resolve) => server.close(resolve));
}
