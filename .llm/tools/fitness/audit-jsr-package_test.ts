import { assertEquals } from 'jsr:@std/assert@^1';
import { fromFileUrl } from 'jsr:@std/path@^1';

Deno.test('JSR module tags apply to source exports; missing JSON exports still fail', async () => {
  const root = await Deno.makeTempDir({ prefix: 'netscript-jsr-audit-' });
  try {
    await Deno.writeTextFile(
      `${root}/deno.json`,
      JSON.stringify({
        name: '@test/audit',
        version: '1.0.0',
        description: 'Audit fixture',
        exports: {
          '.': './mod.ts',
          './data': './data.json',
          './missing': './missing.json',
          './bare': './bare.ts',
        },
      }),
    );
    await Deno.writeTextFile(
      `${root}/mod.ts`,
      '/** Documented source. @module */\nexport const value = 1;\n',
    );
    await Deno.writeTextFile(`${root}/bare.ts`, 'export const value = 2;\n');
    await Deno.writeTextFile(`${root}/data.json`, '{"value":3}\n');
    await Deno.writeTextFile(`${root}/README.md`, '# Fixture\n'.repeat(40));
    const result = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--no-lock',
        '--allow-read',
        '--allow-write',
        '--allow-env',
        fromFileUrl(new URL('./audit-jsr-package.ts', import.meta.url)),
        '--root',
        root,
        '--no-dry-run',
        '--out',
        `${root}/report.json`,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    const report = JSON.parse(await Deno.readTextFile(`${root}/report.json`));
    assertEquals(result.code, 1);
    assertEquals(
      report.gates.filter((g: { gate: string }) => g.gate === 'F-JSR-2 module-tag').map((
        g: { path: string },
      ) => g.path),
      ['./bare.ts'],
    );
    assertEquals(
      report.gates.some((g: { level: string; message: string }) =>
        g.level === 'FAIL' && g.message.includes('missing.json')
      ),
      true,
    );
    assertEquals(report.docs.moduleTagOnEntries['.'], true);
    assertEquals(Object.hasOwn(report.docs.moduleTagOnEntries, './data'), false);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
