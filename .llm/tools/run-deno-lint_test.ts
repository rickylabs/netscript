import { assert, assertEquals, assertStringIncludes } from '@std/assert';

import { type BatchRunner, formatFailures, runLint } from './run-deno-lint.ts';

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

Deno.test('runLint tolerates the empty-batch "No target files found." exit', async () => {
  const runner: BatchRunner = () =>
    Promise.resolve({ code: 1, stdout: '', stderr: 'No target files found.' });

  const result = await runLint(['a.ts'], options, runner);

  assertEquals(result.exitCode, 0);
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
