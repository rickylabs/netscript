import { assertEquals } from '@std/assert';
import { join } from '@std/path';
import { scanCodeQuality } from './scan-code-quality.ts';

Deno.test('scanner reports every guarded quality rule and honors reasoned line allowances', async () => {
  const root = await Deno.makeTempDir();
  const host = join(root, 'packages/cli/src/public/features/plugins/host.ts');
  await Deno.mkdir(join(root, 'packages/cli/src/public/features/plugins'), { recursive: true });
  await Deno.writeTextFile(host, [
    '// deno-lint-ignore no-explicit-any',
    'type Value = Map<any, string>;',
    'const cast = value as unknown as Value;',
    "if (plugin.name === 'auth') return;",
    'const allowed: any = value; // quality-allow: upstream untyped boundary',
  ].join('\n'));
  const findings = await scanCodeQuality(['packages/cli/src'], root);
  assertEquals(findings.map((finding) => finding.rule), [
    'explicit-any-ignore', 'explicit-any', 'unsafe-cast', 'plugin-name-check',
  ]);
});

Deno.test('scanner accepts exact changed files and ignores tests and generated sources', async () => {
  const root = await Deno.makeTempDir();
  await Deno.writeTextFile(join(root, 'clean.ts'), 'export const value: string = "ok";\n');
  await Deno.writeTextFile(join(root, 'ignored_test.ts'), 'const value: any = 1;\n');
  assertEquals(await scanCodeQuality(['clean.ts', 'ignored_test.ts'], root), []);
});
