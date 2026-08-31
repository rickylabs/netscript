import { assert, assertEquals, assertFalse } from '@std/assert';
import { os } from '@orpc/server';
import { CacheQuery } from '../src/cache/cache-query.ts';
import { resetCacheProvider, setCacheProvider } from '../src/cache/cache-provider.ts';
import { defineSdkClientContribution } from '../src/client/sdk-client-contribution.ts';
import { createServiceClient } from '../src/client/service-client.ts';
import { defineServices } from '../src/presets/define-services.ts';
import { createQueryFactory } from '../src/query/query-factory.ts';
import { createKvCachePersister } from '../src/query-client/kv-cache-persister.ts';
import type { CacheEntry } from '../src/ports/cache-entry.ts';
import type { CacheProvider } from '../src/cache/cache-provider.ts';
import { MemoryCacheStore } from './test-helpers.ts';

const contract = {
  echo: os.handler(({ input }: { input: unknown }) => input),
};

const tenantContribution = defineSdkClientContribution<{ tenant: string }>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'test:tenant',
  context: { tenant: 'required' },
  headerKeys: ['x-tenant'],
  responseCache: {
    mode: 'partitioned',
    partition: ({ context }) => context.tenant,
  },
  prepare: ({ context }) => ({ headers: { 'x-tenant': context.tenant } }),
});

const localeContribution = defineSdkClientContribution<{ locale: string }>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'test:locale',
  context: { locale: 'required' },
  headerKeys: ['accept-language'],
  responseCache: {
    mode: 'partitioned',
    partition: ({ context }) => context.locale,
  },
  prepare: ({ context }) => ({ headers: { 'accept-language': context.locale } }),
});

const invariantContribution = defineSdkClientContribution<Record<never, never>>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'test:invariant',
  context: {},
  headerKeys: ['x-invariant'],
  responseCache: { mode: 'invariant' },
  prepare: () => ({ headers: { 'x-invariant': 'same' } }),
});

const directOnlyContribution = defineSdkClientContribution<Record<never, never>>()({
  protocol: { family: 'netscript.sdk-client', major: 1 },
  id: 'test:direct',
  context: {},
  headerKeys: ['x-direct'],
  responseCache: { mode: 'direct-only' },
  prepare: () => ({ headers: { 'x-direct': 'value' } }),
});

Deno.test('server and TanStack full keys use sorted contribution partitions', () => {
  const client = createServiceClient({
    contract,
    serviceName: 'partitioned-service',
    contributions: [tenantContribution, localeContribution] as const,
  });
  const factory = createQueryFactory('orders', contract, client);
  const context = { tenant: 'principal-7', locale: 'de-CH' };
  const key = factory.echo.key({ page: 1 }, { context });
  const queryOptions = factory.echo.queryOptions({ page: 1 }, { context });

  assertEquals([...key], [
    'orders',
    'echo',
    '{"page":1}',
    '$netscript.sdk-context',
    '[["test:locale","de-CH"],["test:tenant","principal-7"]]',
  ]);
  assertEquals(queryOptions.queryKey.slice(-3), [
    '$netscript.sdk-context',
    ['test:locale', 'de-CH'],
    ['test:tenant', 'principal-7'],
  ]);
});

Deno.test('server cache entries cannot cross contribution partitions', async () => {
  const store = new MemoryCacheStore();
  setCacheProvider(new CacheQuery(store));
  const client = createServiceClient({
    contract,
    serviceName: 'partition-isolation',
    contributions: [tenantContribution] as const,
  });
  const action = createQueryFactory('orders', contract, client).echo;
  const input = { page: 1 };
  const alphaContext = { tenant: 'alpha' };
  const betaContext = { tenant: 'beta' };
  const alphaKey = action.key(input, { context: alphaContext });
  const betaKey = action.key(input, { context: betaContext });
  store.setRaw(
    ['cache_query', ...alphaKey],
    { data: { owner: 'alpha' }, timestamp: Date.now() } satisfies CacheEntry<unknown>,
  );

  try {
    assertEquals(await action.getCachedData(input, { context: alphaContext }), { owner: 'alpha' });
    assertEquals(await action.getCachedData(input, { context: betaContext }), null);
    assertFalse(JSON.stringify(alphaKey).includes('beta'));
    assertFalse(JSON.stringify(betaKey).includes('alpha'));
  } finally {
    resetCacheProvider();
  }
});

Deno.test('empty and invariant contribution tuples preserve unsuffixed keys', () => {
  const omittedClient = createServiceClient({
    contract,
    serviceName: 'omitted-service',
  });
  const invariantClient = createServiceClient({
    contract,
    serviceName: 'invariant-service',
    contributions: [invariantContribution] as const,
  });
  assertEquals(createQueryFactory('orders', contract, omittedClient).echo.key('same').length, 3);
  assertEquals(createQueryFactory('orders', contract, invariantClient).echo.key('same').length, 3);
});

Deno.test('partitioned factories preserve unsuffixed invalidation prefixes', async () => {
  const prefixes: Array<readonly unknown[]> = [];
  const provider: CacheProvider = {
    descriptor: { system: 'capture', tier: 'l1' },
    query: (_key, options) => options.queryFn(),
    prefetch: () => Promise.resolve(),
    getCachedData: () => Promise.resolve(null),
    getCachedEntry: () => Promise.resolve(null),
    invalidateQueries: (prefix) => {
      prefixes.push(prefix);
      return Promise.resolve();
    },
  };
  setCacheProvider(provider);
  const client = createServiceClient({
    contract,
    serviceName: 'partition-prefix',
    contributions: [tenantContribution] as const,
  });
  const factory = createQueryFactory('orders', contract, client);

  try {
    await factory.invalidate();
    await factory.echo.invalidate();
    assertEquals(prefixes, [['orders'], ['orders', 'echo']]);
  } finally {
    resetCacheProvider();
  }
});

Deno.test('defineServices omits direct-only query and query-utils properties at runtime', () => {
  const services = defineServices({
    safe: {
      contract,
      contributions: [tenantContribution] as const,
    },
    direct: {
      contract,
      contributions: [directOnlyContribution] as const,
    },
  });

  assert('safe' in services.clients);
  assert('direct' in services.clients);
  assert('safe' in services.queries);
  assertFalse('direct' in services.queries);
  assert('safe' in services.queryUtils);
  assertFalse('direct' in services.queryUtils);
});

Deno.test('recursive query utils partition every full read key but not mutation keys', () => {
  const services = defineServices({
    catalog: {
      contract,
      contributions: [tenantContribution] as const,
    },
  });
  const utils = services.queryUtils.catalog.echo;
  const options = { input: { page: 1 }, context: { tenant: 'alpha' } };
  const expectedSuffix = ['$netscript.sdk-context', ['test:tenant', 'alpha']];

  assertEquals(utils.queryKey(options).slice(-2), expectedSuffix);
  assertEquals(utils.queryOptions(options).queryKey.slice(-2), expectedSuffix);
  assertEquals(utils.experimental_streamedKey(options).slice(-2), expectedSuffix);
  assertEquals(utils.experimental_streamedOptions(options).queryKey.slice(-2), expectedSuffix);
  assertEquals(utils.experimental_liveKey(options).slice(-2), expectedSuffix);
  assertEquals(utils.experimental_liveOptions(options).queryKey.slice(-2), expectedSuffix);
  assertEquals(
    utils.infiniteKey({
      input: () => ({ page: 1 }),
      initialPageParam: 0,
      context: { tenant: 'alpha' },
    }).slice(-2),
    expectedSuffix,
  );
  const infiniteOptions = utils.infiniteOptions({
    input: () => ({ page: 1 }),
    initialPageParam: 0,
    context: { tenant: 'alpha' },
  });
  assert(infiniteOptions.queryKey !== undefined);
  assertEquals(infiniteOptions.queryKey.slice(-2), expectedSuffix);

  const mutation = utils.mutationOptions({ context: { tenant: 'alpha' } });
  assertFalse(JSON.stringify(mutation.mutationKey).includes('$netscript.sdk-context'));
});

Deno.test('persisted TanStack storage keeps partitioned full keys separate', async () => {
  const store = new MemoryCacheStore();
  const persister = createKvCachePersister({ store });
  const services = defineServices({
    catalog: {
      contract,
      contributions: [tenantContribution] as const,
    },
  });
  const alphaKey = JSON.stringify(services.queryUtils.catalog.echo.queryKey({
    input: { page: 1 },
    context: { tenant: 'alpha' },
  }));
  const betaKey = JSON.stringify(services.queryUtils.catalog.echo.queryKey({
    input: { page: 1 },
    context: { tenant: 'beta' },
  }));
  await persister.setItem(alphaKey, 'alpha-value');
  await persister.setItem(betaKey, 'beta-value');

  assertEquals(await persister.getItem(alphaKey), 'alpha-value');
  assertEquals(await persister.getItem(betaKey), 'beta-value');
  assertFalse(alphaKey === betaKey);
});

Deno.test('generated collection wiring keeps each partitioned key paired with its query function', () => {
  const services = defineServices({
    catalog: {
      contract,
      contributions: [tenantContribution] as const,
    },
  });
  const alphaOptions = services.queryUtils.catalog.echo.queryOptions({
    input: { page: 1 },
    context: { tenant: 'alpha' },
  });
  const betaOptions = services.queryUtils.catalog.echo.queryOptions({
    input: { page: 1 },
    context: { tenant: 'beta' },
  });
  const alphaCollectionSource = {
    queryKey: alphaOptions.queryKey,
    queryFn: alphaOptions.queryFn,
  };
  const betaCollectionSource = {
    queryKey: betaOptions.queryKey,
    queryFn: betaOptions.queryFn,
  };

  assertEquals(alphaCollectionSource.queryKey.slice(-2), [
    '$netscript.sdk-context',
    ['test:tenant', 'alpha'],
  ]);
  assertEquals(betaCollectionSource.queryKey.slice(-2), [
    '$netscript.sdk-context',
    ['test:tenant', 'beta'],
  ]);
  assert(alphaCollectionSource.queryFn === alphaOptions.queryFn);
  assert(betaCollectionSource.queryFn === betaOptions.queryFn);
  assertFalse(
    JSON.stringify(alphaCollectionSource.queryKey) ===
      JSON.stringify(betaCollectionSource.queryKey),
  );
});
