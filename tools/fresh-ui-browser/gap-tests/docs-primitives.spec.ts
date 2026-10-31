import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  await expect(page.getByRole('heading', { name: 'Docs primitive components' })).toBeVisible();
});

test('docs-label/native-association', async ({ page }) => {
  const fields = page.locator('#docs-labels');
  await page.locator('#before-doc-labels').focus();
  await page.keyboard.press('Tab');
  await expect(fields.locator('#doc-email')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(fields.locator('#doc-nickname')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(fields.getByRole('textbox', { name: 'Hidden document label' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after-doc-labels')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(fields.locator('#doc-sr-label')).toBeFocused();
  await page.locator('#doc-email-label').click();
  await expect(fields.locator('#doc-email')).toBeFocused();
  expect(
    await page.locator('#doc-email-label').evaluate((element) =>
      getComputedStyle(element, '::after').content
    ),
  ).toBe('"*"');
  const hidden = fields.locator('label[data-sr-only="true"]');
  expect(await hidden.evaluate((element) => element.getBoundingClientRect().width))
    .toBeLessThanOrEqual(1);
  await expect(hidden).not.toHaveAttribute('tabindex');
});

test('docs-card/native-child-controls', async ({ page }) => {
  await page.locator('#before-doc-card').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Pin docs card', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Read docs card', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Archive docs card', exact: true })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Docs card actions')).toHaveText('2');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('link', { name: 'Read docs card', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#read-card$/);
  const card = page.locator('#docs-card > [data-part="root"]');
  await expect(card).not.toHaveAttribute('tabindex');
  await expect(card).not.toHaveAttribute('role', 'button');
  const style = await card.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      radius: style.borderRadius,
      shadow: style.boxShadow,
      left: style.borderLeftWidth,
      top: style.borderTopWidth,
      background: style.backgroundColor,
    };
  });
  expect(style).toEqual({
    radius: '0px',
    shadow: 'none',
    left: '0px',
    top: '1px',
    background: 'rgba(0, 0, 0, 0)',
  });
  await expect(page.locator('#docs-card-default .ns-card__header')).toHaveCSS('display', 'flex');
  await expect(page.locator('#docs-card .ns-card__header')).toHaveCSS('display', 'grid');
});

test('pagination/native-links-and-disabled', async ({ page }) => {
  const pages = page.getByRole('navigation', { name: 'Order pages', exact: true });
  const one = pages.getByRole('link', { name: 'Page one', exact: true });
  const four = pages.getByRole('link', { name: 'Page four', exact: true });
  await page.locator('#before-doc-pages').focus();
  await page.keyboard.press('Tab');
  await expect(one).toBeFocused();
  await expect(one).toHaveAttribute('aria-current', 'page');
  await page.keyboard.press('Tab');
  await expect(four).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after-doc-pages')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(four).toBeFocused();
  for (const name of ['Unavailable page two', 'Unavailable page three']) {
    const disabled = pages.getByRole('link', { name, exact: true });
    await expect(disabled).not.toHaveAttribute('href');
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await disabled.click({ force: true });
  }
  await expect(page.getByLabel('Disabled page callbacks')).toHaveText('0');
  await four.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#page-four$/);
  const pager = page.getByRole('navigation', { name: 'Docs chapters', exact: true });
  const previous = pager.getByRole('link', { name: 'Previous Telemetry and logging', exact: true });
  const next = pager.getByRole('link', { name: 'Next Authentication', exact: true });
  await page.locator('#before-doc-pager').focus();
  await page.keyboard.press('Tab');
  await expect(previous).toBeFocused();
  await expect(previous).toHaveAttribute('rel', 'prev');
  await page.keyboard.press('Tab');
  await expect(next).toBeFocused();
  await expect(next).toHaveAttribute('rel', 'next');
  await page.keyboard.press('Shift+Tab');
  await expect(previous).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#previous-topic$/);
});

test('pagination/rtl-and-responsive-tiles', async ({ page }) => {
  const pager = page.getByRole('navigation', { name: 'Docs chapters', exact: true });
  const previous = pager.locator('[data-part="previous"]');
  const next = pager.locator('[data-part="next"]');
  const [left, right] = await Promise.all([previous.boundingBox(), next.boundingBox()]);
  if (page.viewportSize()!.width < 640) expect(right!.y).toBeGreaterThan(left!.y);
  else expect(right!.x).toBeGreaterThan(left!.x);
  await page.locator('html').evaluate((element) => element.setAttribute('dir', 'rtl'));
  await expect(previous.locator('[data-part="icon"]')).toHaveCSS(
    'transform',
    'matrix(-1, 0, 0, 1, 0, 0)',
  );
  await expect(previous).toHaveAttribute('href', '#previous-topic');
  await previous.focus();
  await page.keyboard.press('Tab');
  await expect(next).toBeFocused();
});

test('docs-primitives/strict-accessibility-and-local-review', async ({ page }) => {
  const result = await new AxeBuilder({ page }).include('#docs-labels').include('#docs-card')
    .include('#docs-card-default').include('#docs-pager').include('#docs-pages').analyze();
  expect(
    result.violations.filter((entry) => entry.impact === 'critical' || entry.impact === 'serious'),
  ).toEqual([]);
  for (const id of ['docs-labels', 'docs-card', 'docs-card-default', 'docs-pager', 'docs-pages']) {
    const region = page.locator(
      id === 'docs-labels' ? '#docs-label-display' : `#${id} > [data-part="root"]`,
    );
    await region.screenshot({ path: test.info().outputPath(`${id}.png`) });
  }
});
