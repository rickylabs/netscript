import { assertEquals } from '@std/assert';
import { join } from '@std/path';

Deno.test('doc-lint preserves child failure and atomically writes newline JSON', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(
      join(root, 'deno.json'),
      JSON.stringify({ name: '@test/pkg', exports: './mod.ts' }),
    );
    await Deno.writeTextFile(join(root, 'mod.ts'), 'export const undocumented = 1;\n');
    const reportPath = join(root, 'out', 'report.json');
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run',
        new URL('./run-deno-doc-lint.ts', import.meta.url).pathname,
        '--root',
        root,
        '--output',
        reportPath,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code === 0, false);
    const text = await Deno.readTextFile(reportPath);
    assertEquals(text.endsWith('\n'), true);
    const report = JSON.parse(text);
    assertEquals(report.source.exitCode === 0, false);
    assertEquals(report.summary.totalErrors > 0, true);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
