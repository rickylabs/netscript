import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  await expect(page.getByRole('heading', { name: 'Prose components' })).toBeVisible();
});

test('prose/native-links-and-host-anchors', async ({ page }) => {
  const prose = page.locator('#prose-installed');
  const links = prose.getByRole('link');
  await expect(links).toHaveCount(2);
  await page.locator('#before-prose').focus();
  await page.keyboard.press('Tab');
  await expect(links.nth(0)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(links.nth(1)).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(links.nth(0)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#prose-target$/);
  await page.locator('#after-prose').focus();
  await page.keyboard.press('Tab');
  const anchor = page.getByRole('link', { name: 'Link to host heading', exact: true });
  await expect(anchor).toBeFocused();
  await expect(anchor).toHaveCSS('opacity', '1');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#prose-target$/);
});

test('prose/installed-native-type-markers-code-and-sanitization', async ({ page }) => {
  const prose = page.locator('#prose-installed .ns-markdown');
  await expect(prose.locator('h1')).toHaveText('Webhooks');
  await expect(prose.locator('h2')).toHaveCSS('font-size', '26px');
  await expect(prose.locator('h2')).toHaveCSS('line-height', '34px');
  await expect(prose.locator('h2')).toHaveCSS('margin-block-start', '56px');
  await expect(prose.locator('h3')).toHaveCSS('font-size', '19px');
  await expect(prose.locator('h4')).toHaveCSS('font-size', '16px');
  await expect(prose.locator('p').first()).toHaveCSS('font-size', '19px');
  await expect(prose.locator('p').first()).toHaveCSS('line-height', '30px');
  await expect(prose.locator('p').nth(1)).toHaveCSS('font-size', '16px');
  await expect(prose.locator('p').nth(1)).toHaveCSS('line-height', '26px');
  await expect(prose.locator('ul')).toHaveCSS('list-style-type', 'square');
  await expect(prose.locator('ol')).toHaveCSS('list-style-type', 'decimal');
  expect(
    await prose.locator('ul > li').first().evaluate((element) =>
      getComputedStyle(element, '::marker').fontSize
    ),
  ).toBe('12px');
  const chip = prose.locator('p > code').first();
  await expect(chip).toHaveCSS('font-size', '13px');
  await expect(chip).toHaveCSS('border-top-width', '0px');
  expect(await chip.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
    'rgba(0, 0, 0, 0)',
  );
  await expect(prose.locator('pre .hljs-keyword')).not.toHaveCount(0);
  await expect(prose.locator('table')).toHaveCount(1);
  await expect(prose.locator('script, [onerror]')).toHaveCount(0);
  await expect(page.locator('#prose-host kbd')).toHaveCount(2);
  await expect(page.locator('#prose-host kbd').first()).toHaveCSS('height', '20px');
  expect((await prose.boundingBox())!.width).toBeLessThanOrEqual(720);
  const measure = await prose.locator('p').nth(1).boundingBox();
  expect(measure!.width).toBeLessThanOrEqual(544);
});

test('prose/rtl-native-layout-and-hover-anchor', async ({ page }) => {
  await page.locator('html').evaluate((element) => element.setAttribute('dir', 'rtl'));
  const quote = page.locator('#prose-installed blockquote');
  await expect(quote).toHaveCSS('border-right-width', '2px');
  await expect(quote).toHaveCSS('border-left-width', '0px');
  await expect(quote).toHaveCSS('padding-right', '16px');
  const heading = page.locator('#prose-target');
  const anchor = heading.getByRole('link');
  await expect(anchor).toHaveCSS('opacity', '0');
  await heading.hover();
  await expect(anchor).toHaveCSS('opacity', '1');
  expect(
    await page.locator('#prose-installed ul').evaluate((element) =>
      getComputedStyle(element).paddingRight
    ),
  ).toBe('20px');
});

test('prose/strict-accessibility-and-local-review', async ({ page }) => {
  const result = await new AxeBuilder({ page }).include('#prose-installed').include('#prose-host')
    .analyze();
  expect(
    result.violations.filter((entry) => entry.impact === 'critical' || entry.impact === 'serious'),
  ).toEqual([]);
  await page.locator('#prose-installed').screenshot({
    path: test.info().outputPath('prose-installed.png'),
  });
  await page.locator('#prose-host').screenshot({ path: test.info().outputPath('prose-host.png') });
});
