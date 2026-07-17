import { createServiceQueryUtils } from '../../src/query-client/create-service-query-utils.ts';
import type {
  ContractProcedureLike,
  ContractSchema,
  ServiceClient,
} from '../../src/ports/service-client.ts';
import type { ServiceQueryUtils } from '../../src/ports/service-query-utils.ts';

interface ListOrdersInput {
  readonly page: number;
}

interface ListOrdersOutput {
  readonly items: readonly { readonly id: string }[];
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

declare const serviceContract: {
  readonly orders: {
    readonly list: Procedure<ListOrdersInput, ListOrdersOutput>;
  };
};

declare const serviceClient: ServiceClient<typeof serviceContract>;

const utils = createServiceQueryUtils(serviceClient, { path: ['orders'] });
const typedUtils: ServiceQueryUtils<typeof serviceContract> = utils;
const queryOptions = typedUtils.orders.list.queryOptions({ input: { page: 1 } });
declare const queryContext: Parameters<typeof queryOptions.queryFn>[0];
const data: Promise<ListOrdersOutput> | ListOrdersOutput = queryOptions.queryFn(
  queryContext,
);

void data;
