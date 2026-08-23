import { assert, assertEquals, assertStringIncludes } from '@std/assert';

import { type BatchRunner, buildConfigBatches, formatFailures, runLint } from './run-deno-lint.ts';

const options = { cwd: '/repo', batchSize: 2 };

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
        ? { code: 1, stdout: '', stderr: crash }
        : { code: 0, stdout: '', stderr: '' },
    );

  const result = await runLint(['a.ts', 'b.ts', 'c.ts', 'd.ts'], options, runner);

  assertEquals(result.exitCode, 1);
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
  ].join('\n');
  const runner: BatchRunner = () => Promise.resolve({ code: 1, stdout: finding, stderr: '' });

  const result = await runLint(['a.ts'], options, runner);

  assertEquals(result.exitCode, 1);
  // Non-zero, but the occurrence is parseable — it is a lint finding, not a crash.
  assertEquals(result.failures, []);
  assertStringIncludes(result.text, 'no-explicit-any');
});

Deno.test('runLint fails closed when Deno excludes an otherwise selected batch', async () => {
  const runner: BatchRunner = () =>
    Promise.resolve({ code: 1, stdout: '', stderr: 'No target files found.' });

  const result = await runLint(['a.ts'], options, runner);

  assertEquals(result.exitCode, 2);
  assertEquals(result.noTargetBatches, 1);
  assertEquals(result.failures, []);
});

Deno.test('runLint reports every failing batch, not just the first', async () => {
  const runner: BatchRunner = (files) =>
    Promise.resolve({ code: 2, stdout: '', stderr: `boom on ${files[0]}` });

  const result = await runLint(['a.ts', 'b.ts', 'c.ts'], options, runner);

  assertEquals(result.exitCode, 2);
  assertEquals(result.failures.map((failure) => failure.batchIndex), [0, 1]);
  assert(result.failures.every((failure) => failure.stderr.startsWith('boom on ')));
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
    assertEquals(JSON.parse(new TextDecoder().decode(output.stdout)).selection.filesSelected, 0);
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
    assertEquals(JSON.parse(new TextDecoder().decode(output.stdout)).selection.excludedBatches, 1);
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
    assertEquals(JSON.parse(await Deno.readTextFile(reportPath)).selection.filesSelected, 1);
  } finally {
    await Deno.remove(root, { recursive: true });
  }
});
