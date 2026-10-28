import { assert, assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';
import { join } from '@std/path';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { createUiMigrateCommand } from './migrate-ui-command.ts';
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
.ns-model-selector__option.is-active { color: green; }`;
  const result = migrateVariantCss(input);
  assertEquals(result.diagnostics, []);
  assertStringIncludes(result.content, ":where(.ns-btn)[data-variant='primary']:hover");
  assertStringIncludes(result.content, "[data-example='.ns-btn--ghost']");
  assertStringIncludes(result.content, "content: '.ns-btn--ghost'; background: url('.ns-btn--sm')");
  assertStringIncludes(result.content, ":where(.ns-toast)[data-type='error']");
  assertStringIncludes(result.content, 'url(.ns-btn--primary)');
  assertStringIncludes(result.content, ".ns-model-selector__option[data-state='selected']");
  assertStringIncludes(
    result.content,
    ":where(.ns-btn):is([data-size='icon'], [data-icon='true'])",
  );
  assertEquals(migrateVariantCss(result.content), result);
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
