import {
  assert,
  assertEquals,
  assertFalse,
  assertNotStrictEquals,
  assertRejects,
  assertStrictEquals,
} from '@std/assert';
import { os } from '@orpc/server';
import { defineSdkClientContribution } from '../../src/client/sdk-client-contribution.ts';
import { createHttpClientLink } from '../../src/client/http-client-link.ts';
import { createServerServiceEnvKey } from '../../src/discovery/service-url.ts';
import type { PreparedSdkClientCall } from '../../src/internal/client-contributions/adapter-ports.ts';
import { createPreparedOutboundHeadersPort } from '../../src/internal/client-contributions/prepared-call.ts';
import {
  createStableV1ClientLink,
  type StableV1TransportContext,
} from '../../src/internal/client-contributions/stable-v1-adapter.ts';
import { resolveTransportPolicy } from '../../src/internal/transport-policy.ts';
import type { ClientLinkPort } from '../../src/ports/client-link-factory.ts';
import type { SdkClientPrepareOptions } from '../../src/ports/sdk-client-contribution.ts';

const SERVICE_NAME = 'sdk-contribution-adapter';
const RPC_PATH = `/api/rpc/v1/${SERVICE_NAME}`;
const OMITTED_CONTRIBUTION_BASELINE = JSON.stringify({
  url: `http://127.0.0.1:9${RPC_PATH}/echo`,
  method: 'POST',
  headers: [['content-type', 'application/json']],
  body: [...new TextEncoder().encode('{"json":{"message":"same"}}')],
});

interface CredentialContext {
  readonly credential: () => string;
}

interface IdentityContext extends CredentialContext {
  readonly locale: () => string;
}

interface PendingFetch {
  readonly headers: Headers;
  readonly reject: (reason?: unknown) => void;
}

function createContract() {
  return {
    echo: os.route({ method: 'POST', path: '/echo' }).handler(
      ({ input }: { input: unknown }) => input,
    ),
  };
}

function createCredentialContribution(
  observations: SdkClientPrepareOptions<CredentialContext>[],
) {
  return defineSdkClientContribution<CredentialContext>()({
    protocol: { family: 'netscript.sdk-client', major: 1 },
    id: 'test:credential',
    context: { credential: 'required' },
    headerKeys: ['x-test-credential'],
    responseCache: { mode: 'invariant' },
    prepare: (options) => {
      observations.push(options);
      return { headers: { 'x-test-credential': options.context.credential() } };
    },
  });
}

function createIdentityContribution(
  observations: SdkClientPrepareOptions<IdentityContext>[],
) {
  return defineSdkClientContribution<IdentityContext>()({
    protocol: { family: 'netscript.sdk-client', major: 1 },
    id: 'test:identity',
    context: { credential: 'required', locale: 'required' },
    headerKeys: ['authorization', 'accept-language'],
    responseCache: { mode: 'invariant' },
    prepare: (options) => {
      observations.push(options);
      return {
        headers: {
          authorization: options.context.credential(),
          'accept-language': options.context.locale(),
        },
      };
    },
  });
}

function transportDescriptor() {
  return Object.freeze({
    kind: 'http' as const,
    origin: new URL('http://127.0.0.1:9'),
    rpcPath: RPC_PATH,
    secure: false,
  });
}

function isAsyncIterator(value: unknown): value is AsyncIteratorObject<unknown> {
  return typeof value === 'object' && value !== null &&
    'next' in value && typeof value.next === 'function' &&
    Symbol.asyncIterator in value;
}

function eventThenFailure(value: unknown, error: Error): AsyncGenerator<unknown> {
  return (async function* () {
    yield value;
    throw error;
  })();
}

function singleEvent(value: unknown): AsyncGenerator<unknown> {
  return (async function* () {
    yield value;
  })();
}

async function waitForPendingFetches(
  pending: readonly PendingFetch[],
  minimum: number,
): Promise<void> {
  for (let attempt = 0; attempt < 50 && pending.length < minimum; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  assert(pending.length >= minimum, `Expected at least ${minimum} pending fetches`);
}

function createPendingFetch(pending: PendingFetch[]): typeof globalThis.fetch {
  return (_request, init) =>
    new Promise<Response>((_resolve, reject) => {
      pending.push({
        headers: new Headers(init?.headers),
        reject,
      });
    });
}

async function captureRejected(error: Error, operation: () => Promise<unknown>): Promise<void> {
  try {
    await operation();
    throw new Error('Expected operation to reject');
  } catch (caught) {
    assertStrictEquals(caught, error);
  }
}

Deno.test('forced unary retry prepares once and reuses one immutable prepared call', async () => {
  const observations: SdkClientPrepareOptions<CredentialContext>[] = [];
  const contribution = createCredentialContribution(observations);
  const preparedCalls: PreparedSdkClientCall<object>[] = [];
  const headerContainers: Headers[] = [];
  let attempts = 0;
  let policyCalls = 0;
  const policyProcedures: SdkClientPrepareOptions<CredentialContext>['procedure'][] = [];
  const finalError = new Error('transport failed');
  const rawLink: ClientLinkPort<
    StableV1TransportContext<object>,
    PreparedSdkClientCall<object>
  > = {
    call(_path, _input, options): Promise<unknown> {
      assert(options.preparedCall !== undefined);
      preparedCalls.push(options.preparedCall);
      headerContainers.push(new Headers(options.preparedCall.contributedHeaders.values));
      attempts += 1;
      return attempts === 1 ? Promise.reject(new Error('retry me')) : Promise.reject(finalError);
    },
  };
  const contract = createContract();
  const link = createStableV1ClientLink<CredentialContext>({
    link: rawLink,
    preparation: createPreparedOutboundHeadersPort([contribution]),
    transportPolicy: resolveTransportPolicy(contract, {
      transportPolicy: {
        method: (options) => {
          assertEquals(observations.length, 0);
          policyCalls += 1;
          policyProcedures.push(options.procedure);
          return options.inferredMethod;
        },
      },
    }),
    resolveTransport: transportDescriptor,
    hasContributions: true,
  });

  await captureRejected(finalError, () =>
    link.call(['echo'], { message: 'retry' }, {
      context: {
        credential: () => 'credential-A',
        retry: 1,
        retryDelay: 0,
        cache: 'no-store',
        traceHeaders: { traceparent: 'transport-only' },
      },
    }));

  assertEquals(observations.length, 1);
  assertEquals(policyCalls, 1);
  assertEquals(attempts, 2);
  assertStrictEquals(preparedCalls[0], preparedCalls[1]);
  assertStrictEquals(policyProcedures[0], observations[0].procedure);
  assertStrictEquals(policyProcedures[0], preparedCalls[0].call.transportPolicy.procedure);
  assertNotStrictEquals(headerContainers[0], headerContainers[1]);
  assertEquals([...headerContainers[0].entries()], [...headerContainers[1].entries()]);
  assertEquals(preparedCalls[0].contributedHeaders.values, {
    'x-test-credential': 'credential-A',
  });
  assert(Object.isFrozen(preparedCalls[0]));
  assert(Object.isFrozen(preparedCalls[0].contributedHeaders.values));
  assert(Object.isFrozen(observations[0]));
  assert(Object.isFrozen(observations[0].context));
  assertEquals(Object.keys(observations[0].context), ['credential']);
  assertFalse('retry' in observations[0].context);
  assertFalse('cache' in observations[0].context);
  assertFalse('traceHeaders' in observations[0].context);
  assertEquals(observations[0].procedure.path, ['echo']);
  assertEquals(observations[0].transport.kind, 'http');
  assertEquals(observations[0].input, { message: 'retry' });
});

Deno.test('HTTP retry materializes fresh transport headers with byte-equivalent contribution data', async () => {
  const envKey = createServerServiceEnvKey(SERVICE_NAME);
  const previous = Deno.env.get(envKey);
  Deno.env.set(envKey, 'http://127.0.0.1:9');
  const observations: SdkClientPrepareOptions<CredentialContext>[] = [];
  const containers: HeadersInit[] = [];
  const values: string[] = [];
  const transportError = new Error('wire failure');
  const transportFetch: typeof globalThis.fetch = (_request, init) => {
    assert(init?.headers !== undefined);
    containers.push(init.headers);
    values.push(new Headers(init.headers).get('x-test-credential') ?? '');
    return Promise.reject(transportError);
  };

  try {
    const link = createHttpClientLink({
      transportPolicy: resolveTransportPolicy(createContract()),
      serviceName: SERVICE_NAME,
      protocol: 'http',
      rpcPath: RPC_PATH,
      propagateTraceContext: false,
      getTraceHeaders: () => ({}),
      contributions: [createCredentialContribution(observations)],
      fetch: transportFetch,
    });
    await captureRejected(transportError, () =>
      link.call(['echo'], { message: 'wire' }, {
        context: {
          credential: () => 'credential-wire',
          retry: 1,
          retryDelay: 0,
        },
      }));

    assertEquals(observations.length, 1);
    assertEquals(values, ['credential-wire', 'credential-wire']);
    assertEquals(containers.length, 2);
    assertNotStrictEquals(containers[0], containers[1]);
  } finally {
    if (previous === undefined) Deno.env.delete(envKey);
    else Deno.env.set(envKey, previous);
  }
});

Deno.test('iterator reconnect starts one new preparation epoch and rotates credentials', async () => {
  let credential = 'A';
  const observations: SdkClientPrepareOptions<CredentialContext>[] = [];
  const contribution = createCredentialContribution(observations);
  const attempts: PreparedSdkClientCall<object>[] = [];
  let transportAttempt = 0;
  let policyCalls = 0;
  const rawLink: ClientLinkPort<
    StableV1TransportContext<object>,
    PreparedSdkClientCall<object>
  > = {
    call(_path, _input, options): Promise<unknown> {
      assert(options.preparedCall !== undefined);
      attempts.push(options.preparedCall);
      transportAttempt += 1;
      if (transportAttempt === 1) return Promise.reject(new Error('initial open failed'));
      if (transportAttempt === 2) {
        return Promise.resolve(eventThenFailure('A-item', new Error('iterator failed')));
      }
      if (transportAttempt === 3) return Promise.reject(new Error('reconnect open failed'));
      return Promise.resolve(singleEvent('B-item'));
    },
  };
  const contract = createContract();
  const link = createStableV1ClientLink<CredentialContext>({
    link: rawLink,
    preparation: createPreparedOutboundHeadersPort([contribution]),
    transportPolicy: resolveTransportPolicy(contract, {
      transportPolicy: {
        method: (options) => {
          policyCalls += 1;
          return options.inferredMethod;
        },
      },
    }),
    resolveTransport: transportDescriptor,
    hasContributions: true,
  });

  const output = await link.call(['echo'], { stream: true }, {
    context: {
      credential: () => credential,
      retry: 3,
      retryDelay: 0,
    },
  });
  assert(isAsyncIterator(output));
  assertEquals(await output.next(), { done: false, value: 'A-item' });
  credential = 'B';
  assertEquals(await output.next(), { done: false, value: 'B-item' });

  assertEquals(observations.length, 2);
  assertEquals(policyCalls, 2);
  assertEquals(attempts.length, 4);
  assertStrictEquals(attempts[0], attempts[1]);
  assertStrictEquals(attempts[2], attempts[3]);
  assertNotStrictEquals(attempts[1], attempts[2]);
  assertEquals(
    attempts.map((call) => call.contributedHeaders.values['x-test-credential']),
    ['A', 'A', 'B', 'B'],
  );
});

Deno.test('aborted iterator failure starts no reconnect epoch', async () => {
  const controller = new AbortController();
  const observations: SdkClientPrepareOptions<CredentialContext>[] = [];
  let transportAttempts = 0;
  const rawLink: ClientLinkPort<
    StableV1TransportContext<object>,
    PreparedSdkClientCall<object>
  > = {
    call(): Promise<unknown> {
      transportAttempts += 1;
      return Promise.resolve(eventThenFailure('first', new Error('after abort')));
    },
  };
  const contract = createContract();
  const link = createStableV1ClientLink<CredentialContext>({
    link: rawLink,
    preparation: createPreparedOutboundHeadersPort([
      createCredentialContribution(observations),
    ]),
    transportPolicy: resolveTransportPolicy(contract),
    resolveTransport: transportDescriptor,
    hasContributions: true,
  });

  const output = await link.call(['echo'], { stream: true }, {
    context: {
      credential: () => 'A',
      retry: 1,
      retryDelay: 0,
      signal: controller.signal,
    },
  });
  assert(isAsyncIterator(output));
  await output.next();
  controller.abort(new Error('stop stream'));
  await assertRejects(() => output.next(), Error, 'stop stream');
  assertEquals(observations.length, 1);
  assertEquals(transportAttempts, 1);
});

Deno.test('omitted and explicit-empty contributions produce byte-identical requests', async () => {
  const envKey = createServerServiceEnvKey(SERVICE_NAME);
  const previous = Deno.env.get(envKey);
  Deno.env.set(envKey, 'http://127.0.0.1:9');

  const capture = async (contributions?: readonly []): Promise<string> => {
    let requestBytes = '';
    const link = createHttpClientLink({
      transportPolicy: resolveTransportPolicy(createContract()),
      serviceName: SERVICE_NAME,
      protocol: 'http',
      rpcPath: RPC_PATH,
      propagateTraceContext: false,
      getTraceHeaders: () => ({}),
      contributions,
      fetch: async (request, init) => {
        const outgoing = new Request(request, init);
        requestBytes = JSON.stringify({
          url: outgoing.url,
          method: outgoing.method,
          headers: [...outgoing.headers.entries()].sort(),
          body: [...new Uint8Array(await outgoing.arrayBuffer())],
        });
        throw new Error('captured');
      },
    });
    await assertRejects(() =>
      link.call(['echo'], { message: 'same' }, {
        context: { cache: 'no-store' },
      })
    );
    return requestBytes;
  };

  try {
    assertEquals(await capture(), OMITTED_CONTRIBUTION_BASELINE);
    assertEquals(await capture([]), OMITTED_CONTRIBUTION_BASELINE);
  } finally {
    if (previous === undefined) Deno.env.delete(envKey);
    else Deno.env.set(envKey, previous);
  }
});

Deno.test('overlapping GETs with identical prepared headers coalesce while pending', async () => {
  const envKey = createServerServiceEnvKey(SERVICE_NAME);
  const previous = Deno.env.get(envKey);
  Deno.env.set(envKey, 'http://127.0.0.1:9');
  const observations: SdkClientPrepareOptions<IdentityContext>[] = [];
  const pending: PendingFetch[] = [];
  const contract = {
    echo: os.route({ method: 'GET', path: '/echo' }).handler(
      ({ input }: { input: unknown }) => input,
    ),
  };
  const link = createHttpClientLink({
    transportPolicy: resolveTransportPolicy(contract),
    serviceName: SERVICE_NAME,
    protocol: 'http',
    rpcPath: RPC_PATH,
    propagateTraceContext: false,
    getTraceHeaders: () => ({}),
    contributions: [createIdentityContribution(observations)],
    fetch: createPendingFetch(pending),
  });
  const first = link.call(['echo'], { message: 'same' }, {
    context: { credential: () => 'Bearer A', locale: () => 'en-US' },
  });
  const second = link.call(['echo'], { message: 'same' }, {
    context: { credential: () => 'Bearer A', locale: () => 'en-US' },
  });

  try {
    await waitForPendingFetches(pending, 1);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assertEquals(pending.length, 1);
    assertEquals(pending[0].headers.get('authorization'), 'Bearer A');
    assertEquals(pending[0].headers.get('accept-language'), 'en-US');
  } finally {
    for (const request of pending) request.reject(new Error('release coalesced requests'));
    await Promise.allSettled([first, second]);
    if (previous === undefined) Deno.env.delete(envKey);
    else Deno.env.set(envKey, previous);
  }
});

Deno.test('overlapping GETs with distinct prepared headers dispatch separately', async () => {
  const envKey = createServerServiceEnvKey(SERVICE_NAME);
  const previous = Deno.env.get(envKey);
  Deno.env.set(envKey, 'http://127.0.0.1:9');
  const observations: SdkClientPrepareOptions<IdentityContext>[] = [];
  const pending: PendingFetch[] = [];
  const contract = {
    echo: os.route({ method: 'GET', path: '/echo' }).handler(
      ({ input }: { input: unknown }) => input,
    ),
  };
  const link = createHttpClientLink({
    transportPolicy: resolveTransportPolicy(contract),
    serviceName: SERVICE_NAME,
    protocol: 'http',
    rpcPath: RPC_PATH,
    propagateTraceContext: false,
    getTraceHeaders: () => ({}),
    contributions: [createIdentityContribution(observations)],
    fetch: createPendingFetch(pending),
  });
  const first = link.call(['echo'], { message: 'same' }, {
    context: { credential: () => 'Bearer A', locale: () => 'en-US' },
  });
  const second = link.call(['echo'], { message: 'same' }, {
    context: { credential: () => 'Bearer B', locale: () => 'fr-FR' },
  });

  try {
    await waitForPendingFetches(pending, 2);
    assertEquals(pending.length, 2);
    assertEquals(
      pending.map((request) => request.headers.get('authorization')).sort(),
      ['Bearer A', 'Bearer B'],
    );
    assertEquals(
      pending.map((request) => request.headers.get('accept-language')).sort(),
      ['en-US', 'fr-FR'],
    );
  } finally {
    for (const request of pending) request.reject(new Error('release distinct requests'));
    await Promise.allSettled([first, second]);
    if (previous === undefined) Deno.env.delete(envKey);
    else Deno.env.set(envKey, previous);
  }
});
