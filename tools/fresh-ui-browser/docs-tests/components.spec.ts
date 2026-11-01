import { expect, test } from '@playwright/test';
import type { ComponentCatalog } from '../../docs-site/fresh-ui/catalog.ts';

for (
  const path of [
    'create/',
    'design-system/components/button/',
    'design-system/components/command-palette/',
  ]
) {
  test(`Fresh UI reference: ${path}`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(path);
    const component = path === 'create/'
      ? 'workspace'
      : path.includes('command-palette')
      ? 'command-palette'
      : 'button';
    const frame = page.frameLocator('[data-component-preview]');
    await expect(frame.locator('html')).toHaveAttribute('data-preview-ready', component);
    await expect(frame.locator('html')).toHaveAttribute(
      'data-scheme',
      info.project.use.colorScheme!,
    );
    await expect(
      page.locator('nav[aria-label="Documentation lanes"] [aria-current="page"]'),
    ).toHaveText('Design system');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (component === 'button') {
      await frame.getByRole('button', { name: 'Save changes' }).click();
      await expect(frame.getByRole('status')).toHaveText('Changes saved');
    }
    if (component === 'command-palette') {
      await frame.getByRole('button', { name: 'Open commands' }).click();
      await expect(frame.getByRole('dialog')).toBeVisible();
      await frame.getByRole('combobox').press('Escape');
      // The first Escape dismisses the inner combobox; the second dismisses the dialog.
      await frame.getByRole('combobox').press('Escape');
      await expect(frame.getByRole('dialog')).not.toBeVisible();
    }
    expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath('reference.png'), fullPage: true });
  });
}

test('builder shares the CLI code and imports a preset without inventing axes', async ({ page }) => {
  await page.goto('create/');
  const catalog: ComponentCatalog = await (await page.request.get('assets/fresh-ui/catalog.json'))
    .json();
  const frame = page.frameLocator('[data-component-preview]');
  await expect(frame.locator('html')).toHaveAttribute('data-preview-ready', 'workspace');
  const computed = () =>
    frame.locator('html').evaluate((root) => {
      const style = getComputedStyle(root);
      return {
        radius: style.getPropertyValue('--ns-radius-control').trim(),
        font: style.getPropertyValue('--ns-font-sans').trim().replace(/["']/g, '').replace(
          /\s*,\s*/g,
          ',',
        ),
      };
    });
  const effective = (id: string) => {
    const preset = catalog.presets.find((p) => p.id === id)!;
    return {
      radius: preset.values['radius-control'],
      font: preset.values['font-sans'].replace(/["']/g, '').replace(/\s*,\s*/g, ','),
    };
  };
  expect(await computed()).toEqual(effective('studio-utility'));
  await page.locator('[data-preset-choice]').selectOption('studio-cloud');
  await expect(page.locator('[data-effective="accent"]')).toHaveText('Blue');
  const code = await page.locator('[data-preset-code]').inputValue();
  expect(code).toMatch(/^ns1_/);
  const payload = await page.evaluate(
    (code) => JSON.parse(atob(code.slice(4).replaceAll('-', '+').replaceAll('_', '/'))),
    code,
  );
  expect(payload).toEqual({ version: 1, theme: 'studio-cloud', style: 'style-utility' });
  await expect(page.frameLocator('[data-component-preview]').locator('html')).toHaveAttribute(
    'data-flavor',
    'cloud',
  );
  expect(await computed()).toEqual(effective('studio-cloud'));
  await expect(page.locator('[data-preset-command="init"]')).toContainText(code);
  await expect(page.locator('[data-preset-command="ui:apply"]')).toContainText(code);
  await page.reload();
  await expect(page.locator('[data-preset-choice]')).toHaveValue('studio-cloud');
  await page.locator('input[name="preset"]').fill('ns1_broken');
  await page.getByRole('button', { name: 'Apply preset code' }).click();
  await expect(page.locator('[data-builder-status]')).toContainText('Invalid UI preset code');
  await expect(page.locator('[data-preset-choice]')).toHaveValue('studio-cloud');
});

test('every generated registry preview mounts actual components', async ({ page }, info) => {
  test.skip(
    info.project.name !== 'light-1280',
    'One complete census; the representative browser matrix runs in all projects.',
  );
  const catalog = await (await page.request.get('assets/fresh-ui/catalog.json')).json();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const component of catalog.components) {
    await page.goto(
      `assets/fresh-ui/preview/?component=${component.name}&theme=studio-utility&scheme=light`,
    );
    await expect(page.locator('html')).toHaveAttribute('data-preview-ready', component.name);
    await expect(page.getByText('Loading Fresh UI preview…')).toHaveCount(0);
    await expect(page.locator('#preview > *')).not.toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
