import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  await expect(page.getByRole('heading', { name: 'Date controls' })).toBeVisible();
});

test('calendar/gregorian-grid', async ({ page }) => {
  const root = page.locator('#leap-calendar');
  const day = (iso: string) => root.locator(`button[value="${iso}"]`);
  await day('2024-02-28').focus();
  await page.keyboard.press('ArrowRight');
  await expect(day('2024-02-29')).toBeFocused();
  await expect(page.getByLabel('Selected day')).toBeEmpty();
  await page.keyboard.press('ArrowRight');
  await expect(day('2024-03-01')).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(day('2024-02-29')).toBeFocused();
  await page.keyboard.press('PageUp');
  await expect(day('2024-01-29')).toBeFocused();
  await page.keyboard.press('PageDown');
  await expect(day('2024-02-29')).toBeFocused();
  await page.keyboard.press('Shift+PageDown');
  await expect(day('2025-02-28')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(day('2025-02-23')).toBeFocused();
  await page.keyboard.press('End');
  await expect(day('2025-03-01')).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(day('2025-02-22')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Selected day')).toHaveText('2025-03-01');
  await expect(root.locator('[data-part="day"][tabindex="0"]')).toHaveCount(1);
});

test('calendar/disabled-and-controlled', async ({ page }) => {
  const root = page.locator('#bounded-calendar');
  await root.locator('button[value="2024-02-28"]').focus();
  await expect(root.locator('button[value="2024-02-29"]')).toBeDisabled();
  await page.keyboard.press('ArrowRight');
  await expect(root.locator('button[value="2024-03-01"]')).toBeFocused();
  await page.keyboard.press('End');
  await page.keyboard.press('ArrowRight');
  await expect(root.locator('button[value="2024-03-03"]')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(root.locator('button[value="2024-03-03"]')).toBeFocused();
  const fixed = page.locator('#fixed-calendar');
  await fixed.locator('button[value="2024-02-28"]').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await expect(page.getByLabel('Requested day')).toHaveText('2024-02-29');
  await expect(fixed.locator('button[value="2024-02-28"]')).toHaveAttribute(
    'data-state',
    'selected',
  );
  await expect(fixed.locator('button[value="2024-02-29"]')).not.toHaveAttribute(
    'data-state',
    'selected',
  );
});

test('calendar/range-and-native-caption', async ({ page }, info) => {
  const root = page.locator('#range-calendar');
  await root.locator('button[value="2024-03-02"]').focus();
  await page.keyboard.press('Space');
  await root.locator('button[value="2024-02-28"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Selected range')).toHaveText('2024-02-28/2024-03-02');
  await expect(root.locator('button[value="2024-02-29"]')).toHaveAttribute('data-range', 'middle');
  await expect(root.locator('button[value="2024-02-29"]').locator('..')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  const colors = await root.locator('button[value="2024-02-29"]').evaluate((middle) => {
    const probe = document.createElement('span');
    probe.style.backgroundColor = 'var(--ns-selected)';
    middle.after(probe);
    const selected = getComputedStyle(probe).backgroundColor;
    probe.remove();
    const endpoint = middle.closest('[data-part="root"]')!
      .querySelector('button[value="2024-02-28"]')!;
    return {
      middle: getComputedStyle(middle).backgroundColor,
      endpoint: getComputedStyle(endpoint).backgroundColor,
      selected,
    };
  });
  expect(colors.middle).toBe(colors.selected);
  expect(colors.middle).not.toBe(colors.endpoint);
  await expect(root.getByRole('grid').first()).toHaveAttribute('aria-multiselectable', 'true');
  await root.screenshot({ path: info.outputPath('calendar-range-local-linux.png') });
  const caption = page.locator('#dropdown-calendar');
  await caption.getByRole('combobox', { name: 'Month 1' }).selectOption('0');
  await caption.getByRole('combobox', { name: 'Year 1' }).selectOption('2025');
  await expect(caption.getByRole('grid', { name: 'January 2025' })).toBeVisible();
});

test('date-picker/modal-calendar', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Delivery: Choose a date', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Delivery', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-part="day"][tabindex="0"]')).toBeFocused();
  await dialog.getByRole('button', { name: 'Previous month' }).focus();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Next month' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Previous month' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).focus();
  await expect(dialog).toHaveJSProperty('open', true);
  expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
  await page.locator('#after-calendars').evaluate((element) => element.focus());
  await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Space');
  await dialog.locator('button[value="2024-02-28"]').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Delivery: Feb 29, 2024', exact: true }))
    .toBeFocused();
  await page.getByRole('button', { name: 'Submit date', exact: true }).click();
  await expect(page.getByLabel('Submitted date')).toHaveText('2024-02-29');
  const chosen = page.getByRole('button', { name: 'Delivery: Feb 29, 2024', exact: true });
  await chosen.click();
  await expect(dialog.locator('button[value="2024-02-29"]')).toBeFocused();
  await page.keyboard.press('PageDown');
  await expect(dialog.locator('button[value="2024-03-29"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(chosen).toBeFocused();
  await page.keyboard.press('Space');
  await expect(dialog.locator('button[value="2024-02-29"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Disabled delivery: Choose a date' }))
    .toBeDisabled();
});

test('date-picker/native-browser-chrome-boundary', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Delivery: Choose a date', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Delivery', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-part="day"][tabindex="0"]')).toBeFocused();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).focus();
  await page.keyboard.press('Tab');
  // Chromium may visit browser chrome at a native modal boundary (BODY sentinel).
  // It must never focus any inert application control outside the dialog.
  await expect(dialog).toHaveJSProperty('open', true);
  expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
  const atBoundary = await page.evaluate(() => document.activeElement === document.body);
  if (atBoundary) await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Previous month' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  if (await page.evaluate(() => document.activeElement === document.body)) {
    await page.keyboard.press('Shift+Tab');
  }
  await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
});

test('date-picker/range-and-modal-accessibility', async ({ page }, info) => {
  await page.getByRole('button', { name: 'Trip: Choose a date', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Trip', exact: true });
  await dialog.locator('button[value="2024-02-28"]').focus();
  await page.keyboard.press('Enter');
  await expect(dialog).toBeVisible();
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
    .toEqual([]);
  await dialog.screenshot({ path: info.outputPath('calendar-local-linux.png') });
  await dialog.locator('button[value="2024-03-02"]').focus();
  await page.keyboard.press('Space');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Trip: Feb 28, 2024 – Mar 2, 2024', exact: true }))
    .toBeFocused();
});

test('date-picker/controlled-refusal', async ({ page }) => {
  await page.getByRole('button', { name: 'Fixed picker: Feb 28, 2024', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Fixed picker', exact: true });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[aria-label="Requested picker open"]')).toHaveText('false');
  expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
  await dialog.locator('button[value="2024-02-28"]').focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.locator('[aria-label="Requested picker date"]')).toHaveText('2024-02-29');
  await expect(dialog.locator('button[value="2024-02-28"]')).toHaveAttribute(
    'data-state',
    'selected',
  );
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
});
