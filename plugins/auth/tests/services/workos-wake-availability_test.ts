import { assert, assertEquals } from '@std/assert';
import { deadline } from '@std/async';
import { MemoryKvAdapter } from '@netscript/kv';
import { createAuthServiceBackendRegistry } from '../../services/src/backend-registry.ts';
import { sessionRequest } from '../../../../packages/auth-workos/tests/testing/revocation-fixture.ts';

Deno.test('WorkOS registry wakes a fully idle worker after sign-out-everywhere and admits a fresh sign-in promptly', async () => {
  await using kv = new MemoryKvAdapter();
  const idle = Promise.withResolvers<void>();
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const completed = Promise.withResolvers<void>();
  const revoked: string[] = [];
  const cutoff = Date.now() - 60_000;
  let lists = 0;
  let waits = 0;
  const registry = await createAuthServiceBackendRegistry({
    kv,
    env: {
      NETSCRIPT_AUTH_BACKEND: 'workos',
      NETSCRIPT_AUTH_COOKIE_NAME: 'wos-session',
      WORKOS_COOKIE_PASSWORD: 'x'.repeat(32),
    },
    workosRevocationWorkerOptions: {
      wait(milliseconds, signal) {
        waits++;
        if (lists) completed.resolve();
        if (milliseconds < 60_000 && !lists) return Promise.resolve();
        assertEquals(milliseconds, lists ? 250 : 60_000);
        idle.resolve();
        return new Promise((resolve) => {
          if (signal.aborted) resolve();
          else signal.addEventListener('abort', () => resolve(), { once: true });
        });
      },
    },
    workos: {
      userManagement: {
        loadSealedSession({ sessionData }) {
          const [subject, sessionId] = sessionData.split(':');
          const iat = sessionId === 'fresh' ? Math.ceil(Date.now() / 1000) + 1 : cutoff / 1000;
          const result = {
            authenticated: true as const,
            user: { id: subject },
            sessionId,
            accessToken: `header.${btoa(JSON.stringify({ iat, exp: iat + 3600 }))}.signature`,
          };
          return {
            authenticate: () => Promise.resolve(result),
            refresh: () => Promise.resolve(result),
          };
        },
        async listSessions(subject, options) {
          lists++;
          assertEquals(options.limit, 50);
          entered.resolve();
          await release.promise;
          return {
            data: ['a', 'b'].map((id) => ({
              id,
              userId: subject,
              createdAt: new Date(cutoff).toISOString(),
            })),
            listMetadata: {},
          };
        },
        revokeSession({ sessionId }) {
          revoked.push(sessionId);
          return Promise.resolve();
        },
      },
    },
  });
  const backend = registry.resolveBackend();
  assert(registry.background);
  const running = registry.background.start();
  try {
    // Wait for an explicit scheduling signal, never a polling budget.
    await deadline(idle.promise, 2000);
    assertEquals(waits, 9);
    const startedAt = performance.now();
    await backend.sessions.revokeSubjectSessions({ subject: 'alice' });
    assertEquals((await backend.authenticate(sessionRequest('alice:a'))).ok, false);
    assertEquals((await backend.authenticate(sessionRequest('alice:b'))).ok, false);
    assertEquals((await backend.authenticate(sessionRequest('alice:fresh'))).ok, false);
    assertEquals((await backend.authenticate(sessionRequest('bob:c'))).ok, true);
    await deadline(entered.promise, 2000);
    release.resolve();
    await deadline(completed.promise, 2000);
    assertEquals((await backend.authenticate(sessionRequest('alice:fresh'))).ok, true);
    assertEquals((await backend.authenticate(sessionRequest('alice:a'))).ok, false);
    assert(performance.now() - startedAt < 2000);
    assertEquals(lists, 1);
    assertEquals(revoked, ['a', 'b']);
  } finally {
    release.resolve();
    await registry.background.stop();
    await running;
  }
});
