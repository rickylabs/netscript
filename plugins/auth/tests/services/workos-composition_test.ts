import { assert, assertEquals } from '@std/assert';
import { DenoKvAdapter } from '@netscript/kv';
import { createWorkosRevocationStore } from '@netscript/auth-workos';
import { createAuthServiceBackendRegistry } from '../../services/src/backend-registry.ts';
import type { AuthPluginServiceContext } from '../../services/src/init.ts';
import createAuthService from '../../services/src/main.ts';
import {
  sessionClient,
  sessionRequest,
} from '../../../../packages/auth-workos/tests/testing/revocation-fixture.ts';

Deno.test('shipped WorkOS registry and main share the host KV, cookie policy, worker and service logger', async () => {
  await using kv = new DenoKvAdapter(await Deno.openKv(':memory:'));
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  const logs: Array<{ message: string; fields: Record<string, unknown> }> = [];
  const env = {
    PORT: '0',
    NETSCRIPT_AUTH_BACKEND: 'workos',
    WORKOS_COOKIE_PASSWORD: 'x'.repeat(32),
    NETSCRIPT_AUTH_COOKIE_NAME: 'configured_session',
    WORKOS_ACCESS_TOKEN_MAX_LIFETIME_MS: '3600000',
  };
  let lists = 0;
  const client = sessionClient();
  const store = createWorkosRevocationStore(kv);
  await store.revokeSubject('alice', new Date().toISOString());
  const workos: NonNullable<AuthPluginServiceContext['workos']> = {
    userManagement: {
      loadSealedSession(options) {
        assertEquals(options.cookiePassword, env.WORKOS_COOKIE_PASSWORD);
        return client.userManagement.loadSealedSession(options);
      },
      async listSessions(subject, options) {
        assertEquals(subject, 'alice');
        assertEquals(options.limit, 50);
        if (++lists === 1) throw new Error('provider-secret-must-not-leak');
        entered.resolve();
        await release.promise;
        return {
          data: [{ id: 'a', userId: 'alice', createdAt: '2026-01-01T00:00:00.000Z' }],
          listMetadata: {},
        };
      },
      revokeSession: () => Promise.resolve(),
    },
  };
  const registry = await createAuthServiceBackendRegistry({ env, kv, workos });
  assertEquals(registry.cookieName, env.NETSCRIPT_AUTH_COOKIE_NAME);
  assert(registry.background);
  const ctx: AuthPluginServiceContext = {
    env,
    kv,
    workos,
    db: { getClient: () => Promise.resolve({}) },
    contracts: {},
    logger: {
      error: (message: string, fields: Record<string, unknown>) => logs.push({ message, fields }),
    },
  };
  const service = await createAuthService(ctx);
  try {
    await entered.promise; // Only main starts the worker; no application request has occurred.
    assertEquals(
      (await registry.resolveBackend().authenticate(sessionRequest('alice:b'))).ok,
      false,
    );
    assertEquals((await registry.resolveBackend().authenticate(sessionRequest('bob:c'))).ok, true);
    const origin = `http://127.0.0.1:${service.addr.port}`;
    const me = await fetch(`${origin}/api/v1/auth/me`, {
      headers: { cookie: 'configured_session=bob:c' },
    });
    assertEquals((await me.json()).authenticated, true);
    const wrong = await fetch(`${origin}/api/v1/auth/me`, {
      headers: { cookie: 'wos-session=bob:c' },
    });
    assertEquals((await wrong.json()).authenticated, false);
    const stopped = service.stop();
    // The runtime signal hook is proven separately; this releases the held SDK page for manual drain.
    release.resolve();
    await stopped;
  } finally {
    release.resolve();
    await service.stop();
  }
  assertEquals(lists, 2);
  assertEquals(await store.isRevoked('alice', 'a', Date.parse('2026-01-01T00:00:00.000Z')), true);
  assertEquals(logs, [{
    message: 'WorkOS revocation worker retrying after failure.',
    fields: {
      component: 'workos-revocation',
      stage: 'delivery',
    },
  }]);
});

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  Deno.test(`shipped main drains its shutdown hook on ${signal}`, async () => {
    const child = new Deno.Command(Deno.execPath(), {
      args: ['run', '--unstable-kv', '-A', 'plugins/auth/tests/testing/workos-shutdown-fixture.ts'],
      stdin: 'piped',
      stdout: 'piped',
      stderr: 'piped',
    }).spawn();
    const lines = child.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(
      new TransformStream<string, string>({
        transform(chunk, controller) {
          controller.enqueue(chunk);
        },
      }),
    ).getReader();
    let text = '';
    try {
      while (!text.includes('worker-started\n')) {
        const result = await lines.read();
        assert(!result.done, text);
        text += result.value;
      }
      child.kill(signal);
      const writer = child.stdin.getWriter();
      await writer.write(new TextEncoder().encode('release\n'));
      await writer.close();
      while (true) {
        const result = await lines.read();
        if (result.done) break;
        text += result.value;
      }
      const status = await child.status;
      assertEquals(status.code, 0, text);
      assert(text.includes('worker-drained\n'), text);
    } finally {
      lines.releaseLock();
      if (!(await child.status).success) {
        const error = await new Response(child.stderr).text();
        console.error(error);
      } else await child.stderr.cancel();
    }
  });
}
