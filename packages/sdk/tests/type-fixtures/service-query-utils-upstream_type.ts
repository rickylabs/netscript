import type { Client } from 'npm:@orpc/client@1.13.5';
import { createTanstackQueryUtils } from 'npm:@orpc/tanstack-query@1.13.5';
import type { ContractProcedureLike, ContractSchema } from '../../src/ports/service-client.ts';
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

declare const upstreamClient: {
  readonly orders: {
    readonly list: Client<Record<never, never>, ListOrdersInput, ListOrdersOutput, Error>;
  };
};

const upstreamUtils = createTanstackQueryUtils(upstreamClient);
const sdkUtils: ServiceQueryUtils<typeof serviceContract> = upstreamUtils;

void sdkUtils;
