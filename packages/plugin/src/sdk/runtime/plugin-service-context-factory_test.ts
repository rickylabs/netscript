import { assert, assertEquals, assertStrictEquals } from '@std/assert';
import { baseContract } from '@netscript/contracts';
import { createPluginServiceContext } from './plugin-service-context-factory.ts';

Deno.test('createPluginServiceContext resolves each injected adapter once on first use', async () => {
  let databaseResolutions = 0;
  let kvResolutions = 0;
  const databaseClient = Object.freeze({ provider: 'test' });
  const kvAdapter = createTestKv();

  const contextPromise = createPluginServiceContext('test-plugin', {
    getDatabaseClient: () => {
      databaseResolutions++;
      return Promise.resolve(databaseClient);
    },
    getKv: () => {
      kvResolutions++;
      return Promise.resolve(kvAdapter);
    },
  });

  assertEquals(databaseResolutions, 0);
  assertEquals(kvResolutions, 0);

  const context = await contextPromise;
  assertEquals(databaseResolutions, 0);
  assertEquals(kvResolutions, 0);

  const [firstClient, secondClient] = await Promise.all([
    context.db.getClient(),
    context.db.getClient(),
  ]);
  assertStrictEquals(firstClient, databaseClient);
  assertStrictEquals(secondClient, databaseClient);
  assertEquals(databaseResolutions, 1);

  const kv = requireTestKv(context.kv);
  const [entry, exists] = await Promise.all([
    kv.get(['test']),
    kv.has(['test']),
  ]);
  assertEquals(entry, { key: ['test'], value: 'value' });
  assertEquals(exists, true);
  assertEquals(kvResolutions, 1);

  assert(typeof context.contracts === 'object' && context.contracts !== null);
  assertStrictEquals(Reflect.get(context.contracts, 'base'), baseContract);
  assertEquals(Reflect.get(context.contracts, 'versions'), {});

  assert(typeof context.logger === 'object' && context.logger !== null);
  for (const method of ['info', 'warn', 'error', 'debug']) {
    assertEquals(typeof Reflect.get(context.logger, method), 'function');
  }
  assertEquals(context.env, Deno.env.toObject());
});

interface TestKv {
  get(key: readonly unknown[]): Promise<unknown>;
  has(key: readonly unknown[]): Promise<boolean>;
}

function requireTestKv(value: unknown): TestKv {
  if (!isTestKv(value)) {
    throw new TypeError('Expected a test KV adapter.');
  }
  return value;
}

function isTestKv(value: unknown): value is TestKv {
  return (
    typeof value === 'object' && value !== null &&
    typeof Reflect.get(value, 'get') === 'function' &&
    typeof Reflect.get(value, 'has') === 'function'
  );
}

function createTestKv(): object {
  return {
    supportsWatch: true,
    get(key: readonly unknown[]): Promise<unknown> {
      return Promise.resolve({ key, value: 'value' });
    },
    set(): Promise<void> {
      return Promise.resolve();
    },
    delete(): Promise<void> {
      return Promise.resolve();
    },
    has(): Promise<boolean> {
      return Promise.resolve(true);
    },
    async *list(): AsyncIterable<unknown> {
      // No entries are needed for the resolver observation.
    },
    async *watch(): AsyncIterable<unknown> {
      // No events are needed for the resolver observation.
    },
    async *watchPrefix(): AsyncIterable<unknown> {
      // No events are needed for the resolver observation.
    },
    close(): Promise<void> {
      return Promise.resolve();
    },
    [Symbol.asyncDispose](): Promise<void> {
      return Promise.resolve();
    },
  };
}
