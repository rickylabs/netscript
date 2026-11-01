import { expect, test } from '@playwright/test';

// Firefox snapshot DOM inspections grant activation between physical Escapes.
// Keep action traces, screenshots and sources; CLI-forced snapshots invalidate this control.
test.use({
  trace: { mode: 'retain-on-failure', snapshots: false, screenshots: true, sources: true },
});

test('forced native close stands and later accepted parent render reopens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/shell');
  const shell = page.locator('#shell-example');
  await expect(shell).toHaveAttribute('data-sidebar-mode', 'hydrated');
  await page.getByRole('button', { name: 'Refuse dismissal' }).click();
  await expect(shell.locator('dialog')).toBeVisible();
  // No evaluations/assertions between these Escapes: CDP evaluation grants activation.
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(shell.locator('dialog')).toBeHidden();
  await expect(shell.locator('[data-scope="sidebar-toggle"]')).toHaveAttribute(
    'aria-expanded',
    'false',
  );
  await expect.poll(async () => {
    const proposals = JSON.parse(
      await page.getByLabel('Shell proposals').textContent() ?? '[]',
    ) as string[];
    return proposals.filter((value) => value === 'false:native-close').length;
  }).toBe(1);
  await page.getByRole('button', { name: 'Parent refresh' }).click();
  await expect(shell.locator('dialog')).toBeVisible();
  await expect(shell.locator('[data-scope="sidebar-toggle"]')).toHaveAttribute(
    'aria-expanded',
    'true',
  );
});

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
