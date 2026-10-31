import { expect, test } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

for (const kind of ['dialog', 'sheet'] as const) {
  test.describe(`${kind} ownership`, () => {
    test.beforeEach(async ({ page }, info) => {
      const area = page.locator(`#${kind}-ownership`);
      await page.goto(`/?scheme=${info.project.name.includes('dark') ? 'dark' : 'light'}`);
      await expect(
        area.getByRole('heading', {
          name: `${kind === 'dialog' ? 'Dialog' : 'Sheet'} ownership examples`,
        }),
      ).toBeVisible();
    });

    test(`${kind}/controlled-Escape-refusal-and-acceptance`, async ({ page }) => {
      const area = page.locator(`#${kind}-ownership`);
      const trigger = area.getByRole('button', { name: 'Open controlled navigation', exact: true });
      await trigger.focus();
      await page.keyboard.press('Enter');
      const dialog = area.getByRole('dialog', { name: 'Controlled navigation sample' });
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(area.getByLabel('Requested navigation dialog state')).toHaveText('false');
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
      await expect(dialog.getByRole('button', { name: 'Allow navigation close' })).toBeFocused();
      await dialog.getByRole('button', { name: 'Close controlled navigation' }).click();
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Allow navigation close' }).click();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(trigger).toBeFocused();
      await expect(area.getByLabel('Accepted navigation close reasons')).toHaveText(
        '["trigger","escape-key","close-button","escape-key","native-close"]',
      );
    });

    test(`${kind}/uncontrolled-and-disabled-Escape-controls`, async ({ page }) => {
      const area = page.locator(`#${kind}-ownership`);
      const ordinary = area.getByRole('button', {
        name: 'Open uncontrolled navigation',
        exact: true,
      });
      await ordinary.focus();
      await page.keyboard.press('Space');
      const dialog = area.getByRole('dialog', { name: 'Uncontrolled navigation sample' });
      await expect(dialog.getByRole('link', { name: 'Destination' })).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(dialog).not.toBeVisible();
      await expect(ordinary).toBeFocused();
      const locked = area.getByRole('button', {
        name: 'Open Escape-disabled navigation',
        exact: true,
      });
      await locked.click();
      const fixed = area.getByRole('dialog', { name: 'Escape-disabled navigation sample' });
      await page.keyboard.press('Escape');
      await expect(fixed).toBeVisible();
      await fixed.getByRole('button', { name: 'Close Escape-disabled navigation', exact: true })
        .click();
      await expect(fixed).not.toBeVisible();
      await expect(locked).toBeFocused();
    });

    test(`${kind}/strict-native-modal-accessibility`, async ({ page }) => {
      const area = page.locator(`#${kind}-ownership`);
      await area.getByRole('button', { name: 'Open controlled navigation', exact: true }).click();
      const result = await new AxeBuilder({ page }).include(`#${kind}-ownership`).analyze();
      expect(result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
        .toEqual([]);
    });

    test(`${kind}/platform-close-wins-and-next-parent-render-reconciles`, async ({ page }) => {
      const area = page.locator(`#${kind}-ownership`);
      await area.getByRole('button', { name: 'Open platform-close navigation', exact: true })
        .click();
      const dialog = area.getByRole('dialog', { name: 'Platform-close navigation sample' });
      await expect(dialog).toBeVisible();
      await page.keyboard.press('Escape');
      // Keep the key presses adjacent: automation DOM queries can supply user activation.
      await page.keyboard.press('Escape');
      await expect(area.getByLabel('Platform navigation cancelability')).toHaveText('[true,false]');
      await expect(dialog).not.toBeVisible();
      const reasons: string[] = JSON.parse(
        (await area.getByLabel('Platform navigation close reasons').textContent())!,
      );
      expect(reasons.filter((reason) => reason === 'native-close')).toHaveLength(1);
      await area.getByRole('button', {
        name: 'Render accepted navigation state again',
        exact: true,
      })
        .click();
      await expect.poll(async () => ({
        visible: await dialog.isVisible(),
        reasons,
      })).toEqual({ visible: true, reasons: ['trigger', 'native-close'] });
      expect(await dialog.evaluate((element) => element.matches(':modal'))).toBe(true);
      await expect(
        dialog.getByRole('button', { name: 'Close platform-close navigation', exact: true }),
      ).toBeFocused();
    });
  });
}
