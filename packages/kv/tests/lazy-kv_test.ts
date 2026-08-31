import { assertEquals, assertStrictEquals } from '@std/assert';
import {
  createLazyKv,
  type KvEntry,
  type KvKey,
  type KvListOptions,
  type KvSetOptions,
  type WatchableKv,
  type WatchEvent,
  type WatchOptions,
  type WatchPrefixOptions,
} from '../mod.ts';
import { registerKvAdapter, resetKv } from '../application/mod.ts';

Deno.test('createLazyKv resolves once and forwards the WatchableKv contract', async () => {
  await resetKv();

  const getKey: KvKey = ['get'];
  const setKey: KvKey = ['set'];
  const setValue = { value: true };
  const setOptions: KvSetOptions = { expireIn: 10 };
  const deleteKey: KvKey = ['delete'];
  const hasKey: KvKey = ['has'];
  const listOptions: KvListOptions = { prefix: ['list'], limit: 2 };
  const watchKeys: KvKey[] = [['watch']];
  const watchOptions: WatchOptions = { debounce: 5 };
  const watchPrefix: KvKey = ['prefix'];
  const watchPrefixOptions: WatchPrefixOptions = { pollInterval: 20 };
  const getResult: KvEntry<string> = {
    key: getKey,
    value: 'get-result',
    versionstamp: '1',
  };
  const listResult: KvEntry<string> = {
    key: ['list', 'one'],
    value: 'list-result',
    versionstamp: '2',
  };
  const watchResult: WatchEvent<string>[] = [{
    key: watchKeys[0],
    value: 'watch-result',
    type: 'set',
    timestamp: new Date(0),
    versionstamp: '3',
  }];
  const watchPrefixResult: WatchEvent<string> = {
    key: ['prefix', 'one'],
    value: 'prefix-result',
    type: 'set',
    timestamp: new Date(1),
    versionstamp: '4',
  };

  let resolutions = 0;
  let closes = 0;
  const adapter: WatchableKv = {
    supportsWatch: false,
    get: <T>(key: KvKey) => {
      assertStrictEquals(key, getKey);
      return Promise.resolve(getResult as KvEntry<T>);
    },
    set: (key, value, options) => {
      assertStrictEquals(key, setKey);
      assertStrictEquals(value, setValue);
      assertStrictEquals(options, setOptions);
      return Promise.resolve();
    },
    delete: (key) => {
      assertStrictEquals(key, deleteKey);
      return Promise.resolve();
    },
    has: (key) => {
      assertStrictEquals(key, hasKey);
      return Promise.resolve(true);
    },
    async *list<T>(options: KvListOptions): AsyncIterable<KvEntry<T>> {
      assertStrictEquals(options, listOptions);
      yield listResult as KvEntry<T>;
    },
    async *watch<T>(
      keys: KvKey[],
      options?: WatchOptions,
    ): AsyncIterable<WatchEvent<T>[]> {
      assertStrictEquals(keys, watchKeys);
      assertStrictEquals(options, watchOptions);
      yield watchResult as WatchEvent<T>[];
    },
    async *watchPrefix<T>(
      prefix: KvKey,
      options?: WatchPrefixOptions,
    ): AsyncIterable<WatchEvent<T>> {
      assertStrictEquals(prefix, watchPrefix);
      assertStrictEquals(options, watchPrefixOptions);
      yield watchPrefixResult as WatchEvent<T>;
    },
    close: () => {
      closes++;
      return Promise.resolve();
    },
    [Symbol.asyncDispose]() {
      return this.close();
    },
  };

  registerKvAdapter('redis', () => {
    resolutions++;
    return adapter;
  });

  const kv = createLazyKv({ provider: 'redis', redisUrl: 'redis://recording.test' });
  assertEquals(resolutions, 0);
  assertEquals(kv.supportsWatch, true);

  assertStrictEquals(await kv.get<string>(getKey), getResult);
  assertEquals(resolutions, 1);
  await kv.set(setKey, setValue, setOptions);
  assertEquals(resolutions, 1);
  await kv.delete(deleteKey);
  assertEquals(await kv.has(hasKey), true);

  const listed = [];
  for await (const entry of kv.list<string>(listOptions)) listed.push(entry);
  assertEquals(listed, [listResult]);

  const watched = [];
  for await (const events of kv.watch<string>(watchKeys, watchOptions)) watched.push(events);
  assertEquals(watched, [watchResult]);

  const prefixWatched = [];
  for await (const event of kv.watchPrefix<string>(watchPrefix, watchPrefixOptions)) {
    prefixWatched.push(event);
  }
  assertEquals(prefixWatched, [watchPrefixResult]);

  await kv.close();
  assertEquals(closes, 1);
  await kv[Symbol.asyncDispose]();
  assertEquals(closes, 2);
  await resetKv();
});
