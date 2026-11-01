import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  await expect(page.getByRole('heading', { name: 'Alert components' })).toBeVisible();
});

test('alert/native-actions-and-dismissal', async ({ page }) => {
  const alert = page.locator('#alert-dismiss > .ns-alert');
  await page.locator('#before-alert').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Review alert', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Alert actions')).toHaveText('1');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Dismiss review', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'Review alert', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await expect(alert).toHaveAttribute('data-state', 'closed');
  await expect(alert).toBeHidden();
  await expect(page.getByLabel('Alert requests')).toHaveText('1');
  await expect(page.getByRole('button', { name: 'Dismiss review', exact: true })).toHaveCount(0);
  await page.keyboard.press('Tab');
  await expect(page.locator('#after-alert')).toBeFocused();
  await page.locator('#before-alert').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after-alert')).toBeFocused();
});

test('alert/controlled-refusal-reopening-and-native-hidden', async ({ page }) => {
  const banner = page.locator('#alert-controlled > .ns-alert');
  const dismiss = page.getByRole('button', { name: 'Dismiss controlled', exact: true });
  await dismiss.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Alert requests')).toHaveText('1');
  await expect(banner).toBeVisible();
  await expect(dismiss).toBeFocused();
  await page.getByRole('button', { name: 'Toggle controlled notice', exact: true }).click();
  await expect(banner).toBeHidden();
  await expect(dismiss).toHaveCount(0);
  await page.getByRole('button', { name: 'Toggle controlled notice', exact: true }).click();
  await expect(banner).toBeVisible();
  await expect(page.getByRole('button', { name: 'Toggle controlled notice', exact: true }))
    .toBeFocused();
  await expect(page.locator('#alert-hidden > .ns-alert')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Hidden action', exact: true })).toHaveCount(0);
});

test('alert/semantic-tones-logical-rule-and-decorative-glyphs', async ({ page }) => {
  const tones = page.locator('#alert-variants > .ns-alert');
  await expect(tones).toHaveCount(12);
  for (const banner of await tones.all()) {
    const variant = await banner.getAttribute('data-variant');
    await expect(banner).toHaveAttribute(
      'role',
      ['warning', 'destructive'].includes(variant!) ? 'alert' : 'status',
    );
    await expect(banner.locator('[data-part="title"]')).toHaveText(
      ({
        neutral: 'Note',
        info: 'Info',
        success: 'Success',
        warning: 'Warning',
        destructive: 'Error',
        important: 'Important',
      } as Record<string, string>)[variant!],
    );
    const colours = await banner.evaluate((element) => {
      const root = getComputedStyle(element);
      const title = getComputedStyle(element.querySelector('.ns-alert__title')!);
      const body = getComputedStyle(element.querySelector('.ns-alert__description')!);
      return {
        tone: root.getPropertyValue('--ns-alert-text'),
        root: root.color,
        title: title.color,
        body: body.color,
        fill: root.backgroundColor,
        icon: getComputedStyle(element.querySelector('.ns-alert__icon')!).backgroundColor,
      };
    });
    // The label carries the semantic tone; body copy retains normal reading ink.
    expect(colours.title).not.toBe('rgba(0, 0, 0, 0)');
    expect(colours.body).toBe(colours.root);
    expect(colours.fill).not.toBe('rgba(0, 0, 0, 0)');
    expect(colours.icon).toBe('rgba(0, 0, 0, 0)');
    await expect(banner.locator('.ns-alert__icon')).toHaveAttribute('aria-hidden', 'true');
    await expect(banner.locator('.ns-alert__icon')).toHaveCSS('color', colours.title);
    await expect(banner).toHaveCSS(
      'gap',
      await banner.evaluate((element) =>
        getComputedStyle(element).getPropertyValue('--ns-control-gap').trim()
      ),
    );
    if (await banner.getAttribute('data-emphasis') === 'strong') {
      await expect(banner).toHaveCSS('border-top-width', '0px');
    }
  }
  const localized = page.locator('#alert-localized [data-part="title"]');
  await expect(localized).toHaveText('Hinweis');
  expect(await localized.evaluate((element) => element.getBoundingClientRect().width))
    .toBeLessThanOrEqual(1);
  expect(await page.locator('#alert-localized').ariaSnapshot()).toContain('Hinweis');
  const important = tones.filter({
    has: page.locator('[data-part="title"]', { hasText: 'Important' }),
  }).last();
  await expect(important.locator('.ns-alert__icon > svg')).toHaveCount(1);
  expect(await important.locator('.ns-alert__icon path').count()).toBe(2);
  expect(await important.evaluate((element) => getComputedStyle(element, '::before').width)).toBe(
    '2px',
  );
  await page.locator('html').evaluate((element) => element.setAttribute('dir', 'rtl'));
  const rule = await important.evaluate((element) => {
    const css = getComputedStyle(element, '::before');
    return { right: css.right, left: css.left };
  });
  expect(rule.right).toBe('0px');
  expect(rule.left).not.toBe('0px');
});

test('alert/strict-accessibility-and-local-review', async ({ page }) => {
  const result = await new AxeBuilder({ page }).include('#alert-variants').include('#alert-dismiss')
    .include('#alert-controlled').include('#alert-hidden').include('#alert-localized').analyze();
  expect(
    result.violations.filter((entry) => entry.impact === 'critical' || entry.impact === 'serious'),
  ).toEqual([]);
  await page.locator('#alert-variants').screenshot({
    path: test.info().outputPath('alert-tones.png'),
  });
});
