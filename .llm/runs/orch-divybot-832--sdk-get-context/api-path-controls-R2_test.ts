import { assert, assertEquals } from '@std/assert';
import { baseContract } from '@netscript/contracts';
import { createServiceClient, defineSdkClientContribution } from '@netscript/sdk/client';
import { createQueryFactories } from '@netscript/sdk/query';
import { createServiceQueryUtils } from '@netscript/sdk/query-client';
import { QueryClient, QueryObserver } from 'npm:@tanstack/query-core@^5.104.1';

const REPLY = 'synthetic-r2-result';
const OBSERVATION_TICKS = 40;
const contract = {
  read: baseContract.route({ method: 'GET', path: '/read' })
    .meta({ access: { authentication: 'none' } }),
};

/** Observe only the final boundary; the public SDK, oRPC and TanStack paths stay real. */
function fixture() {
  const original = globalThis.fetch;
  const wire: { readonly signal: AbortSignal; readonly method: string }[] = [];
  const preparedSignals: (AbortSignal | undefined)[] = [];
  const complete: (() => void)[] = [];
  globalThis.fetch = (input, init) => {
    assert(input instanceof Request);
    const signal = init?.signal ?? input.signal;
    wire.push({ signal, method: input.method });
    return new Promise<Response>((resolve, reject) => {
      const onAbort = () => {
        signal.removeEventListener('abort', onAbort);
        reject(signal.reason);
      };
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) onAbort();
      complete.push(() => {
        signal.removeEventListener('abort', onAbort);
        resolve(Response.json({ json: REPLY }));
      });
    });
  };
  const contribution = defineSdkClientContribution<Record<never, never>>()({
    protocol: { family: 'netscript.sdk-client', major: 1 },
    id: 'test:r2-invariant',
    context: {},
    headerKeys: ['x-r2-invariant'],
    responseCache: { mode: 'invariant' },
    prepare: ({ signal }) => {
      preparedSignals.push(signal);
      return { headers: { 'x-r2-invariant': 'same' } };
    },
  });
  const client = createServiceClient({
    contract,
    serviceName: 'r2-query-evidence',
    protocol: 'https',
    resolveServiceUrl: () => 'https://example.invalid',
    propagateTraceContext: false,
    contributions: [contribution] as const,
  });
  return {
    client,
    wire,
    preparedSignals,
    release() {
      for (const done of complete) done();
    },
    close() {
      for (const done of complete) done();
      globalThis.fetch = original;
    },
  };
}

/** Allow the real deferred dedupe queue to execute; never classify this bound as a RED timeout. */
async function observeQueue(prepared: readonly unknown[], wire: readonly unknown[]): Promise<void> {
  for (let tick = 0; tick < OBSERVATION_TICKS; tick++) {
    await new Promise((resolve) => setTimeout(resolve, 1));
    if (prepared.length >= 2 && wire.length >= 1) {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return;
    }
  }
  assert(false, 'fixture did not reach the native fetch boundary; not a semantic RED');
}

for (const mode of ['different keys', 'different QueryClients'] as const) {
  Deno.test({
    name: `RED B1: queryUtils observers with ${mode} use independent signalled GET fetches`,
    sanitizeOps: true,
    sanitizeResources: true,
    async fn() {
      const f = fixture();
      const qa = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
      const qb = mode === 'different keys'
        ? qa
        : new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
      const ua = createServiceQueryUtils(f.client, { path: ['first'] });
      const ub = createServiceQueryUtils(f.client, {
        path: [mode === 'different keys' ? 'second' : 'first'],
      });
      const aOptions = ua.read.queryOptions({ input: {} });
      const bOptions = ub.read.queryOptions({ input: {} });
      assertEquals(qa === qb, mode === 'different keys');
      assertEquals(
        JSON.stringify(aOptions.queryKey) === JSON.stringify(bOptions.queryKey),
        mode === 'different QueryClients',
      );
      const a = new QueryObserver(qa, aOptions);
      const b = new QueryObserver(qb, bOptions);
      const unsubscribeA = a.subscribe(() => {});
      const unsubscribeB = b.subscribe(() => {});
      let aRejected = false;
      const aResult = qa.fetchQuery(aOptions).catch(() => {
        aRejected = true;
      });
      const bResult = qb.fetchQuery(bOptions);
      try {
        await observeQueue(f.preparedSignals, f.wire);
        assertEquals(f.preparedSignals.length, 2);
        assert(f.preparedSignals.every((signal) => signal instanceof AbortSignal));
        assert(f.wire.every(({ method }) => method === 'GET'));
        assertEquals(f.wire.length, 2, 'two signalled queryUtils executions need two fetches');
        await qa.cancelQueries({ queryKey: aOptions.queryKey, exact: true });
        await aResult;
        assert(aRejected);
        assertEquals(f.wire.filter(({ signal }) => signal.aborted).length, 1);
        assertEquals(qb.getQueryState(bOptions.queryKey)?.fetchStatus, 'fetching');
        f.release();
        assertEquals(await bResult, REPLY);
      } finally {
        f.close();
        await Promise.allSettled([aResult, bResult]);
        unsubscribeA();
        unsubscribeB();
        qa.clear();
        if (qb !== qa) qb.clear();
      }
    },
  });
}

Deno.test({
  name: 'CONTROL B1: queries queryOptions remain unsignalled and coalesce across different keys',
  sanitizeOps: true,
  sanitizeResources: true,
  async fn() {
    const f = fixture();
    const q = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const queries = createQueryFactories({
      first: { contract, client: f.client },
      second: { contract, client: f.client },
    });
    const aOptions = queries.first.read.queryOptions({});
    const bOptions = queries.second.read.queryOptions({});
    const a = new QueryObserver(q, aOptions);
    const b = new QueryObserver(q, bOptions);
    const unsubscribeA = a.subscribe(() => {});
    const unsubscribeB = b.subscribe(() => {});
    const aResult = q.fetchQuery(aOptions);
    const bResult = q.fetchQuery(bOptions);
    try {
      await observeQueue(f.preparedSignals, f.wire);
      assertEquals(f.preparedSignals, [undefined, undefined]);
      assertEquals(f.wire.length, 1, 'eligible unsignalled calls retain transport dedupe');
      f.release();
      assertEquals(await Promise.all([aResult, bResult]), [REPLY, REPLY]);
    } finally {
      f.close();
      await Promise.allSettled([aResult, bResult]);
      unsubscribeA();
      unsubscribeB();
      q.clear();
    }
  },
});

Deno.test({
  name: 'CONTROL B1: queryUtils observers for one key in one client share TanStack execution',
  sanitizeOps: true,
  sanitizeResources: true,
  async fn() {
    const f = fixture();
    const q = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
    const options = createServiceQueryUtils(f.client).read.queryOptions({ input: {} });
    const a = new QueryObserver(q, options);
    const b = new QueryObserver(q, options);
    const unsubscribeA = a.subscribe(() => {});
    const unsubscribeB = b.subscribe(() => {});
    const result = q.fetchQuery(options);
    try {
      for (let tick = 0; tick < OBSERVATION_TICKS && f.wire.length === 0; tick++) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
      assertEquals(f.preparedSignals.length, 1);
      assert(f.preparedSignals[0] instanceof AbortSignal);
      assertEquals(f.wire.length, 1);
      f.release();
      assertEquals(await result, REPLY);
    } finally {
      f.close();
      await Promise.allSettled([result]);
      unsubscribeA();
      unsubscribeB();
      q.clear();
    }
  },
});
