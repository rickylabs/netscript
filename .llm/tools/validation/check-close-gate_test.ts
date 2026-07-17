import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { fetchGitHubJsonWithRetry } from './check-close-gate.ts';

Deno.test('close-gate retries transient GitHub failures before returning JSON', async () => {
  const statuses = [503, 502, 200];
  const delays: number[] = [];
  let authenticatedCalls = 0;
  let anonymousCalls = 0;
  const result = await fetchGitHubJsonWithRetry<{ ok: boolean }>(
    'https://api.github.test/pulls/772',
    'test-token',
    {
      fetch: (_url, init) => {
        const authenticated = new Headers(init?.headers).has('authorization');
        if (!authenticated) {
          anonymousCalls++;
          return Promise.resolve(new Response('private', { status: 404 }));
        }
        const status = statuses[authenticatedCalls++];
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
  assertEquals(authenticatedCalls, 3);
  assertEquals(anonymousCalls, 2);
  assertEquals(delays, [1_000, 2_000]);
});

Deno.test('close-gate falls back to public metadata after an authenticated 5xx', async () => {
  const authorizations: boolean[] = [];
  const result = await fetchGitHubJsonWithRetry<{ number: number }>(
    'https://api.github.test/pulls/772',
    'test-token',
    {
      fetch: (_url, init) => {
        const authenticated = new Headers(init?.headers).has('authorization');
        authorizations.push(authenticated);
        return Promise.resolve(
          authenticated
            ? new Response('transient', { status: 503 })
            : Response.json({ number: 772 }),
        );
      },
      sleep: () => Promise.resolve(),
    },
  );

  assertEquals(result, { number: 772 });
  assertEquals(authorizations, [true, false]);
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
