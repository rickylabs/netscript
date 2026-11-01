import { assertEquals, assertRejects, assertStringIncludes } from '@std/assert';
import { runCliQuality, unchangedBaselinePaths } from './cli-quality.ts';
import { GATE_CATALOG } from '../gates/catalog.ts';

Deno.test('CLI ratchet checks new files, changed debt and wrapper crashes without widening the baseline', async () => {
  const cwd = await Deno.makeTempDir();
  const file = 'packages/cli/legacy.ts';
  const bytes = new TextEncoder().encode('debugger;\nexport const legacy=1\n');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  const baseline = { lint: { [file]: hash }, fmt: { [file]: hash } };
  try {
    await Deno.mkdir(`${cwd}/packages/cli`, { recursive: true });
    await Deno.writeFile(`${cwd}/${file}`, bytes);
    await Deno.writeTextFile(`${cwd}/packages/cli/clean.ts`, 'export const clean = 1;\n');
    assertEquals(await unchangedBaselinePaths(baseline.lint, cwd), [file]);
    assertEquals(await runCliQuality(cwd, baseline), 0);

    await Deno.writeTextFile(`${cwd}/packages/cli/new.ts`, 'debugger;\n');
    assertEquals(await runCliQuality(cwd, baseline), 1, 'new lint violations must fail');
    await Deno.writeTextFile(`${cwd}/packages/cli/new.ts`, 'export const fresh=2\n');
    assertEquals(await runCliQuality(cwd, baseline), 1, 'new format violations must fail');
    await Deno.remove(`${cwd}/packages/cli/new.ts`);

    await Deno.writeTextFile(`${cwd}/${file}`, new TextDecoder().decode(bytes) + '\n');
    assertEquals(await unchangedBaselinePaths(baseline.lint, cwd), []);
    assertEquals(await runCliQuality(cwd, baseline), 1, 'editing debt removes both exemptions');
    await Deno.writeTextFile(`${cwd}/${file}`, 'export const legacy = 1;\n');
    assertEquals(await runCliQuality(cwd, baseline), 0, 'a repaired file must pass');

    await Deno.writeTextFile(`${cwd}/${file}`, 'export const broken = ;\n');
    assertEquals(await runCliQuality(cwd, baseline), 1, 'parse failures must fail');
    await Deno.remove(`${cwd}/${file}`);
    assertEquals(await unchangedBaselinePaths(baseline.lint, cwd), []);
    await Deno.remove(`${cwd}/packages/cli/clean.ts`);
    assertEquals(await runCliQuality(cwd, baseline), 1, 'empty selections must fail');
  } finally {
    await Deno.remove(cwd, { recursive: true });
  }
});

Deno.test('CLI baseline refuses paths outside the CLI source and malformed hashes', async () => {
  for (const path of ['deno.json', 'packages/cli/../escape.ts', '/packages/cli/file.ts']) {
    await assertRejects(() => unchangedBaselinePaths({ [path]: 'a'.repeat(64) }, '.'));
  }
  await assertRejects(() => unchangedBaselinePaths({ 'packages/cli/file.ts': 'bad' }, '.'));
});

Deno.test('CLI quality is wired to local and hosted CI with root-equivalent scoped rules', async () => {
  const root = JSON.parse(await Deno.readTextFile(new URL('../../../deno.json', import.meta.url)));
  const scoped = JSON.parse(
    await Deno.readTextFile(new URL('./cli-quality.deno.json', import.meta.url)),
  );
  assertEquals(scoped.lint, { rules: root.lint.rules });
  const { include: _include, exclude: _exclude, ...format } = root.fmt;
  assertEquals(scoped.fmt, format);
  assertEquals(root.tasks['ci:quality'].dependencies.includes('quality:cli'), true);
  assertStringIncludes(root.tasks['quality:cli'], '.llm/tools/quality/cli-quality.ts');
  assertEquals(GATE_CATALOG['cli-quality'], ['deno', 'task', 'quality:cli']);
  const ci = await Deno.readTextFile(new URL('../../../.github/workflows/ci.yml', import.meta.url));
  assertStringIncludes(ci, '--gate cli-quality --id quality-cli');
});
