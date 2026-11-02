import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  await expect(page.getByRole('heading', { name: 'Action components' })).toBeVisible();
});

test('button-group/native-tab-order', async ({ page }) => {
  const save = page.getByRole('button', { name: 'Save', exact: true });
  await save.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(save).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Saves')).toHaveText('1');
});

test('toggle/native-press', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Bold', exact: true });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(button).toHaveAttribute('data-selected', 'true');
  await page.keyboard.press('Space');
  await expect(button).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'All', exact: true }).first()).toBeFocused();
  await expect(page.getByRole('button', { name: 'Locked', exact: true })).toBeDisabled();
});

test('toggle-group/roving-selection', async ({ page }) => {
  const toolbar = page.getByRole('toolbar', { name: 'Status', exact: true });
  const all = toolbar.getByRole('button', { name: 'All', exact: true });
  const open = toolbar.getByRole('button', { name: 'Open', exact: true });
  const closed = toolbar.getByRole('button', { name: 'Closed', exact: true });
  await all.focus();
  await page.keyboard.press('ArrowRight');
  await expect(open).toBeFocused();
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Space');
  await expect(open).toHaveAttribute('aria-pressed', 'true');
  await expect(all).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('End');
  await expect(closed).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(all).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(closed).toBeFocused();
  await page.keyboard.press('Home');
  await expect(all).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(all).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('toolbar', { name: 'Formatting' }).getByRole('button', {
      name: 'All',
      exact: true,
    }),
  ).toBeFocused();
});

test('toggle-group/multiple-vertical-and-rtl', async ({ page }, info) => {
  const multiple = page.getByRole('toolbar', { name: 'Formatting' });
  await multiple.getByRole('button', { name: 'All', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await expect(multiple.getByRole('button', { name: 'All', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(multiple.getByRole('button', { name: 'Open', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const vertical = page.getByRole('toolbar', { name: 'Vertical' });
  await vertical.getByRole('button', { name: 'All', exact: true }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(vertical.getByRole('button', { name: 'Open', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(vertical.getByRole('button', { name: 'All', exact: true })).toBeFocused();
  await page.goto(`/?dir=rtl&scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  const rtl = page.getByRole('toolbar', { name: 'Status', exact: true });
  await rtl.getByRole('button', { name: 'All', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await expect(rtl.getByRole('button', { name: 'Open', exact: true })).toBeFocused();
});

test('actions/strict-accessibility-and-local-review', async ({ page }, info) => {
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
    .toEqual([]);
  await page.screenshot({ path: info.outputPath('actions-local-linux.png'), fullPage: true });
});
