import { assertEquals } from '@std/assert';
import { AmqpAdapter } from '../adapters/amqp.adapter.ts';
import { KvPollingAdapter } from '../adapters/kv-polling.adapter.ts';
import { RedisAdapter } from '../adapters/redis.adapter.ts';
import type { WatchableKv } from '../adapters/kv-polling.adapter.ts';

type AmqpHarness = Pick<AmqpAdapter<unknown>, 'listen' | 'stop'> & Record<string, unknown>;
type RedisHarness = Pick<RedisAdapter<unknown>, 'listen' | 'stop'> & Record<string, unknown>;

function emptyKv(): WatchableKv {
  return {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve(),
    delete: () => Promise.resolve(),
    has: () => Promise.resolve(false),
    list: async function* () {},
    watch: async function* () {},
    watchPrefix: async function* () {},
    supportsWatch: false,
    close: () => Promise.resolve(),
    [Symbol.asyncDispose]: () => Promise.resolve(),
  } as WatchableKv;
}

function nextTurn(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

Deno.test('kv-polling listener clears timers after abort', async () => {
  const queue = new KvPollingAdapter({
    kv: emptyKv(),
    pollInterval: 1,
    visibilityTimeout: 10,
  });
  const controller = new AbortController();

  const listening = queue.listen(async () => {}, { signal: controller.signal });
  await nextTurn();
  controller.abort();
  await listening;
  await queue.stop();

  assertEquals((queue as unknown as Record<string, unknown>)['running'], false);
});

Deno.test('amqp listener closes connection when stopped', async () => {
  let closed = false;
  const queue = Object.create(AmqpAdapter.prototype) as AmqpHarness;
  queue['url'] = 'amqp://example';
  queue['queueName'] = 'jobs';
  queue['listening'] = false;
  queue['connection'] = Promise.resolve({
    close: () => {
      closed = true;
      return Promise.resolve();
    },
  });
  queue['queue'] = {
    listen: (_handler: unknown, options: { signal: AbortSignal }) =>
      new Promise<void>((resolve) => {
        options.signal.addEventListener('abort', () => resolve(), { once: true });
      }),
  };

  const listening = queue.listen(async () => {});
  await nextTurn();
  await queue.stop();
  await listening;

  assertEquals(closed, true);
  assertEquals(queue['listening'], false);
});

Deno.test('redis listener disconnects blocking client on abort', async () => {
  let disconnected = false;
  let releaseBlocking: (() => void) | undefined;
  const queue = Object.create(RedisAdapter.prototype) as RedisHarness;
  queue['url'] = 'redis://example';
  queue['queueName'] = 'jobs';
  queue['options'] = undefined;
  queue['listening'] = false;
  queue['abortController'] = undefined;
  queue['delayedTimer'] = undefined;
  queue['clients'] = {
    commands: {
      zrangebyscore: () => Promise.resolve([]),
      lpush: () => Promise.resolve(1),
      zrem: () => Promise.resolve(1),
      lrem: () => Promise.resolve(1),
    },
    blocking: {
      brpoplpush: () =>
        new Promise<null>((resolve) => {
          releaseBlocking = () => resolve(null);
        }),
      disconnect: () => {
        disconnected = true;
        releaseBlocking?.();
      },
    },
  };
  const controller = new AbortController();

  const listening = queue.listen(async () => {}, { signal: controller.signal });
  await nextTurn();
  controller.abort();
  await listening;
  await queue.stop();

  assertEquals(disconnected, true);
  assertEquals(queue['listening'], false);
  assertEquals(queue['delayedTimer'], undefined);
});
