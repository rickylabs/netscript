import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  await expect(page.getByRole('heading', { name: 'Page header examples' })).toBeVisible();
});

test('page-header/native-child-controls', async ({ page }) => {
  const section = page.locator('#page-header-default');
  await section.locator('[data-before-header]').focus();
  await page.keyboard.press('Tab');
  await expect(section.getByRole('link', { name: 'Workspace' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#workspace$/);
  await page.keyboard.press('Tab');
  await expect(section.getByRole('button', { name: 'Export', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(section.getByRole('button', { name: 'Create order', exact: true })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Page header actions')).toHaveText('2');
  await page.keyboard.press('Tab');
  await expect(section.locator('[data-after-header]')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(section.getByRole('button', { name: 'Create order', exact: true })).toBeFocused();
  await expect(section.locator('[data-scope="page-header"][data-part="root"]')).not.toHaveAttribute(
    'tabindex',
  );
});

test('page-header/child-tabs-keep-keyboard-and-rtl', async ({ page }) => {
  const section = page.locator('#page-header-with-tabs');
  const overview = section.getByRole('tab', { name: 'Overview', exact: true });
  const orders = section.getByRole('tab', { name: 'Orders', exact: true });
  await overview.focus();
  await page.keyboard.press('ArrowRight');
  await expect(orders).toBeFocused();
  await expect(orders).toHaveAttribute('aria-selected', 'true');
  await expect(section.getByRole('tabpanel', { name: 'Orders', exact: true })).toBeVisible();
  await page.keyboard.press('Home');
  await expect(overview).toBeFocused();
  await page.locator('html').evaluate((element) => element.setAttribute('dir', 'rtl'));
  await page.keyboard.press('ArrowLeft');
  await expect(orders).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(section.getByRole('tabpanel', { name: 'Orders', exact: true })).toBeFocused();
});

test('page-header/responsive-heading-and-optional-slots', async ({ page }) => {
  const header = page.locator('#page-header-default .ns-page-header');
  const title = header.getByRole('heading', { name: 'Overview', exact: true });
  await expect(title).toHaveCSS('font-size', '48px');
  await expect(title).toHaveCSS('line-height', '52px');
  const intro = await header.locator('[data-part="intro"]').boundingBox();
  const actions = await header.locator('[data-part="actions"]').boundingBox();
  if (page.viewportSize()!.width < 640) {
    expect(actions!.y).toBeGreaterThanOrEqual(intro!.y + intro!.height);
  } else expect(actions!.x).toBeGreaterThan(intro!.x);
  await expect(page.locator('#page-header-title-only [data-part="title"]')).toHaveText('Settings');
  await expect(page.locator('#page-header-title-only [data-part="actions"]')).toHaveCount(0);
  await expect(page.locator('#page-header-title-only [data-part="status-bar"]')).toHaveCount(0);
  await expect(page.locator('#page-header-composed h1')).toHaveCount(1);
  await page.getByRole('button', { name: 'Save custom header' }).click();
  await expect(page.getByLabel('Page header actions')).toHaveText('1');
  expect(await header.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
});

test('page-header/strict-accessibility-and-local-review', async ({ page }) => {
  const result = await new AxeBuilder({ page }).include('[id^="page-header-"]').analyze();
  expect(
    result.violations.filter((entry) => entry.impact === 'critical' || entry.impact === 'serious'),
  ).toEqual([]);
  for (const variant of ['default', 'with-tabs', 'with-status', 'title-only', 'composed']) {
    await page.locator(`#page-header-${variant} .ns-page-header`).screenshot({
      path: test.info().outputPath(`page-header-${variant}.png`),
    });
  }
});
