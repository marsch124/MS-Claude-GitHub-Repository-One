// Headless browser smoke test: load the app, walk every route, and fail if the
// browser logs any error or a page throws. Catches runtime breakage (bad refs,
// null derefs) that unit tests can't. Run with:  node tests/smoke.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

// Resolve Playwright whether installed locally (CI) or globally (dev sandbox).
let chromium;
try { ({ chromium } = await import('playwright')); }
catch { chromium = (await import('/opt/node22/lib/node_modules/playwright/index.js')).default.chromium; }

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'text/plain' });
    res.end(d);
  });
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const routes = ['#/', '#/new', '#/insights', '#/settings', '#/recipes', '#/recipe-new', '#/bake-new', '#/bake-insights', '#/search', '#/how', '#/changelog', '#/manage-lists'];
const errors = [];
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

try {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  // Seed one of each record so list/detail/insights screens render real content.
  await page.evaluate(async () => {
    const db = await import('/js/db.js');
    const { newBatch, newBake, newRecipe } = await import('/js/model.js');
    const bt = newBatch(); bt.name = 'Smoke carrots'; await db.saveBatch(bt);
    const bk = newBake(); bk.name = 'Smoke loaf'; await db.saveBake(bk);
    const r = newRecipe(); r.title = 'Smoke recipe'; await db.saveRecipe(r);
    await db.saveBakeLesson({ id: 'l_smoke', text: 'smoke lesson', createdAt: new Date().toISOString() });
  });
  for (const route of routes) {
    await page.goto(base + '/' + route, { waitUntil: 'networkidle' });
    await page.waitForSelector('.screen', { timeout: 5000 });
  }
  // Open the seeded batch and bake detail pages too.
  const batchId = await page.evaluate(async () => (await (await import('/js/db.js')).getAllBatches())[0].id);
  await page.goto(base + '/#/batch/' + batchId, { waitUntil: 'networkidle' });
  await page.waitForSelector('.detail', { timeout: 5000 });
} catch (e) {
  errors.push(`navigation: ${e.message}`);
} finally {
  await browser.close();
  server.close();
}

if (errors.length) {
  console.error('SMOKE TEST FAILED:\n' + errors.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('Smoke test passed: all routes rendered with no browser errors.');
