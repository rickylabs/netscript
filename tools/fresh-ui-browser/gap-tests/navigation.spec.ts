import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

test.beforeEach(async ({ page }, info) => {
  await page.goto(`/?scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  await expect(page.getByRole('heading', { name: 'Navigation components' })).toBeVisible();
});

test('navigation-menu/native-disclosure', async ({ page }) => {
  const nav = page.getByRole('navigation', { name: 'Site' });
  const learn = nav.locator('summary').filter({ hasText: 'Learn' }),
    concepts = nav.locator('summary').filter({ hasText: 'Concepts' });
  await expect(nav.getByRole('link', { name: 'Build' })).toHaveAttribute('aria-current', 'page');
  await learn.focus();
  await page.keyboard.press('Enter');
  await expect(nav.getByRole('link', { name: 'Tutorials Build step by step' })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(nav.getByRole('link', { name: 'Tutorials Build step by step' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(learn).toBeFocused();
  await expect(nav.locator('details[open]')).toHaveCount(0);
  await page.keyboard.press('Space');
  await concepts.click();
  await expect(nav.locator('details[open]')).toHaveCount(1);
  await expect(nav.getByRole('link', { name: 'Runtime Learn the model' })).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await expect(page.locator('#before-menubar')).toBeFocused();
  await expect(nav.locator('details[open]')).toHaveCount(0);
});

test('menubar/application-menus', async ({ page }) => {
  const bar = page.getByRole('menubar', { name: 'Application' });
  const file = bar.getByRole('menuitem', { name: 'File', exact: true }),
    view = bar.getByRole('menuitem', { name: 'View', exact: true });
  await file.focus();
  await page.keyboard.press('ArrowRight');
  await expect(view).toBeFocused();
  await page.keyboard.press('Home');
  await expect(file).toBeFocused();
  await page.keyboard.press('End');
  await expect(view).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(file).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const menu = page.getByRole('menu', { name: 'File', exact: true });
  await expect(menu.getByRole('menuitem', { name: 'New tab', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(menu.getByRole('menuitem', { name: 'Share', exact: true })).toBeFocused();
  await page.keyboard.press('End');
  await expect(menu.getByRole('menuitem', { name: 'Print', exact: true })).toBeFocused();
  await page.keyboard.press('Home');
  await expect(menu.getByRole('menuitem', { name: 'New tab', exact: true })).toBeFocused();
  await page.keyboard.press('p');
  await expect(menu.getByRole('menuitem', { name: 'Print', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Menu action')).toHaveText('print');
  await expect(file).toBeFocused();
  await expect(menu).not.toBeVisible();
  await page.keyboard.press('ArrowUp');
  await expect(menu.getByRole('menuitem', { name: 'Print', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  const choices = page.getByRole('menu', { name: 'View', exact: true });
  const sidebar = choices.getByRole('menuitemcheckbox', { name: 'Show sidebar', exact: true });
  await expect(sidebar).toBeFocused();
  await expect(sidebar).toBeChecked();
  await page.keyboard.press('Space');
  await expect(sidebar).not.toBeChecked();
  await page.keyboard.press('ArrowDown');
  await expect(choices.getByRole('menuitemradio', { name: 'Compact', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Space');
  await expect(choices.getByRole('menuitemradio', { name: 'Comfortable', exact: true }))
    .toBeChecked();
  await expect(choices.getByRole('menuitemradio', { name: 'Compact', exact: true })).not
    .toBeChecked();
  await page.keyboard.press('Escape');
  await expect(view).toBeFocused();
  await expect(choices).not.toBeVisible();
});

test('navigation-menu/escape-boundary', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'Mobile navigation', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Mobile navigation', exact: true });
  const nav = dialog.getByRole('navigation', { name: 'Mobile site' });
  await nav.getByRole('link', { name: 'Mobile build', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  const summary = nav.locator('summary').filter({ hasText: 'Mobile learn' });
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(nav.getByRole('link', { name: 'Mobile guide', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await nav.getByRole('link', { name: 'Mobile guide', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await expect(summary).toBeFocused();
  await expect(nav.locator('details[open]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test('menubar/submenu-and-tab-exit', async ({ page }) => {
  const bar = page.getByRole('menubar', { name: 'Application' }),
    file = bar.getByRole('menuitem', { name: 'File', exact: true });
  await file.focus();
  await page.keyboard.press('Enter');
  const menu = page.getByRole('menu', { name: 'File', exact: true });
  await menu.getByRole('menuitem', { name: 'Share', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  const sub = page.getByRole('menu', { name: 'Share', exact: true });
  await expect(sub.getByRole('menuitem', { name: 'Email', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sub).not.toBeVisible();
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'Share', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowLeft');
  await expect(sub).not.toBeVisible();
  await expect(menu).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(sub.getByRole('menuitem', { name: 'Email', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Menu action')).toHaveText('email');
  await expect(menu).not.toBeVisible();
  await expect(file).toBeFocused();
  await page.keyboard.press('Space');
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('menuitem', { name: 'New tab', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await page.keyboard.press('ArrowUp');
  await expect(menu.getByRole('menuitem', { name: 'Print', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#after-menubar')).toBeFocused();
  await expect(menu).not.toBeVisible();
  await page.keyboard.press('Shift+Tab');
  await expect(file).toBeFocused();
});

test('menubar/rtl-and-outside-focus', async ({ page }, info) => {
  await page.goto(`/?dir=rtl&scheme=${info.project.name.startsWith('dark') ? 'dark' : 'light'}`);
  const bar = page.getByRole('menubar', { name: 'Application' });
  const file = bar.getByRole('menuitem', { name: 'File', exact: true }),
    view = bar.getByRole('menuitem', { name: 'View', exact: true });
  await file.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(view).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(file).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menu', { name: 'File', exact: true })).toBeVisible();
  await page.locator('#after-menubar').click();
  await expect(page.locator('#after-menubar')).toBeFocused();
  await expect(page.getByRole('menu', { name: 'File', exact: true })).not.toBeVisible();
  await page.getByRole('button', { name: 'Independent actions', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: 'Inspect', exact: true })).toBeFocused();
  await page.locator('#outside-menu').click();
  await expect(page.locator('#outside-menu')).toBeFocused();
  await expect(page.getByRole('menu', { name: 'Independent actions', exact: true })).not
    .toBeVisible();
});

test('location-marker/decorative-tab-skip and stepper/native-step-links', async ({ page }) => {
  await page.getByRole('button', { name: 'Before marker', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'After marker', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#steps').getByRole('link', { name: 'Account' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#account$/);
  await page.keyboard.press('Tab');
  await expect(page.locator('#steps').getByRole('link', { name: 'Shipping' })).toBeFocused();
  await expect(page.locator('#steps [aria-current="step"]')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(page.locator('#after-steps')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#steps').getByRole('link', { name: 'Shipping' })).toBeFocused();
});

test('navigation/strict-accessibility-and-local-review', async ({ page }, info) => {
  await page.getByRole('menubar', { name: 'Application' }).getByRole('menuitem', {
    name: 'View',
    exact: true,
  }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitemcheckbox', { name: 'Show sidebar' })).toBeFocused();
  const popup = page.getByRole('menu', { name: 'View', exact: true });
  await popup.screenshot({ path: info.outputPath('menubar-open-local-linux.png') });
  const result = await new AxeBuilder({ page }).analyze();
  expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
    .toEqual([]);
  await page.locator('#navigation').screenshot({
    path: info.outputPath('navigation-local-linux.png'),
  });
});
