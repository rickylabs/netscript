import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  await expect(page.getByRole('heading', { name: 'Overlay components' })).toBeVisible();
});

test('alert-dialog/native-confirmation', async ({ page }, info) => {
  const trigger = page.getByRole('button', { name: 'Review deletion', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('alertdialog', { name: 'Delete project?', exact: true });
  const cancel = dialog.getByRole('button', { name: 'Cancel', exact: true }),
    action = dialog.getByRole('button', { name: 'Delete project', exact: true });
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(action).toBeFocused();
  await page.keyboard.press('Tab');
  if (await page.evaluate(() => document.activeElement === document.body)) {
    await page.keyboard.press('Tab');
  }
  await expect(dialog.getByRole('button', { name: 'Peek owner', exact: true })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  if (await page.evaluate(() => document.activeElement === document.body)) {
    await page.keyboard.press('Shift+Tab');
  }
  await expect(action).toBeFocused();
  await page.locator('#after-context').evaluate((element) => element.focus());
  await expect(action).toBeFocused();
  await page.mouse.click(2, 2);
  await expect(dialog).toBeVisible();
  await action.hover();
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
    .toEqual([]);
  await dialog.screenshot({ path: info.outputPath('alert-dialog-local-linux.png') });
  await cancel.focus();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.getByLabel('Canceled changes')).toHaveText('1');
  await page.keyboard.press('Space');
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page.getByLabel('Confirmed changes')).toHaveText('1');
});

test('alert-dialog/controlled-pending-and-nested-preview', async ({ page }) => {
  await page.getByRole('button', { name: 'Review pending change', exact: true }).click();
  const pending = page.getByRole('alertdialog', { name: 'Pending change', exact: true });
  await expect(pending.getByRole('button', { name: 'Apply pending change', exact: true }))
    .toBeDisabled();
  await pending.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(pending).not.toBeVisible();
  await page.getByRole('button', { name: 'Review deletion', exact: true }).click();
  const dialog = page.getByRole('alertdialog', { name: 'Delete project?', exact: true });
  const preview = dialog.getByRole('button', { name: 'Peek owner', exact: true });
  await preview.focus();
  await expect(page.getByRole('region', { name: 'Project owner', exact: true })).toBeVisible();
  await expect(preview).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('region', { name: 'Project owner', exact: true })).not.toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(preview).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await page.getByRole('button', { name: 'Review fixed change', exact: true }).click();
  const fixed = page.getByRole('alertdialog', { name: 'Fixed change', exact: true });
  await page.keyboard.press('Escape');
  await expect(page.locator('[aria-label="Requested alert open"]')).toHaveText('false');
  expect(await fixed.evaluate((element) => element.matches(':modal'))).toBe(true);
  await fixed.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await fixed.evaluate((element) => element.matches(':modal'))).toBe(true);
});

test('hover-card/focus-preserving-preview', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Preview NetScript', exact: true }),
    card = page.getByRole('region', { name: 'NetScript team', exact: true });
  await trigger.focus();
  await expect(card).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(card.getByRole('link', { name: 'View team' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(card).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Space');
  await expect(card).toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(card).not.toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after-hover')).toBeFocused();
});

test('hover-card/pointer-transfer-and-visual', async ({ page }, info) => {
  const trigger = page.getByRole('button', { name: 'Preview NetScript', exact: true }),
    card = page.getByRole('region', { name: 'NetScript team', exact: true });
  await trigger.hover();
  await expect(card).toBeVisible();
  await card.hover();
  await card.screenshot({ path: info.outputPath('hover-card-local-linux.png') });
  await card.getByRole('link', { name: 'View team' }).click();
  await expect(page).toHaveURL(/#team$/);
  await expect(card).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after-hover')).toBeFocused();
  await expect(card).not.toBeVisible();
});

test('hover-card/touch-disclosure @touch', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Preview NetScript', exact: true });
  const card = page.getByRole('region', { name: 'NetScript team', exact: true });
  await trigger.tap();
  await expect(card).toBeVisible();
  // Touch activation remains open beyond the pointer-transfer grace interval.
  await page.waitForTimeout(250);
  await expect(card).toBeVisible();
  await card.getByRole('link', { name: 'View team' }).tap();
  await expect(page).toHaveURL(/#team$/);
  await expect(card).toBeVisible();
  await trigger.tap();
  await expect(card).not.toBeVisible();
});

test('hover-card/mouse-click-after-hover-closes', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Preview NetScript', exact: true });
  const card = page.getByRole('region', { name: 'NetScript team', exact: true });
  await trigger.hover();
  await expect(card).toBeVisible();
  await trigger.click();
  await expect(card).not.toBeVisible();
  await trigger.click();
  await expect(card).toBeVisible();
});

test('context-menu/native-context-region', async ({ page }, info) => {
  const region = page.getByRole('group', { name: 'Order context', exact: true }),
    menu = page.getByRole('menu', { name: 'Order context', exact: true });
  await region.click();
  await expect(menu).not.toBeVisible();
  await page.keyboard.press('Shift+F10');
  await expect(menu.getByRole('menuitem', { name: 'Open order', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: 'Copy ID', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const bookmarks = menu.getByRole('menuitemcheckbox', { name: 'Show bookmarks', exact: true });
  await expect(bookmarks).toBeFocused();
  await page.keyboard.press('Space');
  await expect(bookmarks).not.toBeChecked();
  await page.keyboard.press('Home');
  await expect(menu.getByRole('menuitem', { name: 'Open order', exact: true })).toBeFocused();
  await page.keyboard.press('End');
  await expect(menu.getByRole('menuitem', { name: 'More tools', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  const sub = page.getByRole('menu', { name: 'More tools', exact: true });
  await expect(sub.getByRole('menuitem', { name: 'Inspect order', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sub).not.toBeVisible();
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).not.toBeVisible();
  await expect(region).toBeFocused();
  await page.keyboard.press('ContextMenu');
  await expect(menu).toBeVisible();
  await menu.getByRole('menuitem', { name: 'Copy ID', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(menu).not.toBeVisible();
  await expect(region).toBeFocused();
  await expect(page.getByLabel('Context action')).toHaveText('copy');
  await page.keyboard.press('Shift+F10');
  await expect(menu).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after-context')).toBeFocused();
  await expect(menu).not.toBeVisible();
  await region.click({ button: 'right', position: { x: 10, y: 10 } });
  await expect(menu).toBeVisible();
  const bounds = await menu.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
    .toEqual([]);
  await menu.screenshot({ path: info.outputPath('context-menu-local-linux.png') });
  await page.locator('#after-context').click();
  await expect(page.locator('#after-context')).toBeFocused();
  await expect(menu).not.toBeVisible();
});

test('context-menu/destructive-text-role-and-activation', async ({ page }) => {
  const region = page.getByRole('group', { name: 'Order context', exact: true });
  await region.focus();
  await page.keyboard.press('Shift+F10');
  const menu = page.getByRole('menu', { name: 'Order context', exact: true });
  const action = menu.getByRole('menuitem', { name: 'Delete order', exact: true });
  expect(
    await action.evaluate((element) => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--ns-destructive-text)';
      element.append(probe);
      const expected = getComputedStyle(probe).color;
      probe.remove();
      return getComputedStyle(element).color === expected;
    }),
  ).toBe(true);
  const result = await new AxeBuilder({ page }).include(
    '[data-scope="context-menu"][data-part="content"]',
  ).analyze();
  expect(
    result.violations.filter((entry) => entry.impact === 'critical' || entry.impact === 'serious'),
  ).toEqual([]);
  await menu.screenshot({ path: test.info().outputPath('destructive-menu.png') });
  await action.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Context action')).toHaveText('delete');
  await expect(menu).not.toBeVisible();
  await expect(region).toBeFocused();
});
