import { assertEquals, assertExists } from '@std/assert';
import { join } from '@std/path';

import { parseTap } from './run-deno-test.ts';

Deno.test('TAP parser groups duplicate failure shapes while retaining test locations', () => {
  const message = (line: number) =>
    JSON.stringify({
      message:
        `Error: same failure\n\u001b[31mDeno.test('case ${line}', () => fail());\u001b[0m\n\u001b[31m  ^\u001b[0m\n    at file:///repo/example_test.ts:${line}:3`,
      severity: 'fail',
      at: { file: './example_test.ts', line, column: 6 },
    });
  const parsed = parseTap(
    [
      'TAP version 14',
      'not ok 1 - first case',
      '  ---',
      `  ${message(4)}`,
      '  ...',
      'not ok 2 - second case',
      '  ---',
      `  ${message(8)}`,
      '  ...',
      'ok 3 - ignored case # SKIP',
      '1..3',
    ].join('\n'),
    '/repo',
  );

  assertEquals(parsed.failed.length, 2);
  assertEquals(parsed.failed[0].message, parsed.failed[1].message);
  assertEquals(parsed.ignored, 1);
});

Deno.test('CLI preserves failing exit and writes one deduplicated JSON report', async () => {
  const root = await Deno.makeTempDir();
  try {
    const fixture = join(root, 'duplicate_test.ts');
    const reportPath = join(root, 'report.json');
    await Deno.writeTextFile(
      fixture,
      [
        "Deno.test('first', () => { throw new Error('same failure'); });",
        "Deno.test('second', () => { throw new Error('same failure'); });",
      ].join('\n'),
    );
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run',
        new URL('./run-deno-test.ts', import.meta.url).pathname,
        '--output',
        reportPath,
        '--',
        '--no-config',
        fixture,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();

    assertEquals(output.code, 1);
    const pointer = JSON.parse(new TextDecoder().decode(output.stdout));
    assertEquals(pointer.report, reportPath);
    const report = JSON.parse(await Deno.readTextFile(reportPath));
    assertEquals(report.summary.failed, 2);
    assertEquals(report.summary.uniqueFailures, 1, JSON.stringify(report.failures));
    assertEquals(report.failures[0].count, 2);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('CLI makes non-test process failures structurally visible', async () => {
  const root = await Deno.makeTempDir();
  try {
    const fixture = join(root, 'broken_test.ts');
    const reportPath = join(root, 'report.json');
    await Deno.writeTextFile(fixture, 'this is not TypeScript;\n');
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run',
        new URL('./run-deno-test.ts', import.meta.url).pathname,
        '--output',
        reportPath,
        '--',
        '--no-config',
        fixture,
      ],
      stdout: 'null',
      stderr: 'null',
    }).output();

    assertEquals(output.code, 1);
    const report = JSON.parse(await Deno.readTextFile(reportPath));
    assertEquals(report.summary.failed, 0);
    assertExists(report.processFailure);
    assertEquals(report.processFailure.stderr.bytes > 0, true);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('CLI attributes the deliberate duplicate typed-queue DLQ invariant failure', async () => {
  const root = await Deno.makeTempDir({ prefix: 'typed-dlq-control-' });
  try {
    const fixture = join(root, 'duplicate-dlq_test.ts');
    const reportPath = join(root, 'report.json');
    const fixtureModule = new URL(
      '../../packages/queue/tests/_fixtures/typed-dlq.ts',
      import.meta.url,
    ).href;
    await Deno.writeTextFile(
      fixture,
      [
        `import { typedDlqRedelivery } from ${JSON.stringify(fixtureModule)};`,
        "Deno.test('duplicate DLQ negative control', () => typedDlqRedelivery('memory', (store) => ({",
        '  append: (record) => store.append({ ...record, messageId: crypto.randomUUID() }),',
        '  list: (options) => store.list(options),',
        '  depth: () => store.depth(),',
        '  reprocess: (enqueue, options) => store.reprocess(enqueue, options),',
        '})));',
      ].join('\n'),
    );
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run',
        new URL('./run-deno-test.ts', import.meta.url).pathname,
        '--output',
        reportPath,
        '--',
        '--frozen',
        '--no-check',
        '--allow-all',
        fixture,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, 1);
    const report = JSON.parse(await Deno.readTextFile(reportPath));
    assertEquals(report.exitCode, 1);
    assertEquals(report.summary.failed, 1, JSON.stringify(report));
    assertEquals(report.summary.uniqueFailures, 1);
    assertEquals(report.processFailure, undefined);
    const failure = report.failures[0];
    assertEquals(failure.count, 1);
    assertEquals(failure.tests[0].name, 'duplicate DLQ negative control');
    assertEquals(
      failure.tests[0].file.endsWith('duplicate-dlq_test.ts'),
      true,
      JSON.stringify(failure),
    );
    assertEquals(failure.tests[0].line, 2);
    assertEquals(failure.message.includes('one terminal record per message'), true);
    assertEquals(failure.message.includes('-   2\n+   1'), true);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
