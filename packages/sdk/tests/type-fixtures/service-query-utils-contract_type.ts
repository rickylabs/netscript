import type { ContractProcedureLike, ContractSchema } from '../../src/ports/service-client.ts';
import type { ServiceQueryUtils } from '../../src/ports/service-query-utils.ts';

interface ListOrdersInput {
  readonly page: number;
  readonly limit?: number;
}

interface OrderSummary {
  readonly id: string;
  readonly total: number;
}

interface ListOrdersOutput {
  readonly items: readonly OrderSummary[];
}

interface WatchOrderInput {
  readonly id: string;
}

type WatchOrderOutput = AsyncIterable<OrderSummary>;

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
    readonly watch: Procedure<WatchOrderInput, WatchOrderOutput>;
  };
};

declare const utils: ServiceQueryUtils<typeof serviceContract>;

const queryOptions = utils.orders.list.queryOptions({
  input: { page: 1, limit: 20 },
  staleTime: 1_000,
});
const queryData: Promise<ListOrdersOutput> | ListOrdersOutput = queryOptions.queryFn(
  undefined as never,
);
const queryKey: readonly unknown[] = utils.orders.list.queryKey({
  input: { page: 1 },
});
const partialRouterKey: readonly unknown[] = utils.orders.key()[0];

const mutationOptions = utils.orders.list.mutationOptions({
  onSuccess(data, variables) {
    const order: OrderSummary | undefined = data.items[0];
    const page: number = variables.page;
    void order;
    void page;
  },
});
const mutationFn:
  | ((input: ListOrdersInput, context: never) => Promise<ListOrdersOutput> | ListOrdersOutput)
  | undefined = mutationOptions.mutationFn;

const streamedOptions = utils.orders.watch.experimental_streamedOptions({
  input: { id: 'ord_123' },
  queryFnOptions: { refetchMode: 'append', maxChunks: 10 },
});
const streamedData: Promise<readonly OrderSummary[]> | readonly OrderSummary[] = streamedOptions
  .queryFn(undefined as never);

const liveOptions = utils.orders.watch.experimental_liveOptions({
  input: { id: 'ord_123' },
});
const liveData: Promise<OrderSummary> | OrderSummary = liveOptions.queryFn(undefined as never);

const infiniteOptions = utils.orders.list.infiniteOptions({
  input: (pageParam: number) => ({ page: pageParam }),
  initialPageParam: 1,
});
const pageData: Promise<ListOrdersOutput> | ListOrdersOutput = infiniteOptions.queryFn(
  undefined as never,
);

void queryData;
void queryKey;
void partialRouterKey;
void mutationFn;
void streamedData;
void liveData;
void pageData;
