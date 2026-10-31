import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  await expect(page.getByRole('heading', { name: 'Native layout examples' })).toBeVisible();
});

test('scroll-area/native-keyboard-scroll', async ({ page }) => {
  const section = page.locator('#native-scroll-vertical');
  const viewport = section.getByRole('region', { name: 'vertical activity' });
  await section.locator('.before-scroll').focus();
  await page.keyboard.press('Tab');
  await expect(viewport).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect.poll(() => viewport.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
  await page.keyboard.press('PageDown');
  await expect.poll(() => viewport.evaluate((e) => e.scrollTop)).toBeGreaterThan(100);
  await page.keyboard.press('End');
  await expect.poll(() =>
    viewport.evaluate((e) => Math.abs(e.scrollHeight - e.clientHeight - e.scrollTop))
  ).toBeLessThan(2);
  await page.keyboard.press('Home');
  await expect.poll(() => viewport.evaluate((e) => e.scrollTop)).toBe(0);
  await page.keyboard.press('Tab');
  await expect(section.getByRole('link')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(section.locator('.after-scroll')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(section.getByRole('link')).toBeFocused();
  const horizontal = page.locator('#native-scroll-horizontal').getByRole('region');
  await horizontal.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => horizontal.evaluate((e) => e.scrollLeft)).toBeGreaterThan(0);
  await expect(horizontal).toHaveJSProperty('scrollTop', 0);
  const rtl = page.locator('#native-scroll-rtl').getByRole('region');
  await rtl.focus();
  await page.keyboard.press('ArrowLeft');
  await expect.poll(() => rtl.evaluate((e) => e.scrollLeft)).toBeLessThan(0);
  const both = page.locator('#native-scroll-both').getByRole('region');
  await both.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => both.evaluate((e) => e.scrollTop)).toBeGreaterThan(0);
  await expect.poll(() => both.evaluate((e) => e.scrollLeft)).toBeGreaterThan(0);
});

test('aspect-ratio/native-child-focus', async ({ page }) => {
  for (
    const [ratio, numeric] of [['16:9', 16 / 9], ['4:3', 4 / 3], ['1:1', 1], [
      '21:9',
      21 / 9,
    ]] as const
  ) {
    const frame = page.locator(`#native-ratios [data-ratio="${ratio}"]`);
    const box = (await frame.boundingBox())!;
    expect(Math.abs(box.width / box.height - numeric)).toBeLessThan(0.01);
    const paint = await frame.evaluate((element) => {
      const probe = document.createElement('div');
      probe.style.backgroundColor = 'var(--ns-muted)';
      element.append(probe);
      const expected = getComputedStyle(probe).backgroundColor;
      const actual = getComputedStyle(element).backgroundColor;
      probe.remove();
      return { expected, actual };
    });
    expect(paint.actual).toBe(paint.expected);
    expect(paint.actual).not.toBe('rgba(0, 0, 0, 0)');
    await frame.locator('..').locator('.before-ratio').focus();
    await page.keyboard.press('Tab');
    await expect(frame.getByRole('button')).toBeFocused();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await expect(frame.locator('..').locator('.after-ratio')).toBeFocused();
    await page.keyboard.press('Shift+Tab');
    await expect(frame.getByRole('button')).toBeFocused();
    await expect(frame).not.toHaveAttribute('tabindex');
  }
  await expect(page.getByLabel('Media plays')).toHaveText('4');
});

test('direction/local-rtl-keyboard', async ({ page }) => {
  const rtl = page.getByRole('toolbar', { name: 'Local RTL choices' });
  const ltr = page.getByRole('toolbar', { name: 'Nested LTR choices' });
  await rtl.getByRole('button', { name: 'First' }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(rtl.getByRole('button', { name: 'Second' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(rtl.getByRole('button', { name: 'First' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(ltr.getByRole('button', { name: 'First' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(ltr.getByRole('button', { name: 'Second' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('textbox', { name: 'Local RTL search' })).toBeFocused();
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  expect(await rtl.evaluate((e) => getComputedStyle(e).direction)).toBe('rtl');
  expect(await ltr.evaluate((e) => getComputedStyle(e).direction)).toBe('ltr');
  await expect(page.locator('#native-direction > .direction-boundary')).toHaveAttribute(
    'data-dir',
    'rtl',
  );
});

test('native-layout/strict-accessibility-and-utility-review', async ({ page }) => {
  const result = await new AxeBuilder({ page }).include('[id^="native-"]').analyze();
  expect(result.violations.filter((e) => e.impact === 'serious' || e.impact === 'critical'))
    .toEqual([]);
  for (
    const id of [
      'native-scroll-vertical',
      'native-scroll-horizontal',
      'native-scroll-both',
      'native-ratios',
      'native-direction',
    ]
  ) {
    await page.locator(`#${id}`).screenshot({ path: test.info().outputPath(`${id}.png`) });
  }
});
