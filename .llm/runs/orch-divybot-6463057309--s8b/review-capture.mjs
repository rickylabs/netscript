import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.S8B_PLAYWRIGHT_MODULE ?? 'playwright');
const base = process.argv[2];
assert(base, 'Pass the local server URL including /netscript/');
const output = new URL('./screenshots/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.S8B_CHROMIUM_EXECUTABLE,
  headless: true,
  args: ['--disable-dev-shm-usage'],
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1500 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(new URL('design-system/themes/tonal/', base).href, { waitUntil: 'networkidle' });
  const css = await page.locator('.ns-design').evaluate((element) => getComputedStyle(element).minWidth);
  assert.equal(css, '0px', 'The linked stylesheet must apply');
  assert.equal(await page.locator('link[href$="/assets/design-system/section.css"]').count(), 1);
  await page.locator('.ns-design__contents').evaluate((element) => element.open = true);
  const toc = await page.locator('.ns-design__contents a').allTextContents();
  for (const title of ['Theme values', 'Values: Colors', 'Values: Typography', 'Values: Radii', 'Values: Spacing', 'Colors', 'Typography']) {
    assert(toc.includes(title), `Missing TOC label: ${title}`);
  }
  assert.equal(toc.length, new Set(toc).size, 'TOC labels must be unique');
  assert(!toc.some((title) => title.includes('Colours')));
  await page.locator('.ns-design__contents').scrollIntoViewIfNeeded();
  await page.screenshot({ path: fileURLToPath(new URL('tonal--fixed-toc.png', output)) });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    assert(!overflow, `Theme page overflows at ${width}px`);
  }
  await page.goto(new URL('design-system/', base).href, { waitUntil: 'networkidle' });
  const thumbnails = await page.locator('.ns-design__preset img').evaluateAll(async (images) => {
    await Promise.all(images.map(async (image) => { image.loading = 'eager'; await image.decode(); }));
    return images.map((image) => ({
      src: image.getAttribute('src'), width: image.naturalWidth, height: image.naturalHeight,
      declaredWidth: Number(image.getAttribute('width')), declaredHeight: Number(image.getAttribute('height')),
    }));
  });
  assert.equal(thumbnails.length, 68);
  for (const image of thumbnails) {
    assert(image.src.includes('/assets/design-system/thumbnails/'));
    assert(image.width > 0 && image.width <= 480);
    assert.equal(image.width, image.declaredWidth);
    assert.equal(image.height, image.declaredHeight);
  }
  assert.deepEqual(errors, []);
  const results = { status: 'PASS', theme: 'tonal', toc, linkedStylesheet: true, galleryImages: thumbnails.length, thumbnailMaxWidth: 480, responsiveWidths: [390, 1440], errors };
  await writeFile(new URL('./review-browser.json', import.meta.url), JSON.stringify(results, null, 2) + '\n');
  process.stdout.write(JSON.stringify(results) + '\n');
} finally {
  await browser.close();
}
