import { assertEquals } from '@std/assert';
import { join } from '@std/path';

import { ReportFileReporter } from '../../../src/adapters/reporting/report-file-reporter.ts';

Deno.test('report file reporter atomically replaces one complete JSON report', async () => {
  const root = await Deno.makeTempDir();
  try {
    const path = join(root, 'nested', 'report.json');
    await Deno.mkdir(join(root, 'nested'));
    await Deno.writeTextFile(path, '{"stale":true}\n');
    await new ReportFileReporter(path).emit({
      type: 'suite-end',
      report: {
        ok: true,
        suiteId: 'scaffold.service',
        projectRoot: root,
        startedAt: '2026-08-13T00:00:00.000Z',
        durationMs: 10,
        steps: [],
        summary: { passed: 1, failed: 0, skipped: 0 },
      },
    });

    const text = await Deno.readTextFile(path);
    assertEquals(text.endsWith('\n'), true);
    assertEquals(JSON.parse(text).summary.passed, 1);
    const entries: string[] = [];
    for await (const entry of Deno.readDir(join(root, 'nested'))) entries.push(entry.name);
    assertEquals(entries, ['report.json']);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
