import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.S8B_PLAYWRIGHT_MODULE ?? 'playwright');
const base = process.argv[2];
assert(base, 'Pass the local server URL including /netscript/');
const output = new URL('./screenshots/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.S8B_CHROMIUM_EXECUTABLE, headless: true, args: ['--disable-dev-shm-usage'] });
const results = [];
try {
  for (const scheme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1400 }, colorScheme: scheme, reducedMotion: 'reduce' });
    await context.addInitScript((value) => localStorage.setItem('ns-theme', value), scheme);
    for (const [label, path] of [['landing', 'design-system/'], ['studio', 'design-system/themes/studio/'], ['tonal', 'design-system/themes/tonal/']]) {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const response = await page.goto(new URL(path, base).href, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('.ns-design h1').count(), 1);
      assert.equal(await page.locator('html').getAttribute('data-theme'), scheme);
      if (label === 'landing') {
        assert.equal(await page.locator('[data-preset]').count(), 17);
        const visible = page.locator('[data-preset="studio-utility"] .ns-design__preview img:visible');
        assert((await visible.getAttribute('src')).endsWith(`studio-utility--${scheme}.webp`));
        const summary = page.locator('[data-preset="studio-utility"] summary');
        await summary.focus();
        await page.keyboard.press('Enter');
        assert(await summary.locator('..').evaluate((element) => element.open));
        await page.keyboard.press('Enter');
      } else {
        assert.equal(await page.locator('.ns-design__table').count(), 5);
        assert(await page.locator('#values-colors .ns-design__swatch').count() > 0 || await page.locator('.ns-design__swatch').count() > 0);
      }
      const ids = await page.locator('.ns-design [id]').evaluateAll((elements) => elements.map((element) => element.id));
      assert.equal(ids.length, new Set(ids).size);
      const imageState = await page.locator('.ns-design img').evaluateAll(async (elements) => {
        await Promise.all(elements.map(async (image) => { image.loading = 'eager'; await image.decode(); }));
        return elements.map((image) => ({ src: image.getAttribute('src'), width: image.width, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, declaredWidth: Number(image.getAttribute('width')), declaredHeight: Number(image.getAttribute('height')) }));
      });
      assert(imageState.every((image) => image.naturalWidth > 0 && image.naturalWidth === image.declaredWidth && image.naturalHeight === image.declaredHeight));
      assert.deepEqual(errors, []);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: fileURLToPath(new URL(`${label}--${scheme}.png`, output)), fullPage: label === 'landing' });
      results.push({ label, scheme, viewport: '1440x1400', status: response.status(), images: imageState.length, uniqueIds: ids.length, errors });
      await page.close();
    }
    // Check all routes on a phone viewport, including long source tables and templates.
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ['design-system/', 'design-system/themes/studio/', 'design-system/themes/tonal/', 'design-system/guidelines/', 'design-system/token-contract/', 'design-system/create-your-own-theme/']) {
      await page.goto(new URL(path, base).href, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: innerWidth, section: document.querySelector('.ns-design').getBoundingClientRect().width }));
      assert(overflow.document <= overflow.viewport + 1, `${path}: document overflows at ${scheme}: ${JSON.stringify(overflow)}`);
      results.push({ path, scheme, viewport: '390x844', overflow });
    }
    await context.close();
  }
  await writeFile(new URL('./browser-results.json', import.meta.url), JSON.stringify({ status: 'PASS', base, results }, null, 2) + '\n');
  process.stdout.write(JSON.stringify({ status: 'PASS', checks: results.length, screenshots: 6 }) + '\n');
} finally {
  await browser.close();
}
