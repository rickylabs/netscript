import { assert, assertEquals, assertRejects } from '@std/assert';
import { deadline, retry } from '@std/async';
import { stub } from '@std/testing/mock';
import { Redis } from 'ioredis';
import { RedisKvAdapter } from '../redis.ts';
import { KvConnectionError } from '../application/errors.ts';
import { encodeStoredValue } from '../adapters/redis/codec.ts';
import { keyToRedisKey } from '../adapters/redis/serialization.ts';

const enabled = Deno.env.get('NETSCRIPT_TEST_REDIS_DOCKER') === '1';

async function docker(...args: string[]): Promise<string> {
  const result = await new Deno.Command('docker', { args, stdout: 'piped', stderr: 'piped' })
    .output();
  assertEquals(result.code, 0, new TextDecoder().decode(result.stderr));
  return new TextDecoder().decode(result.stdout).trim();
}

Deno.test({
  name: 'Redis watch: native reconnect rereads a value written while no subscriber exists',
  ignore: !enabled,
  async fn() {
    const redis = await server();
    const namespace = `gap-${crypto.randomUUID()}`;
    const controller = new AbortController();
    const kv = new RedisKvAdapter({ url: redis.url, namespace });
    const admin = new Redis(redis.url, { lazyConnect: true });
    const key = ['state'];
    const iterator = kv.watch<string>([key], { initial: true, signal: controller.signal })
      [Symbol.asyncIterator]();
    let pending: Promise<IteratorResult<import('../mod.ts').WatchEvent<string>[]>> | undefined;
    try {
      await redis.start();
      await admin.connect();
      await kv.set(key, 'before');
      const initial = await deadline(iterator.next(), 5_000);
      assert(!initial.done);
      assertEquals(initial.value.map((event) => event.value), ['before']);
      pending = iterator.next();
      pending.catch(() => {});
      // Atomic native commands kill the real subscriber and change storage
      // before Redis can accept any new subscription. No mock or timing race,
      // and no publication that could conceal a missing reconnect snapshot.
      const result = await admin.multi()
        .client('KILL', 'TYPE', 'pubsub')
        .set(keyToRedisKey(key, namespace), encodeStoredValue('during-gap', 'gap-version'))
        .exec();
      assert(result);
      assertEquals(result[0], [null, 1]);
      const recovered = await deadline(pending, 5_000);
      assert(!recovered.done);
      assertEquals(recovered.value.map((event) => event.value), ['during-gap']);
      const next = iterator.next();
      await kv.set(key, 'after');
      const delivered = await deadline(next, 5_000);
      assert(!delivered.done);
      assertEquals(delivered.value.map((event) => event.value), ['after']);
    } finally {
      controller.abort();
      await Promise.allSettled([pending, iterator.return?.(), kv.close(), admin.quit()]);
      admin.disconnect();
      await redis.close();
    }
  },
});

// The container remains alive while the actual Redis server stops and starts.
// Its published endpoint stays fixed, including with a remote Docker daemon.
async function server() {
  const owner = crypto.randomUUID();
  const container = await docker(
    'run',
    '-d',
    '--label',
    `netscript.test-owner=${owner}`,
    '--publish',
    '0.0.0.0::6379',
    'redis:7',
    'sh',
    '-c',
    'exec sleep infinity',
  );
  const start = async () => {
    await docker(
      'exec',
      container,
      'redis-server',
      '--daemonize',
      'yes',
      '--pidfile',
      '/run/watch-test-redis.pid',
      '--save',
      '',
      '--appendonly',
      'no',
    );
    await retry(async () => {
      assertEquals(await docker('exec', container, 'redis-cli', 'PING'), 'PONG');
    }, { maxAttempts: 100, minTimeout: 10, maxTimeout: 50 });
  };
  const stop = () => docker('exec', container, 'redis-cli', 'SHUTDOWN', 'NOSAVE');
  const binding = (await docker('port', container, '6379/tcp')).split('\n')[0];
  const port = Number(binding.slice(binding.lastIndexOf(':') + 1));
  const daemon = Deno.env.get('DOCKER_HOST');
  const hostname = daemon?.startsWith('tcp://') ? new URL(daemon).hostname : '127.0.0.1';
  return {
    url: `redis://${hostname}:${port}`,
    start,
    stop,
    async close() {
      assertEquals(
        await docker(
          'inspect',
          '--format',
          '{{index .Config.Labels "netscript.test-owner"}}',
          container,
        ),
        owner,
      );
      await docker('rm', '--force', container);
    },
  };
}

for (const recover of [true, false]) {
  Deno.test({
    name: `Redis watch: actual server outage after subscriber end ${
      recover ? 'restores the existing iterator' : 'rejects with a typed connection error'
    }`,
    ignore: !enabled,
    async fn() {
      const redis = await server();
      const controller = new AbortController();
      const kv = new RedisKvAdapter({
        url: redis.url,
        namespace: `recovery-${crypto.randomUUID()}`,
      });
      let subscriber: Redis | undefined;
      const originalOn = Redis.prototype.on;
      const on = stub(Redis.prototype, 'on', function (event, listener) {
        if (event === 'message') subscriber = this;
        return originalOn.call(this, event, listener);
      });
      const key = ['state'];
      const stream = kv.watch<string>([key], { initial: true, signal: controller.signal });
      const iterator = stream[Symbol.asyncIterator]();
      let pending: Promise<IteratorResult<import('../mod.ts').WatchEvent<string>[]>> | undefined;
      try {
        await redis.start();
        await kv.set(key, 'before');
        const initial = await deadline(iterator.next(), 5_000);
        assert(!initial.done);
        assertEquals(initial.value.map((event) => event.value), ['before']);
        assert(subscriber, 'Observe the real subscriber installed by the adapter.');
        on.restore();
        const ended = new Promise<void>((resolve) => subscriber!.once('end', resolve));
        pending = iterator.next();
        // Install rejection handling before exercising a future terminal failure.
        pending.catch(() => {});
        await redis.stop();
        await deadline(ended, 8_000);
        assertEquals(subscriber.status, 'end', 'native retry attempts really exhausted');
        if (recover) {
          await redis.start();
          // No further watch() call is allowed to trigger recovery of this lease.
          const result = await deadline(pending, 10_000);
          assert(!result.done);
          // The no-persistence test server lost its old value during the gap.
          assertEquals(result.value.map((event) => [event.type, event.value]), [['delete', null]]);
          const next = iterator.next();
          await kv.set(key, 'after-recovery');
          const delivered = await deadline(next, 5_000);
          assert(!delivered.done);
          assertEquals(delivered.value.map((event) => event.value), ['after-recovery']);
        } else {
          await assertRejects(() => deadline(pending!, 35_000), KvConnectionError);
        }
      } finally {
        if (!on.restored) on.restore();
        controller.abort();
        // Baseline QUIT/UNSUBSCRIBE on an ended socket can reject; preserve the
        // regression verdict while always removing the positively owned server.
        await Promise.allSettled([pending, iterator.return?.(), kv.close()]);
        await redis.close();
      }
    },
  });
}
