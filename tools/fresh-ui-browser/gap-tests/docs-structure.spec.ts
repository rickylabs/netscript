import { expect, type Page, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

declare global {
  var docsClipboardRequests: { text: string; resolve: () => void; reject: () => void }[];
}
const errors: string[] = [];
const originalPath = 'packages/fresh-ui/hello <world> "quoted".tsx';
test.beforeEach(async ({ page }, info) => {
  errors.length = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (e) => {
    if (e.type() === 'error') errors.push(e.text());
  });
  await page.goto(
    '/docs-structure?scheme=' + (info.project.use.colorScheme === 'dark' ? 'dark' : 'light'),
  );
  await expect(page.getByRole('heading', { name: 'Docs structure examples' })).toBeVisible();
});
test.afterEach(() => expect(errors).toEqual([]));
async function deferredClipboard(page: Page) {
  await page.evaluate(() => {
    globalThis.docsClipboardRequests = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: (text: string) =>
          new Promise<void>((resolve, reject) => {
            globalThis.docsClipboardRequests.push({
              text,
              resolve,
              reject: () => reject(new Error('Denied')),
            });
          }),
      },
    });
  });
}
async function axeClean(page: Page) {
  const result = await new AxeBuilder({ page }).include('main').analyze();
  expect(result.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual(
    [],
  );
}

test(
  'file-path-chip/real-clipboard-native-enter-space-and-focus',
  async ({ page, context, browserName }, info) => {
    const capability = await page.evaluate(() => ({
      secure: isSecureContext,
      write: typeof navigator.clipboard?.writeText,
      read: typeof navigator.clipboard?.readText,
    }));
    await info.attach('native-clipboard-capability', {
      body: JSON.stringify(capability),
      contentType: 'application/json',
    });
    expect(capability.secure).toBe(true);
    expect(capability.write).toBe('function');
    if (browserName === 'chromium') {
      await context.grantPermissions([
        'clipboard-read',
        'clipboard-write',
      ]);
    }
    const s = page.locator('#path-native');
    const chip = s.locator('.ns-file-path-chip').first();
    const copy = chip.getByRole('button', { name: 'Copy path' });
    await expect(copy).toHaveAccessibleDescription(originalPath);
    await s.locator('[data-before-path]').focus();
    await page.keyboard.press('Tab');
    await expect(copy).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(chip).toHaveAttribute('data-state', 'copied');
    await expect(chip.getByRole('status')).toHaveText('Path copied');
    if (browserName === 'chromium') {
      // Read only the known text this test just wrote; never inspect a prior clipboard.
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(originalPath);
    }
    await expect(copy).toBeFocused();
    await page.keyboard.press('Space');
    await expect(chip).toHaveAttribute('data-state', 'copied');
    await expect(copy).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(s.locator('[data-after-path]')).toBeFocused();
    await s.getByRole('button', { name: 'Toggle copy', exact: true }).click();
    await expect(chip.getByRole('button')).toHaveCount(0);
    await expect(chip.getByRole('status')).toBeEmpty();
    await s.locator('[data-before-path]').focus();
    await page.keyboard.press('Tab');
    await expect(s.locator('[data-after-path]')).toBeFocused();
  },
);

test(
  'file-path-chip/missing-and-rejected-clipboard-errors-visible-and-announced',
  async ({ page }, info) => {
    const chip = page.locator('#path-native .ns-file-path-chip').first();
    const copy = chip.getByRole('button');
    for (const kind of ['missing', 'rejected']) {
      await page.evaluate(
        (mode) =>
          Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: mode === 'missing'
              ? undefined
              : { writeText: () => Promise.reject(new Error('Permission denied')) },
          }),
        kind,
      );
      await copy.focus();
      await page.keyboard.press('Enter');
      await expect(chip).toHaveAttribute('data-state', 'rest');
      await expect(chip).not.toHaveAttribute('aria-busy');
      await expect(chip.getByRole('status')).toHaveText('Could not copy path');
      await expect(chip.getByRole('status')).toBeVisible();
      expect(await chip.getByRole('status').evaluate((e) => e.getBoundingClientRect().width))
        .toBeGreaterThan(1);
      await expect(copy).toBeFocused();
      await chip.screenshot({ path: info.outputPath('path-error-' + kind + '.png') });
      await axeClean(page);
    }
  },
);

test('file-path-chip/latest-request-wins-without-stale-feedback', async ({ page }) => {
  await deferredClipboard(page);
  const chip = page.locator('#path-native .ns-file-path-chip').first();
  const copy = chip.getByRole('button');
  await copy.click();
  await expect(chip).toHaveAttribute('aria-busy', 'true');
  await expect(copy).toBeEnabled();
  await copy.click();
  expect(await page.evaluate(() => docsClipboardRequests.map((r) => r.text))).toEqual([
    originalPath,
    originalPath,
  ]);
  await page.evaluate(() => docsClipboardRequests[1].resolve());
  await expect(chip.getByRole('status')).toHaveText('Path copied');
  await page.evaluate(() => docsClipboardRequests[0].reject());
  await expect(chip.getByRole('status')).toHaveText('Path copied');
  await expect(chip).toHaveAttribute('data-state', 'copied');
  await copy.click();
  await expect(chip.getByRole('status')).toBeEmpty();
  await copy.click();
  await page.evaluate(() => docsClipboardRequests[3].reject());
  await expect(chip.getByRole('status')).toHaveText('Could not copy path');
  await page.evaluate(() => docsClipboardRequests[2].resolve());
  await expect(chip.getByRole('status')).toHaveText('Could not copy path');
  await expect(chip).toHaveAttribute('data-state', 'rest');
});

test('file-path-chip/path-copy-and-unmount-invalidate-pending-results', async ({ page }) => {
  await deferredClipboard(page);
  const s = page.locator('#path-native');
  const chip = s.locator('.ns-file-path-chip').first();
  await chip.getByRole('button').click();
  await s.getByRole('button', { name: 'Change path', exact: true }).click();
  await expect(chip.locator('code')).toHaveText('src/next.tsx');
  await page.evaluate(() => docsClipboardRequests[0].resolve());
  await expect(chip.getByRole('status')).toBeEmpty();
  await expect(chip).not.toHaveAttribute('aria-busy');
  await chip.getByRole('button').click();
  await s.getByRole('button', { name: 'Toggle copy', exact: true }).click();
  await s.getByRole('button', { name: 'Toggle copy', exact: true }).click();
  await page.evaluate(() => docsClipboardRequests[1].reject());
  await expect(chip.getByRole('status')).toBeEmpty();
  await chip.getByRole('button').click();
  await s.getByRole('button', { name: 'Toggle path mount', exact: true }).click();
  await page.evaluate(() => docsClipboardRequests[2].resolve());
  await s.getByRole('button', { name: 'Toggle path mount', exact: true }).click();
  await expect(chip.getByRole('status')).toBeEmpty();
  await expect(chip).toHaveAttribute('data-state', 'rest');
  expect(await page.evaluate(() => docsClipboardRequests.map((r) => r.text))).toEqual([
    originalPath,
    'src/next.tsx',
    'src/next.tsx',
  ]);
});

test('attribute-chip/escaped-scalars-borderless-sizes-and-native-focus', async ({ page }) => {
  const s = page.locator('#attribute-variants');
  const chips = s.locator('.ns-attribute-chip');
  await expect(chips).toHaveCount(8);
  for (const [i, value] of [0, false, null, '', '"<script>alert(1)</script>\n'].entries()) {
    await expect(chips.nth(i + 2).locator('[data-part="value"]')).toHaveText(
      JSON.stringify(String(value)),
    );
    await expect(chips.nth(i + 2)).not.toHaveAttribute('data-example-' + i);
  }
  await expect(s.locator('script')).toHaveCount(0);
  for (const [i, height] of [[0, 22], [1, 18]]) {
    const chip = chips.nth(i);
    await expect(chip).toHaveCSS('border-top-width', '0px');
    expect((await chip.boundingBox())!.height).toBe(height);
    await expect(chip).not.toHaveAttribute('tabindex');
  }
  await s.locator('[data-before-attributes]').focus();
  await page.keyboard.press('Tab');
  await expect(s.locator('[data-after-attributes]')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(s.locator('[data-before-attributes]')).toBeFocused();
});

test('file-tree/native-lists-annotations-and-child-keyboard', async ({ page }) => {
  const s = page.locator('#tree-variants');
  const tree = s.getByRole('group', { name: 'Scaffold files' });
  await expect(tree.getByRole('list')).toHaveCount(2);
  await expect(tree.getByRole('listitem')).toHaveCount(11);
  await expect(tree.locator('ul > li > ul > li')).toHaveCount(1);
  await expect(
    tree.locator('[role="tree"], [role="treeitem"], [aria-expanded], [aria-selected], [tabindex]'),
  ).toHaveCount(0);
  for (const type of ['folder', 'file']) {
    for (const ownership of ['none', 'owned', 'generated', 'guidance']) {
      const row = tree.locator(
        '[data-part="row"][data-type="' + type + '"][data-ownership="' + ownership + '"]',
      ).filter({ hasText: type + '-' + ownership });
      await expect(row).toBeVisible();
      expect((await row.boundingBox())!.height).toBeGreaterThanOrEqual(26);
      expect(await row.ariaSnapshot()).toContain(type === 'file' ? 'File:' : 'Folder:');
    }
  }
  await s.locator('[data-before-tree]').focus();
  await page.keyboard.press('Tab');
  const source = tree.getByRole('link', { name: 'Read source', exact: true });
  await expect(source).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await expect(tree.getByRole('listitem')).toHaveCount(11);
  for (const row of await tree.locator('[data-part="row"]').all()) await expect(row).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#source-details$/);
  await source.focus();
  await page.keyboard.press('Tab');
  await expect(tree.getByRole('link', { name: 'Read annotation' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(s.locator('[data-after-tree]')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(tree.getByRole('link', { name: 'Read annotation' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(source).toBeFocused();
  const hidden = s.getByRole('group', { name: 'Hidden annotations' });
  const snapshot = await hidden.ariaSnapshot();
  for (const text of ['Dossier:', 'Fichier:', '[owned]', '[generated]', '[guidance]']) {
    expect(snapshot).toContain(text);
  }
  for (const tag of await hidden.locator('[data-part="tag"]').all()) {
    expect(await tag.evaluate((e) => getComputedStyle(e).clipPath)).toBe('inset(50%)');
  }
  const list = tree.locator('ul ul');
  await expect(list).toHaveCSS('padding-inline-start', '20px');
  await expect(tree).toHaveCSS('padding-block-start', '16px');
  await expect(tree).toHaveCSS('padding-inline-start', '20px');
  await axeClean(page);
});

test('figure/native-media-caption-width-and-child-activation', async ({ page }, info) => {
  const s = page.locator('#figure-variants');
  await expect(s.getByRole('figure')).toHaveCount(4);
  for (const width of ['prose', 'wide']) {
    for (const media of ['image', 'diagram']) {
      const figure = s.locator('figure[data-width="' + width + '"][data-media="' + media + '"]');
      await expect(figure.locator('figcaption')).toContainText(
        width + ' ' + media + ' architecture',
      );
      await expect(figure).not.toHaveAttribute('tabindex');
      const visual = figure.getByRole('img');
      await expect(visual).toHaveAccessibleName(
        width + ' architecture ' + (media === 'image' ? 'image' : 'diagram'),
      );
      if (media === 'image') {
        expect(
          await visual.evaluate((e: HTMLImageElement) =>
            e.complete && e.naturalWidth === 720 && e.naturalHeight === 360
          ),
        ).toBe(true);
      }
      const box = (await visual.boundingBox())!;
      expect(box.width / box.height).toBeCloseTo(2, 2);
      expect((await figure.boundingBox())!.width).toBeLessThanOrEqual(
        width === 'prose' ? 544 : 720,
      );
      if ((info.project.use.viewport?.width ?? 390) === 1280) {
        expect((await figure.boundingBox())!.width).toBe(width === 'prose' ? 544 : 720);
      }
      await expect(figure.locator('[data-part="media"]')).toHaveCSS('border-radius', '0px');
      await expect(figure.locator('figcaption')).toHaveCSS('padding-top', '8px');
    }
  }
  await s.locator('[data-before-figures]').focus();
  for (const width of ['prose', 'wide']) {
    for (const media of ['image', 'diagram']) {
      const figure = s.locator('figure[data-width="' + width + '"][data-media="' + media + '"]');
      await page.keyboard.press('Tab');
      await expect(figure.getByRole('link')).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(figure.getByRole('button')).toBeFocused();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Space');
    }
  }
  await expect(s.getByLabel('Figure inspections')).toHaveText('8');
  await page.keyboard.press('Tab');
  await expect(s.locator('[data-after-figures]')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(s.getByRole('button', { name: 'Inspect wide diagram', exact: true })).toBeFocused();
  await axeClean(page);
});

test('docs-structure/utility-captures-long-content-and-rtl', async ({ page }, info) => {
  for (const dir of ['ltr', 'rtl']) {
    await page.locator('html').evaluate((e, d) => e.setAttribute('dir', d), dir);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const offenders = await page.locator(
      '.ns-file-path-chip, .ns-attribute-chip, .ns-file-tree, .ns-figure',
    ).evaluateAll((elements) =>
      elements.filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) =>
        e.getAttribute('data-scope')
      )
    );
    expect(offenders).toEqual([]);
    for (const id of ['path-native', 'attribute-variants', 'tree-variants', 'figure-variants']) {
      await page.locator('#' + id).screenshot({ path: info.outputPath(id + '-' + dir + '.png') });
    }
    await axeClean(page);
  }
});
