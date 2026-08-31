import { assertEquals, assertThrows } from '@std/assert';
import { QueryClient } from '@tanstack/query-core';
import { dehydrateQueryClient, hydrateFromDehydrated } from '../src/application/query/hydration.ts';
import type { DehydratedState } from '../src/application/query/query-types.ts';

Deno.test('hydrateFromDehydrated restores readonly server state', () => {
  const serverClient = new QueryClient();
  serverClient.setQueryData(['greeting'], 'hello');
  const dehydratedState = dehydrateQueryClient(serverClient);
  Object.freeze(dehydratedState.mutations);
  Object.freeze(dehydratedState.queries);

  const browserClient = new QueryClient();
  hydrateFromDehydrated(browserClient, dehydratedState);

  assertEquals(browserClient.getQueryData(['greeting']), 'hello');
});

Deno.test('hydrateFromDehydrated rejects invalid cache entries', () => {
  const queryClient = new QueryClient();

  assertThrows(
    () => hydrateFromDehydrated(queryClient, { mutations: [{}], queries: [] }),
    TypeError,
    'Invalid dehydrated mutation at index 0',
  );
});

Deno.test('hydrateFromDehydrated rejects the evaluator guard-attack cases without mutation', () => {
  const validMutation = {
    mutationKey: ['mutation'],
    state: {
      context: undefined,
      data: undefined,
      error: null,
      failureCount: 0,
      failureReason: null,
      isPaused: true,
      status: 'pending',
      variables: undefined,
      submittedAt: 1,
    },
  };
  const validQuery = {
    queryHash: 'valid-query',
    queryKey: ['query'],
    state: {
      data: 'value',
      dataUpdateCount: 1,
      dataUpdatedAt: 1,
      error: null,
      errorUpdateCount: 0,
      errorUpdatedAt: 0,
      fetchFailureCount: 0,
      fetchFailureReason: null,
      fetchMeta: null,
      isInvalidated: false,
      status: 'success',
      fetchStatus: 'idle',
    },
  };
  const attacks: readonly {
    readonly name: string;
    readonly state: DehydratedState;
    readonly message: string;
  }[] = [
    {
      name: 'empty mutation',
      state: { mutations: [{}], queries: [] },
      message: 'Invalid dehydrated mutation at index 0',
    },
    {
      name: 'incomplete query at index one',
      state: { mutations: [], queries: [validQuery, { queryHash: 'x' }] },
      message: 'Invalid dehydrated query at index 1',
    },
    {
      name: 'bad query status',
      state: {
        mutations: [],
        queries: [{ ...validQuery, state: { ...validQuery.state, status: 'settled' } }],
      },
      message: 'Invalid dehydrated query at index 0',
    },
    {
      name: 'non-array query key',
      state: { mutations: [], queries: [{ ...validQuery, queryKey: 'query' }] },
      message: 'Invalid dehydrated query at index 0',
    },
    {
      name: 'non-record entries',
      state: { mutations: [null], queries: [] },
      message: 'Invalid dehydrated mutation at index 0',
    },
    {
      name: 'non-string scope id',
      state: { mutations: [{ ...validMutation, scope: { id: 1 } }], queries: [] },
      message: 'Invalid dehydrated mutation at index 0',
    },
    {
      name: 'non-array mutation key',
      state: { mutations: [{ ...validMutation, mutationKey: 'mutation' }], queries: [] },
      message: 'Invalid dehydrated mutation at index 0',
    },
    {
      name: 'bad mutation status',
      state: {
        mutations: [{
          ...validMutation,
          state: { ...validMutation.state, status: 'settled' },
        }],
        queries: [],
      },
      message: 'Invalid dehydrated mutation at index 0',
    },
  ];

  for (const attack of attacks) {
    const before = JSON.stringify(attack.state);
    const queryClient = new QueryClient();
    assertThrows(
      () => hydrateFromDehydrated(queryClient, attack.state),
      TypeError,
      attack.message,
      attack.name,
    );
    assertEquals(JSON.stringify(attack.state), before, `${attack.name} mutated its input`);
    assertEquals(queryClient.getQueryCache().getAll().length, 0, attack.name);
    assertEquals(queryClient.getMutationCache().getAll().length, 0, attack.name);
  }

  for (const invalidEntry of ['bad', 1, []]) {
    const nonRecordStates: readonly DehydratedState[] = [
      { mutations: [invalidEntry], queries: [] },
      { mutations: [], queries: [invalidEntry] },
    ];
    for (const state of nonRecordStates) {
      assertThrows(() => hydrateFromDehydrated(new QueryClient(), state), TypeError);
    }
  }

  assertThrows(
    () =>
      Reflect.apply(hydrateFromDehydrated, undefined, [new QueryClient(), {
        mutations: validMutation,
        queries: [],
      }]),
    TypeError,
    'mutations and queries must be arrays',
  );
  assertThrows(
    () =>
      Reflect.apply(hydrateFromDehydrated, undefined, [new QueryClient(), {
        mutations: [],
        queries: validQuery,
      }]),
    TypeError,
    'mutations and queries must be arrays',
  );
});
