import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  await expect(page.getByRole('heading', { name: 'Chart and carousel components' })).toBeVisible();
});

test('chart/native-data-disclosure', async ({ page }) => {
  const figure = page.locator('#series-chart figure');
  await expect(figure.getByRole('img', { name: 'Revenue trend', exact: true })).toBeVisible();
  const summary = figure.locator('summary'),
    table = figure.getByRole('table', { name: 'Revenue trend source values' });
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(table).toBeVisible();
  await expect(table.getByRole('row')).toHaveCount(4);
  await expect(table.getByRole('row', { name: 'January 20 -5' })).toBeVisible();
  await page.keyboard.press('Space');
  await expect(table).not.toBeVisible();
  await expect(summary).toBeFocused();
  const plot = figure.locator('svg'), box = await plot.boundingBox();
  if (!box) throw new Error('Chart plot is not measurable');
  await plot.hover({ position: { x: box.width * .95, y: box.height * .5 } });
  await expect(figure).toHaveAttribute('data-state', 'hover');
  await expect(figure.locator('[data-part="tooltip"]')).toContainText('March');
  await page.mouse.move(0, 0);
  await expect(figure).toHaveAttribute('data-state', 'rest');
  await page.getByLabel('Chart number locale').selectOption('de-DE');
  await expect(figure.locator('[data-part="axis-y"]')).toContainText('28,8');
  await expect(page.getByRole('status', { name: 'Loading Pending revenue' })).toBeVisible();
  await expect(page.locator('#series-chart-states [data-state="empty"]')).toContainText(
    'No data available',
  );
  await expect(page.locator('#series-chart-states circle')).toHaveCount(1);
});

test('carousel/native-controls-and-boundaries', async ({ page }) => {
  const carousel = page.getByRole('region', { name: 'Projects', exact: true });
  const next = carousel.getByRole('button', { name: 'Next Projects slide', exact: true });
  const previous = carousel.getByRole('button', { name: 'Previous Projects slide', exact: true });
  const counter = carousel.locator('[data-part="counter"]');
  await expect(previous).toHaveAttribute('aria-disabled', 'true');
  await previous.focus();
  await page.keyboard.press('Tab');
  await expect(carousel.locator('[data-part="viewport"]')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(carousel.getByRole('link', { name: 'Project One', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(next).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(counter).toHaveText('2 / 3');
  await expect(next).toBeFocused();
  await expect(carousel.locator('[data-part="slide"]').nth(0)).toHaveAttribute('inert');
  await page.keyboard.press('Space');
  await expect(counter).toHaveText('3 / 3');
  await expect(next).toHaveAttribute('aria-disabled', 'true');
  await expect(next).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(counter).toHaveText('3 / 3');
  await expect(page.getByLabel('Project slide changes')).toHaveText('2');
  await previous.focus();
  await page.keyboard.press('Space');
  await expect(counter).toHaveText('2 / 3');
  await expect(previous).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(carousel.getByRole('link', { name: 'Project Two', exact: true })).toBeFocused();
  await carousel.getByRole('button', { name: 'Go to Projects slide 3: Three' }).click();
  await expect(counter).toHaveText('3 / 3');
  await page.getByRole('button', { name: 'Keep first project only' }).click();
  await expect(counter).toHaveText('1 / 1');
  await expect(carousel.getByRole('link', { name: 'Project One', exact: true })).toBeVisible();
});

test('carousel/native-scroll-resize-vertical-and-rtl', async ({ page }, info) => {
  const carousel = page.getByRole('region', { name: 'Projects', exact: true });
  const viewport = carousel.locator('[data-part="viewport"]');
  await carousel.getByRole('link', { name: 'Project One', exact: true }).focus();
  await viewport.hover();
  await page.mouse.wheel(await viewport.evaluate((element) => element.clientWidth), 0);
  await expect(carousel.locator('[data-part="counter"]')).toHaveText('2 / 3');
  await expect(viewport).toBeFocused();
  await page.setViewportSize({ width: 500, height: 900 });
  await expect.poll(() =>
    viewport.evaluate((element) => {
      const active = element.querySelector('[data-part="slide"]:not([inert])');
      return active
        ? Math.abs(active.getBoundingClientRect().left - element.getBoundingClientRect().left)
        : 100;
    })
  ).toBeLessThan(2);
  const vertical = page.getByRole('region', { name: 'Vertical projects', exact: true });
  await vertical.getByRole('button', { name: 'Next Vertical projects slide' }).click();
  await expect(vertical.locator('[data-part="counter"]')).toHaveText('2 / 3');
  await expect.poll(() =>
    vertical.locator('[data-part="viewport"]').evaluate((element) => {
      const active = element.querySelector('[data-part="slide"]:not([inert])');
      return active
        ? Math.abs(active.getBoundingClientRect().top - element.getBoundingClientRect().top)
        : 100;
    })
  ).toBeLessThan(2);
  await page.goto(`/?dir=rtl&scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  const rtl = page.getByRole('region', { name: 'Projects', exact: true });
  await rtl.getByRole('button', { name: 'Next Projects slide', exact: true }).click();
  await expect(rtl.locator('[data-part="counter"]')).toHaveText('2 / 3');
  await expect(rtl.getByRole('link', { name: 'Project Two', exact: true })).toBeVisible();
  const empty = page.getByRole('region', { name: 'Empty projects', exact: true });
  await expect(empty.locator('[data-part="counter"]')).toHaveText('0 / 0');
  await expect(empty.getByRole('button', { name: 'Next Empty projects slide' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
});

test('display-motion/strict-accessibility-and-local-review', async ({ page }, info) => {
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
    .toEqual([]);
  await page.locator('#series-chart figure').screenshot({
    path: info.outputPath('chart-local-linux.png'),
  });
  await page.getByRole('region', { name: 'Projects', exact: true }).screenshot({
    path: info.outputPath('carousel-local-linux.png'),
  });
  await page.getByRole('region', { name: 'Vertical projects', exact: true }).screenshot({
    path: info.outputPath('carousel-vertical-local-linux.png'),
  });
});

test('carousel/native-touch-scroll @touch', async ({ page }) => {
  const carousel = page.getByRole('region', { name: 'Projects', exact: true });
  const viewport = carousel.locator('[data-part="viewport"]');
  await viewport.scrollIntoViewIfNeeded();
  const box = await viewport.boundingBox();
  if (!box) throw new Error('Carousel viewport is not measurable');
  const session = await page.context().newCDPSession(page);
  try {
    const y = box.y + box.height * .7;
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width * .85, y }],
    });
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: box.x + box.width * (.85 - .7 * step / 8), y }],
      });
      await page.waitForTimeout(20);
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(carousel.locator('[data-part="counter"]')).not.toHaveText('1 / 3');
    await expect(carousel.locator('[data-part="slide"]').first()).toHaveAttribute('inert');
    await expect.poll(() =>
      viewport.evaluate((element) => {
        const active = element.querySelector('[data-part="slide"]:not([inert])');
        return active
          ? Math.abs(active.getBoundingClientRect().left - element.getBoundingClientRect().left)
          : 100;
      })
    ).toBeLessThan(2);
    await carousel.getByRole('button', { name: 'Go to Projects slide 1: One' }).tap();
    await expect(carousel.locator('[data-part="counter"]')).toHaveText('1 / 3');
    await carousel.getByRole('button', { name: 'Next Projects slide', exact: true }).tap();
    await expect(carousel.locator('[data-part="counter"]')).toHaveText('2 / 3');
  } finally {
    await session.detach();
  }
});
