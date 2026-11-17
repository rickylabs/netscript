import { assert, assertEquals } from '@std/assert';
import { baseContract } from '@netscript/contracts';
import { createServiceClient, type ServiceClientContext } from '@netscript/sdk/client';
import { createBearerSdkClientContribution } from '@netscript/plugin-auth-core/sdk';

const REPLY = { json: { ok: true } };
const DEADLINE_MS = 30;
const OBSERVATION_MS = 60;
const contract = {
  privateRead: baseContract.route({ method: 'GET', path: '/private-read' })
    .meta({ access: { authentication: 'required' }, policy: { cache: 'no-store' } }),
  publicRead: baseContract.route({ method: 'GET', path: '/public-read' })
    .meta({ access: { authentication: 'none' } }),
  cachedRead: baseContract.route({ method: 'GET', path: '/cached-read' })
    .meta({ access: { authentication: 'none' }, policy: { cache: 'force-cache' } }),
};

interface CredentialContext {
  readonly auth: { readonly getSessionSecret: () => string | undefined };
}

interface Wire {
  readonly method: string;
  readonly cache: RequestCache | undefined;
  readonly initSignal: AbortSignal | null | undefined;
  readonly effectiveSignal: AbortSignal | undefined;
  readonly authorization: string | null;
}

/** Only the final network boundary is replaced; SDK, codec, plugins and bearer run unchanged. */
function fixture(pending = false) {
  const originalFetch = globalThis.fetch;
  const wire: Wire[] = [];
  const finish: (() => void)[] = [];
  let preparations = 0;
  globalThis.fetch = (input, init) => {
    assert(input instanceof Request);
    const signal = init?.signal ?? input.signal;
    const headers = new Headers(init?.headers ?? input.headers);
    wire.push({
      method: input.method,
      cache: init?.cache,
      initSignal: init?.signal,
      effectiveSignal: signal,
      authorization: headers.get('authorization'),
    });
    if (!pending) return Promise.resolve(Response.json(REPLY));
    return new Promise<Response>((resolve, reject) => {
      const onAbort = () => {
        signal.removeEventListener('abort', onAbort);
        reject(signal.reason);
      };
      signal.addEventListener('abort', onAbort, { once: true });
      if (signal.aborted) onAbort();
      finish.push(() => {
        signal.removeEventListener('abort', onAbort);
        resolve(Response.json(REPLY));
      });
    });
  };
  const bearer = createBearerSdkClientContribution<CredentialContext>({
    context: { auth: 'required' },
    resolveCredential: ({ context }) => {
      preparations++;
      return context.auth.getSessionSecret();
    },
    responseCache: { mode: 'direct-only' },
  });
  const client = createServiceClient({
    contract,
    serviceName: 'sdk-context-reproducer',
    protocol: 'https',
    resolveServiceUrl: () => 'https://example.invalid',
    propagateTraceContext: false,
    contributions: [bearer] as const,
  });
  return {
    client,
    wire,
    preparations: () => preparations,
    context: (extra: ServiceClientContext = {}, credential = 'synthetic-a') => ({
      auth: { getSessionSecret: () => credential },
      retry: 0,
      ...extra,
    }),
    close() {
      for (const resolve of finish) resolve();
      globalThis.fetch = originalFetch;
    },
  };
}

async function entered(wire: readonly Wire[], count: number): Promise<void> {
  for (let attempt = 0; attempt < 50 && wire.length < count; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  assert(wire.length >= count, 'expected final SDK fetch boundary entry');
}

Deno.test('RED: native authenticated GET retains explicit no-store and init signal', async () => {
  const f = fixture();
  const request = new AbortController();
  const deadline = new AbortController();
  try {
    await f.client.privateRead({}, {
      context: f.context({
        cache: 'no-store',
        signal: AbortSignal.any([request.signal, deadline.signal]),
      }),
    });
    assertEquals(f.preparations(), 1);
    assertEquals(f.wire[0].method, 'GET');
    assertEquals(f.wire[0].authorization, 'Bearer synthetic-a');
    assertEquals([f.wire[0].cache, f.wire[0].initSignal instanceof AbortSignal], [
      'no-store',
      true,
    ]);
  } finally {
    f.close();
  }
});

Deno.test('RED: metadata no-store without a signal reaches fetch', async () => {
  const f = fixture();
  try {
    await f.client.privateRead({}, { context: f.context() });
    assertEquals(f.wire[0].cache, 'no-store');
  } finally {
    f.close();
  }
});

Deno.test('RED: public GET retains explicit context signal in fetch init', async () => {
  const f = fixture();
  try {
    await f.client.publicRead({}, { context: f.context({ signal: new AbortController().signal }) });
    assertEquals(f.preparations(), 0);
    assert(f.wire[0].initSignal instanceof AbortSignal, 'SDK init.signal must exist');
  } finally {
    f.close();
  }
});

Deno.test('CONTROL: identical eligible default GETs still deduplicate', async () => {
  const f = fixture();
  try {
    const context = f.context();
    await Promise.all([
      f.client.publicRead({}, { context }),
      f.client.publicRead({}, { context }),
    ]);
    assertEquals(f.wire.length, 1);
    assertEquals(f.wire[0].method, 'GET');
  } finally {
    f.close();
  }
});

Deno.test('CONTROL: force-cache metadata reaches fetch', async () => {
  const f = fixture();
  try {
    await f.client.cachedRead({}, { context: f.context() });
    assertEquals(f.wire[0].cache, 'force-cache');
  } finally {
    f.close();
  }
});

Deno.test('CONTROL: contributed identities are isolated before deduplication', async () => {
  const f = fixture();
  try {
    await Promise.all([
      f.client.privateRead({}, { context: f.context({}, 'synthetic-a') }),
      f.client.privateRead({}, { context: f.context({}, 'synthetic-b') }),
    ]);
    assertEquals(f.wire.length, 2);
    assertEquals(f.preparations(), 2);
    assertEquals(f.wire.map((w) => w.authorization).sort(), [
      'Bearer synthetic-a',
      'Bearer synthetic-b',
    ]);
  } finally {
    f.close();
  }
});

Deno.test('RED: no-store and default callers never share a cache group', async () => {
  const f = fixture();
  try {
    await Promise.all([
      f.client.publicRead({}, { context: f.context({ cache: 'no-store' }) }),
      f.client.publicRead({}, { context: f.context({ cache: 'default' }) }),
    ]);
    assertEquals(f.wire.length, 2, 'different effective cache modes require separate fetches');
  } finally {
    f.close();
  }
});

for (const kind of ['request', 'deadline'] as const) {
  Deno.test(`CONTROL: single pending GET effective Request signal cancels on ${kind}`, async () => {
    const f = fixture(true);
    const request = new AbortController();
    const signal = kind === 'deadline'
      ? AbortSignal.any([request.signal, AbortSignal.timeout(DEADLINE_MS)])
      : request.signal;
    let rejected = false;
    const result = f.client.publicRead({}, { context: f.context({ signal }) }).catch(() => {
      rejected = true;
    });
    try {
      await entered(f.wire, 1);
      if (kind === 'request') request.abort();
      await new Promise((resolve) => setTimeout(resolve, OBSERVATION_MS));
      assert(f.wire[0].effectiveSignal?.aborted);
      assert(rejected, 'effective Request signal must reject the pending fetch');
    } finally {
      f.close();
      await result;
    }
  });
}

Deno.test('RED: aborting one caller rejects it while an unsignalled peer survives', async () => {
  const f = fixture(true);
  const abort = new AbortController();
  let cancelled = false;
  let survivorSettled = false;
  const a = f.client.publicRead({}, { context: f.context({ signal: abort.signal }) }).catch(() => {
    cancelled = true;
  });
  const b = f.client.publicRead({}, { context: f.context() }).then(() => {
    survivorSettled = true;
  });
  try {
    await entered(f.wire, 1);
    abort.abort();
    await new Promise((resolve) => setTimeout(resolve, OBSERVATION_MS));
    assertEquals(survivorSettled, false);
    assert(cancelled, 'cancelled caller must reject without waiting for a peer');
  } finally {
    f.close();
    await Promise.all([a, b]);
  }
});
