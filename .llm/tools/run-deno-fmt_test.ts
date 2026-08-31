import { assertEquals, assertStringIncludes } from '@std/assert';

import {
  type BatchResult,
  type BatchRunner,
  buildConfigBatches,
  type CoverageReport,
  crashedBatches,
  formatFailedBatches,
  parseFmtCompletion,
  runFmt,
} from './run-deno-fmt.ts';

const CRASH = 'error: Failed to parse "workspace" configuration.';
const toolPath = new URL('./run-deno-fmt.ts', import.meta.url).pathname;
const lintToolPath = new URL('./run-deno-lint.ts', import.meta.url).pathname;
const decoder = new TextDecoder();

interface CliReport {
  mode: 'check' | 'write';
  summary: {
    filesSelected: number;
    batches: number;
    failedBatches: number;
    findings: number;
  };
  coverage: CoverageReport;
  findings: unknown[];
}

function checked(fileCount: number, lineEnding = '\n'): string {
  return `Checked ${fileCount} ${fileCount === 1 ? 'file' : 'files'}${lineEnding}`;
}

async function runCli(
  root: string,
  files: string[],
  batchSize: number,
  write = false,
  extraArgs: string[] = [],
): Promise<{ code: number; report: CliReport; stderr: string }> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--allow-read',
      '--allow-run',
      toolPath,
      '--cwd',
      root,
      ...files.flatMap((file) => ['--file', file]),
      '--batch-size',
      String(batchSize),
      ...(write ? ['--write'] : []),
      ...extraArgs,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();

  return {
    code: output.code,
    report: JSON.parse(decoder.decode(output.stdout)) as CliReport,
    stderr: decoder.decode(output.stderr),
  };
}

async function runLintCoverage(
  root: string,
  files: string[],
  extraArgs: string[] = [],
): Promise<{ code: number; coverage: CoverageReport }> {
  const output = await new Deno.Command(Deno.execPath(), {
    args: [
      'run',
      '--allow-read',
      '--allow-run',
      lintToolPath,
      '--cwd',
      root,
      ...files.flatMap((file) => ['--file', file]),
      ...extraArgs,
    ],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: output.code,
    coverage: (JSON.parse(decoder.decode(output.stdout)) as { coverage: CoverageReport }).coverage,
  };
}

function countText(text: string, pattern: string): number {
  return text.split(pattern).length - 1;
}

/** A batch whose output parses into a real formatting finding. */
function findingBatch(path: string, reason = 'Text differed.'): BatchResult {
  return { files: [path], exitCode: 1, output: `from ${path}:\n  1 | ${reason}\n` };
}

/** A batch that exits non-zero with no parseable finding — a crash. */
function crashBatch(path: string, output = CRASH): BatchResult {
  return { files: [path], exitCode: 1, output };
}

/**
 * Regression: `deno task fmt:check` exited 1 with `findings: 0` and no diagnostics. A `deno fmt`
 * batch that exits non-zero WITHOUT a parseable formatting finding is a crash — the real instance
 * was a nested `deno.json` fixture with an intentionally malformed `workspace` key, which makes
 * `deno fmt` abort during config discovery.
 */
Deno.test('crashedBatches captures a batch that fails with no finding of its own', () => {
  const results = [crashBatch('a.ts')];

  assertEquals(crashedBatches(results).length, 1);

  const rendered = formatFailedBatches(results);
  assertStringIncludes(rendered, 'exit 1');
  assertStringIncludes(rendered, 'a.ts');
  assertStringIncludes(rendered, 'Failed to parse "workspace" configuration.');
});

Deno.test('crashedBatches does not treat an ordinary formatting finding as a crash', () => {
  assertEquals(crashedBatches([findingBatch('a.ts')]), []);
});

/**
 * The bug an opposite-family IMPL-EVAL caught (F1): the classification was computed GLOBALLY as
 * `someBatchFailed && noFindingsAnywhere`, so a crashed batch hid behind an unrelated batch's
 * formatting finding. Crashes must be judged PER BATCH.
 */
Deno.test('a crashed batch is still reported when ANOTHER batch has a formatting finding', () => {
  const results = [findingBatch('clean-but-unformatted.ts'), crashBatch('broken.ts')];

  const crashed = crashedBatches(results);
  assertEquals(crashed.length, 1);
  assertEquals(crashed[0].files, ['broken.ts']);

  // The crash must reach the log even though the run also has a legitimate finding.
  const rendered = formatFailedBatches(results);
  assertStringIncludes(rendered, 'broken.ts');
  assertStringIncludes(rendered, 'Failed to parse "workspace" configuration.');
  assertEquals(rendered.includes('clean-but-unformatted.ts'), false);
});

/**
 * The false-green half of F1: with `--ignore-line-endings` the only findings in a run can be
 * filtered away, leaving `findings.length === 0`. Under the old global rule `allFindings.length`
 * was still > 0, so the crash was neither reported NOR failed — the gate exited 0 with a crashed
 * batch. Per-batch classification is what makes that impossible.
 */
Deno.test('a crashed batch is caught even when the only findings are ignored line endings', () => {
  const results = [
    findingBatch('crlf.ts', 'Text differed by line endings.'),
    crashBatch('broken.ts'),
  ];

  const crashed = crashedBatches(results);
  assertEquals(crashed.length, 1);
  assertEquals(crashed[0].files, ['broken.ts']);
});

Deno.test('crashedBatches tolerates the "No target files found." empty-batch exit', () => {
  const empty: BatchResult = { files: ['a.ts'], exitCode: 1, output: 'No target files found.' };
  assertEquals(crashedBatches([empty]), []);
});

Deno.test('formatFailedBatches strips ANSI and reports every crashed batch', () => {
  const esc = String.fromCharCode(27);
  const results = [
    crashBatch('a.ts', `${esc}[31mboom a${esc}[0m`),
    crashBatch('b.ts', `${esc}[31mboom b${esc}[0m`),
  ];

  const rendered = formatFailedBatches(results);

  assertStringIncludes(rendered, '2 deno fmt batch(es) failed');
  assertStringIncludes(rendered, 'boom a');
  assertStringIncludes(rendered, 'boom b');
  assertEquals(rendered.includes(esc), false);
});

Deno.test('fmt completion adapter pins all three mode-specific forms', () => {
  const esc = String.fromCharCode(27);
  assertEquals(parseFmtCompletion('Checked 1 file\n', 'check'), { processedCount: 1 });
  assertEquals(parseFmtCompletion('Checked 2 files\r\n', 'write'), { processedCount: 2 });
  assertEquals(
    parseFmtCompletion(
      `${esc}[31merror${esc}[0m: Found 1 not formatted file in 2 files\r\n`,
      'check',
    ),
    { processedCount: 2 },
  );
  assertEquals(
    parseFmtCompletion(
      `${esc}[31merror${esc}[0m: Failed to format 1 of 1 checked file\n`,
      'write',
    ),
    { processedCount: 1 },
  );
  assertEquals(
    parseFmtCompletion('error: Failed to format 2 of 3 checked files\r\n', 'write'),
    { processedCount: 3 },
  );
  assertEquals(parseFmtCompletion('error: Failed to format 1 of 1 checked file\n', 'check'), {
    cause: 'processed-count-unavailable',
  });
  assertEquals(parseFmtCompletion('error: Found 1 not formatted file in 1 file\n', 'write'), {
    cause: 'processed-count-unavailable',
  });
  assertEquals(parseFmtCompletion('Checked 1 file\nChecked 1 file\n', 'check'), {
    cause: 'processed-count-inconsistent',
  });
});

Deno.test('runFmt seam fails closed on malformed and inconsistent completion evidence', async () => {
  const options = { cwd: '/repo', batchSize: 2, check: true };
  const malformed = await runFmt(
    ['a.ts'],
    options,
    (batch) =>
      Promise.resolve({
        files: batch.files,
        exitCode: 0,
        output: 'Checked nope files\r\n',
      }),
  );
  assertEquals(malformed.coverage, {
    filesSelected: 1,
    droppedFiles: [],
    refusals: [{
      cause: 'processed-count-unavailable',
      filesSelected: 1,
      droppedFiles: [],
      unverifiedFiles: ['a.ts'],
    }],
  });

  const inconsistentRunner: BatchRunner = (batch) =>
    Promise.resolve({
      files: batch.files,
      exitCode: 0,
      output: checked(1),
    });
  const inconsistent = await runFmt(['a.ts', 'b.ts'], options, inconsistentRunner);
  assertEquals(inconsistent.coverage, {
    filesSelected: 2,
    droppedFiles: [],
    refusals: [{
      cause: 'processed-count-inconsistent',
      filesSelected: 2,
      droppedFiles: [],
      unverifiedFiles: ['a.ts', 'b.ts'],
    }],
  });
});

Deno.test('runFmt write mismatch probes are non-mutating check classifications', async () => {
  const observedModes: boolean[] = [];
  const runner: BatchRunner = (batch, options) => {
    observedModes.push(options.check);
    if (batch.files.length === 2) {
      return Promise.resolve({
        files: batch.files,
        exitCode: 1,
        output: 'error: Failed to format 1 of 1 checked file\n',
      });
    }
    if (batch.files[0] === 'excluded.ts') {
      return Promise.resolve({
        files: batch.files,
        exitCode: 1,
        output: 'No target files found.\n',
      });
    }
    return Promise.resolve({
      files: batch.files,
      exitCode: 1,
      output: 'error: Found 1 not formatted file in 1 file\n',
    });
  };

  const result = await runFmt(
    ['crash.ts', 'excluded.ts'],
    { cwd: '/repo', batchSize: 2, check: false },
    runner,
  );

  assertEquals(observedModes, [false, true, true]);
  assertEquals(result.coverage, {
    filesSelected: 2,
    filesProcessed: 1,
    droppedFiles: ['excluded.ts'],
    refusals: [{
      cause: 'partial-exclusion',
      filesSelected: 2,
      filesProcessed: 1,
      droppedFiles: ['excluded.ts'],
    }],
  });
});

Deno.test('CLI skips only a marked subtree and still selects its unmarked sibling', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/marked`);
    await Deno.mkdir(`${root}/unmarked`);
    await Deno.writeTextFile(`${root}/marked/.deno-fmt-lint-ignore`, 'deliberately invalid\n');
    await Deno.writeTextFile(`${root}/marked/deno.json`, '{"workspace":true}\n');
    await Deno.writeTextFile(`${root}/marked/hidden.ts`, 'export const hidden=1;\n');
    await Deno.writeTextFile(`${root}/unmarked/visible.ts`, 'export const visible = 1;\n');

    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-run',
        new URL('./run-deno-fmt.ts', import.meta.url).pathname,
        '--cwd',
        root,
        '--root',
        '.',
        '--ext',
        'ts',
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();

    assertEquals(output.code, 0);
    const report = JSON.parse(new TextDecoder().decode(output.stdout));
    assertEquals(report.summary.filesSelected, 1);
    assertEquals(report.summary.batches, 1);
    assertEquals(report.summary.failedBatches, 0);
    assertEquals(report.coverage, {
      filesSelected: 1,
      filesProcessed: 1,
      droppedFiles: [],
      refusals: [],
    });
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('config batches preserve membership with and without directory memoization', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/root-style`);
    await Deno.mkdir(`${root}/nested`);
    await Deno.writeTextFile(`${root}/deno.json`, '{"fmt":{"singleQuote":true}}\n');
    await Deno.writeTextFile(`${root}/nested/deno.json`, '{"fmt":{"singleQuote":false}}\n');
    await Deno.writeTextFile(
      `${root}/root-style/value.ts`,
      "export const rootValue = 'root';\n",
    );
    await Deno.writeTextFile(
      `${root}/nested/value.ts`,
      'export const nestedValue = "nested";\n',
    );

    const files = ['nested/value.ts', 'root-style/value.ts'];
    const uncached = await buildConfigBatches(files, root, 200);
    const cached = await buildConfigBatches(files, root, 200, undefined, new Map());
    assertEquals(cached, uncached);
    assertEquals(uncached.map((batch) => batch.files), [
      ['nested/value.ts'],
      ['root-style/value.ts'],
    ]);

    const explicit = await buildConfigBatches(files, root, 1, 'deno.json', new Map());
    assertEquals(explicit.map((batch) => batch.files), [
      ['nested/value.ts'],
      ['root-style/value.ts'],
    ]);
    assertEquals(new Set(explicit.map((batch) => batch.config)).size, 1);

    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-run',
        new URL('./run-deno-fmt.ts', import.meta.url).pathname,
        '--cwd',
        root,
        '--root',
        '.',
        '--ext',
        'ts',
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, 0);
    const report = JSON.parse(new TextDecoder().decode(output.stdout));
    assertEquals(report.summary.filesSelected, 2);
    assertEquals(report.summary.batches, 2);
    assertEquals(report.summary.failedBatches, 0);
    assertEquals(report.coverage.filesProcessed, 2);
    assertEquals(report.coverage.refusals, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('CLI refuses an empty format selection', async () => {
  const root = await Deno.makeTempDir();
  try {
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-run',
        new URL('./run-deno-fmt.ts', import.meta.url).pathname,
        '--cwd',
        root,
        '--ext',
        'ts',
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, 2);
    const report = JSON.parse(new TextDecoder().decode(output.stdout));
    assertEquals(report.summary.filesSelected, 0);
    assertEquals(report.coverage, {
      filesSelected: 0,
      filesProcessed: 0,
      droppedFiles: [],
      refusals: [{
        cause: 'empty-selection',
        filesSelected: 0,
        filesProcessed: 0,
        droppedFiles: [],
      }],
    });
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('CLI fails when Deno config excludes every selected format target', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(`${root}/deno.json`, '{"fmt":{"exclude":["generated/"]}}\n');
    await Deno.mkdir(`${root}/generated`);
    await Deno.writeTextFile(`${root}/generated/file.ts`, 'export const value=1;\n');
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-run',
        new URL('./run-deno-fmt.ts', import.meta.url).pathname,
        '--cwd',
        root,
        '--file',
        'generated/file.ts',
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, 2);
    const report = JSON.parse(new TextDecoder().decode(output.stdout));
    assertEquals(report.summary.failedBatches, 1);
    assertEquals(report.coverage, {
      filesSelected: 1,
      filesProcessed: 0,
      droppedFiles: ['generated/file.ts'],
      refusals: [{
        cause: 'all-excluded',
        filesSelected: 1,
        filesProcessed: 0,
        droppedFiles: ['generated/file.ts'],
      }],
    });
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('CLI atomically persists its structured format report', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(`${root}/valid.ts`, 'export const value = 1;\n');
    const reportPath = `${root}/report.json`;
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-write',
        '--allow-run',
        new URL('./run-deno-fmt.ts', import.meta.url).pathname,
        '--cwd',
        root,
        '--root',
        '.',
        '--ext',
        'ts',
        '--output',
        reportPath,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, 0);
    assertEquals(JSON.parse(new TextDecoder().decode(output.stdout)).report, reportPath);
    const report = JSON.parse(await Deno.readTextFile(reportPath));
    assertEquals(report.summary.filesSelected, 1);
    assertEquals(report.coverage.filesProcessed, 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('CLI mixed fmt exclusion refuses identically at batch sizes 1 2 and 200', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/generated`, { recursive: true });
    await Deno.mkdir(`${root}/included`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/deno.json`,
      JSON.stringify({ fmt: { exclude: ['generated/'] } }),
    );
    await Deno.writeTextFile(`${root}/clean.ts`, 'export const clean = 1;\n');
    const bad = 'export const bad=1;\n';
    await Deno.writeTextFile(`${root}/generated/bad.ts`, bad);
    await Deno.writeTextFile(`${root}/included/bad.ts`, bad);

    const included = await runCli(root, ['included/bad.ts'], 200);
    assertEquals(included.code, 1);
    assertEquals(included.report.coverage, {
      filesSelected: 1,
      filesProcessed: 1,
      droppedFiles: [],
      refusals: [],
    });
    assertEquals(included.report.summary.findings, 1);

    for (const batchSize of [1, 2, 200]) {
      const mixed = await runCli(root, ['generated/bad.ts', 'clean.ts'], batchSize);
      assertEquals(mixed.code, 2);
      assertEquals(mixed.report.coverage, {
        filesSelected: 2,
        filesProcessed: 1,
        droppedFiles: ['generated/bad.ts'],
        refusals: [{
          cause: 'partial-exclusion',
          filesSelected: 2,
          filesProcessed: 1,
          droppedFiles: ['generated/bad.ts'],
        }],
      });
      assertEquals(mixed.report.findings, []);
      assertEquals(countText(mixed.stderr, 'generated/bad.ts'), 1);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('CLI fmt crash precedence is invariant in check and write modes', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/excluded`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/deno.json`,
      JSON.stringify({ fmt: { exclude: ['excluded/'] } }),
    );
    await Deno.writeTextFile(`${root}/clean.ts`, 'export const clean = 1;\n');
    await Deno.writeTextFile(`${root}/syntax.ts`, 'export const syntax = {\n');
    await Deno.writeTextFile(`${root}/excluded/dropped.ts`, 'export const dropped=1;\n');

    for (const write of [false, true]) {
      for (const batchSize of [1, 2, 200]) {
        const crashOnly = await runCli(root, ['clean.ts', 'syntax.ts'], batchSize, write);
        assertEquals(crashOnly.code, 1);
        assertEquals(crashOnly.report.coverage, {
          filesSelected: 2,
          filesProcessed: 2,
          droppedFiles: [],
          refusals: [],
        });
        assertEquals(countText(crashOnly.stderr, 'SyntaxError'), 1);

        const crashAndDrop = await runCli(
          root,
          ['clean.ts', 'syntax.ts', 'excluded/dropped.ts'],
          batchSize,
          write,
        );
        assertEquals(crashAndDrop.code, 2);
        assertEquals(crashAndDrop.report.coverage, {
          filesSelected: 3,
          filesProcessed: 2,
          droppedFiles: ['excluded/dropped.ts'],
          refusals: [{
            cause: 'partial-exclusion',
            filesSelected: 3,
            filesProcessed: 2,
            droppedFiles: ['excluded/dropped.ts'],
          }],
        });
        assertEquals(countText(crashAndDrop.stderr, 'SyntaxError'), 1);
        assertEquals(JSON.stringify(crashAndDrop.report.coverage).includes('SyntaxError'), false);
      }
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('lint and fmt expose identical coverage keys and causes', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/generated`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/deno.json`,
      JSON.stringify({
        lint: { exclude: ['generated/'] },
        fmt: { exclude: ['generated/'] },
      }),
    );
    await Deno.writeTextFile(`${root}/clean.ts`, 'export const clean = 1;\n');
    await Deno.writeTextFile(`${root}/generated/dropped.ts`, 'export const dropped=1;\n');

    const cases = [
      { files: ['clean.ts', 'generated/dropped.ts'], extra: [] },
      { files: ['generated/dropped.ts'], extra: [] },
      { files: [], extra: ['--include', '^never$'] },
    ];

    for (const testCase of cases) {
      const lint = await runLintCoverage(root, testCase.files, testCase.extra);
      const fmt = await runCli(root, testCase.files, 200, false, testCase.extra);
      assertEquals(lint.code, 2);
      assertEquals(fmt.code, 2);
      assertEquals(Object.keys(lint.coverage).sort(), Object.keys(fmt.report.coverage).sort());
      assertEquals(
        Object.keys(lint.coverage.refusals[0]).sort(),
        Object.keys(fmt.report.coverage.refusals[0]).sort(),
      );
      assertEquals(lint.coverage.refusals[0].cause, fmt.report.coverage.refusals[0].cause);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
