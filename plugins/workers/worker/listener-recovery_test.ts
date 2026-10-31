import { assert, assertEquals } from '@std/assert';
import { delay } from '@std/async';
import { DenoKvAdapter } from '@netscript/kv';
import { Redis } from 'npm:ioredis@^5.11.1';
import { RedisAdapter } from '@netscript/queue/adapters/redis';
import { type WorkerListenerSnapshot, WorkerListenerSupervisor } from './listener-supervisor.ts';

/** Wait on observable adapter progress with a generous bound; fail immediately on terminal supervision. */
async function until(condition: () => boolean, listener: WorkerListenerSupervisor): Promise<void> {
  const deadline = performance.now() + 10_000;
  while (!condition()) {
    assert(
      listener.snapshot().status !== 'failed',
      'Listener exhausted its budget before recovery.',
    );
    assert(performance.now() < deadline, 'Adapter did not reach the expected recovery state.');
    await delay(10);
  }
}

Deno.test('supervised real Deno KV writes recover repeatedly after closed-handle refusals', async () => {
  const dir = await Deno.makeTempDir({ prefix: 'listener-kv-recovery-' });
  let now = 0;
  const sessions: Array<{ fail(): void }> = [];
  const failures: WorkerListenerSnapshot[] = [];
  const listener = new WorkerListenerSupervisor({
    name: 'local-kv',
    now: () => now,
    healthyResetMs: 100,
    maxRestarts: 1,
    sleep: () => Promise.resolve(),
    onFailure: (_error, snapshot) => failures.push(snapshot),
    run: async (signal) => {
      const kv = await Deno.openKv(`${dir}/state.sqlite`);
      const adapter = new DenoKvAdapter(kv);
      const failure = Promise.withResolvers<void>();
      let closed = false;
      const abort = () => failure.resolve();
      signal.addEventListener('abort', abort, { once: true });
      try {
        await adapter.set(['attempt'], sessions.length + 1);
        sessions.push({
          fail() {
            kv.close();
            closed = true;
            failure.resolve();
          },
        });
        await failure.promise;
        if (!signal.aborted) await adapter.set(['refused-write'], true);
      } finally {
        signal.removeEventListener('abort', abort);
        if (!closed) kv.close();
      }
    },
  });
  listener.start();
  try {
    for (let failure = 0; failure < 5; failure++) {
      await until(() => sessions.length === failure + 1, listener);
      now += 100;
      sessions[failure].fail();
      await until(() => failures.length === failure + 1, listener);
    }
    await until(() => sessions.length === 6, listener);
    assertEquals(failures.map((snapshot) => snapshot.restartBudgetUsed), [1, 1, 1, 1, 1]);
    assertEquals(listener.snapshot().restartCount, 5);
    const verification = await Deno.openKv(`${dir}/state.sqlite`);
    try {
      assertEquals((await verification.get(['attempt'])).value, 6);
    } finally {
      verification.close();
    }
  } finally {
    await listener.stop();
    await Deno.remove(dir, { recursive: true });
  }
});

const redisUrl = Deno.env.get('NETSCRIPT_TEST_REDIS_URL');
Deno.test({
  name: 'real Redis queue recovers from repeated ACL write refusals beyond the burst budget',
  ignore: !redisUrl,
  async fn() {
    assert(redisUrl);
    const name = `listener-recovery-${crypto.randomUUID()}`;
    const password = crypto.randomUUID();
    const admin = new Redis(redisUrl, { lazyConnect: true });
    const receiverUrl = new URL(redisUrl);
    receiverUrl.username = name;
    receiverUrl.password = password;
    const receiver = new RedisAdapter<number>(receiverUrl.href, name);
    const producer = new RedisAdapter<number>(redisUrl, name);
    const deliveries: Array<{ message: number; release(): void }> = [];
    const failures: WorkerListenerSnapshot[] = [];
    const backoffs: Array<() => void> = [];
    let now = 0;
    let started = false;
    const listener = new WorkerListenerSupervisor({
      name: 'redis-queue',
      now: () => now,
      healthyResetMs: 100,
      maxRestarts: 1,
      sleep: (_ms, signal) =>
        new Promise<void>((resolve) => {
          const finish = () => {
            signal.removeEventListener('abort', finish);
            resolve();
          };
          signal.addEventListener('abort', finish, { once: true });
          backoffs.push(finish);
        }),
      onFailure: (_error, snapshot) => failures.push(snapshot),
      run: (signal) =>
        receiver.listen(async (message) => {
          const gate = Promise.withResolvers<void>();
          const abort = () => gate.resolve();
          signal.addEventListener('abort', abort, { once: true });
          deliveries.push({ message, release: gate.resolve });
          try {
            await gate.promise;
          } finally {
            signal.removeEventListener('abort', abort);
          }
        }, { signal }),
    });
    try {
      // Only this ephemeral ACL user's rights change; no CONFIG, flush or shared-user mutation.
      await admin.acl('SETUSER', name, 'on', `>${password}`, '~*', '&*', '+@all');
      listener.start();
      started = true;
      await producer.enqueue(0);
      for (let failure = 0; failure < 4; failure++) {
        await until(() => deliveries.length === failure + 1, listener);
        now += 100; // The actual listener has delivered and is still running at this boundary.
        await admin.acl('SETUSER', name, '-brpoplpush');
        deliveries[failure].release();
        await until(
          () => failures.length === failure + 1 && backoffs.length === failure + 1,
          listener,
        );
        assertEquals(failures[failure].failureCause, 'store-write-refused');
        assertEquals(
          failures[failure].childHealth.lastFatalError?.message,
          'Queue store refused a write (details redacted).',
        );
        await admin.acl('SETUSER', name, '+brpoplpush');
        await producer.enqueue(failure + 1);
        backoffs[failure]();
      }
      await until(() => deliveries.length === 5, listener);
      deliveries[4].release();
      const ackDeadline = performance.now() + 10_000;
      while (await admin.llen(`netscript:processing:${name}`)) {
        assert(performance.now() < ackDeadline, 'Recovered message was not acknowledged.');
        await delay(10);
      }
      assertEquals(deliveries.map((delivery) => delivery.message), [0, 1, 2, 3, 4]);
      assertEquals(failures.map((snapshot) => snapshot.restartBudgetUsed), [1, 1, 1, 1]);
      assertEquals(listener.snapshot().status, 'running');
      now += 100;
      assertEquals(listener.snapshot().restartBudgetUsed, 0);
      assertEquals(listener.snapshot().restartCount, 4);
      assertEquals(listener.snapshot().childHealth.restartCount, 4);
    } finally {
      if (started) await listener.stop();
      await Promise.all([receiver.stop(), producer.stop()]);
      await admin.acl('DELUSER', name);
      await admin.del(
        `netscript:queue:${name}`,
        `netscript:processing:${name}`,
        `netscript:delayed:${name}`,
      );
      admin.disconnect();
    }
  },
});
