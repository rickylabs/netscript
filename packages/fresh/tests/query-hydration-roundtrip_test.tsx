import { assert, assertEquals, assertInstanceOf } from '@std/assert';
import { dehydrate, onlineManager, QueryClient } from '@tanstack/query-core';
import { render as renderToString } from 'preact-render-to-string';
import { QueryHydrationScript } from '../src/application/query/hydration-script.tsx';
import { dehydrateQueryClient, hydrateFromDehydrated } from '../src/application/query/hydration.ts';
import type { DehydratedState } from '../src/application/query/query-types.ts';

async function waitForMutationState(
  predicate: () => boolean,
  description: string,
): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  throw new Error(`Timed out waiting for ${description}`);
}

function roundTripThroughHydrationScript(state: DehydratedState): DehydratedState {
  const html = renderToString(<QueryHydrationScript state={state} />);
  const contentStart = html.indexOf('>') + 1;
  const contentEnd = html.lastIndexOf('</script>');
  if (contentStart === 0 || contentEnd < contentStart) {
    throw new Error('QueryHydrationScript did not render a JSON script element');
  }
  return JSON.parse(html.slice(contentStart, contentEnd));
}

function requireRecord(value: unknown, description: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${description} must be a record`);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

Deno.test('query hydration JSON round trip restores a success query', () => {
  const serverClient = new QueryClient();
  serverClient.setQueryData(['greeting'], 'hello');
  const wireState = roundTripThroughHydrationScript(dehydrateQueryClient(serverClient));

  const browserClient = new QueryClient();
  hydrateFromDehydrated(browserClient, wireState);

  assertEquals(browserClient.getQueryData(['greeting']), 'hello');
});

Deno.test('query hydration JSON round trip restores a paused mutation', async () => {
  onlineManager.setOnline(false);
  const serverClient = new QueryClient();
  serverClient.mount();
  const mutation = serverClient.getMutationCache().build(serverClient, {
    mutationKey: ['save-draft'],
    mutationFn: (value: string) => Promise.resolve(value.length),
  });
  const pending = mutation.execute('draft');

  try {
    await waitForMutationState(() => mutation.state.isPaused, 'paused mutation');
    const wireState = roundTripThroughHydrationScript(dehydrateQueryClient(serverClient));

    const browserClient = new QueryClient();
    hydrateFromDehydrated(browserClient, wireState);

    assertEquals(browserClient.getMutationCache().getAll().length, 1);
  } finally {
    onlineManager.setOnline(true);
    await pending;
    serverClient.unmount();
  }
});

Deno.test('query hydration JSON round trip restores a paused mutation without variables', async () => {
  onlineManager.setOnline(false);
  const serverClient = new QueryClient();
  serverClient.mount();
  const mutation = serverClient.getMutationCache().build<void, Error, void, unknown>(serverClient, {
    mutationKey: ['save-without-input'],
    mutationFn: () => Promise.resolve(undefined),
  });
  const pending = mutation.execute();

  try {
    await waitForMutationState(() => mutation.state.isPaused, 'paused mutation without variables');
    const wireState = roundTripThroughHydrationScript(dehydrateQueryClient(serverClient));
    const wireMutation = requireRecord(wireState.mutations[0], 'wire mutation');
    const wireMutationState = requireRecord(wireMutation.state, 'wire mutation state');
    assert(!Object.hasOwn(wireMutationState, 'variables'));

    const browserClient = new QueryClient();
    hydrateFromDehydrated(browserClient, wireState);

    assertEquals(browserClient.getMutationCache().getAll().length, 1);
  } finally {
    onlineManager.setOnline(true);
    await pending;
    serverClient.unmount();
  }
});

Deno.test('query hydration JSON round trip revives a paused mutation prior failure', async () => {
  onlineManager.setOnline(true);
  const serverClient = new QueryClient();
  serverClient.mount();
  const failure = new Error('prior failure');
  let attempts = 0;
  const mutation = serverClient.getMutationCache().build(serverClient, {
    mutationKey: ['retry-draft'],
    mutationFn: (value: string) => {
      attempts += 1;
      if (attempts === 1) {
        onlineManager.setOnline(false);
        return Promise.reject(failure);
      }
      return Promise.resolve(value.length);
    },
    retry: 1,
    retryDelay: 0,
  });
  const pending = mutation.execute('draft');

  try {
    await waitForMutationState(
      () => mutation.state.isPaused && mutation.state.failureCount === 1,
      'paused mutation after its first failure',
    );
    assertEquals(mutation.state.failureReason, failure);

    const wireState = roundTripThroughHydrationScript(dehydrateQueryClient(serverClient));
    const wireMutation = requireRecord(wireState.mutations[0], 'wire mutation');
    const wireMutationState = requireRecord(wireMutation.state, 'wire mutation state');
    assertEquals(wireMutationState.failureReason, {});
    assert(!Object.hasOwn(wireMutationState, 'context'));
    assert(!Object.hasOwn(wireMutationState, 'data'));

    const browserClient = new QueryClient();
    hydrateFromDehydrated(browserClient, wireState);

    const hydratedFailure = browserClient.getMutationCache().getAll()[0]?.state.failureReason;
    assertInstanceOf(hydratedFailure, Error);
  } finally {
    onlineManager.setOnline(true);
    await pending;
    serverClient.unmount();
  }
});

const rejectionCases: readonly [string, unknown][] = [
  ['string', 'offline'],
  ['number', 503],
  ['boolean', true],
  ['array', ['offline', 503]],
  ['plain object', { status: 503, body: 'unavailable' }],
];

for (const [label, rejection] of rejectionCases) {
  Deno.test(`query hydration preserves ${label} rejection and sibling query`, async () => {
    onlineManager.setOnline(true);
    const serverClient = new QueryClient();
    serverClient.mount();
    serverClient.setQueryData(['still-present', label], `query-${label}`);
    let attempts = 0;
    const mutation = serverClient.getMutationCache().build(serverClient, {
      mutationKey: ['reject-with', label],
      mutationFn: () => {
        attempts += 1;
        if (attempts === 1) {
          onlineManager.setOnline(false);
          return Promise.reject(rejection);
        }
        return Promise.resolve('recovered');
      },
      retry: 1,
      retryDelay: 0,
    });
    const pending = mutation.execute(undefined);

    try {
      await waitForMutationState(
        () => mutation.state.isPaused && mutation.state.failureCount === 1,
        `paused ${label} rejection`,
      );
      const wireState = roundTripThroughHydrationScript(dehydrateQueryClient(serverClient));
      const wireMutation = requireRecord(wireState.mutations[0], `${label} wire mutation`);
      const wireMutationState = requireRecord(
        wireMutation.state,
        `${label} wire mutation state`,
      );
      assertEquals(wireMutationState.failureReason, rejection);

      const browserClient = new QueryClient();
      hydrateFromDehydrated(browserClient, wireState);

      assertEquals(
        browserClient.getQueryData(['still-present', label]),
        `query-${label}`,
      );
      assertEquals(browserClient.getMutationCache().getAll().length, 1);
      const hydratedFailure = browserClient.getMutationCache().getAll()[0]?.state.failureReason;
      assertInstanceOf(hydratedFailure, Error);
      assertEquals(hydratedFailure.cause, rejection);
    } finally {
      onlineManager.setOnline(true);
      await pending;
      serverClient.unmount();
    }
  });
}

Deno.test('query hydration restores a mutation whose failure reason is omitted on the wire', async () => {
  onlineManager.setOnline(true);
  const serverClient = new QueryClient();
  serverClient.mount();
  serverClient.setQueryData(['undefined-mutation-sibling'], 'kept');
  let attempts = 0;
  const mutation = serverClient.getMutationCache().build(serverClient, {
    mutationKey: ['reject-with-undefined'],
    mutationFn: () => {
      attempts += 1;
      if (attempts === 1) {
        onlineManager.setOnline(false);
        return Promise.reject();
      }
      return Promise.resolve('recovered');
    },
    retry: 1,
    retryDelay: 0,
  });
  const pending = mutation.execute(undefined);

  try {
    await waitForMutationState(
      () => mutation.state.isPaused && mutation.state.failureCount === 1,
      'paused undefined rejection',
    );
    const wireState = roundTripThroughHydrationScript(dehydrateQueryClient(serverClient));
    const wireMutation = requireRecord(wireState.mutations[0], 'undefined wire mutation');
    const wireMutationState = requireRecord(
      wireMutation.state,
      'undefined wire mutation state',
    );
    assert(!Object.hasOwn(wireMutationState, 'failureReason'));

    const browserClient = new QueryClient();
    hydrateFromDehydrated(browserClient, wireState);

    assertEquals(browserClient.getQueryData(['undefined-mutation-sibling']), 'kept');
    assertEquals(browserClient.getMutationCache().getAll().length, 1);
    const hydratedFailure = browserClient.getMutationCache().getAll()[0]?.state.failureReason;
    assertInstanceOf(hydratedFailure, Error);
    assertEquals(hydratedFailure.cause, undefined);
  } finally {
    onlineManager.setOnline(true);
    await pending;
    serverClient.unmount();
  }
});

Deno.test('query hydration restores omitted query error twins and sibling query', async () => {
  const serverClient = new QueryClient();
  serverClient.setQueryData(['undefined-query-sibling'], 'kept');
  await serverClient.fetchQuery({
    queryKey: ['reject-query-with-undefined'],
    queryFn: () => Promise.reject(),
    retry: false,
  }).catch(() => undefined);

  const wireState = roundTripThroughHydrationScript(
    dehydrate(serverClient, { shouldDehydrateQuery: () => true }),
  );
  const wireFailedQuery = wireState.queries.find((query) =>
    isRecord(query) && Array.isArray(query.queryKey) &&
    query.queryKey[0] === 'reject-query-with-undefined'
  );
  const wireQuery = requireRecord(wireFailedQuery, 'undefined wire query');
  const wireQueryState = requireRecord(wireQuery.state, 'undefined wire query state');
  assert(!Object.hasOwn(wireQueryState, 'error'));
  assert(!Object.hasOwn(wireQueryState, 'fetchFailureReason'));

  const browserClient = new QueryClient();
  hydrateFromDehydrated(browserClient, wireState);

  assertEquals(browserClient.getQueryData(['undefined-query-sibling']), 'kept');
  const hydratedState = browserClient.getQueryState(['reject-query-with-undefined']);
  assertInstanceOf(hydratedState?.error, Error);
  assertEquals(hydratedState.error.cause, undefined);
  assertInstanceOf(hydratedState.fetchFailureReason, Error);
  assertEquals(hydratedState.fetchFailureReason.cause, undefined);
});

Deno.test('query hydration cannot escape through hostile rejection coercion', async () => {
  onlineManager.setOnline(true);
  const serverClient = new QueryClient();
  serverClient.mount();
  serverClient.setQueryData(['hostile-sibling'], 'kept');
  const hostileValue = {
    [Symbol.toPrimitive](): never {
      throw new Error('hostile Symbol.toPrimitive');
    },
    toString(): never {
      throw new Error('hostile toString');
    },
  };
  const rejection = [hostileValue];
  let attempts = 0;
  const mutation = serverClient.getMutationCache().build(serverClient, {
    mutationKey: ['reject-with-hostile-coercion'],
    mutationFn: () => {
      attempts += 1;
      if (attempts === 1) {
        onlineManager.setOnline(false);
        return Promise.reject(rejection);
      }
      return Promise.resolve('recovered');
    },
    retry: 1,
    retryDelay: 0,
  });
  const pending = mutation.execute(undefined);

  try {
    await waitForMutationState(
      () => mutation.state.isPaused && mutation.state.failureCount === 1,
      'paused hostile rejection',
    );
    const dehydratedState = dehydrateQueryClient(serverClient);
    const wireState = roundTripThroughHydrationScript(dehydratedState);

    const wireClient = new QueryClient();
    hydrateFromDehydrated(wireClient, wireState);
    assertEquals(wireClient.getQueryData(['hostile-sibling']), 'kept');

    const directClient = new QueryClient();
    hydrateFromDehydrated(directClient, dehydratedState);
    assertEquals(directClient.getQueryData(['hostile-sibling']), 'kept');
    const hydratedFailure = directClient.getMutationCache().getAll()[0]?.state.failureReason;
    assertInstanceOf(hydratedFailure, Error);
    assert(hydratedFailure.cause === rejection);
  } finally {
    onlineManager.setOnline(true);
    await pending;
    serverClient.unmount();
  }
});

Deno.test('query hydration preserves fields from a serialized error record', async () => {
  onlineManager.setOnline(false);
  const serverClient = new QueryClient();
  serverClient.mount();
  const mutation = serverClient.getMutationCache().build(serverClient, {
    mutationKey: ['serialized-error'],
    mutationFn: (value: string) => Promise.resolve(value.length),
  });
  const pending = mutation.execute('draft');

  try {
    await waitForMutationState(() => mutation.state.isPaused, 'paused mutation');
    const wireState = roundTripThroughHydrationScript(dehydrateQueryClient(serverClient));
    const wireMutation = requireRecord(wireState.mutations[0], 'wire mutation');
    const wireMutationState = requireRecord(wireMutation.state, 'wire mutation state');
    wireMutationState.failureReason = {
      message: 'serialized failure',
      name: 'TypeError',
      stack: 'serialized stack',
    };
    wireMutationState.error = {
      message: 'serialized current error',
      name: 'RangeError',
    };

    const browserClient = new QueryClient();
    hydrateFromDehydrated(browserClient, wireState);

    const hydratedMutationState = browserClient.getMutationCache().getAll()[0]?.state;
    const hydratedFailure = hydratedMutationState?.failureReason;
    assertInstanceOf(hydratedFailure, Error);
    assertEquals(hydratedFailure.message, 'serialized failure');
    assertEquals(hydratedFailure.name, 'TypeError');
    assertEquals(hydratedFailure.stack, 'serialized stack');
    assertInstanceOf(hydratedMutationState?.error, Error);
    assertEquals(hydratedMutationState.error.message, 'serialized current error');
    assertEquals(hydratedMutationState.error.name, 'RangeError');
  } finally {
    onlineManager.setOnline(true);
    await pending;
    serverClient.unmount();
  }
});

Deno.test('query hydration revives serialized query error fields', () => {
  const serverClient = new QueryClient();
  serverClient.setQueryData(['failed-query'], 'stale data');
  const wireState = roundTripThroughHydrationScript(dehydrateQueryClient(serverClient));
  const wireQuery = requireRecord(wireState.queries[0], 'wire query');
  const wireQueryState = requireRecord(wireQuery.state, 'wire query state');
  wireQueryState.error = { message: 'serialized query error' };
  wireQueryState.fetchFailureReason = { message: 'serialized fetch failure' };
  wireQueryState.status = 'error';

  const browserClient = new QueryClient();
  hydrateFromDehydrated(browserClient, wireState);

  const hydratedState = browserClient.getQueryCache().getAll()[0]?.state;
  assertInstanceOf(hydratedState?.error, Error);
  assertEquals(hydratedState.error.message, 'serialized query error');
  assertInstanceOf(hydratedState.fetchFailureReason, Error);
  assertEquals(hydratedState.fetchFailureReason.message, 'serialized fetch failure');
});
