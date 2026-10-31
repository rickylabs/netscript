import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  await expect(page.getByRole('heading', { name: 'Command palette components' })).toBeVisible();
  await page.getByRole('button', { name: 'Open commands', exact: true }).click();
});

test('command-palette/keyboard-selects-once', async ({ page }) => {
  const input = page.getByRole('dialog', { name: 'Command palette', exact: true }).getByRole(
    'combobox',
  );
  await input.focus();
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', /orders/);
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Command selections')).toHaveText('1');
  await expect(page.getByRole('dialog', { name: 'Command palette', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open commands', exact: true })).toBeFocused();
});

test('command-palette/query-filters-and-empty-state', async ({ page }) => {
  const dialog = page.getByRole('dialog', { name: 'Command palette', exact: true });
  const input = page.getByRole('dialog', { name: 'Command palette', exact: true }).getByRole(
    'combobox',
  );
  await input.fill('settings');
  await expect(dialog.getByRole('option')).toHaveCount(1);
  await expect(dialog.getByRole('option')).toHaveText('Workspace settings');
  await expect(dialog.locator('[data-part="empty"]')).toHaveCount(0);
  await input.fill('no matches');
  await expect(dialog.getByRole('option')).toHaveCount(0);
  await expect(dialog.locator('[data-part="empty"]')).toHaveText('No matching commands');
});

test('command-palette/pointer-and-ime-activation', async ({ page }) => {
  const dialog = page.getByRole('dialog', { name: 'Command palette', exact: true });
  const input = dialog.getByRole('combobox');
  await input.focus();
  await page.keyboard.press('ArrowDown');
  const defaultAllowed = await input.evaluate((element) =>
    element.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        isComposing: true,
        bubbles: true,
        cancelable: true,
      }),
    )
  );
  expect(defaultAllowed).toBe(true);
  await expect(page.getByLabel('Command selections')).toHaveText('0');
  await expect(page.getByLabel('Command close requests')).toHaveText('0');
  await dialog.getByRole('option', { name: 'Workspace settings', exact: true }).click();
  await expect(page.getByLabel('Command selections')).toHaveText('1');
  await expect(page.getByLabel('Command close requests')).toHaveText('1');
});

test('command-palette/keyboard-and-controlled-refusal', async ({ page }) => {
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Command close requests')).toHaveText('1');
  await page.getByRole('button', { name: 'Open fixed commands', exact: true }).click();
  const fixed = page.getByRole('dialog', { name: 'Fixed command palette', exact: true });
  const input = fixed.getByRole('combobox');
  await input.focus();
  await page.keyboard.press('ArrowDown');
  for (let n = 1; n <= 2; n++) {
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Command selections')).toHaveText(String(n));
    await expect(page.getByLabel('Fixed command requests')).toHaveText(String(n));
    await expect(fixed).toBeVisible();
    await expect(input).toBeFocused();
  }
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Fixed command requests')).toHaveText('3');
  await expect(fixed).toBeVisible();
  await expect(input).toBeFocused();
  await fixed.getByRole('button', { name: 'Fixed filter' }).focus();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('Fixed command requests')).toHaveText('4');
  await expect(fixed).toBeVisible();
  await expect(fixed.getByRole('button', { name: 'Fixed filter' })).toBeFocused();
});

test('command-palette/inline-native-order-disabled-and-arbitrary-ids', async ({ page }) => {
  await page.keyboard.press('Escape');
  const inline = page.locator('#command-inline');
  const input = inline.getByRole('combobox');
  await page.locator('#before-inline-command').focus();
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(inline.getByRole('button', { name: 'Pages only' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(inline.getByRole('link', { name: 'Command help' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after-inline-command')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(inline.getByRole('link', { name: 'Command help' })).toBeFocused();
  await input.focus();
  await page.keyboard.press('Home');
  await expect(input).toHaveAttribute('aria-activedescendant', /page%20%2F%CE%B1%231$/);
  await page.keyboard.press('ArrowDown');
  await expect(input).toHaveAttribute('aria-activedescendant', /-install$/);
  await page.keyboard.press('ArrowUp');
  await expect(input).toHaveAttribute('aria-activedescendant', /page%20%2F%CE%B1%231$/);
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Inline command selection')).toHaveText('page /α#1');
  await expect(page.getByLabel('Inline command count')).toHaveText('1');
  await expect(input).toBeFocused();
  await inline.getByRole('option', { name: 'Unavailable result', exact: true }).click({
    force: true,
  });
  await expect(page.getByLabel('Inline command count')).toHaveText('1');
  await input.focus();
  await page.keyboard.press('End');
  await expect(input).toHaveAttribute('aria-activedescendant', /-theme$/);
  await inline.getByRole('button', { name: 'Pages only' }).click();
  await expect(input).not.toHaveAttribute('aria-activedescendant');
  await input.focus();
  await inline.getByRole('option', { name: /Getting started/ }).click();
  await expect(page.getByLabel('Inline command count')).toHaveText('2');
  await expect(input).toBeFocused();
});

test('command-palette/query-loading-rtl-and-highlight-reset', async ({ page }) => {
  await page.keyboard.press('Escape');
  const inline = page.locator('#command-inline');
  const input = inline.getByRole('combobox');
  await input.fill('scaffold');
  await expect(inline.getByRole('option')).toHaveCount(1);
  await expect(inline.locator('[data-part="item-excerpt"] strong')).toHaveText('scaffold');
  await page.keyboard.press('ArrowDown');
  await input.fill('no results');
  await expect(input).not.toHaveAttribute('aria-activedescendant');
  await expect(inline.locator('[data-content="empty"]')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Inline command count')).toHaveText('0');
  await page.keyboard.press('Escape');
  await expect(input).toHaveValue('');
  await expect(inline.getByRole('option')).toHaveCount(4);
  await page.locator('html').evaluate((element) => element.setAttribute('dir', 'rtl'));
  await page.keyboard.press('Home');
  const highlighted = inline.locator('[data-highlighted="true"]');
  const before = await highlighted.evaluate((element) => {
    const style = getComputedStyle(element, '::before');
    return { right: style.right, width: style.width };
  });
  expect(before).toEqual({ right: '0px', width: '2px' });
  await page.getByRole('button', { name: 'Toggle command loading' }).click();
  await expect(inline.locator('[data-content="loading"]')).toBeVisible();
  const spinnerColor = await inline.locator('.ns-spinner').evaluate((element) =>
    getComputedStyle(element).color
  );
  await expect(inline.locator('.ns-cmdk')).toHaveCSS('color', spinnerColor);
  await expect(inline.getByRole('option')).toHaveCount(0);
  await input.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Inline command count')).toHaveText('0');
});

test('command-palette/strict-accessibility-and-local-review', async ({ page }) => {
  const { AxeBuilder } = await import('@axe-core/playwright');
  const dialog = page.getByRole('dialog', { name: 'Command palette', exact: true });
  const modal = await new AxeBuilder({ page }).include(
    '[data-scope="command-palette"][data-part="backdrop"][open]',
  ).analyze();
  expect(
    modal.violations.filter((entry) => entry.impact === 'critical' || entry.impact === 'serious'),
  ).toEqual([]);
  await dialog.screenshot({ path: test.info().outputPath('command-modal.png') });
  await page.keyboard.press('Escape');
  const inline = page.locator('#command-inline');
  for (const state of ['results', 'empty', 'loading']) {
    if (state === 'results') {
      await inline.getByRole('combobox').focus();
      await page.keyboard.press('Home');
    }
    if (state === 'empty') await inline.getByRole('combobox').fill('missing');
    if (state === 'loading') {
      await page.getByRole('button', { name: 'Toggle command loading' }).click();
    }
    const result = await new AxeBuilder({ page }).include('#command-inline').analyze();
    expect(
      result.violations.filter((entry) =>
        entry.impact === 'critical' || entry.impact === 'serious'
      ),
    ).toEqual([]);
    await inline.screenshot({ path: test.info().outputPath(`command-${state}.png`) });
  }
});

test('command-palette/literal-query-without-modern-regexp-api', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.evaluate(() => Reflect.deleteProperty(RegExp, 'escape'));
  expect(await page.evaluate(() => typeof RegExp.escape)).toBe('undefined');
  await page.keyboard.press('Escape');
  const inline = page.locator('#command-inline');
  await inline.getByRole('combobox').fill('A.B(C)');
  await expect(inline.getByRole('option')).toHaveCount(1);
  await expect(inline.locator('[data-part="item-excerpt"] strong')).toHaveText('a.b(c)');
  expect(errors).toEqual([]);
});
