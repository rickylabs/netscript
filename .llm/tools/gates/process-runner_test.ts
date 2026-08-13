import { assertEquals, assertStringIncludes } from '@std/assert';

import { runProcess } from './process-runner.ts';

const cwd = Deno.cwd();

Deno.test('process runner preserves nonzero exit and output evidence', async () => {
  const result = await runProcess(
    [Deno.execPath(), 'eval', 'console.log("seen"); console.error("broken"); Deno.exit(7)'],
    { cwd, timeoutMs: 5_000 },
  );
  assertEquals(result.outcome, 'FAIL');
  assertEquals(result.exitCode, 7);
  assertStringIncludes(result.stdout.tail, 'seen');
  assertStringIncludes(result.stderr.tail, 'broken');
  assertEquals(result.stdout.sha256.length, 64);
});

Deno.test('process runner reports spawn failure', async () => {
  const result = await runProcess(
    [`missing-gate-command-${crypto.randomUUID()}`],
    { cwd, timeoutMs: 5_000 },
  );
  assertEquals(result.outcome, 'SPAWN_FAILED');
  assertEquals(result.exitCode, undefined);
});

Deno.test('process runner terminates a timed out child', async () => {
  const result = await runProcess(
    [Deno.execPath(), 'eval', 'setInterval(() => {}, 1000)'],
    { cwd, timeoutMs: 50 },
  );
  assertEquals(result.outcome, 'TIMED_OUT');
  assertStringIncludes(result.reason ?? '', 'exceeded');
});

Deno.test('process runner records interruption distinctly from timeout', async () => {
  const controller = new AbortController();
  const pending = runProcess(
    [Deno.execPath(), 'eval', 'setInterval(() => {}, 1000)'],
    { cwd, timeoutMs: 5_000, signal: controller.signal },
  );
  setTimeout(() => controller.abort(), 50);
  const result = await pending;
  assertEquals(result.outcome, 'INTERRUPTED');
});

Deno.test('process runner bounds retained output while hashing the full stream', async () => {
  const result = await runProcess(
    [Deno.execPath(), 'eval', 'console.log("a".repeat(10000) + "END")'],
    { cwd, timeoutMs: 5_000, tailBytes: 128 },
  );
  assertEquals(result.outcome, 'PASS');
  assertEquals(result.stdout.truncated, true);
  assertStringIncludes(result.stdout.tail, 'END');
});
