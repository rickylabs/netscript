import { assertEquals } from '@std/assert';

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
