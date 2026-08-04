import { definePage } from '@netscript/fresh/builders';
import {
  type DehydratedState,
  dehydrateQueryClient,
  hydrateFromDehydrated,
  useMutation,
  useQuery,
  useQueryClient,
} from '@netscript/fresh/query';
import { Deferred } from '@netscript/fresh/defer';
import { z } from 'zod';
import { useRef } from 'preact/hooks';

// Define typed route contract
import { bindRoutePattern, defineRouteContract } from '@netscript/fresh/route';

const ordersRoute = bindRoutePattern(
  defineRouteContract({
    searchSchema: z.object({
      limit: z.number().optional().default(10),
      offset: z.number().optional().default(0),
      status: z.string().optional(),
    }),
  }),
  '/dashboard/orders',
);

// Dummy types/stubs to mimic the SDK query factory
interface Order {
  id: string;
  status: string;
  amount: number;
}

interface OrderList {
  items: Order[];
  total: number;
}

// Mock SDK queries
const ordersQueryUtils = {
  list: {
    queryOptions: (input: { limit: number; offset: number; status?: string }) => ({
      queryKey: ['orders', input] as const,
      queryFn: (): Promise<OrderList> => {
        return Promise.resolve({ items: [], total: 0 });
      },
    }),
    clientKey: (input?: { limit: number; offset: number; status?: string }) =>
      ['orders', input] as const,
    getCachedEntry: (_input: { limit: number; offset: number; status?: string }) => {
      return Promise.resolve({ data: { items: [], total: 0 } as OrderList, cachedAt: Date.now() });
    },
  },
  update: {
    mutationOptions: () => ({
      mutationFn: (variables: { id: string; status: string }): Promise<Order> => {
        return Promise.resolve({ id: variables.id, status: variables.status, amount: 100 });
      },
    }),
  },
};

// Mock Query Client Creator
function createNetScriptQueryClient() {
  return getIslandQueryClient();
}
import { getIslandQueryClient } from '@netscript/fresh/query';

// Preact stubs
function OrdersTable(
  props: { items: Order[]; onAdvance: (vars: { id: string; status: string }) => void },
) {
  return (
    <div>
      {props.items.map((item) => (
        <div key={item.id}>
          {item.status}
          <button type='button' onClick={() => props.onAdvance({ id: item.id, status: 'shipped' })}>
            Advance
          </button>
        </div>
      ))}
    </div>
  );
}

// Client island receiving server-dehydrated query state
interface OrdersQueryIslandProps {
  dehydratedState?: DehydratedState;
  input: { limit: number; offset: number; status?: string };
  initialOrders: OrderList;
  cachedAt: number;
}

function OrdersQueryIsland(props: OrdersQueryIslandProps) {
  const queryClient = useQueryClient();
  const hydratedRef = useRef(false);
  const currentKey = ordersQueryUtils.list.clientKey(props.input);

  if (!hydratedRef.current && props.dehydratedState) {
    hydrateFromDehydrated(queryClient, props.dehydratedState);
    hydratedRef.current = true;
  }

  const { data } = useQuery({
    ...ordersQueryUtils.list.queryOptions(props.input),
    initialData: props.initialOrders,
    staleTime: 15_000,
  });

  const mutation = useMutation({
    ...ordersQueryUtils.update.mutationOptions(),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: currentKey });
      const previous = queryClient.getQueryData<OrderList>(currentKey);
      if (previous) {
        queryClient.setQueryData(currentKey, {
          ...previous,
          items: previous.items.map((item) =>
            item.id === variables.id ? { ...item, status: variables.status } : item
          ),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(currentKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ordersQueryUtils.list.clientKey() });
    },
  });

  return <OrdersTable items={data?.items ?? []} onAdvance={mutation.mutate} />;
}

// Stats partial component rendering a deferred promise
interface StatsProps {
  statsPromise: Promise<{ revenue: number }>;
}

function StatsLayer(props: StatsProps) {
  return (
    <Deferred promise={props.statsPromise} fallback={<div>Loading stats...</div>}>
      {(data) => <div>Revenue: ${data.revenue}</div>}
    </Deferred>
  );
}

// Form component
import type { RuntimeFormState } from '@netscript/fresh/form';
const checkoutFormSchema = z.object({
  address: z.string().min(1),
  postalCode: z.string().min(3),
});

function CheckoutForm(props: RuntimeFormState<z.input<typeof checkoutFormSchema>>) {
  return (
    <form method='POST'>
      <input name='address' value={props.values.address ?? ''} />
      {props.fieldErrors?.address && <span>{props.fieldErrors.address}</span>}
      <button type='submit'>Submit</button>
    </form>
  );
}

// Page definition exercising the builder chain
const ordersPage = definePage()
  .withRoute(ordersRoute)
  .withTelemetry({ enabled: true, spanName: 'dashboard.orders.view' })
  .withPolicy('balanced')
  // cross-layer request-dedup: the cached orders slice is read once per request
  .withResource('ordersData', async (ctx) => {
    return await ordersQueryUtils.list.getCachedEntry({
      limit: ctx.search.limit,
      offset: ctx.search.offset,
      status: ctx.search.status,
    });
  })
  .withResource('dehydratedQuery', async (ctx) => {
    const queryClient = createNetScriptQueryClient();
    const queryOptions = ordersQueryUtils.list.queryOptions({
      limit: ctx.search.limit,
      offset: ctx.search.offset,
      status: ctx.search.status,
    });
    await queryClient.prefetchQuery(queryOptions);
    return dehydrateQueryClient(queryClient);
  })
  .withLayer('ordersQuery', OrdersQueryIsland, {
    loader: async (ctx) => {
      const entry = await ctx.resource('ordersData');
      const dehydratedState = await ctx.resource('dehydratedQuery');
      return {
        dehydratedState,
        input: {
          limit: ctx.search.limit,
          offset: ctx.search.offset,
          status: ctx.search.status,
        },
        initialOrders: entry.data,
        cachedAt: entry.cachedAt,
      };
    },
  })
  // Demonstrating withForm in the builder
  .withForm('checkoutForm', CheckoutForm, {
    schema: checkoutFormSchema,
    mutate: (_input) => {
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      return { message: 'Address updated successfully' };
    },
  })
  // Demonstrating definePartial & deferred-loader composition
  .withLayer('stats', StatsLayer, {
    loader: () => {
      // Deferred loader composition: returning a Promise resolved in background
      const statsPromise = Promise.resolve({ revenue: 45000 });
      return { statsPromise };
    },
    partial: '/partials/stats',
    partialName: 'stats-panel',
  })
  .withLayout((slots) => (
    <main>
      {slots.stats()}
      {slots.ordersQuery()}
      {slots.checkoutForm()}
    </main>
  ))
  .build();

// Use them locally so no unused variable compiler warnings occur
void ordersPage;
