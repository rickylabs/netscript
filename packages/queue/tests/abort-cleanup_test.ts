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
  const cleanup: string[] = [];
  queue['connection'] = Promise.resolve({
    on() {},
    removeListener() {},
    createChannel: () =>
      Promise.resolve({
        on() {},
        removeListener() {},
        assertQueue: () => Promise.resolve(),
        prefetch: () => Promise.resolve(),
        consume: () => Promise.resolve({ consumerTag: 'owned-consumer' }),
        cancel: (tag: string) => {
          cleanup.push(`cancel:${tag}`);
          return Promise.resolve();
        },
        close: () => {
          cleanup.push('channel-close');
          return Promise.resolve();
        },
      }),
    close: () => {
      closed = true;
      cleanup.push('connection-close');
      return Promise.resolve();
    },
  });

  const listening = queue.listen(async () => {});
  await nextTurn();
  await queue.stop();
  await listening;

  assertEquals(cleanup, ['cancel:owned-consumer', 'channel-close', 'connection-close']);
  assertEquals(closed, true);
  assertEquals(queue['listening'], false);
});

Deno.test('redis listener disconnects blocking client on abort', async () => {
  let blockingDisconnected = false;
  let commandsDisconnected = false;
  let promotionDisconnected = false;
  const blockingStarted = Promise.withResolvers<void>();
  let releaseBlocking: (() => void) | undefined;
  const queue = Object.create(RedisAdapter.prototype) as RedisHarness;
  queue['url'] = 'redis://example';
  queue['queueName'] = 'jobs';
  queue['options'] = undefined;
  queue['listening'] = false;
  queue['delayedTimer'] = undefined;
  queue['clients'] = {
    commands: {
      zrangebyscore: () => Promise.resolve([]),
      lpush: () => Promise.resolve(1),
      zrem: () => Promise.resolve(1),
      lrem: () => Promise.resolve(1),
      disconnect: () => {
        commandsDisconnected = true;
      },
    },
    blocking: {
      brpoplpush: () =>
        new Promise<null>((resolve) => {
          releaseBlocking = () => resolve(null);
          blockingStarted.resolve();
        }),
      disconnect: () => {
        blockingDisconnected = true;
        releaseBlocking?.();
      },
    },
  };
  queue['promotionClient'] = {
    watch: () => Promise.resolve('OK'),
    zrangebyscore: () => Promise.resolve([]),
    unwatch: () => Promise.resolve('OK'),
    disconnect: () => {
      promotionDisconnected = true;
    },
  };
  queue['leaseRuntime'] = {
    configure() {},
    ready: () => Promise.resolve(),
    pollInterval: 1_000,
    claim: () =>
      new Promise<null>((resolve) => {
        releaseBlocking = () => resolve(null);
        blockingStarted.resolve();
      }),
    stop() {
      releaseBlocking?.();
    },
  };
  const controller = new AbortController();

  const listening = queue.listen(async () => {}, {
    signal: controller.signal,
    visibilityTimeout: 100,
  });
  await blockingStarted.promise;
  controller.abort();
  await listening;
  await queue.stop();

  assertEquals(blockingDisconnected, true);
  assertEquals(commandsDisconnected, true);
  assertEquals(promotionDisconnected, true);
  assertEquals(queue['clients'], null);
  assertEquals(queue['listening'], false);
  assertEquals(queue['delayedTimer'], undefined);
  assertEquals(queue['leaseTimer'], undefined);
});
