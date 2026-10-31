import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  await expect(page.getByRole('heading', { name: 'Form components' })).toBeVisible();
});

test('radio-group/native-radio', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Plan', exact: true });
  const free = group.getByRole('radio', { name: 'Free', exact: true });
  const pro = group.getByRole('radio', { name: 'Pro', exact: true });
  await free.focus();
  await page.keyboard.press('ArrowRight');
  await expect(pro).toBeFocused();
  await expect(pro).toBeChecked();
  await page.keyboard.press('ArrowLeft');
  await expect(free).toBeFocused();
  await expect(free).toBeChecked();
  await pro.focus();
  await page.keyboard.press('Space');
  await expect(pro).toBeChecked();
  await expect(group.getByRole('radio', { name: 'Unavailable' })).toBeDisabled();
  await page.getByRole('button', { name: 'Submit radio' }).click();
  await expect(page.getByLabel('Submitted plan')).toHaveText('pro');
});

test('radio-group/controlled-request', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Fixed plan', exact: true });
  await group.getByRole('radio', { name: 'Free', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByLabel('Requested plan')).toHaveText('pro');
  await expect(group.getByRole('radio', { name: 'Free', exact: true })).toBeChecked();
  await expect(group.getByRole('radio', { name: 'Pro', exact: true })).not.toBeChecked();
});

test('input-group/native-control', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Site search' });
  await input.focus();
  await page.keyboard.type('native');
  await page.keyboard.press('Home');
  await page.keyboard.type('A');
  await page.keyboard.press('End');
  await page.keyboard.type('Z');
  await expect(input).toHaveValue('AnativeZ');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Run search' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Search count')).toHaveText('1');
  await page.keyboard.press('Shift+Tab');
  await expect(input).toBeFocused();
  await expect(page.getByRole('textbox', { name: 'Disabled search' })).toBeDisabled();
});

test('input-otp/native-edit-and-paste', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Verification code' });
  await input.focus();
  await page.keyboard.type('123');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Backspace');
  await expect(input).toHaveValue('13');
  await page.keyboard.press('Home');
  await page.keyboard.press('Delete');
  await expect(input).toHaveValue('3');
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.evaluate(() => navigator.clipboard.writeText('12 34-56'));
  await input.focus();
  await page.keyboard.press('Control+A');
  await page.keyboard.press('Control+V');
  await expect(input).toHaveValue('123456');
  await expect(page.locator('#otp-form [data-part="slot"]')).toHaveText([
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
  ]);
  await page.getByRole('button', { name: 'Verify code' }).click();
  await expect(page.getByLabel('Submitted code')).toHaveText('123456');
});

test('input-otp/controlled-and-disabled', async ({ page }) => {
  const input = page.getByRole('textbox', { name: 'Fixed code' });
  await input.fill('3456');
  await expect(page.getByLabel('Requested code')).toHaveText('3456');
  await expect(input).toHaveValue('12');
  await expect(page.getByRole('textbox', { name: 'Disabled code' })).toBeDisabled();
});

test('slider/native-range', async ({ page }) => {
  const slider = page.getByRole('slider', { name: 'Volume', exact: true });
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await expect(slider).toHaveValue('45');
  await page.keyboard.press('ArrowLeft');
  await expect(slider).toHaveValue('40');
  await page.keyboard.press('Home');
  await expect(slider).toHaveValue('0');
  await page.keyboard.press('End');
  await expect(slider).toHaveValue('100');
  const fixed = page.getByRole('slider', { name: 'Fixed volume', exact: true });
  await fixed.focus();
  await page.keyboard.press('ArrowRight');
  await expect(fixed).toHaveValue('40');
  await expect(page.getByRole('slider', { name: 'Disabled volume' })).toBeDisabled();
});

test('slider/two-thumb-boundaries-and-vertical', async ({ page }) => {
  const min = page.getByRole('slider', { name: 'Minimum price' }),
    max = page.getByRole('slider', { name: 'Maximum price' });
  await min.focus();
  await page.keyboard.press('End');
  await expect(min).toHaveValue('80');
  await expect(max).toHaveValue('80');
  await max.focus();
  await page.keyboard.press('Home');
  await expect(max).toHaveValue('80');
  await min.focus();
  await page.keyboard.press('Home');
  await expect(min).toHaveValue('0');
  await max.focus();
  await page.keyboard.press('End');
  await expect(max).toHaveValue('100');
  const vertical = page.getByRole('slider', { name: 'Vertical volume' });
  await vertical.focus();
  await page.keyboard.press('ArrowUp');
  await expect(vertical).toHaveValue('50');
  await expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
});

test('forms/strict-accessibility-and-local-review', async ({ page }, info) => {
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
    .toEqual([]);
  await page.locator('#forms').screenshot({ path: info.outputPath('forms-local-linux.png') });
});

test('slider/pointer-range-escapes-both-endpoints', async ({ page }) => {
  const lower = page.getByRole('slider', { name: 'Minimum price' }),
    upper = page.getByRole('slider', { name: 'Maximum price' });
  const drag = async (input: typeof lower, from: number, to: number) => {
    await input.scrollIntoViewIfNeeded();
    const geometry = await input.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;width:var(--ns-space-4);';
      element.parentElement!.append(probe);
      const thumb = probe.getBoundingClientRect().width;
      probe.remove();
      return {
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
        thumb,
      };
    });
    const x = (value: number) =>
      geometry.left + geometry.thumb / 2 + (geometry.width - geometry.thumb) * value / 100;
    const y = geometry.top + geometry.height / 2;
    await page.mouse.move(x(from), y);
    await page.mouse.down();
    await page.mouse.move(x(to), y, { steps: 20 });
    await page.mouse.up();
  };
  await drag(upper, 80, 100);
  await expect(upper).toHaveValue('100');
  await drag(lower, 20, 100);
  await expect(lower).toHaveValue('100');
  await drag(lower, 100, 50);
  expect(Number(await lower.inputValue())).toBeLessThan(100);
  await expect(upper).toHaveValue('100');
  await page.reload();
  await drag(lower, 20, 0);
  await expect(lower).toHaveValue('0');
  await drag(upper, 80, 0);
  await expect(upper).toHaveValue('0');
  await drag(upper, 0, 50);
  expect(Number(await upper.inputValue())).toBeGreaterThan(0);
  await expect(lower).toHaveValue('0');
});

test('forms/invalid-relationships', async ({ page }) => {
  const radio = page.getByRole('group', { name: 'Invalid plan' }).getByRole('radio', {
    name: 'Free',
    exact: true,
  });
  await expect(radio).toHaveAttribute('aria-invalid', 'true');
  await expect(radio).toHaveAttribute('aria-describedby', 'plan-error');
  await expect(page.getByRole('textbox', { name: 'Invalid search' })).toHaveAttribute(
    'aria-describedby',
    'search-error',
  );
  await expect(page.getByRole('textbox', { name: 'Invalid search' })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
});
