import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

declare global {
  var __resizeObserverStats: { active: number; disconnected: number };
  var __resizePointerId: number | undefined;
}

test.beforeEach(async ({ page }, info) => {
  await page.addInitScript(() => {
    const Original = globalThis.ResizeObserver;
    globalThis.__resizeObserverStats = { active: 0, disconnected: 0 };
    globalThis.ResizeObserver = class extends Original {
      watched = false;
      override observe(target: Element, options?: ResizeObserverOptions) {
        if (!this.watched && target.matches('[data-scope="resizable"][data-part="panel-group"]')) {
          this.watched = true;
          globalThis.__resizeObserverStats.active++;
        }
        super.observe(target, options);
      }
      override disconnect() {
        if (this.watched) {
          this.watched = false;
          globalThis.__resizeObserverStats.active--;
          globalThis.__resizeObserverStats.disconnected++;
        }
        super.disconnect();
      }
    };
  });
  await page.goto(`/?scheme=${info.project.name.includes('dark') ? 'dark' : 'light'}`);
  await expect(page.getByRole('heading', { name: 'Resizable examples' })).toBeVisible();
});

test('resizable/bounded-native-keyboard', async ({ page }) => {
  for (
    const [id, label, increase, decrease, orientation] of [
      ['resize-horizontal', 'Horizontal contents', 'ArrowRight', 'ArrowLeft', 'vertical'],
      ['resize-vertical', 'Vertical contents', 'ArrowDown', 'ArrowUp', 'horizontal'],
      ['resize-rtl', 'RTL contents', 'ArrowLeft', 'ArrowRight', 'vertical'],
    ]
  ) {
    const section = page.locator(`#${id}`);
    const handle = section.getByRole('separator', { name: label });
    await expect(handle).toHaveAttribute('aria-orientation', orientation);
    const controlledId = await handle.getAttribute('aria-controls');
    expect(controlledId).toBeTruthy();
    await expect(section.locator(`[id="${controlledId}"]`)).toHaveAttribute('role', 'group');
    await handle.focus();
    await page.keyboard.press('Home');
    await expect(handle).toHaveAttribute('aria-valuetext', '80 pixels');
    await page.keyboard.press(increase);
    await expect(handle).toHaveAttribute('aria-valuetext', '90 pixels');
    await page.keyboard.press(decrease);
    await expect(handle).toHaveAttribute('aria-valuetext', '80 pixels');
    await page.keyboard.press(decrease);
    await expect(handle).toHaveAttribute('aria-valuetext', '80 pixels');
    await page.keyboard.press('End');
    expect(await handle.getAttribute('aria-valuenow')).toBe(
      await handle.getAttribute('aria-valuemax'),
    );
    const panel = section.locator('[data-scope="resizable"][data-part="panel"]').first();
    const pixels = (await panel.boundingBox())![orientation === 'vertical' ? 'width' : 'height'];
    expect(Math.abs(Number.parseFloat((await handle.getAttribute('aria-valuetext'))!) - pixels))
      .toBeLessThan(0.2);
    expect(Number(await handle.getAttribute('aria-valuenow'))).toBeGreaterThanOrEqual(
      Number(await handle.getAttribute('aria-valuemin')),
    );
    await page.keyboard.press('Enter');
    expect(await handle.getAttribute('aria-valuenow')).toBe(
      await handle.getAttribute('aria-valuemax'),
    );
  }
  const horizontal = page.locator('#resize-horizontal');
  await horizontal.getByRole('button', { name: 'Open horizontal chapter' }).focus();
  await page.keyboard.press('Tab');
  await expect(horizontal.getByRole('separator')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(horizontal.getByRole('group', { name: 'Secondary panel' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(horizontal.getByRole('link')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(horizontal.getByRole('group', { name: 'Secondary panel' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(horizontal.getByRole('separator')).toBeFocused();
  const plain = page.locator('#resize-plain');
  await expect(plain.getByRole('separator', { name: 'Plain contents' })).toBeVisible();
  await expect(plain.getByRole('group', { name: 'Plain contents' })).toBeVisible();
  await expect(plain.locator('[data-part="grip"]')).toHaveCount(0);
});

test('resizable/pointer-capture-both-axes-and-rtl', async ({ page }) => {
  for (
    const [id, horizontal] of [['resize-horizontal', true], ['resize-vertical', false], [
      'resize-rtl',
      true,
    ]] as const
  ) {
    const handle = page.locator(`#${id}`).getByRole('separator');
    await handle.scrollIntoViewIfNeeded();
    await handle.evaluate((element) =>
      element.addEventListener('pointerdown', (event) => {
        globalThis.__resizePointerId = (event as PointerEvent).pointerId;
      }, { once: true })
    );
    const before = Number.parseFloat((await handle.getAttribute('aria-valuetext'))!);
    const box = (await handle.boundingBox())!;
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    expect(await handle.evaluate((e) => e.hasPointerCapture(globalThis.__resizePointerId!))).toBe(
      true,
    );
    const delta = id === 'resize-rtl' ? 25 : -25;
    await page.mouse.move(horizontal ? x + delta : x, horizontal ? y : y + delta, { steps: 4 });
    await expect.poll(async () => Number.parseFloat((await handle.getAttribute('aria-valuetext'))!))
      .toBeLessThan(before - 20);
    await page.mouse.up();
    expect(await handle.evaluate((e) => e.hasPointerCapture(globalThis.__resizePointerId!))).toBe(
      false,
    );
  }
});

test('resizable/controlled-refusal-and-container-clamp', async ({ page }) => {
  const handle = page.locator('#resize-controlled').getByRole('separator');
  await handle.focus();
  await page.keyboard.press('ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuetext', '180 pixels');
  await expect(page.getByLabel('Last resize proposal')).toHaveText('190');
  await expect(page.getByLabel('Resize proposal count')).toHaveText('1');
  await page.getByRole('button', { name: 'Accept controlled sizes' }).click();
  await handle.focus();
  await page.keyboard.press('ArrowRight');
  await expect(handle).toHaveAttribute('aria-valuetext', '190 pixels');
  const adaptive = page.locator('#resize-geometry').getByRole('separator');
  const old = await adaptive.getAttribute('aria-valuetext');
  await page.getByRole('button', { name: 'Shrink resize container' }).click();
  await expect.poll(() => adaptive.getAttribute('aria-valuetext')).not.toBe(old);
  await expect(page.getByLabel('Geometry resize proposals')).toHaveText('0');
  const min = Number(await adaptive.getAttribute('aria-valuemin'));
  const max = Number(await adaptive.getAttribute('aria-valuemax'));
  const now = Number(await adaptive.getAttribute('aria-valuenow'));
  expect(now).toBeGreaterThanOrEqual(min);
  expect(now).toBeLessThanOrEqual(max);
  expect(
    await page.locator('#resize-geometry .ns-resizable').evaluate((e) =>
      e.scrollWidth <= e.clientWidth + 1
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Restore resize container' }).click();
  await expect(adaptive).toHaveAttribute('aria-valuetext', old!);
});

test('resizable/unmount-cleans-observer-and-active-capture', async ({ page }) => {
  const baseline = await page.evaluate(() => globalThis.__resizeObserverStats.active);
  await page.getByRole('button', { name: 'Mount resize example' }).click();
  const handle = page.locator('#resize-lifecycle').getByRole('separator');
  await expect(handle).toBeVisible();
  await expect.poll(() => page.evaluate(() => globalThis.__resizeObserverStats.active)).toBe(
    baseline + 1,
  );
  await handle.evaluate((element) =>
    element.addEventListener('pointerdown', (event) => {
      globalThis.__resizePointerId = (event as PointerEvent).pointerId;
    })
  );
  await handle.scrollIntoViewIfNeeded();
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  expect(await handle.evaluate((e) => e.hasPointerCapture(globalThis.__resizePointerId!))).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Switch resize direction' }).evaluate((button) =>
    (button as HTMLButtonElement).click()
  );
  await expect(handle).toHaveAttribute('aria-orientation', 'horizontal');
  await expect.poll(() =>
    handle.evaluate((e) => e.hasPointerCapture(globalThis.__resizePointerId!))
  ).toBe(false);
  await expect.poll(() => page.evaluate(() => globalThis.__resizeObserverStats.active)).toBe(
    baseline + 1,
  );
  await page.mouse.up();
  await handle.scrollIntoViewIfNeeded();
  const moved = (await handle.boundingBox())!;
  await page.mouse.move(moved.x + moved.width / 2, moved.y + moved.height / 2);
  await page.mouse.down();
  expect(await handle.evaluate((e) => e.hasPointerCapture(globalThis.__resizePointerId!))).toBe(
    true,
  );
  const node = await handle.elementHandle();
  const pointerId = await page.evaluate(() => globalThis.__resizePointerId!);
  const frame = page.locator('#resize-lifecycle .ns-resizable');
  await frame.evaluate((element) => element.style.display = 'none');
  await expect.poll(() => node!.evaluate((element, id) => element.hasPointerCapture(id), pointerId))
    .toBe(false);
  await frame.evaluate((element) => element.style.display = '');
  await expect(handle).toBeVisible();
  await page.mouse.up();
  await handle.scrollIntoViewIfNeeded();
  const restored = (await handle.boundingBox())!;
  await page.mouse.move(restored.x + restored.width / 2, restored.y + restored.height / 2);
  await page.mouse.down();
  expect(await handle.evaluate((e) => e.hasPointerCapture(globalThis.__resizePointerId!))).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Remove resize example' }).evaluate((button) =>
    (button as HTMLButtonElement).click()
  );
  await expect(handle).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => globalThis.__resizeObserverStats.active)).toBe(
    baseline,
  );
  expect(await page.evaluate(() => globalThis.__resizeObserverStats.disconnected)).toBeGreaterThan(
    0,
  );
  await page.mouse.up();
});

test('resizable/strict-axe-and-utility-captures', async ({ page }) => {
  const result = await new AxeBuilder({ page }).include('[id^="resize-"]').analyze();
  expect(result.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious'))
    .toEqual([]);
  const grip = page.locator('#resize-horizontal [data-part="grip"] svg');
  await expect(grip).toHaveAttribute('width', '10');
  await expect(grip.locator('path')).toHaveCount(6);
  for (const id of ['resize-horizontal', 'resize-vertical', 'resize-rtl', 'resize-plain']) {
    await page.locator(`#${id}`).screenshot({ path: test.info().outputPath(`${id}.png`) });
  }
});

test('resizable/native-touch-drag @touch', async ({ page, context }) => {
  const handle = page.locator('#resize-horizontal').getByRole('separator');
  await handle.scrollIntoViewIfNeeded();
  const before = Number.parseFloat((await handle.getAttribute('aria-valuetext'))!);
  const box = (await handle.boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  const session = await context.newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: x - 30, y }],
  });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => Number.parseFloat((await handle.getAttribute('aria-valuetext'))!))
    .toBeLessThan(before - 25);
  await expect(handle).toBeFocused();
  await session.detach();
});
