import { assert, assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { join } from '@std/path';
import { DenoFileSystem } from '../../../../kernel/adapters/runtime/file-system/deno-file-system.ts';
import { DenoGeneratedSourceFormatter } from '../../../../kernel/adapters/runtime/process/deno-generated-source-formatter.ts';
import { DenoProcess } from '../../../../kernel/adapters/runtime/process/deno-process.ts';
import { variantMigrations } from './variant-migration-data.ts';
import { migrateVariantCss } from './migrate-css.ts';
import { migrateVariantSource } from './migrate-source.ts';
import { MigrateUiVariantsUseCase } from './migrate-ui-variants-use-case.ts';

Deno.test('state migration classifies the whole compound regardless of class order', () => {
  for (
    const [base, state, value] of [
      ['ns-citation', 'is-active', 'active'],
      ['ns-model-opt', 'is-active', 'selected'],
      ['ns-dashboard__nav-item', 'is-active', 'selected'],
      ['ns-dashboard__sidebar', 'is-open', 'open'],
      ['ns-dashboard__sidebar-backdrop', 'is-visible', 'open'],
    ]
  ) {
    for (const selector of [`.${state}.${base}`, `.${base}.${state}`]) {
      const result = migrateVariantCss(`${selector} { color: red; }`);
      assertEquals(result.diagnostics, []);
      assertEquals(result.content.includes(`.${state}`), false);
      assertStringIncludes(result.content, `[data-state='${value}']`);
      assertEquals(migrateVariantCss(result.content), result);
    }
  }
  const nested = migrateVariantCss(
    ':is(.is-active.ns-citation, .is-active.ns-model-opt), :not(.is-active).ns-citation { color:red }',
  );
  assertEquals(nested.diagnostics, []);
  assertEquals(nested.content.includes('.is-active'), false);
  assertStringIncludes(nested.content, "[data-state='active'].ns-citation");
  assertStringIncludes(nested.content, "[data-state='selected'].ns-model-opt");
  // Negative controls: neither a different subject nor a sibling branch supplies the base.
  for (
    const selector of [
      '.ns-citation .is-active.custom',
      '.is-active.custom > .ns-citation',
      '.is-active.custom, .ns-citation',
      ':is(.ns-citation, .is-active.custom)',
      '.is-active:not(.ns-citation)',
      "[data-example='.ns-citation'].is-active",
      '.is-active.my-ns-citation',
    ]
  ) {
    const source = `${selector} { content: '.is-active.ns-citation'; }`;
    assertEquals(migrateVariantCss(source), { content: source, diagnostics: [] });
  }
});

Deno.test('spread-only legacy class props fail whole-app preflight before any writes', async () => {
  const root = await Deno.makeTempDir({ prefix: 'migration-spread-preflight-' });
  try {
    const css = join(root, 'a.css');
    const good = join(root, 'b.tsx');
    const bad = join(root, 'c.tsx');
    const originals = [
      '.ns-btn--ghost { color: red; }',
      "export const good = <button class='ns-btn ns-btn--ghost' />;",
      "const props = { class: 'ns-btn ns-btn--ghost' }; export const bad = <button {...props} />;",
    ];
    for (const [index, path] of [css, good, bad].entries()) {
      await Deno.writeTextFile(path, originals[index]);
    }
    const fs = new DenoFileSystem();
    let writes = 0;
    const write = fs.writeFile.bind(fs);
    fs.writeFile = (path, content) => {
      writes++;
      return write(path, content);
    };
    for (const tag of ['<button {...props} />', "<button class='ns-btn' {...props} />"]) {
      originals[2] = `const props = { class: 'ns-btn ns-btn--ghost' }; export const bad = ${tag};`;
      await Deno.writeTextFile(bad, originals[2]);
      for (const dryRun of [true, false]) {
        await assertRejects(
          () => new MigrateUiVariantsUseCase(fs).execute({ appRoot: root, dryRun }),
          Error,
          'no files written',
        );
        assertEquals(writes, 0);
        for (const [index, path] of [css, good, bad].entries()) {
          assertEquals(await Deno.readTextFile(path), originals[index]);
        }
      }
    }
    // Negative control: fixing the producer to data attributes allows the same batch to run.
    await Deno.writeTextFile(
      bad,
      "const props = { class: 'ns-btn', 'data-variant': 'ghost' }; export const view = <button {...props} />;",
    );
    const result = await new MigrateUiVariantsUseCase(fs).execute({ appRoot: root });
    assertEquals(result.changed, ['a.css', 'b.tsx']);
    assert(writes > 0);
    assertStringIncludes(await Deno.readTextFile(css), "data-variant='ghost'");
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('spread preflight includes className, inline objects and state producers', () => {
  for (
    const source of [
      "const props = { class: 'ns-btn ns-btn--ghost' }; const view = <button class='ns-btn' {...props} />;",
      "const props = { className: 'ns-btn ns-btn--ghost' }; const view = <button {...props} />;",
      "const view = <button {...{ class: 'ns-btn ns-btn--ghost' }} />;",
      "const props = { class: 'ns-citation is-active' }; const view = <span {...props} />;",
    ]
  ) {
    const result = migrateVariantSource('view.tsx', source);
    assertEquals(result.content, source);
    assert(result.diagnostics.some((message) => message.includes('spread')));
  }
  for (
    const source of [
      "const props = { title: 'Hello' }; const view = <button {...props} />;",
      "const props = { class: 'custom custom--ghost' }; const view = <button {...props} />;",
      "const props = { class: 'ns-btn ns-btn--ghost' }; const view = <button {...props} class='ns-btn' />;",
      "const props = { id: 'one' }; const view = <button {...props} class='ns-btn ns-btn--ghost' />;",
    ]
  ) {
    assertEquals(migrateVariantSource('view.tsx', source).diagnostics, []);
  }
});

Deno.test('Markdown source migration stays idempotent after canonical formatting', async () => {
  const root = await Deno.makeTempDir({ prefix: 'markdown-migration-format-' });
  try {
    const migration = variantMigrations.find((entry) => entry.file === 'markdown.tsx')!;
    let old = await Deno.readTextFile(
      new URL(
        '../../../../../../fresh-ui/registry/components/ui/markdown.tsx.template',
        import.meta.url,
      ),
    );
    for (const edit of migration.edits) {
      assert(old.includes(edit.after), 'current template must contain the reviewed after span');
      old = old.replace(edit.after, edit.before);
    }
    const path = join(root, 'markdown.tsx');
    await Deno.writeTextFile(path, old);
    const useCase = new MigrateUiVariantsUseCase(
      new DenoFileSystem(),
      new DenoGeneratedSourceFormatter(new DenoProcess()),
    );
    const first = await useCase.execute({ appRoot: root });
    assertEquals(first.changed, ['markdown.tsx']);
    const formatted = await Deno.readTextFile(path);
    assertStringIncludes(formatted, "data-part='root'");
    assertEquals((await useCase.execute({ appRoot: root })).changed, []);
    assertEquals(await Deno.readTextFile(path), formatted);
    // Customized anatomy still fails closed instead of being accepted as already migrated.
    const custom = old.replace('<div class=', '<article class=');
    assert(custom !== old);
    assert(migrateVariantSource('markdown.tsx', custom).diagnostics.length > 0);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
