import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagesDir = path.resolve('src/pages');

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (entry.name.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

function hasLabelPair(html) {
  const labelCount = (html.match(/<label\b/gi) || []).length;
  const inputCount = (html.match(/<(input|textarea|select)\b/gi) || []).length;
  return labelCount >= 1 && inputCount >= 1;
}

function assertNoSeriousIssues(file, html) {
  const relative = path.relative(process.cwd(), file);

  assert.match(html, /<html lang="ar" dir="rtl">/, `${relative}: html metadata missing`);
  assert.match(html, /id="main-content"/, `${relative}: main landmark missing`);

  if (!relative.endsWith('admin/login.html') && !relative.endsWith('offline.html')) {
    assert.match(html, /skip-link/, `${relative}: skip link missing`);
  }

  const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  imageTags.forEach((img) => {
    assert.match(img, /alt=/, `${relative}: image missing alt attribute`);
  });

  if (html.includes('<form')) {
    assert.ok(hasLabelPair(html), `${relative}: form fields missing labels`);
  }
}

const htmlFiles = walk(pagesDir);
htmlFiles.forEach((file) => {
  const html = fs.readFileSync(file, 'utf8');
  assertNoSeriousIssues(file, html);
});

const css = fs.readFileSync('src/styles/components/button.css', 'utf8');
assert.match(css, /min-inline-size:\s*44px/);
assert.match(css, /min-block-size:\s*44px/);

console.log('a11y checks passed with 0 critical/serious issues in static audit');
