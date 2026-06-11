import { setCacheProvider } from '../../src/cache/cache-provider.ts';
import { CacheQuery } from '../../src/cache/cache-query.ts';
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

  const client = {
    list: (input: ListInput): Promise<ListOutput> =>
      Promise.resolve({ items: [`${input.limit}:${input.offset}`] }),
  } as unknown as ServiceClient<typeof contract>;

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
});
