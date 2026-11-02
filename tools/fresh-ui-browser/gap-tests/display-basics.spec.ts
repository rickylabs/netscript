import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  await expect(page.getByRole('heading', { name: 'Data display basics' })).toBeVisible();
});

test('item/native-child-controls', async ({ page }) => {
  const link = page.getByRole('link', { name: 'Order42', exact: true });
  await link.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Review order', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Order reviews')).toHaveText('2');
  await page.keyboard.press('Shift+Tab');
  await expect(link).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#order-42$/);
  await expect(page.locator('[data-scope="item"][data-part="root"]').first()).not.toHaveAttribute(
    'tabindex',
  );
});

test('kbd/noninteractive-notation', async ({ page }) => {
  await page.locator('#before-kbd').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after-kbd')).toBeFocused();
  await expect(page.locator('#display-kbd kbd')).toHaveCount(5);
  await expect(page.locator('#display-kbd [aria-hidden="true"]')).toHaveText('+');
  await expect(page.locator('#unseparated-keys [aria-hidden]')).toHaveCount(0);
});

test('collapsible/native-disclosure', async ({ page }) => {
  const summary = page.getByText('Repository details', { exact: true }).locator('..');
  const details = summary.locator('..');
  const link = page.getByRole('link', { name: 'Open repository', exact: true });
  await summary.focus();
  await expect(link).not.toBeVisible();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open');
  await expect(details).toHaveAttribute('data-open', 'true');
  await page.keyboard.press('Tab');
  await expect(link).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Space');
  await expect(link).not.toBeVisible();
  await page.keyboard.press('Tab');
  const controlled = page.getByText('Controlled details', { exact: true }).locator('..');
  await expect(controlled).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Disclosure requests')).toHaveText('1');
  await expect(controlled.locator('..')).not.toHaveAttribute('open');
  await page.getByRole('button', { name: 'Set disclosure externally' }).click();
  await expect(controlled.locator('..')).toHaveAttribute('open');
  await controlled.focus();
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Disclosure requests')).toHaveText('2');
  await expect(controlled.locator('..')).toHaveAttribute('open');
  const disabled = page.getByText('Unavailable details', { exact: true }).locator('..');
  await disabled.click();
  await expect(disabled).toHaveAttribute('aria-disabled', 'true');
  await expect(disabled.locator('..')).not.toHaveAttribute('open');
  await details.evaluate((element) => {
    if (element instanceof HTMLDetailsElement) element.open = true;
  });
  await expect(details).toHaveAttribute('data-open', 'true');
  await controlled.locator('..').evaluate((element) => {
    if (element instanceof HTMLDetailsElement) element.open = false;
  });
  await expect(page.getByLabel('Disclosure requests')).toHaveText('3');
  await expect(controlled.locator('..')).toHaveAttribute('open');
  await disabled.locator('..').evaluate((element) => {
    if (element instanceof HTMLDetailsElement) element.open = true;
  });
  await expect(disabled.locator('..')).not.toHaveAttribute('open');
});

test('display-basics/strict-accessibility-and-local-review', async ({ page }, info) => {
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
    .toEqual([]);
  await page.locator('#display-item').screenshot({ path: info.outputPath('item-local-linux.png') });
  await page.locator('#display-kbd').screenshot({ path: info.outputPath('kbd-local-linux.png') });
  await page.getByText('Repository details', { exact: true }).click();
  await page.locator('#display-disclosure').screenshot({
    path: info.outputPath('collapsible-local-linux.png'),
  });
});
