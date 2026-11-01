import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.beforeEach(async ({ page }, info) => {
  await page.goto(
    `/stats-grid?scheme=${info.project.use.colorScheme === 'dark' ? 'dark' : 'light'}`,
  );
  await expect(page.getByRole('heading', { name: 'Stats grid examples' })).toBeVisible();
});

test('stats-grid/native-child-controls', async ({ page }) => {
  const section = page.locator('#stats-native');
  await section.locator('[data-before-stats]').focus();
  await page.keyboard.press('Tab');
  await expect(section.getByRole('button', { name: 'Inspect metrics' })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(section.getByLabel('Metric actions')).toHaveText('2');
  await page.keyboard.press('Tab');
  await expect(section.getByRole('link', { name: 'Read metric details' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#metrics-details$/);
  await page.keyboard.press('Tab');
  await expect(section.locator('[data-after-stats]')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(section.getByRole('link', { name: 'Read metric details' })).toBeFocused();
  for (const part of ['sparkline', 'ticks', 'blockbars']) {
    await expect(section.locator(`[data-part='${part}']`)).toHaveCSS('display', 'none');
    await expect(section.locator(`[data-part='${part}']`)).toHaveAttribute('inert', '');
  }
  await expect(section.locator('.ns-stats-grid')).not.toHaveAttribute('tabindex');
  await expect(section.locator('.ns-stats-grid__card')).not.toHaveAttribute('tabindex');
});

test('stats-grid/container-adaptive-columns-and-defaults', async ({ page }) => {
  for (const n of [2, 3, 4]) {
    for (const joined of ['false', 'true']) {
      const grid = page.locator(`#stats-${n}-${joined} .ns-stats-grid`);
      await expect(grid).toHaveAttribute('data-columns', String(n));
      await expect(grid).toHaveAttribute('data-joined', joined);
      const count = await grid.evaluate((e) =>
        getComputedStyle(e).gridTemplateColumns.split(' ').length
      );
      expect(count).toBe(page.viewportSize()!.width < 640 ? 1 : n);
      expect(await grid.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    }
  }
  const narrow = page.locator('#stats-container .ns-stats-grid');
  expect(await narrow.evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length))
    .toBe(1);
  const automatic = page.locator('#stats-default .ns-stats-grid');
  await expect(automatic).not.toHaveAttribute('data-columns');
  expect(await automatic.evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length))
    .toBe(page.viewportSize()!.width < 640 ? 1 : 5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('stats-grid/joined-wrap-rules-and-rtl', async ({ page }) => {
  for (const direction of ['ltr', 'rtl']) {
    await page.locator('html').evaluate((e, dir) => e.setAttribute('dir', dir), direction);
    for (const columns of [2, 3, 4]) {
      const grid = page.locator(`#stats-${columns}-true .ns-stats-grid`);
      const rules = await grid.evaluate((e) => {
        const root = getComputedStyle(e);
        return {
          root: [
            root.borderTopWidth,
            root.borderInlineEndWidth,
            root.borderBottomWidth,
            root.borderInlineStartWidth,
          ],
          cards: Array.from(e.children).map((card) => {
            const style = getComputedStyle(card);
            return {
              rules: [
                style.borderTopWidth,
                style.borderInlineEndWidth,
                style.borderBottomWidth,
                style.borderInlineStartWidth,
              ],
              radius: style.borderRadius,
              shadow: style.boxShadow,
            };
          }),
        };
      });
      expect(rules.root).toEqual(['1px', '1px', '1px', '0px']);
      for (const card of rules.cards) {
        expect(card.rules).toEqual(['0px', '0px', '0px', '1px']);
        expect(card.radius).toBe('0px');
        expect(card.shadow).toContain('0px -1px 0px 0px');
      }
    }
    const wrapped = page.locator('#stats-4-true .ns-stats-grid');
    await wrapped.evaluate((e) => {
      e.style.width = '450px';
      e.style.maxWidth = '100%';
    });
    const boxes = await wrapped.locator('.ns-stats-grid__card').evaluateAll((cards) =>
      cards.map((e) => {
        const b = e.getBoundingClientRect();
        return { x: b.x, y: b.y, width: b.width, height: b.height };
      })
    );
    const perRow = page.viewportSize()!.width < 640 ? 1 : 2;
    expect(boxes[perRow].y).toBeCloseTo(boxes[0].y + boxes[0].height, 1);
    expect(boxes[perRow].x).toBeCloseTo(boxes[0].x, 1);
    expect(await wrapped.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    const rootBox = (await wrapped.boundingBox())!;
    const image = await wrapped.screenshot({
      path: test.info().outputPath(`stats-wrap-${direction}.png`),
    });
    // Measure the rendered seam, independently of which CSS technique draws it.
    const borderPixels = await wrapped.evaluate(async (element, sample) => {
      const bytes = Uint8Array.from(atob(sample.png), (c) => c.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: 'image/png' }));
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d')!;
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      const pixels = context.getImageData(5, sample.y - 3, 1, 7).data;
      context.fillStyle = getComputedStyle(element).borderTopColor;
      context.fillRect(0, 0, 1, 1);
      const border = context.getImageData(0, 0, 1, 1).data;
      return Array.from({ length: 7 }, (_, n) => n * 4).filter((i) =>
        pixels[i] === border[0] && pixels[i + 1] === border[1] && pixels[i + 2] === border[2]
      ).length;
    }, { png: image.toString('base64'), y: Math.round(boxes[perRow].y - rootBox.y) });
    expect(borderPixels).toBe(1);
  }
});

test('stats-grid/hero-delta-and-theme-owned-decorations', async ({ page }) => {
  const hero = page.locator('#stats-hero [data-variant="hero"]');
  const expected = await hero.evaluate((e) => ({
    background: getComputedStyle(e).getPropertyValue('--ns-primary').trim(),
    foreground: getComputedStyle(e).getPropertyValue('--ns-primary-fg').trim(),
  }));
  expect(expected.background).not.toBe('');
  expect(expected.foreground).not.toBe('');
  const resolved = await hero.evaluate((e) => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--ns-primary-fg)';
    e.append(probe);
    const foreground = getComputedStyle(probe).color;
    probe.style.color = 'var(--ns-primary)';
    const background = getComputedStyle(probe).color;
    probe.remove();
    return { foreground, background };
  });
  await expect(hero).toHaveCSS('background-color', resolved.background);
  for (const part of ['label', 'value', 'detail', 'delta']) {
    await expect(hero.locator(`[data-part='${part}']`)).toHaveCSS('color', resolved.foreground);
  }
  for (const delta of ['up', 'down']) {
    const indicator = page.locator(`#stats-3-false [data-delta='${delta}'] [data-part='delta']`)
      .first();
    await expect(indicator).toHaveAttribute('aria-hidden', 'true');
    await expect(indicator).toHaveText(delta === 'up' ? '↗' : '↘');
  }
  const card = page.locator('#stats-native .ns-stats-grid__card');
  await card.evaluate((e) => {
    for (const part of ['sparkline', 'ticks', 'blockbars']) {
      e.style.setProperty(`--ns-deco-${part}`, '1');
    }
  });
  for (const part of ['sparkline', 'ticks', 'blockbars']) {
    await expect(card.locator(`[data-part='${part}']`)).toHaveCSS('display', 'block');
    await expect(card.locator(`[data-part='${part}']`)).toHaveAttribute('aria-hidden', 'true');
  }
  await page.locator('#stats-native [data-before-stats]').focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.locator('#stats-native [data-after-stats]')).toBeFocused();
});

test('stats-grid/strict-accessibility-and-utility-review', async ({ page }) => {
  const results = await new AxeBuilder({ page }).include('#stats-examples').analyze();
  expect(results.violations.filter((e) => e.impact === 'critical' || e.impact === 'serious'))
    .toEqual([]);
  for (
    const id of [
      'stats-2-false',
      'stats-3-false',
      'stats-4-false',
      'stats-2-true',
      'stats-3-true',
      'stats-4-true',
      'stats-hero',
    ]
  ) {
    await page.locator(`#${id} .ns-stats-grid`).screenshot({
      path: test.info().outputPath(`${id}.png`),
    });
  }
});

test('stats-grid/actual-card-stylesheet-order-preserves-kpi-rules', async ({ page }) => {
  const cards = page.locator(
    '#stats-3-false .ns-stats-grid__card, #stats-hero .ns-stats-grid__card',
  );
  const measure = () =>
    cards.evaluateAll((elements) =>
      elements.map((element) => {
        const card = getComputedStyle(element);
        const body = getComputedStyle(element.querySelector('.ns-stats-grid__body')!);
        return {
          background: card.backgroundColor,
          borders: [
            card.borderTopWidth,
            card.borderRightWidth,
            card.borderBottomWidth,
            card.borderLeftWidth,
          ],
          radius: card.borderRadius,
          padding: body.padding,
        };
      })
    );
  const before = await measure();
  await page.evaluate(async () => {
    const response = await fetch('/registered-card.css');
    if (!response.ok) throw new Error('Actual registered Card stylesheet is required.');
    const style = document.createElement('style');
    style.textContent = await response.text();
    document.head.append(style);
  });
  expect(await measure()).toEqual(before);
});
