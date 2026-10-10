import { oc } from '@orpc/contract';
import { z } from 'npm:zod@^4.6.5';
import { QueryClient, type QueryFunctionContext } from '@tanstack/query-core';
import { useQuery } from 'npm:@tanstack/preact-query@^5.104.1';
import { createServiceClient } from '@netscript/sdk/client';
import { createServiceQueryUtils } from '@netscript/sdk/query-client';
import type { QueryClientPort as PresetQueryClientPort } from '@netscript/sdk/presets';
import type { QueryClientPort, ServiceClient } from '@netscript/sdk/ports';

const contract = {
  list: oc.input(z.object({ offset: z.number(), limit: z.number() })).output(
    z.array(z.object({ id: z.string() })),
  ),
};
declare const securedClient: ServiceClient<typeof contract, { accessToken: string }>;

export function consumerAssertions(): void {
  const ordersClient = createServiceClient({ contract, serviceName: 'orders' });
  const utils = createServiceQueryUtils(ordersClient);
  const options = utils.list.queryOptions({ input: { offset: 0, limit: 20 } });
  const query = useQuery(options);
  const data: { id: string }[] | undefined = query.data;
  const queryClient = new QueryClient();
  const signal = new AbortController().signal;
  const result: Promise<{ id: string }[]> | { id: string }[] = options.queryFn({
    client: queryClient,
    queryKey: options.queryKey,
    signal,
    meta: undefined,
  });

  // Equality checks catch widening to unknown/any without casts or suppressions.
  type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true
    : false;
  type Assert<T extends true> = T;
  type PresetTypeClosure = Assert<Equal<PresetQueryClientPort, QueryClientPort>>;
  type Input = Assert<
    Equal<Parameters<typeof utils.list.queryOptions>[0]['input'], {
      offset: number;
      limit: number;
    }>
  >;
  type Output = Assert<Equal<typeof query.data, { id: string }[] | undefined>>;
  type Cancellation = Assert<Equal<Parameters<typeof options.queryFn>[0]['signal'], AbortSignal>>;
  type QueryClientContext = Assert<
    Equal<Parameters<typeof options.queryFn>[0]['client'], QueryClient>
  >;
  type TanStackContext = Assert<
    QueryFunctionContext extends Parameters<typeof options.queryFn>[0] ? true : false
  >;

  const securedUtils = createServiceQueryUtils(securedClient);
  const securedOptions = securedUtils.list.queryOptions({
    input: { offset: 0, limit: 20 },
    context: { accessToken: 'fixture-only' },
  });
  const securedQuery = useQuery(securedOptions);
  type ClientContext = Assert<
    Equal<Parameters<typeof securedUtils.list.queryOptions>[0]['context'], { accessToken: string }>
  >;
  type RequiredContext = Assert<
    Equal<
      Record<never, never> extends
        Pick<Parameters<typeof securedUtils.list.queryOptions>[0], 'context'> ? true
        : false,
      false
    >
  >;
  type SecuredOutput = Assert<Equal<typeof securedQuery.data, { id: string }[] | undefined>>;

  void data;
  void result;
  const proof:
    & PresetTypeClosure
    & Input
    & Output
    & Cancellation
    & QueryClientContext
    & TanStackContext
    & ClientContext
    & RequiredContext
    & SecuredOutput = true;
  void proof;
}
