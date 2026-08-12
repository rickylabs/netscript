import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { scanCodeQuality } from './scan-code-quality.ts';

Deno.test('scanner reports every guarded quality rule and honors reasoned line allowances', async () => {
  const root = await Deno.makeTempDir();
  const host = join(root, 'packages/cli/src/public/features/plugins/host.ts');
  await Deno.mkdir(join(root, 'packages/cli/src/public/features/plugins'), { recursive: true });
  await Deno.writeTextFile(
    host,
    [
      '// deno-lint-ignore no-explicit-any',
      'type Value = Map<any, string>;',
      'const cast = value as unknown as Value;',
      "if (plugin.name === 'auth') return;",
      'const allowed: any = value; // quality-allow: upstream untyped boundary',
    ].join('\n'),
  );
  const findings = await scanCodeQuality(['packages/cli/src'], root);
  assertEquals(findings.map((finding) => finding.rule), [
    'explicit-any-ignore',
    'explicit-any',
    'unsafe-cast',
    'plugin-name-check',
  ]);
});

Deno.test('scanner accepts exact changed files and ignores tests and generated sources', async () => {
  const root = await Deno.makeTempDir();
  await Deno.writeTextFile(join(root, 'clean.ts'), 'export const value: string = "ok";\n');
  await Deno.writeTextFile(join(root, 'ignored_test.ts'), 'const value: any = 1;\n');
  assertEquals(await scanCodeQuality(['clean.ts', 'ignored_test.ts'], root), []);
});

Deno.test('scanner catches evasion attempts: file-wide ignore, spaced casts, predicate name checks', async () => {
  const root = await Deno.makeTempDir();
  const dir = join(root, 'packages/cli/src/public/features/plugins');
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(
    join(dir, 'evade.ts'),
    [
      '// deno-lint-ignore-file no-explicit-any',
      'const a = value as   unknown   as Value;',
      "if (plugin.name.startsWith('auth')) return;",
      "if (kind.includes('ai')) enableMcp();",
      "const b = plugin.slug.endsWith('workers');",
    ].join('\n'),
  );
  const findings = await scanCodeQuality(['packages/cli/src'], root);
  const rules = findings.map((f) => f.rule);
  assertEquals(rules.includes('explicit-any-ignore'), true); // file-wide ignore
  assertEquals(rules.includes('unsafe-cast'), true); // irregular whitespace
  assertEquals(rules.filter((r) => r === 'plugin-name-check').length, 3); // startsWith/includes/endsWith
});

Deno.test('capability id containing a plugin name is NOT a false positive', async () => {
  const root = await Deno.makeTempDir();
  const dir = join(root, 'packages/cli/src/public/features/plugins');
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(
    join(dir, 'ok.ts'),
    [
      "if (plugin.cli?.doctorChecks?.includes('auth-backend')) return check();",
      "const cap = 'ai-tools';",
    ].join('\n'),
  );
  assertEquals(await scanCodeQuality(['packages/cli/src'], root), []);
});

Deno.test('scanner catches plugin-identity via const/array indirection (Opus IMPL-EVAL bypass)', async () => {
  const root = await Deno.makeTempDir();
  const dir = join(root, 'packages/cli/src/public/features/plugins');
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(
    join(dir, 'indirect.ts'),
    [
      "const target = 'auth';",
      'if (plugin.name === target) return;',
      "const gated = ['ai', 'workers'];",
      'if (gated.includes(plugin.name)) enable();',
      "const pred = 'streams';",
      'if (plugin.name.startsWith(pred)) return;',
    ].join('\n'),
  );
  const findings = await scanCodeQuality(['packages/cli/src'], root);
  assertEquals(findings.filter((f) => f.rule === 'plugin-name-check').length, 3);
});

Deno.test('scanner catches @ts-error suppressions and `as never` (source-side type escapes)', async () => {
  const root = await Deno.makeTempDir();
  await Deno.mkdir(`${root}/packages/cli/src`, { recursive: true });
  await Deno.writeTextFile(
    `${root}/packages/cli/src/escape.ts`,
    [
      '// @ts-expect-error upstream type mismatch',
      'const a = wrong();',
      'const b = value as never;',
      '// @ts-ignore',
      'const c = other();',
    ].join('\n'),
  );
  const rules = (await scanCodeQuality(['packages/cli/src'], root)).map((f) => f.rule);
  assertEquals(rules.filter((r) => r === 'ts-error-suppression').length, 2);
  assertEquals(rules.filter((r) => r === 'unsafe-cast').length, 1);
});

Deno.test('scanner exempts negative type fixtures from production-source findings', async () => {
  const root = await Deno.makeTempDir();
  const fixtureDir = join(root, 'packages/sdk/tests/type-fixtures');
  await Deno.mkdir(fixtureDir, { recursive: true });
  await Deno.writeTextFile(
    join(fixtureDir, 'negative-contract_type.ts'),
    '// @ts-expect-error negative compile fixture assertion\nconst value: string = 1;\n',
  );

  assertEquals(await scanCodeQuality(['packages'], root), []);
});

Deno.test('type-fixture exemption requires both its directory and suffix', async () => {
  const root = await Deno.makeTempDir();
  const sourceDir = join(root, 'packages/sdk/src');
  const testsDir = join(root, 'packages/sdk/tests');
  const fixtureDir = join(testsDir, 'type-fixtures');
  await Deno.mkdir(sourceDir, { recursive: true });
  await Deno.mkdir(fixtureDir, { recursive: true });
  const directive =
    '// @ts-expect-error negative compile fixture assertion\nconst value: string = 1;\n';
  await Deno.writeTextFile(join(sourceDir, 'ordinary-source.ts'), directive);
  await Deno.writeTextFile(join(testsDir, 'outside-directory_type.ts'), directive);
  await Deno.writeTextFile(join(fixtureDir, 'missing-suffix.ts'), directive);

  const findings = await scanCodeQuality(['packages'], root);
  assertEquals(findings.map((finding) => finding.file), [
    'packages/sdk/src/ordinary-source.ts',
    'packages/sdk/tests/outside-directory_type.ts',
    'packages/sdk/tests/type-fixtures/missing-suffix.ts',
  ]);
  assertEquals(findings.map((finding) => finding.rule), [
    'ts-error-suppression',
    'ts-error-suppression',
    'ts-error-suppression',
  ]);
});
