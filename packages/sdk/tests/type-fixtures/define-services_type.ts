import { defineServices } from '../../src/presets/define-services.ts';
import type { QueryFactory } from '../../src/ports/query-factory.ts';
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

interface GetUserInput {
  readonly id: string;
}

interface GetUserOutput {
  readonly id: string;
  readonly name: string;
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
};

declare const usersContract: {
  readonly get: Procedure<GetUserInput, GetUserOutput>;
};

const sdk = defineServices({
  orders: { contract: ordersContract },
  users: { contract: usersContract, options: { staleTime: 60_000 } },
});

const ordersClient: ServiceClient<typeof ordersContract> = sdk.clients.orders;
const ordersQueries: QueryFactory<typeof ordersContract> = sdk.queries.orders;
const ordersUtils: ServiceQueryUtils<typeof ordersContract> = sdk.queryUtils.orders;
const usersClient: ServiceClient<typeof usersContract> = sdk.clients.users;
const usersQueries: QueryFactory<typeof usersContract> = sdk.queries.users;
const usersUtils: ServiceQueryUtils<typeof usersContract> = sdk.queryUtils.users;

const listResult = ordersQueries.list({ page: 1 });
const getOptions = usersUtils.get.queryOptions({ input: { id: 'usr_1' } });

void ordersClient;
void ordersUtils;
void usersClient;
void usersQueries;
void listResult;
void getOptions;
