import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

const errors: string[] = [];
test.beforeEach(async ({ page }, info) => {
  errors.length = 0;
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/desktop-controls?scheme=' + info.project.use.colorScheme);
  await expect(page.getByRole('heading', { name: 'Desktop controls examples' })).toBeVisible();
  await expect(page.locator('#tray-one button[tabindex="-1"]')).toHaveCount(2);
});
test.afterEach(() => expect(errors).toEqual([]));

test('window-chrome/native-operation-controls', async ({ page }) => {
  const table = [
    ['legacy', ['reload', 'hide', 'close']],
    ['macos', ['close', 'hide', 'reload']],
    ['windows', ['hide', 'reload', 'close']],
    ['linux', ['hide', 'reload', 'close']],
  ] as const;
  const emitted: string[] = [];
  for (const [platform, actions] of table) {
    const buttons = page.locator('#window-' + platform + ' button');
    expect(
      await buttons.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-action'))),
    ).toEqual(actions);
    await buttons.first().focus();
    for (let i = 0; i < actions.length; i++) {
      await expect(buttons.nth(i)).toBeFocused();
      await page.keyboard.press(i % 2 ? 'Space' : 'Enter');
      emitted.push(actions[i]);
      await expect(page.getByLabel('Window operations')).toHaveText(emitted.join(','));
      if (i < actions.length - 1) await page.keyboard.press('Tab');
    }
    await page.keyboard.press('Shift+Tab');
    await expect(buttons.nth(actions.length - 2)).toBeFocused();
  }
  const all = page.locator('#window-all button');
  await all.first().focus();
  for (const [index, action] of ['show', 'hide', 'focus', 'reload', 'close'].entries()) {
    await expect(all.nth(index)).toBeFocused();
    await page.keyboard.press('Enter');
    emitted.push(action);
    await expect(page.getByLabel('Window operations')).toHaveText(emitted.join(','));
    if (index < 4) await page.keyboard.press('Tab');
  }
  for (const platform of ['macos', 'windows', 'linux']) {
    const controls = page.locator('#window-five-' + platform + ' button');
    await controls.first().focus();
    for (const [index, action] of ['show', 'hide', 'focus', 'reload', 'close'].entries()) {
      await expect(controls.nth(index)).toBeFocused();
      await page.keyboard.press(index % 2 ? 'Space' : 'Enter');
      emitted.push(action);
      await expect(page.getByLabel('Window operations')).toHaveText(emitted.join(','));
      if (index < 4) await page.keyboard.press('Tab');
    }
  }
  await expect(page.locator('#window-empty button')).toHaveCount(0);
  await expect(page.locator('#window-forced-disabled button:disabled')).toHaveCount(5);
  for (const platform of ['macos', 'windows', 'linux']) {
    await expect(page.locator('#window-' + platform + '-disabled button:disabled')).toHaveCount(3);
    const unfocused = page.locator('#window-' + platform + '-unfocused button').first();
    await unfocused.focus();
    await page.keyboard.press('Space');
    emitted.push((await unfocused.getAttribute('data-action'))!);
    await expect(page.getByLabel('Window operations')).toHaveText(emitted.join(','));
  }
});

test('tray-menu/native-disclosure-and-roving', async ({ page }) => {
  const first = page.locator('#tray-one');
  const summary = first.locator('summary');
  const actions = first.locator('button:not(:disabled)');
  await summary.focus();
  await page.keyboard.press('ArrowDown');
  await expect(actions.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(actions.nth(1)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Menu operations')).toHaveText('copy');
  await page.keyboard.press('ArrowDown');
  await expect(actions.nth(2)).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Menu operations')).toHaveText('copy,open');
  await page.keyboard.press('ArrowDown');
  await expect(actions.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(actions.nth(2)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(summary).toBeFocused();
  await expect(first.locator('details')).not.toHaveAttribute('open');
  await expect(page.locator('#tray-two details')).toHaveAttribute('open', '');
  await page.keyboard.press('ArrowUp');
  await expect(actions.nth(2)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#between-trays')).toBeFocused();
  await expect(first.locator('details')).not.toHaveAttribute('open');
  await page.keyboard.press('Shift+Tab');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Space');
  await expect(first.locator('details')).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(first.locator('details')).not.toHaveAttribute('open');
  await expect(page.getByLabel('Menu operations')).toHaveText('copy,open');
});

test('tray-menu dismissal survives rerender and unrelated focus never closes another menu', async ({ page }) => {
  const first = page.locator('#tray-one');
  const second = page.locator('#tray-two');
  await first.locator('summary').focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Escape');
  await page.locator('#rerender-desktop').click();
  await expect(page.getByLabel('Desktop revision')).toHaveText('1');
  await expect(first.locator('details')).not.toHaveAttribute('open');
  await expect(second.locator('details')).toHaveAttribute('open', '');
  await page.locator('#before-desktop').focus();
  await page.locator('#after-desktop').focus();
  await expect(second.locator('details')).toHaveAttribute('open', '');
  await second.locator('summary').focus();
  await page.keyboard.press('ArrowUp');
  await expect(second.getByRole('menuitem', { name: 'Open another' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(second.locator('summary')).toBeFocused();
  await expect(second.locator('details')).toHaveAttribute('open', '');
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#between-trays')).toBeFocused();
  await expect(second.locator('details')).not.toHaveAttribute('open');
  await expect(page.getByLabel('Menu operations')).toHaveText('');
});

test('tray-menu/ssr-native-tab-order', async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: info.project.use.viewport,
    colorScheme: info.project.use.colorScheme,
  });
  const page = await context.newPage();
  try {
    await page.goto(baseURL + '/desktop-controls-static?scheme=' + info.project.use.colorScheme);
    const first = page.locator('#tray-one');
    await expect(first.locator('details')).toHaveAttribute('open', '');
    await expect(first.locator('[tabindex]')).toHaveCount(0);
    await first.locator('summary').focus();
    for (const label of ['Open Ctrl+O', 'Copy document Ctrl+C', 'Open another']) {
      await page.keyboard.press('Tab');
      const action = first.getByRole('menuitem', { name: label, exact: true });
      await expect(action).toBeFocused();
      await page.keyboard.press('Enter');
      await expect(first.locator('details')).toHaveAttribute('open', '');
    }
    await page.keyboard.press('Tab');
    await expect(page.locator('#between-trays')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(first.getByRole('menuitem', { name: 'Open another' })).toBeFocused();
    await first.locator('summary').focus();
    await page.keyboard.press('Space');
    await expect(first.locator('details')).not.toHaveAttribute('open');
    await page.keyboard.press('Enter');
    await expect(first.locator('details')).toHaveAttribute('open', '');
    await expect(page.getByLabel('Menu operations')).toHaveText('');
  } finally {
    await context.close();
  }
});

test(
  'tray-menu unchanged static SSR markup passes accessibility before hydration',
  async ({ page }, info) => {
    await page.goto('/desktop-controls-static?scheme=' + info.project.use.colorScheme);
    await expect(page.locator('#tray-one [tabindex]')).toHaveCount(0);
    const axe = await new AxeBuilder({ page }).include('main').analyze();
    expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual(
      [],
    );
  },
);

test(
  'Desktop snapshots geometry, logical layout, tokens and native accessibility',
  async ({ page }, info) => {
    for (const direction of ['ltr', 'rtl']) {
      await page.evaluate((dir) => {
        document.documentElement.dir = dir;
      }, direction);
      for (const platform of ['macos', 'windows', 'linux']) {
        for (const state of ['focused', 'blurred', 'hover', 'unfocused', 'disabled']) {
          const root = page.locator('#window-' + platform + '-' + state + ' [data-part="root"]');
          await expect(root).toHaveAttribute('data-platform', platform);
          await expect(root).toHaveAttribute('data-state', state);
          const dimensions = await root.evaluate((node) => ({
            height: node.getBoundingClientRect().height,
            overflow: node.scrollWidth - node.clientWidth,
            controls: [...node.querySelectorAll('button')].map((button) => ({
              width: button.getBoundingClientRect().width,
              height: button.getBoundingClientRect().height,
            })),
          }));
          expect(dimensions.height).toBe(40);
          expect(dimensions.overflow).toBeLessThanOrEqual(1);
          expect(dimensions.controls.map((button) => button.width)).toEqual(
            [1, 2, 3].map(() => platform === 'windows' ? 46 : platform === 'linux' ? 24 : 12),
          );
          if (platform === 'macos') {
            expect(dimensions.controls.map((button) => button.height))
              .toEqual([12, 12, 12]);
          }
        }
      }
      await expect(page.locator('#tray-no-accelerator kbd')).toHaveCount(0);
      await expect(page.locator('#tray-disabled button:disabled')).toHaveCount(4);
      for (const id of ['tray-one', 'tray-two', 'tray-long', 'window-leading']) {
        const overflow = await page.locator('#' + id).evaluate((node) =>
          node.scrollWidth - node.clientWidth
        );
        expect(overflow, id).toBeLessThanOrEqual(1);
      }
      for (const platform of ['macos', 'windows', 'linux']) {
        const frame = page.locator('#window-five-' + platform);
        const box = await frame.evaluate((element) => ({
          width: element.getBoundingClientRect().width,
          overflow: element.scrollWidth - element.clientWidth,
          leadingWidth:
            element.querySelector('[data-part="leading"]')!.getBoundingClientRect().width,
          controls: [...element.querySelectorAll('button')].length,
        }));
        expect(box.width).toBeLessThanOrEqual((await page.viewportSize())!.width);
        expect(box.overflow).toBeLessThanOrEqual(1);
        expect(box.leadingWidth).toBeGreaterThan(0);
        expect(box.controls).toBe(5);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
        .toBeLessThanOrEqual(1);
      const width = await page.locator('#tray-one nav').evaluate((node) =>
        node.getBoundingClientRect().width
      );
      expect(width).toBe(256);
      const axe = await new AxeBuilder({ page }).include('main').analyze();
      expect(axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? '')))
        .toEqual([]);
      await page.locator('#window-snapshots').screenshot({
        path: info.outputPath('window-' + direction + '.png'),
      });
      await page.locator('#tray-snapshots').screenshot({
        path: info.outputPath('tray-' + direction + '.png'),
      });
    }
  },
);
