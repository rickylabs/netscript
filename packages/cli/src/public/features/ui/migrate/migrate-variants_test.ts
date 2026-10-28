import { assert, assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join } from '@std/path';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { createUiMigrateCommand } from './migrate-ui-command.ts';
import { variantMigrations } from './variant-migration-data.ts';
import { migrateVariantSource } from './migrate-source.ts';
import { migrateVariantCss } from './migrate-css.ts';
import { MigrateUiVariantsUseCase } from './migrate-ui-variants-use-case.ts';

Deno.test('literal app JSX migrates orthogonal values without touching comments, text or strings', () => {
  const input = `const example = "<b class='ns-badge ns-badge--primary'>";
// <b class='ns-badge ns-badge--primary'>
const pattern = /<b class='ns-badge ns-badge--primary'\\/>/;
export const view = <><p>Don't change text</p><button className='ns-btn ns-btn--ghost ns-btn--icon ns-btn--sm custom'>Action</button></>;`;
  const result = migrateVariantSource('view.tsx', input);
  assertEquals(result.diagnostics, []);
  assertStringIncludes(result.content, "data-variant='ghost' data-icon='true' data-size='sm'");
  assertStringIncludes(result.content, "className='ns-btn custom'");
  assertStringIncludes(result.content, `const example = "<b class='ns-badge ns-badge--primary'>";`);
  assertStringIncludes(result.content, "// <b class='ns-badge ns-badge--primary'>");
  assertEquals(migrateVariantSource('view.tsx', result.content), result);
});

Deno.test('nested JSX attribute elements and quoted custom classes retain valid syntax', () => {
  const input =
    `<Dialog.Trigger class="ns-btn ns-btn--ghost before:content-['x']" icon={<b class='ns-badge ns-badge--primary' />} />`;
  const result = migrateVariantSource('view.tsx', input);
  assertEquals(result.diagnostics, []);
  assertStringIncludes(result.content, `class="ns-btn before:content-['x']" data-variant='ghost'`);
  assertStringIncludes(result.content, "<b class='ns-badge' data-variant='primary' />");
  assertEquals(migrateVariantSource('view.tsx', result.content), result);
});

Deno.test('conflicting attributes and unsupported dynamic markup fail without partial edits', () => {
  for (
    const input of [
      `<b class='ns-badge ns-badge--primary' data-variant='secondary' />`,
      `<b class={'ns-badge ns-badge--' + variant} />`,
      `<button class='ns-btn ns-btn--sm ns-btn--lg' />`,
      `const variants = { primary: 'ns-btn--primary' }; const classes = cn('ns-btn', variants[variant]); const view = <button class={classes} />;`,
    ]
  ) {
    const result = migrateVariantSource('custom.tsx', input);
    assert(result.diagnostics.length > 0);
    assertEquals(result.content, input);
  }
});

Deno.test('CSS migration preserves specificity and ignores declarations, comments and quoted selectors', () => {
  const input = `/* .ns-btn--primary {} */
.ns-btn--primary:hover, [data-example='.ns-btn--ghost'] .ns-btn--icon.ns-btn--sm { content: '.ns-btn--ghost'; background: url('.ns-btn--sm'); }
@supports (background: url(.ns-btn--primary)) { .custom { color: red; } }
.ns-toast--error { color: red; }
.ns-model-opt.is-active { color: green; }`;
  const result = migrateVariantCss(input);
  assertEquals(result.diagnostics, []);
  assertStringIncludes(result.content, ":where(.ns-btn)[data-variant='primary']:hover");
  assertStringIncludes(result.content, "[data-example='.ns-btn--ghost']");
  assertStringIncludes(result.content, "content: '.ns-btn--ghost'; background: url('.ns-btn--sm')");
  assertStringIncludes(result.content, ":where(.ns-toast)[data-type='error']");
  assertStringIncludes(result.content, 'url(.ns-btn--primary)');
  assertStringIncludes(result.content, ".ns-model-opt[data-state='selected']");
  assertStringIncludes(
    result.content,
    ":where(.ns-btn):is([data-size='icon'], [data-icon='true'])",
  );
  assertEquals(migrateVariantCss(result.content), result);
});

Deno.test('real 0.0.8 navigation, mobile sidebar, model and citation selectors migrate with their state producers', () => {
  // Exact selector vocabulary from the pre-migration registry styles, not the public component names.
  const input = `.ns-dashboard__nav-item.is-active { color: red; }
.ns-dashboard__sidebar.is-open { transform: translateX(0); }
.ns-dashboard__sidebar-backdrop.is-visible { opacity: 1; }
.ns-model-opt.is-active .ns-model-opt__label { color: red; }
.ns-citation.is-active { color: red; }
.ns-dashboard__nav-item .ns-citation.is-active { color: red; }`;
  const result = migrateVariantCss(input);
  assertEquals(result.diagnostics, []);
  assertEquals(result.content.includes('.is-'), false);
  assertStringIncludes(result.content, ".ns-dashboard__nav-item[data-state='selected']");
  assertStringIncludes(result.content, ".ns-dashboard__sidebar[data-state='open']");
  assertStringIncludes(result.content, ".ns-dashboard__sidebar-backdrop[data-state='open']");
  assertStringIncludes(result.content, ".ns-model-opt[data-state='selected'] .ns-model-opt__label");
  assertStringIncludes(result.content, ".ns-citation[data-state='active']");
  assertStringIncludes(result.content, ".ns-dashboard__nav-item .ns-citation[data-state='active']");
  assertEquals(migrateVariantCss(result.content), result);
  const custom = '.ns-citation .custom.is-active, .my-ns-citation.is-active { color: red; }';
  assertEquals(migrateVariantCss(custom).content, custom);
  assertEquals(
    migrateVariantSource('custom.tsx', `<b class='my-ns-citation is-active' />`).content,
    `<b class='my-ns-citation is-active' />`,
  );
  assertStringIncludes(
    migrateVariantCss('.ns-citation:not( .is-active) { color:red }').content,
    ".ns-citation:not( [data-state='active'])",
  );
});

Deno.test('layout aliases survive and controlled component props require a manual merge', () => {
  const layout = `<Card.Body class='ns-stack ns-stack--lg' />`;
  assertEquals(migrateVariantSource('view.tsx', layout), { content: layout, diagnostics: [] });
  const css = migrateVariantCss('.ns-stack--lg { gap: 2rem; }').content;
  assertStringIncludes(css, ":is(.ns-stack--lg, :where(.ns-stack)[data-gap='lg'])");
  assertEquals(migrateVariantCss(css).content, css);
  for (
    const input of [
      "<Button class='ns-btn--destructive' />",
      "<Avatar class='ns-avatar--sm' />",
      "<Dialog.Trigger class='ns-btn--loading' />",
    ]
  ) {
    const result = migrateVariantSource('view.tsx', input);
    assertEquals(result.content, input);
    assert(result.diagnostics.length > 0);
  }
  const forward = migrateVariantSource(
    'view.tsx',
    "<Sheet.Close class='ns-btn ns-btn--primary ns-btn--sm'>Close</Sheet.Close>",
  );
  assertEquals(forward.diagnostics, []);
  assertStringIncludes(forward.content, "data-variant='primary' data-size='sm'");
});

Deno.test('a copied wrapper without an ns class string receives its structural contract', () => {
  const migration = variantMigrations.find((file) => file.file === 'icon-button.tsx')!;
  const before = migration.edits[0].before;
  assertEquals(before.includes('ns-'), false);
  const result = migrateVariantSource('icon-button.tsx', before);
  assertEquals(result.diagnostics, []);
  assertStringIncludes(result.content, "data-scope='icon-button'");
  assertStringIncludes(result.content, "data-part='glyph'");
  assertEquals(migrateVariantSource('icon-button.tsx', result.content), result);
});

Deno.test('whole-app preflight, dry run, command routing and idempotence use the selected app', async () => {
  const root = await Deno.makeTempDir({ prefix: 'ui-migrate-' });
  try {
    const app = join(root, 'apps', 'dashboard');
    await Deno.mkdir(join(app, 'routes'), { recursive: true });
    await Deno.mkdir(join(app, 'node_modules'), { recursive: true });
    const good = join(app, 'routes', 'index.tsx');
    const bad = join(app, 'routes', 'custom.tsx');
    const original = `<b class='ns-badge ns-badge--success' />`;
    await Deno.writeTextFile(good, original);
    await Deno.writeTextFile(bad, `<b class={'ns-badge ns-badge--' + variant} />`);
    const ignored = join(app, 'node_modules', 'untouched.tsx');
    await Deno.writeTextFile(ignored, original);
    const fs = new DenoFileSystem();
    const useCase = new MigrateUiVariantsUseCase(fs);
    await assertRejects(() => useCase.execute({ appRoot: app }), Error, 'no files written');
    assertEquals(await fs.readFile(good), original);
    await Deno.remove(bad);
    const lines: string[] = [];
    const create = () =>
      createUiMigrateCommand({
        fs,
        resolveUiAppRoot: (input) => {
          assertEquals(input.projectRoot, root);
          assertEquals(input.app, 'dashboard');
          return Promise.resolve(app);
        },
        print: (text) => lines.push(text),
      });
    await create().parse(['variants', '--project-root', root, '--app', 'dashboard', '--dry-run']);
    assertEquals(await fs.readFile(good), original);
    assert(lines.some((line) => line.startsWith('would migrate')));
    await create().parse(['variants', '--project-root', root, '--app', 'dashboard']);
    assertStringIncludes(await fs.readFile(good), "data-variant='success'");
    assertEquals(await fs.readFile(ignored), original);
    assertEquals((await useCase.execute({ appRoot: app })).changed, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('failed write restores already-written app files', async () => {
  const root = await Deno.makeTempDir({ prefix: 'ui-migrate-rollback-' });
  try {
    const fs = new DenoFileSystem();
    const original = `<b class='ns-badge ns-badge--success' />`;
    await fs.writeFile(join(root, 'a.tsx'), original);
    await fs.writeFile(join(root, 'b.tsx'), original);
    const write = fs.writeFile.bind(fs);
    let writes = 0;
    fs.writeFile = (path, content) =>
      ++writes === 2 ? Promise.reject(new Error('disk failure')) : write(path, content);
    await assertRejects(
      () => new MigrateUiVariantsUseCase(fs).execute({ appRoot: root }),
      Error,
      'disk failure',
    );
    assertEquals(await fs.readFile(join(root, 'a.tsx')), original);
    assertEquals(await fs.readFile(join(root, 'b.tsx')), original);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
