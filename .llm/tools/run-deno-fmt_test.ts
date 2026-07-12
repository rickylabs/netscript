import { assertEquals, assertStringIncludes } from '@std/assert';

import { type BatchResult, formatFailedBatches } from './run-deno-fmt.ts';

/**
 * Regression: `deno task fmt:check` exited 1 with `findings: 0` and no diagnostics. A `deno fmt`
 * batch that exits non-zero WITHOUT a parseable formatting finding is a crash — the real instance
 * was a nested `deno.json` test fixture with an intentionally malformed `workspace` key, which makes
 * `deno fmt` abort during config discovery. The wrapper detected the failed batch (so it exited 1)
 * but never surfaced its output, so CI showed nothing to act on.
 */
Deno.test('formatFailedBatches surfaces a crashed batch: exit code, files, and output', () => {
  const crash = 'error: Failed to parse "workspace" configuration.';
  const results: BatchResult[] = [
    { files: ['a.ts', 'b.ts'], exitCode: 0, output: '' },
    { files: ['c.ts', 'd.ts'], exitCode: 1, output: crash },
  ];

  const rendered = formatFailedBatches(results);

  assertStringIncludes(rendered, '1 deno fmt batch(es) failed');
  assertStringIncludes(rendered, 'not a formatting difference');
  assertStringIncludes(rendered, 'exit 1');
  assertStringIncludes(rendered, 'c.ts');
  assertStringIncludes(rendered, 'Failed to parse "workspace" configuration.');
});

Deno.test('formatFailedBatches ignores the "No target files found." empty-batch exit', () => {
  const results: BatchResult[] = [
    { files: ['a.ts'], exitCode: 1, output: 'No target files found.' },
  ];

  const rendered = formatFailedBatches(results);

  assertStringIncludes(rendered, '0 deno fmt batch(es) failed');
  assertEquals(rendered.includes('exit 1'), false);
});

Deno.test('formatFailedBatches strips ANSI and reports every failing batch', () => {
  const esc = String.fromCharCode(27);
  const results: BatchResult[] = [
    { files: ['a.ts'], exitCode: 2, output: `${esc}[31mboom a${esc}[0m` },
    { files: ['b.ts'], exitCode: 2, output: `${esc}[31mboom b${esc}[0m` },
  ];

  const rendered = formatFailedBatches(results);

  assertStringIncludes(rendered, '2 deno fmt batch(es) failed');
  assertStringIncludes(rendered, 'boom a');
  assertStringIncludes(rendered, 'boom b');
  // ANSI escapes must not leak into the CI log.
  assertEquals(rendered.includes(esc), false);
});
