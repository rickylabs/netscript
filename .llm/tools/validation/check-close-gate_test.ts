import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { fetchGitHubJsonWithRetry } from './check-close-gate.ts';

Deno.test('close-gate retries transient GitHub failures before returning JSON', async () => {
  const statuses = [503, 502, 200];
  const delays: number[] = [];
  let calls = 0;
  const result = await fetchGitHubJsonWithRetry<{ ok: boolean }>(
    'https://api.github.test/pulls/772',
    'test-token',
    {
      fetch: () => {
        const status = statuses[calls++];
        return Promise.resolve(
          new Response(
            status === 200 ? JSON.stringify({ ok: true }) : 'transient',
            { status, headers: { 'content-type': 'application/json' } },
          ),
        );
      },
      sleep: (milliseconds) => {
        delays.push(milliseconds);
        return Promise.resolve();
      },
    },
  );

  assertEquals(result, { ok: true });
  assertEquals(calls, 3);
  assertEquals(delays, [1_000, 2_000]);
});

Deno.test('close-gate does not retry non-transient GitHub failures', async () => {
  let calls = 0;
  await assertRejects(
    () =>
      fetchGitHubJsonWithRetry('https://api.github.test/pulls/772', 'test-token', {
        fetch: () => {
          calls++;
          return Promise.resolve(new Response('forbidden', { status: 403 }));
        },
        sleep: () => Promise.resolve(),
      }),
    Error,
    '403 forbidden',
  );
  assertEquals(calls, 1);
});
