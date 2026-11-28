import { assert, assertEquals, assertRejects } from '@std/assert';
import { AsyncIteratorClass, withEventMeta } from '@orpc/client';
import { os } from '@orpc/server';
import { defineSdkClientContribution } from '../../src/client/sdk-client-contribution.ts';
import type { PreparedSdkClientCall } from '../../src/internal/client-contributions/adapter-ports.ts';
import { createPreparedOutboundHeadersPort } from '../../src/internal/client-contributions/prepared-call.ts';
import {
  createStableV1ClientLink,
  type StableV1ResolvedEpoch,
  type StableV1TransportContext,
} from '../../src/internal/client-contributions/stable-v1-adapter.ts';
import { createTracedRpcFetch } from '../../src/internal/fetch-rpc-link.ts';
import { resolveTransportPolicy } from '../../src/internal/transport-policy.ts';
import type { ClientLinkPort } from '../../src/ports/client-link-factory.ts';
import type { SdkClientTransportDescriptor } from '../../src/ports/sdk-client-contribution.ts';

function createContract() {
  return {
    echo: os.route({ method: 'POST', path: '/echo' }).handler(
      ({ input }: { input: unknown }) => input,
    ),
  };
}

function isAsyncIterator(value: unknown): value is AsyncIteratorObject<unknown> {
  return typeof value === 'object' && value !== null &&
    'next' in value && typeof value.next === 'function' &&
    Symbol.asyncIterator in value;
}

Deno.test('createTracedRpcFetch preserves init.headers for string and URL inputs (oRPC v2 parity)', async () => {
  const observed: Array<{
    readonly inputType: string;
    readonly authorization: string | null;
    readonly contentType: string | null;
    readonly custom: string | null;
    readonly method: string | undefined;
  }> = [];

  const tracedFetch = createTracedRpcFetch({
    serviceName: 'orders',
    propagateTraceContext: false,
    transportFetch: (input, init) => {
      const headers = new Headers(init?.headers);
      observed.push({
        inputType: typeof input === 'string' ? 'string' : input instanceof URL ? 'URL' : 'Request',
        authorization: headers.get('authorization'),
        contentType: headers.get('content-type'),
        custom: headers.get('x-correlation'),
        method: init?.method,
      });
      return Promise.resolve(new Response('ok', { status: 200 }));
    },
  });

  await tracedFetch(
    'https://orders.in-process.localhost/api/rpc/v1/orders/echo',
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer v2-token',
        'content-type': 'application/json',
        'x-correlation': 'corr-1',
      },
    },
    {},
  );

  await tracedFetch(
    new URL('https://orders.in-process.localhost/api/rpc/v1/orders/echo'),
    {
      method: 'POST',
      headers: new Headers([
        ['authorization', 'Bearer url-token'],
        ['content-type', 'application/json'],
        ['x-correlation', 'corr-2'],
      ]),
    },
    {},
  );

  await tracedFetch(
    new Request('https://orders.in-process.localhost/api/rpc/v1/orders/echo', {
      method: 'POST',
      headers: {
        authorization: 'Bearer base-token',
        'content-type': 'application/json',
        'x-correlation': 'from-request',
      },
    }),
    {
      headers: {
        authorization: 'Bearer override-token',
      },
    },
    {},
  );

  assertEquals(observed, [
    {
      inputType: 'string',
      authorization: 'Bearer v2-token',
      contentType: 'application/json',
      custom: 'corr-1',
      method: 'POST',
    },
    {
      inputType: 'URL',
      authorization: 'Bearer url-token',
      contentType: 'application/json',
      custom: 'corr-2',
      method: 'POST',
    },
    {
      inputType: 'Request',
      authorization: 'Bearer override-token',
      contentType: 'application/json',
      custom: 'from-request',
      method: undefined,
    },
  ]);
});

Deno.test('createStableV1ClientLink resolveEpoch resolves before prepare, pins retries, and re-resolves on reconnect', async () => {
  const contract = createContract();
  const transportPolicy = resolveTransportPolicy(contract);

  // 1. Throwing resolveEpoch fails before contribution preparation runs.
  let prepareCallsBeforeFailure = 0;
  const failBeforePrepare = createStableV1ClientLink({
    transportPolicy,
    preparation: createPreparedOutboundHeadersPort([
      defineSdkClientContribution()({
        protocol: { family: 'netscript.sdk-client', major: 1 },
        id: 'test:epoch-order',
        context: {},
        headerKeys: ['x-epoch'],
        responseCache: { mode: 'invariant' },
        prepare: () => {
          prepareCallsBeforeFailure += 1;
          return { headers: { 'x-epoch': 'never' } };
        },
      }),
    ]),
    resolveEpoch: () => {
      throw new Error('epoch destination missing');
    },
    hasContributions: true,
  });

  await assertRejects(
    () => failBeforePrepare.call(['echo'], { message: 'x' }, { context: {} }),
    Error,
    'epoch destination missing',
  );
  assertEquals(prepareCallsBeforeFailure, 0);

  // 2. Unary retry stays pinned to epoch 1's resolved link even if the active target swaps mid-retry,
  //    and public transport descriptors carry zero hidden symbols.
  const retainedDescriptors: SdkClientTransportDescriptor[] = [];
  const callsByTarget: Array<{ readonly target: string; readonly header: string | undefined }> = [];
  let prepareCount = 0;
  let activeTarget: 'app-1' | 'app-2' = 'app-1';
  let app1Attempts = 0;

  const makeUnaryLink = (
    target: 'app-1' | 'app-2',
    failFirst: boolean,
  ): ClientLinkPort<StableV1TransportContext<object>, PreparedSdkClientCall<object>> => ({
    call(_path, input, options) {
      callsByTarget.push({
        target,
        header: options.preparedCall?.contributedHeaders.values['x-epoch'],
      });
      if (target === 'app-1' && failFirst && app1Attempts === 0) {
        app1Attempts += 1;
        activeTarget = 'app-2';
        return Promise.reject(new Error('transient-app-1-failure'));
      }
      app1Attempts += 1;
      return Promise.resolve({ target, input });
    },
  });

  const linksByTarget = {
    'app-1': makeUnaryLink('app-1', true),
    'app-2': makeUnaryLink('app-2', false),
  };

  const retryClientLink = createStableV1ClientLink({
    transportPolicy,
    preparation: createPreparedOutboundHeadersPort([
      defineSdkClientContribution()({
        protocol: { family: 'netscript.sdk-client', major: 1 },
        id: 'test:epoch-pin',
        context: {},
        headerKeys: ['x-epoch'],
        responseCache: { mode: 'invariant' },
        prepare: ({ transport }) => {
          retainedDescriptors.push(transport);
          prepareCount += 1;
          return { headers: { 'x-epoch': `epoch-${prepareCount}` } };
        },
      }),
    ]),
    resolveEpoch: (): StableV1ResolvedEpoch => ({
      transport: Object.freeze({
        kind: 'http' as const,
        origin: new URL('https://orders.in-process.localhost'),
        rpcPath: '/api/rpc/v1/orders',
        secure: true,
      }),
      link: linksByTarget[activeTarget],
    }),
    hasContributions: true,
  });

  const retryResult = await retryClientLink.call(
    ['echo'],
    { id: 1 },
    { context: { retry: 1, retryDelay: 0 } },
  );
  assertEquals(retryResult, { target: 'app-1', input: { id: 1 } });
  assertEquals(prepareCount, 1);
  assertEquals(callsByTarget, [
    { target: 'app-1', header: 'epoch-1' },
    { target: 'app-1', header: 'epoch-1' },
  ]);

  // Subsequent logical call resolves the new target cleanly.
  const secondResult = await retryClientLink.call(['echo'], { id: 2 }, { context: {} });
  assertEquals(secondResult, { target: 'app-2', input: { id: 2 } });
  assertEquals(prepareCount, 2);
  assertEquals(callsByTarget[2], { target: 'app-2', header: 'epoch-2' });

  for (const descriptor of retainedDescriptors) {
    assert(Object.isFrozen(descriptor));
    assertEquals(Object.getOwnPropertySymbols(descriptor), []);
  }

  // 3. Async-iterator reconnect calls resolveEpoch anew, picking up app-2 with fresh headers and lastEventId.
  let streamTarget: 'app-1' | 'app-2' = 'app-1';
  let streamPrepareCount = 0;
  const streamObserved: Array<{
    readonly target: string;
    readonly header: string | undefined;
    readonly lastEventId: string | undefined;
  }> = [];

  const streamLinks: Record<
    'app-1' | 'app-2',
    ClientLinkPort<StableV1TransportContext<object>, PreparedSdkClientCall<object>>
  > = {
    'app-1': {
      call(_path, _input, options) {
        streamObserved.push({
          target: 'app-1',
          header: options.preparedCall?.contributedHeaders.values['x-epoch'],
          lastEventId: options.lastEventId,
        });
        let step = 0;
        return Promise.resolve(
          new AsyncIteratorClass<unknown>(
            () => {
              if (step === 0) {
                step += 1;
                return Promise.resolve({
                  done: false,
                  value: withEventMeta({ app: 'app-1', seq: 1 }, { id: 'ev-1' }),
                });
              }
              streamTarget = 'app-2';
              return Promise.reject(new Error('stream-drop'));
            },
            () => Promise.resolve(),
          ),
        );
      },
    },
    'app-2': {
      call(_path, _input, options) {
        streamObserved.push({
          target: 'app-2',
          header: options.preparedCall?.contributedHeaders.values['x-epoch'],
          lastEventId: options.lastEventId,
        });
        let emitted = false;
        return Promise.resolve(
          new AsyncIteratorClass<unknown>(
            () => {
              if (!emitted) {
                emitted = true;
                return Promise.resolve({
                  done: false,
                  value: withEventMeta({ app: 'app-2', seq: 2 }, { id: 'ev-2' }),
                });
              }
              return Promise.resolve({ done: true, value: undefined });
            },
            () => Promise.resolve(),
          ),
        );
      },
    },
  };

  const streamClientLink = createStableV1ClientLink({
    transportPolicy,
    preparation: createPreparedOutboundHeadersPort([
      defineSdkClientContribution()({
        protocol: { family: 'netscript.sdk-client', major: 1 },
        id: 'test:stream-epoch',
        context: {},
        headerKeys: ['x-epoch'],
        responseCache: { mode: 'invariant' },
        prepare: () => {
          streamPrepareCount += 1;
          return { headers: { 'x-epoch': `stream-${streamPrepareCount}` } };
        },
      }),
    ]),
    resolveEpoch: (): StableV1ResolvedEpoch => ({
      transport: Object.freeze({
        kind: 'http' as const,
        origin: new URL('https://orders.in-process.localhost'),
        rpcPath: '/api/rpc/v1/orders',
        secure: true,
      }),
      link: streamLinks[streamTarget],
    }),
    hasContributions: true,
  });

  const iterator = await streamClientLink.call(
    ['echo'],
    { stream: true },
    { context: { retry: 1, retryDelay: 0 } },
  );
  assert(isAsyncIterator(iterator));
  const first = await iterator.next();
  const second = await iterator.next();
  const third = await iterator.next();
  await iterator.return?.();

  assertEquals(first, { done: false, value: { app: 'app-1', seq: 1 } });
  assertEquals(second, { done: false, value: { app: 'app-2', seq: 2 } });
  assertEquals(third, { done: true, value: undefined });
  assertEquals(streamObserved, [
    { target: 'app-1', header: 'stream-1', lastEventId: undefined },
    { target: 'app-2', header: 'stream-2', lastEventId: 'ev-1' },
  ]);
});
