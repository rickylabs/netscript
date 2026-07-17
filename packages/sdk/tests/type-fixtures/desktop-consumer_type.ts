import { createDesktopRpcLink, createDesktopServiceClient } from '@netscript/sdk/desktop';
import type {
  ContractProcedureLike,
  ContractSchema,
  DesktopBindingInvoke,
  ServiceClient,
} from '@netscript/sdk/desktop';

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

declare const invoke: DesktopBindingInvoke;
declare const ordersContract: {
  readonly get: Procedure<GetOrderInput, Order>;
};

const link = createDesktopRpcLink({ invoke });
const client = createDesktopServiceClient({ contract: ordersContract, invoke });
const typedClient: ServiceClient<typeof ordersContract> = client;
const order: Promise<Order> = typedClient.get({ id: 'ord_1' });

// @ts-expect-error id must remain a string across the Desktop transport. // quality-allow: negative compile fixture proves contract input remains enforced without bindings.d.ts
typedClient.get({ id: 42 });

void link;
void order;
