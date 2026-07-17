import { createServiceClient } from '../../src/client/service-client.ts';
import { createQueryCollection } from '../../src/collections/create-query-collection.ts';
import { createQueryFactory } from '../../src/query/query-factory.ts';
import { createNetScriptQueryClient } from '../../src/query-client/query-client-factory.ts';
import { createServiceQueryUtils } from '../../src/query-client/create-service-query-utils.ts';
import type { QueryCollection } from '../../src/collections/create-query-collection.ts';
import type { QueryFactory } from '../../src/ports/query-factory.ts';
import type { QueryClientPort } from '../../src/ports/query-client.ts';
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
  readonly items: readonly Order[];
}

interface GetOrderInput {
  readonly id: string;
}

interface Order {
  readonly id: string;
  readonly total: number;
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

declare const ordersContract: {
  readonly list: Procedure<ListOrdersInput, ListOrdersOutput>;
  readonly get: Procedure<GetOrderInput, Order>;
};

const serviceClient = createServiceClient({
  contract: ordersContract,
  serviceName: 'orders',
});

const typedClient: ServiceClient<typeof ordersContract> = serviceClient;
const listFromClient: Promise<ListOrdersOutput> = typedClient.list({ page: 1 });
const orderFromClient: Promise<Order> = typedClient.get({ id: 'ord_1' });

// @ts-expect-error page must remain a number in the inferred service client. // quality-allow: negative compile fixture requires TypeScript's expect-error directive to prove string input remains rejected
typedClient.list({ page: '1' });

const queryFactory = createQueryFactory('orders', ordersContract, serviceClient);
const typedQueryFactory: QueryFactory<typeof ordersContract> = queryFactory;
const listFromFactory: Promise<ListOrdersOutput> = typedQueryFactory.list({ page: 1 });
const listKey: readonly [string, 'list', string] = typedQueryFactory.list.key({ page: 1 });
const mutationOptions = typedQueryFactory.get.mutationOptions();
const mutationResult: Promise<Order> | Order | undefined = mutationOptions.mutationFn?.(
  { id: 'ord_1' },
);

const serviceUtils = createServiceQueryUtils(serviceClient);
const typedServiceUtils: ServiceQueryUtils<typeof ordersContract> = serviceUtils;
const queryOptions = typedServiceUtils.list.queryOptions({ input: { page: 1 } });
declare const queryContext: Parameters<typeof queryOptions.queryFn>[0];
const listFromUtils: Promise<ListOrdersOutput> | ListOrdersOutput = queryOptions.queryFn(
  queryContext,
);

const queryClient = createNetScriptQueryClient();
const typedQueryClient: QueryClientPort = queryClient;
const cached: ListOrdersOutput | undefined = typedQueryClient.getQueryData<ListOrdersOutput>([
  'orders',
  'list',
]);
const fetched: Promise<ListOrdersOutput> = typedQueryClient.fetchQuery({
  queryKey: ['orders', 'list'],
  queryFn: () => Promise.resolve({ items: [] }),
});

const collection = createQueryCollection({
  resource: 'orders',
  queryKey: ['orders', 'list'],
  queryFn: (): Promise<Order[]> => Promise.resolve([{ id: 'ord_1', total: 42 }]),
  getKey: (order) => order.id,
  queryClient,
});

const typedCollection: QueryCollection<Order> = collection;
const totals: number[] = typedCollection.map((order) => order.total);
const collectionItem: Order | undefined = typedCollection.get('ord_1');

void listFromClient;
void orderFromClient;
void listFromFactory;
void listKey;
void mutationResult;
void listFromUtils;
void cached;
void fetched;
void totals;
void collectionItem;
