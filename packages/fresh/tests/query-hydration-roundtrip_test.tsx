import { assert, assertEquals, assertInstanceOf } from '@std/assert';
import { onlineManager, QueryClient } from '@tanstack/query-core';
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
    mutationFn: async (value: string) => value.length,
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
    mutationFn: async () => undefined,
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
    mutationFn: async (value: string) => {
      attempts += 1;
      if (attempts === 1) {
        onlineManager.setOnline(false);
        throw failure;
      }
      return value.length;
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

Deno.test('query hydration preserves fields from a serialized error record', async () => {
  onlineManager.setOnline(false);
  const serverClient = new QueryClient();
  serverClient.mount();
  const mutation = serverClient.getMutationCache().build(serverClient, {
    mutationKey: ['serialized-error'],
    mutationFn: async (value: string) => value.length,
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

    const browserClient = new QueryClient();
    hydrateFromDehydrated(browserClient, wireState);

    const hydratedFailure = browserClient.getMutationCache().getAll()[0]?.state.failureReason;
    assertInstanceOf(hydratedFailure, Error);
    assertEquals(hydratedFailure.message, 'serialized failure');
    assertEquals(hydratedFailure.name, 'TypeError');
    assertEquals(hydratedFailure.stack, 'serialized stack');
  } finally {
    onlineManager.setOnline(true);
    await pending;
    serverClient.unmount();
  }
});
