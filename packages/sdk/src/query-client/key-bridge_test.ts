import { assert, assertFalse } from '@std/assert';
import { partialMatchKey } from '@tanstack/query-core';
import type {
  ContractProcedureLike,
  ContractSchema,
  ServiceClient,
} from '../ports/service-client.ts';
import { createQueryFactory } from '../query/query-factory.ts';
import { bridgeInvalidation } from './key-bridge.ts';

interface ListInput {
  readonly limit: number;
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
const client: ServiceClient<typeof contract> = {
  list: () => Promise.resolve({ items: ['ok'] }),
};
const factoryKey = createQueryFactory('orders', contract, client).list.queryOptions({
  limit: 20,
}).queryKey;

Deno.test('bridgeInvalidation matches a query-factory key when resource and action match', () => {
  const filterKey = bridgeInvalidation('orders', 'list').queryKey;

  assert(partialMatchKey(factoryKey, filterKey));
});

Deno.test('bridgeInvalidation does not match a query-factory key when resource differs', () => {
  const filterKey = bridgeInvalidation('payments', 'list').queryKey;

  assertFalse(partialMatchKey(factoryKey, filterKey));
});
