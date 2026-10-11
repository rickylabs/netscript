import { assert, assertEquals } from '@std/assert';

import { DenoProcess } from './deno-process.ts';

Deno.test('DenoProcess kills and awaits a child after the configured timeout', async () => {
  const startedAt = performance.now();
  const result = await new DenoProcess().exec(
    'deno',
    ['eval', 'setInterval(() => {}, 1_000)'],
    { timeoutMs: 50 },
  );

  assertEquals(result.timedOut, true);
  assertEquals(performance.now() - startedAt < 2_000, true);
});

Deno.test('DenoProcess can start a child with an empty inherited environment', async () => {
  const result = await new DenoProcess().exec(
    'deno',
    ['eval', "console.log(Deno.env.has('HOME'))"],
    { clearEnv: true },
  );

  assertEquals(result.code, 0);
  assertEquals(result.stdout.trim(), 'false');
});

Deno.test('DenoProcess closes piped stdin before timeout kills and awaits the child', async () => {
  const startedAt = performance.now();
  const result = await new DenoProcess().exec(
    'deno',
    [
      'eval',
      "await new Response(Deno.stdin.readable).text(); console.log('stdin-closed'); setInterval(() => {}, 1_000);",
    ],
    { stdin: 'rendered source', timeoutMs: 250 },
  );

  assertEquals(result.stdout.trim(), 'stdin-closed');
  assertEquals(result.timedOut, true);
  assertEquals(performance.now() - startedAt < 2_000, true);
});

Deno.test('DenoProcess bounds child output and fails when the capture capacity is exceeded', async () => {
  const process = new DenoProcess();
  const result = await process.exec(Deno.execPath(), ['eval', 'console.log("x".repeat(10000));'], {
    maxOutputBytes: 1024,
    timeoutMs: 5000,
  });
  assertEquals(result.code, 1);
  assertEquals(result.stderr, 'Process output capacity exceeded.');
  assert(result.stdout.length <= 1024);
});

Deno.test('DenoProcess retains exact output within its capture capacity', async () => {
  const result = await new DenoProcess().exec(Deno.execPath(), [
    'eval',
    'console.log("within"); console.error("error");',
  ], { maxOutputBytes: 1024 });
  assertEquals(result.code, 0);
  assertEquals(result.stdout, 'within\n');
  assertEquals(result.stderr, 'error\n');
});
