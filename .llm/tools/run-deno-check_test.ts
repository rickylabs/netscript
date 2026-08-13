import { assertEquals } from 'jsr:@std/assert@^1';
import { join } from 'jsr:@std/path@^1';

Deno.test('runner fails when deno check excludes every explicit target despite exit 0', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(join(root, 'deno.json'), '{"exclude":["generated/"]}\n');
    await Deno.mkdir(join(root, 'generated'));
    await Deno.writeTextFile(join(root, 'generated', 'broken.ts'), 'const value: string = 1;\n');
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-run',
        new URL('./run-deno-check.ts', import.meta.url).pathname,
        '--cwd',
        root,
        '--file',
        'generated/broken.ts',
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, 2);
    const report = JSON.parse(new TextDecoder().decode(output.stdout));
    assertEquals(report.selection, { filesSelected: 1, batches: 1, failedBatches: 1 });
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('runner fails when its own selection is empty', async () => {
  const root = await Deno.makeTempDir();
  try {
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-run',
        new URL('./run-deno-check.ts', import.meta.url).pathname,
        '--cwd',
        root,
        '--root',
        '.',
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, 2);
    const report = JSON.parse(new TextDecoder().decode(output.stdout));
    assertEquals(report.selection.filesSelected, 0);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('runner atomically persists its structured report and emits a compact pointer', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(join(root, 'valid.ts'), 'export const value: number = 1;\n');
    const reportPath = join(root, 'report.json');
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run',
        new URL('./run-deno-check.ts', import.meta.url).pathname,
        '--cwd',
        root,
        '--root',
        '.',
        '--output',
        reportPath,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, 0);
    assertEquals(JSON.parse(new TextDecoder().decode(output.stdout)).report, reportPath);
    assertEquals(JSON.parse(await Deno.readTextFile(reportPath)).selection.filesSelected, 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
