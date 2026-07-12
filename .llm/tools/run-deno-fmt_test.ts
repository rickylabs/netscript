import { assertEquals, assertStringIncludes } from '@std/assert';

import { type BatchResult, crashedBatches, formatFailedBatches } from './run-deno-fmt.ts';

const CRASH = 'error: Failed to parse "workspace" configuration.';

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
