import { expect, test } from '@playwright/test';
import type { ComponentCatalog } from '../../docs-site/fresh-ui/catalog.ts';
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeStylePolicy } from '../../docs-site/style-policy.ts';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SITE = resolve(REPO, 'docs/site/_site/assets/fresh-ui');

test(
  'isolated preview CSS matches canonical registry sources and keeps its authored style policy',
  async ({ page }, info) => {
    test.skip(
      info.project.name !== 'light-1280',
      'Static asset fidelity and both-scheme token declarations need one complete census.',
    );
    const registry: { items: { files?: { path: string }[] }[] } = JSON.parse(
      await readFile(resolve(REPO, 'packages/fresh-ui/registry.json'), 'utf8'),
    );
    const tokens: { presets: Record<string, unknown> } = JSON.parse(
      await readFile(resolve(REPO, 'packages/fresh-ui/registry/theme/tokens.json'), 'utf8'),
    );
    const componentSources = [
      ...new Set(
        registry.items.flatMap((item) => item.files ?? []).filter((file) =>
          file.path.endsWith('.css') && !file.path.includes('/theme/')
        ).map((file) => file.path),
      ),
    ].sort();
    const expected: Record<string, string[]> = {
      'components.css': componentSources,
      'docs.css': ['tools/docs-site/fresh-ui/styles.css'],
      'preview.css': ['tools/docs-site/fresh-ui/preview.css'],
    };
    for (const id of Object.keys(tokens.presets)) {
      expected['presets/' + id + '.css'] = [
        'packages/fresh-ui/registry/theme/presets/' + id + '.css',
      ];
    }
    const manifest: { path: string; sources: string[]; sourceSha256: string; sha256: string }[] =
      JSON.parse(await readFile(resolve(SITE, 'css-manifest.json'), 'utf8'));
    const files = (await readdir(SITE, { recursive: true })).map((path) =>
      path.replaceAll('\\', '/')
    ).filter((path) => path.endsWith('.css')).sort();
    expect(files).toEqual(Object.keys(expected).sort());
    expect(manifest.map((asset) => asset.path).sort()).toEqual(files);
    const hash = (value: string) => createHash('sha256').update(value).digest('hex');
    for (const asset of manifest) {
      const sources = expected[asset.path];
      if (!sources) throw new Error('Unexpected isolated stylesheet: ' + asset.path);
      expect(asset.sources).toEqual(sources);
      const source = (await Promise.all(sources.map((path) =>
        readFile(resolve(REPO, path), 'utf8')
      ))).join(
        '\n',
      );
      expect(hash(source), asset.path + ' canonical source').toBe(asset.sourceSha256);
      expect(
        hash(await readFile(resolve(SITE, asset.path), 'utf8')),
        asset.path + ' published bytes',
      ).toBe(asset.sha256);
    }
    await page.goto('assets/fresh-ui/preview/?component=button&theme=studio-utility');
    const layer = {
      path: 'registry/theme/presets/studio-utility.css',
      kind: 'css' as const,
      tokenLayer: true,
      source: await readFile(
        resolve(REPO, 'packages/fresh-ui/registry/theme/presets/studio-utility.css'),
        'utf8',
      ),
    };
    const authored = {
      path: 'tools/docs-site/fresh-ui/preview.css',
      kind: 'css' as const,
      source: await readFile(resolve(REPO, 'tools/docs-site/fresh-ui/preview.css'), 'utf8'),
    };
    expect(await page.evaluate(analyzeStylePolicy, [layer, authored])).toEqual([]);
    for (
      const [source, kind] of [['.control {color:red}', 'raw-colour'], [
        '.control {color:var(--ns-destructive)}',
        'red-outside-state',
      ]] as const
    ) {
      const findings = await page.evaluate(analyzeStylePolicy, [layer, { ...authored, source }]);
      expect(findings.some((finding) => finding.kind === kind)).toBe(true);
    }
  },
);

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
    await expect(page.locator('.docs-edit a')).toHaveAttribute(
      'href',
      'https://github.com/rickylabs/netscript/edit/main/docs/site/design-system/components.page.ts',
    );
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
  await page.locator('input[name="preset"]').fill('ns2_e30');
  await page.getByRole('button', { name: 'Apply preset code' }).click();
  await expect(page.locator('[data-builder-status]')).toHaveText('Unsupported UI preset version');
  await expect(page.locator('[data-preset-choice]')).toHaveValue('studio-cloud');
  await page.goto('create/?preset=' + 'x'.repeat(5_000));
  await expect(page.locator('[data-builder-status]')).toContainText('exceeds 4096 characters');
  await expect(page.locator('[data-preset-choice]')).toHaveValue('studio-utility');
});

test(
  'every generated registry preview mounts actual components without third-party requests',
  async ({
    page,
    context,
    baseURL,
  }, info) => {
    test.skip(
      info.project.name !== 'light-1280',
      'One complete census; the representative browser matrix runs in all projects.',
    );
    test.setTimeout(180_000);
    const origin = new URL(baseURL!).origin;
    const external = new Set<string>();
    await context.route(/^https?:\/\//, async (route) => {
      if (new URL(route.request().url()).origin !== origin) {
        external.add(route.request().url());
        await route.abort();
      } else await route.continue();
    });
    const catalog: ComponentCatalog = await (await page.request.get('assets/fresh-ui/catalog.json'))
      .json();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('create/');
    await expect(page.frameLocator('[data-component-preview]').locator('html')).toHaveAttribute(
      'data-preview-ready',
      'workspace',
    );
    expect([...external]).toEqual([]);
    for (const preset of catalog.presets) {
      await page.locator('[data-preset-choice]').selectOption(preset.id);
      const root = page.frameLocator('[data-component-preview]').locator('html');
      await expect(root).toHaveAttribute('data-preset', preset.id);
      await expect(root).toHaveAttribute('data-preview-ready', 'workspace');
      expect([...external], preset.id).toEqual([]);
    }
    for (const component of catalog.components) {
      await page.goto(
        `assets/fresh-ui/preview/?component=${component.name}&theme=studio-utility&scheme=light`,
      );
      await expect(page.locator('html')).toHaveAttribute('data-preview-ready', component.name);
      await expect(page.getByText('Loading Fresh UI preview…')).toHaveCount(0);
      await expect(page.locator('#preview > *')).not.toHaveCount(0);
      expect([...external], component.name).toEqual([]);
    }
    for (
      const path of [
        'create/',
        'design-system/components/',
        ...catalog.components.map((c) => 'design-system/components/' + c.name + '/'),
      ]
    ) {
      const html = await (await page.request.get(path)).text();
      expect(html, path).toContain(
        'href="https://github.com/rickylabs/netscript/edit/main/docs/site/design-system/components.page.ts"',
      );
    }
    expect(errors).toEqual([]);
  },
);
