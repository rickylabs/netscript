import { assert, assertEquals, assertStringIncludes } from '@std/assert';

import {
  type BatchRunner,
  buildConfigBatches,
  type CoverageReport,
  formatFailures,
  parseLintCompletion,
  runLint,
} from './run-deno-lint.ts';

const options = { cwd: '/repo', batchSize: 2 };
const toolPath = new URL('./run-deno-lint.ts', import.meta.url).pathname;
const decoder = new TextDecoder();

interface CliReport {
  source: { mode: string };
  selection?: { filesSelected: number; batches: number; failedBatches: number };
  coverage?: CoverageReport;
  summary: { totalOccurrences: number };
  groups: unknown[];
  failures?: unknown[];
}

function checked(fileCount: number, lineEnding = '\n'): string {
  return `Checked ${fileCount} ${fileCount === 1 ? 'file' : 'files'}${lineEnding}`;
}

async function runCli(
  root: string,
  files: string[],
  batchSize: number,
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

function countText(text: string, pattern: string): number {
  return text.split(pattern).length - 1;
}

/**
 * Regression: a `deno lint` batch that exits non-zero WITHOUT any parseable lint occurrence used to
 * propagate its exit code while its stderr was swallowed into the occurrence parser. CI then showed
 * an exit-1 report with `groups: []` and zero diagnostics — the failure was invisible.
 *
 * The real instance was a nested `deno.json` test fixture with an intentionally malformed
 * `workspace` key, which makes `deno lint` abort during config discovery.
 */
Deno.test('runLint captures a batch that fails without lint occurrences', async () => {
  const crash = 'error: Failed to parse "workspace" configuration.';
  const runner: BatchRunner = (files) =>
    Promise.resolve(
      files.includes('b.ts')
        ? { code: 1, stdout: '', stderr: `${crash}\n${checked(files.length)}` }
        : { code: 0, stdout: '', stderr: checked(files.length) },
    );

  const result = await runLint(['a.ts', 'b.ts', 'c.ts', 'd.ts'], options, runner);

  assertEquals(result.exitCode, 1);
  assertEquals(result.coverage, {
    filesSelected: 4,
    filesProcessed: 4,
    droppedFiles: [],
    refusals: [],
  });
  assertEquals(result.failures.length, 1);

  const [failure] = result.failures;
  assertEquals(failure.batchIndex, 0);
  assertEquals(failure.exitCode, 1);
  assertEquals(failure.files, ['a.ts', 'b.ts']);
  assertStringIncludes(failure.stderr, 'Failed to parse "workspace" configuration.');

  // The rendered message must name the exit code, the file set, and the underlying stderr.
  const rendered = formatFailures(result.failures);
  assertStringIncludes(rendered, 'exit 1');
  assertStringIncludes(rendered, 'b.ts');
  assertStringIncludes(rendered, 'Failed to parse "workspace" configuration.');
});

Deno.test('runLint does not treat ordinary lint findings as batch failures', async () => {
  const finding = [
    'error[no-explicit-any]: `any` type is not allowed',
    ' --> /repo/a.ts:3:10',
    'Checked 1 file',
  ].join('\n');
  const runner: BatchRunner = () => Promise.resolve({ code: 1, stdout: finding, stderr: '' });

  const result = await runLint(['a.ts'], options, runner);

  assertEquals(result.exitCode, 1);
  // Non-zero, but the occurrence is parseable — it is a lint finding, not a crash.
  assertEquals(result.failures, []);
  assertEquals(result.coverage.filesProcessed, 1);
  assertEquals(result.coverage.refusals, []);
  assertStringIncludes(result.text, 'no-explicit-any');
});

Deno.test('runLint fails closed when Deno excludes an otherwise selected batch', async () => {
  const runner: BatchRunner = () =>
    Promise.resolve({ code: 1, stdout: '', stderr: 'No target files found.' });

  const result = await runLint(['a.ts'], options, runner);

  assertEquals(result.exitCode, 2);
  assertEquals(result.noTargetBatches, 1);
  assertEquals(result.failures, []);
  assertEquals(result.coverage, {
    filesSelected: 1,
    filesProcessed: 0,
    droppedFiles: ['a.ts'],
    refusals: [{
      cause: 'all-excluded',
      filesSelected: 1,
      filesProcessed: 0,
      droppedFiles: ['a.ts'],
    }],
  });
});

Deno.test('runLint reports every failing batch, not just the first', async () => {
  const runner: BatchRunner = (files) =>
    Promise.resolve({
      code: 2,
      stdout: '',
      stderr: `boom on ${files[0]}\n${checked(files.length)}`,
    });

  const result = await runLint(['a.ts', 'b.ts', 'c.ts'], options, runner);

  assertEquals(result.exitCode, 1);
  assertEquals(result.failures.map((failure) => failure.batchIndex), [0, 1]);
  assert(result.failures.every((failure) => failure.stderr.startsWith('boom on ')));
  assertEquals(result.coverage.filesProcessed, 3);
});

Deno.test('lint completion adapter pins singular plural ANSI LF and CRLF forms', () => {
  assertEquals(parseLintCompletion('Checked 1 file\n'), { processedCount: 1 });
  assertEquals(parseLintCompletion('Checked 2 files\r\n'), { processedCount: 2 });
  assertEquals(
    parseLintCompletion(
      `${String.fromCharCode(27)}[32mChecked 3 files${String.fromCharCode(27)}[0m\n`,
    ),
    { processedCount: 3 },
  );
  assertEquals(parseLintCompletion('Checked nope files\n'), {
    cause: 'processed-count-unavailable',
  });
  assertEquals(parseLintCompletion('Checked 1 file\nChecked 1 file\n'), {
    cause: 'processed-count-inconsistent',
  });
});

Deno.test('runLint fails closed on malformed and inconsistent completion evidence', async () => {
  const malformed = await runLint(
    ['a.ts'],
    options,
    () => Promise.resolve({ code: 0, stdout: '', stderr: 'Checked nope files\r\n' }),
  );
  assertEquals(malformed.exitCode, 2);
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

  const inconsistentRunner: BatchRunner = (files) =>
    Promise.resolve({
      code: 0,
      stdout: '',
      stderr: files.length === 2 ? checked(1) : checked(1),
    });
  const inconsistent = await runLint(['a.ts', 'b.ts'], options, inconsistentRunner);
  assertEquals(inconsistent.exitCode, 2);
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

Deno.test('CLI skips only a marked subtree and still selects its unmarked sibling', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/marked`);
    await Deno.mkdir(`${root}/unmarked`);
    await Deno.writeTextFile(`${root}/marked/.deno-fmt-lint-ignore`, 'deliberately invalid\n');
    await Deno.writeTextFile(`${root}/marked/deno.json`, '{"workspace":true}\n');
    await Deno.writeTextFile(`${root}/marked/hidden.ts`, 'export const hidden = 1;\n');
    await Deno.writeTextFile(`${root}/unmarked/visible.ts`, 'export const visible = 1;\n');

    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-run',
        new URL('./run-deno-lint.ts', import.meta.url).pathname,
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
    assertEquals(report.selection.filesSelected, 1);
    assertEquals(report.selection.batches, 1);
    assertEquals(report.selection.failedBatches, 0);
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
    await Deno.mkdir(`${root}/root-config`);
    await Deno.mkdir(`${root}/nested`);
    await Deno.writeTextFile(`${root}/deno.json`, '{"lint":{"rules":{"tags":["recommended"]}}}\n');
    await Deno.writeTextFile(
      `${root}/nested/deno.json`,
      '{"lint":{"rules":{"tags":["recommended"]}}}\n',
    );
    await Deno.writeTextFile(`${root}/root-config/value.ts`, 'export const rootValue = 1;\n');
    await Deno.writeTextFile(`${root}/nested/value.ts`, 'export const nestedValue = 1;\n');

    const files = ['nested/value.ts', 'root-config/value.ts'];
    const uncached = await buildConfigBatches(files, root, 200);
    const cached = await buildConfigBatches(files, root, 200, undefined, new Map());
    assertEquals(cached, uncached);
    assertEquals(uncached.map((batch) => batch.files), [
      ['nested/value.ts'],
      ['root-config/value.ts'],
    ]);

    const explicit = await buildConfigBatches(files, root, 1, 'deno.json', new Map());
    assertEquals(explicit.map((batch) => batch.files), [
      ['nested/value.ts'],
      ['root-config/value.ts'],
    ]);
    assertEquals(new Set(explicit.map((batch) => batch.config)).size, 1);

    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-run',
        new URL('./run-deno-lint.ts', import.meta.url).pathname,
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
    assertEquals(report.selection.filesSelected, 2);
    assertEquals(report.selection.batches, 2);
    assertEquals(report.selection.failedBatches, 0);
    assertEquals(report.coverage.filesProcessed, 2);
    assertEquals(report.coverage.refusals, []);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('CLI refuses an empty lint selection', async () => {
  const root = await Deno.makeTempDir();
  try {
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-run',
        new URL('./run-deno-lint.ts', import.meta.url).pathname,
        '--cwd',
        root,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, 2);
    const report = JSON.parse(new TextDecoder().decode(output.stdout));
    assertEquals(report.selection.filesSelected, 0);
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

Deno.test('CLI fails when Deno config excludes every selected lint target', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(`${root}/deno.json`, '{"exclude":["generated/"]}\n');
    await Deno.mkdir(`${root}/generated`);
    await Deno.writeTextFile(`${root}/generated/file.ts`, 'export const value = 1;\n');
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-run',
        new URL('./run-deno-lint.ts', import.meta.url).pathname,
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
    assertEquals(report.selection.excludedBatches, 1);
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

Deno.test('CLI atomically persists its structured lint report', async () => {
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
        new URL('./run-deno-lint.ts', import.meta.url).pathname,
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
    const report = JSON.parse(await Deno.readTextFile(reportPath));
    assertEquals(report.selection.filesSelected, 1);
    assertEquals(report.coverage.filesProcessed, 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('CLI input mode omits selection coverage', async () => {
  const root = await Deno.makeTempDir();
  try {
    const input = `${root}/lint.log`;
    await Deno.writeTextFile(input, checked(1));
    const output = await new Deno.Command(Deno.execPath(), {
      args: [
        'run',
        '--allow-read',
        '--allow-run',
        toolPath,
        '--input',
        input,
      ],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assertEquals(output.code, 0);
    const report = JSON.parse(decoder.decode(output.stdout));
    assertEquals(report.source.mode, 'file');
    assertEquals(report.selection, undefined);
    assertEquals(report.coverage, undefined);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('CLI mixed lint exclusion refuses identically at batch sizes 1 2 and 200', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/.llm/tools`, { recursive: true });
    await Deno.mkdir(`${root}/.github/scripts`, { recursive: true });
    await Deno.mkdir(`${root}/included`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/deno.json`,
      JSON.stringify({
        lint: { exclude: ['.llm/'], rules: { include: ['no-explicit-any'] } },
      }),
    );
    const violation = 'export const value: any = 1;\n';
    await Deno.writeTextFile(`${root}/.llm/tools/probe.ts`, violation);
    await Deno.writeTextFile(
      `${root}/.github/scripts/ci-classify-changes.ts`,
      'export const clean = 1;\n',
    );
    await Deno.writeTextFile(`${root}/included/probe.ts`, violation);

    const included = await runCli(root, ['included/probe.ts'], 200);
    assertEquals(included.code, 1);
    assertEquals(included.report.coverage, {
      filesSelected: 1,
      filesProcessed: 1,
      droppedFiles: [],
      refusals: [],
    });
    assertEquals(included.report.summary.totalOccurrences, 1);

    for (const batchSize of [1, 2, 200]) {
      const mixed = await runCli(
        root,
        ['.llm/tools/probe.ts', '.github/scripts/ci-classify-changes.ts'],
        batchSize,
      );
      assertEquals(mixed.code, 2);
      assertEquals(mixed.report.coverage, {
        filesSelected: 2,
        filesProcessed: 1,
        droppedFiles: ['.llm/tools/probe.ts'],
        refusals: [{
          cause: 'partial-exclusion',
          filesSelected: 2,
          filesProcessed: 1,
          droppedFiles: ['.llm/tools/probe.ts'],
        }],
      });
      assertEquals(mixed.report.groups, []);
      assertEquals(countText(mixed.stderr, '.llm/tools/probe.ts'), 1);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test('CLI crash coverage and precedence are invariant at batch sizes 1 2 and 200', async () => {
  const root = await Deno.makeTempDir();
  try {
    await Deno.mkdir(`${root}/excluded`, { recursive: true });
    await Deno.writeTextFile(
      `${root}/deno.json`,
      JSON.stringify({ lint: { exclude: ['excluded/'] } }),
    );
    await Deno.writeTextFile(`${root}/clean.ts`, 'export const clean = 1;\n');
    await Deno.writeTextFile(`${root}/syntax.ts`, 'export const syntax = {\n');
    await Deno.writeTextFile(`${root}/excluded/dropped.ts`, 'export const dropped = 1;\n');

    for (const batchSize of [1, 2, 200]) {
      const crashOnly = await runCli(root, ['clean.ts', 'syntax.ts'], batchSize);
      assertEquals(crashOnly.code, 1);
      assertEquals(crashOnly.report.coverage, {
        filesSelected: 2,
        filesProcessed: 2,
        droppedFiles: [],
        refusals: [],
      });
      assertEquals(crashOnly.report.failures?.length, 1);
      assertEquals(countText(crashOnly.stderr, 'SyntaxError'), 1);

      const crashAndDrop = await runCli(
        root,
        ['clean.ts', 'syntax.ts', 'excluded/dropped.ts'],
        batchSize,
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
      assertEquals(crashAndDrop.report.failures?.length, 1);
      assertEquals(countText(crashAndDrop.stderr, 'SyntaxError'), 1);
      assertEquals(JSON.stringify(crashAndDrop.report.coverage).includes('SyntaxError'), false);
    }
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
