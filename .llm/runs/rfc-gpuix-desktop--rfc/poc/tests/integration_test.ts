/**
 * Headless integration: the client path the GPUIX UI uses, without a window.
 * Cookie sign-in → bearer bridge → typed oRPC via @netscript/sdk → mutation →
 * durable stream delivery via @netscript/sdk/streams/consumer.
 */
import { assert, assertEquals } from 'jsr:@std/assert@^1';
import { startWorkspaceService } from '../app/service/service.ts';
import { createWorkspaceClient, followActivity, type StreamChange } from '../app/client/workspace-client.ts';
import type { HostServices } from '../app/client/host.ts';
import { SESSION_COOKIE } from '../app/contract.ts';

Deno.test('desktop client path: auth bridge, typed RPC, durable stream', async () => {
  const dir = await Deno.makeTempDir({ dir: Deno.env.get('PROBE_DIR') });
  const service = await startWorkspaceService({ kvPath: `${dir}/service.kv`, eventsPerSecond: 0 });
  const jar = new Map<string, string>();
  const host: HostServices = {
    baseUrl: service.url,
    fetch: async (input, init) => {
      const response = await fetch(input, init);
      for (const line of response.headers.getSetCookie()) {
        const [pair] = line.split(';');
        const [name, value] = pair.split('=');
        if (value) jar.set(name.trim(), value.trim());
      }
      return response;
    },
    authHeaders: (): Record<string, string> => {
      const token = jar.get(SESSION_COOKIE);
      return token ? { authorization: `Bearer ${token}` } : {};
    },
    settings: { get: () => Promise.resolve(undefined), set: () => Promise.resolve() },
    native: null,
    runtime: { renderer: 'test', runtime: 'deno', platform: Deno.build.os, memoryMb: () => null },
    onReady() {},
  };
  const client = createWorkspaceClient(host);
  try {
    assertEquals(await client.session.me({}), null, 'anonymous before sign-in');
    let rejected = false;
    await client.overview.get({ periodDays: 28 }).catch(() => rejected = true);
    assert(rejected, 'workspace reads require a session');

    const signIn = await host.fetch(`${service.url}/auth/sign-in`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'ada@netscript.dev', password: 'netscript' }),
    });
    assertEquals(signIn.status, 200);
    assert(jar.has(SESSION_COOKIE), 'HttpOnly session cookie captured by the native jar');

    const me = await client.session.me({});
    assertEquals(me?.email, 'ada@netscript.dev');
    const overview = await client.overview.get({ periodDays: 28 });
    assert(overview.totals.records.current > 0);
    const page = await client.records.list({ page: 1, pageSize: 10 });
    assertEquals(page.rows.length, 10);

    const received: StreamChange[] = [];
    const states: string[] = [];
    const subscription = followActivity(host, {
      onChanges: (changes) => received.push(...changes),
      onState: (state) => states.push(state),
    });
    const target = page.rows[0];
    const updated = await client.records.setStatus({ id: target.id, status: 'shipped' });
    assertEquals(updated.status, 'shipped');
    const deadline = Date.now() + 5_000;
    while (!received.some((change) => (change.value as { recordId?: string })?.recordId === target.id) && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    await subscription.close();
    assert(received.some((change) => (change.value as { recordId?: string })?.recordId === target.id), 'mutation arrived on the durable stream');
    assert(states.includes('live'));

    // Persistence: the mutation survives a service restart through @netscript/kv.
    await service.stop();
    const restarted = await startWorkspaceService({ kvPath: `${dir}/service.kv`, eventsPerSecond: 0 });
    try {
      assertEquals((await restarted.backend.get(target.id))?.status, 'shipped');
    } finally {
      await restarted.stop();
    }
  } finally {
    await service.stop().catch(() => {});
    await Deno.remove(dir, { recursive: true }).catch(() => {});
  }
});
