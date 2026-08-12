import {
  type CacheProvider,
  resetCacheProvider,
  setCacheProvider,
} from '../../src/cache/cache-provider.ts';
import { CacheQuery } from '../../src/cache/cache-query.ts';
import { createCompositeQuery } from '../../src/query/composite-query.ts';
import { createQueryFactory } from '../../src/query/query-factory.ts';
import type {
  ContractProcedureLike,
  ContractSchema,
  ServiceClient,
} from '../../src/ports/service-client.ts';
import { assertEquals, MemoryCacheStore } from '../test-helpers.ts';

interface ListInput {
  readonly limit: number;
  readonly offset: number;
}

interface ListOutput {
  readonly items: readonly string[];
}

type Schema<TInput, TOutput> = ContractSchema & {
  readonly '~standard': {
    readonly types: {
      readonly input: TInput;
      readonly output: TOutput;
    };
  };
};

type Procedure<TInput, TOutput> = ContractProcedureLike<
  Schema<TInput, TInput>,
  Schema<TOutput, TOutput>
>;

const listProcedure = { '~orpc': {} } as Procedure<ListInput, ListOutput>;
const contract = { list: listProcedure } as const;

Deno.test('createQueryFactory builds stable action keys and query options', async () => {
  const store = new MemoryCacheStore();
  setCacheProvider(new CacheQuery(store));

  const client: ServiceClient<typeof contract> = {
    list: (input: ListInput): Promise<ListOutput> =>
      Promise.resolve({ items: [`${input.limit}:${input.offset}`] }),
  };

  const factory = createQueryFactory('orders', contract, client);
  const key = factory.list.key({ limit: 20, offset: 0 });
  const options = factory.list.queryOptions({ limit: 20, offset: 0 });
  const result = await options.queryFn();

  assertEquals(key[0], 'orders');
  assertEquals(key[1], 'list');
  assertEquals(typeof key[2], 'string');
  assertEquals(options.queryKey[0], 'orders');
  assertEquals(options.queryKey[1], 'list');
  assertEquals(result.items[0], '20:0');
  resetCacheProvider();
});

Deno.test('queryOptions shares the server CacheQuery entry and action invalidation', async () => {
  const store = new MemoryCacheStore();
  setCacheProvider(new CacheQuery(store));

  let currentItem = 'before-mutation';
  let clientCalls = 0;
  const client: ServiceClient<typeof contract> = {
    list: (_input: ListInput): Promise<ListOutput> => {
      clientCalls += 1;
      return Promise.resolve({ items: [currentItem] });
    },
  };

  const factory = createQueryFactory('orders', contract, client);
  const input = { limit: 20, offset: 0 };
  const options = factory.list.queryOptions(input);

  assertEquals((await options.queryFn()).items[0], 'before-mutation');

  currentItem = 'after-mutation';
  assertEquals((await options.queryFn()).items[0], 'before-mutation');

  await factory.list.invalidate();
  assertEquals((await options.queryFn()).items[0], 'after-mutation');
  assertEquals(clientCalls, 2);
  resetCacheProvider();
});

Deno.test('queryOptions remains a direct service query when no server cache is registered', async () => {
  resetCacheProvider();

  let clientCalls = 0;
  const client: ServiceClient<typeof contract> = {
    list: (_input: ListInput): Promise<ListOutput> => {
      clientCalls += 1;
      return Promise.resolve({ items: [`call-${clientCalls}`] });
    },
  };

  const options = createQueryFactory('orders', contract, client).list.queryOptions({
    limit: 20,
    offset: 0,
  }, {
    preferFreshOnStale: true,
  });

  assertEquals((await options.queryFn()).items[0], 'call-1');
  assertEquals((await options.queryFn()).items[0], 'call-2');
});

Deno.test('query factories propagate static resource.action cache namespaces', async () => {
  const operationIds: Array<string | undefined> = [];
  const provider: CacheProvider = {
    descriptor: { system: 'capture', tier: 'l1' },
    query: (_key, options) => {
      operationIds.push(options.operationId);
      return options.queryFn();
    },
    prefetch: async (_key, options) => {
      operationIds.push(options.operationId);
      await options.queryFn();
    },
    getCachedData: (_key, operationId) => {
      operationIds.push(operationId);
      return Promise.resolve(null);
    },
    getCachedEntry: (_key, operationId) => {
      operationIds.push(operationId);
      return Promise.resolve(null);
    },
    invalidateQueries: (_prefix, operationId) => {
      operationIds.push(operationId);
      return Promise.resolve();
    },
  };
  setCacheProvider(provider);
  const client: ServiceClient<typeof contract> = {
    list: () => Promise.resolve({ items: ['ok'] }),
  };
  const factory = createQueryFactory('orders', contract, client);
  const input = { limit: 20, offset: 0 };

  await factory.list(input, { operationId: 'ignored.user-input' });
  await factory.list.getCachedData(input);
  await factory.list.getCachedEntry(input);
  await factory.list.invalidate();

  assertEquals(operationIds.join(','), 'orders.list,orders.list,orders.list,orders.list');
  resetCacheProvider();
});

Deno.test('composite queries use explicit normalized or fixed cache namespaces', async () => {
  const operationIds: Array<string | undefined> = [];
  const provider: CacheProvider = {
    descriptor: { system: 'capture', tier: 'l1' },
    query: (_key, options) => {
      operationIds.push(options.operationId);
      return options.queryFn();
    },
    prefetch: () => Promise.resolve(),
    getCachedData: () => Promise.resolve(null),
    getCachedEntry: () => Promise.resolve(null),
    invalidateQueries: () => Promise.resolve(),
  };
  setCacheProvider(provider);

  const named = createCompositeQuery({
    key: ['dashboard'] as const,
    queryFn: (props: { tenant: string }) => Promise.resolve(props.tenant),
    defaultOptions: { operationId: 'Billing :: Dashboard' },
  });
  const fallback = createCompositeQuery({
    key: ['summary'] as const,
    queryFn: (props: { tenant: string }) => Promise.resolve(props.tenant),
  });
  await named({ tenant: 'private-tenant' });
  await fallback({ tenant: 'private-tenant' });

  assertEquals(operationIds.join(','), 'billing.dashboard,composite');
  resetCacheProvider();
});
