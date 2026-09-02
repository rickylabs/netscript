import { assert, assertEquals, assertFalse } from '@std/assert';

const contributionModule = new URL('../src/client/sdk-client-contribution.ts', import.meta.url);
const linkModule = new URL('../src/client/http-client-link.ts', import.meta.url);
const discoveryModule = new URL('../src/discovery/service-url.ts', import.meta.url);
const policyModule = new URL('../src/internal/transport-policy.ts', import.meta.url);
const sdkConfig = new URL('../deno.json', import.meta.url);

Deno.test('composed headers retain transport-authored CLIENT spans across retry and reconnect', async () => {
  const source = `
    import { context, trace } from 'npm:@opentelemetry/api@^1.9.1';
    import { AsyncLocalStorageContextManager } from 'npm:@opentelemetry/context-async-hooks@^2.9.0';
    import {
      BasicTracerProvider,
      InMemorySpanExporter,
      SimpleSpanProcessor,
    } from 'npm:@opentelemetry/sdk-trace-base@^2.5.0';
    import { os } from 'npm:@orpc/server@^1.14.6';
    import { defineSdkClientContribution } from ${JSON.stringify(contributionModule.href)};
    import { createHttpClientLink } from ${JSON.stringify(linkModule.href)};
    import { createServerServiceEnvKey } from ${JSON.stringify(discoveryModule.href)};
    import { resolveTransportPolicy } from ${JSON.stringify(policyModule.href)};

    context.disable();
    trace.disable();
    const contextManager = new AsyncLocalStorageContextManager().enable();
    context.setGlobalContextManager(contextManager);
    const exporter = new InMemorySpanExporter();
    const provider = new BasicTracerProvider({
      spanProcessors: [new SimpleSpanProcessor(exporter)],
    });
    trace.setGlobalTracerProvider(provider);

    const firstSecret = 'first-header-secret';
    const secondSecret = 'second-header-secret';
    const staleTraceparent = '00-11111111111111111111111111111111-2222222222222222-01';
    const staleTracestate = 'vendor=stale';
    const serviceName = 'contribution-observability';
    Deno.env.set(createServerServiceEnvKey(serviceName), 'http://127.0.0.1:9');
    const contract = {
      echo: os.route({ method: 'POST', path: '/echo' }).handler(
        ({ input }) => input,
      ),
    };
    let firstPreparations = 0;
    const authContribution = defineSdkClientContribution()({
      protocol: { family: 'netscript.sdk-client', major: 1 },
      id: 'test:auth-observability',
      context: {},
      headerKeys: ['authorization'],
      responseCache: { mode: 'invariant' },
      prepare: () => {
        firstPreparations += 1;
        return { headers: { authorization: 'Bearer ' + firstSecret } };
      },
    });
    let secondPreparations = 0;
    const secondContribution = defineSdkClientContribution()({
      protocol: { family: 'netscript.sdk-client', major: 1 },
      id: 'test:second-observability',
      context: {},
      headerKeys: ['x-second-observed'],
      responseCache: { mode: 'invariant' },
      prepare: () => {
        secondPreparations += 1;
        return { headers: { 'x-second-observed': secondSecret } };
      },
    });
    const contributions = [authContribution, secondContribution];
    const attempts = [];
    const captureAttempt = (phase, init) => {
      const headers = new Headers(init?.headers);
      attempts.push({
        phase,
        entries: [...headers.entries()],
        traceparent: headers.get('traceparent'),
        traceparentCount: [...headers.keys()].filter((name) => name === 'traceparent').length,
      });
    };
    const linkOptions = {
      transportPolicy: resolveTransportPolicy(contract),
      serviceName,
      protocol: 'http',
      rpcPath: '/api/rpc/v1/contribution-observability',
      propagateTraceContext: true,
      getTraceHeaders: () => ({
        traceparent: staleTraceparent,
        tracestate: staleTracestate,
      }),
    };

    let retryParentSpanId = null;
    const retryLink = createHttpClientLink({
      ...linkOptions,
      contributions,
      fetch: (_request, init) => {
        captureAttempt('retry', init);
        return Promise.reject(new Error('retry transport stop'));
      },
    });
    await provider.getTracer('sdk-observability-test').startActiveSpan(
      'test.retry-parent',
      async (parentSpan) => {
        retryParentSpanId = parentSpan.spanContext().spanId;
        try {
          await retryLink.call(['echo'], { ok: true }, {
            context: { retry: 1, retryDelay: 0 },
          });
        } catch {
          // Expected: both retry attempts stop at the transport seam.
        } finally {
          parentSpan.end();
        }
      },
    );

    const encoder = new TextEncoder();
    const firstStream = [
      'event: message\\ndata: {"json":"A-item"}\\n\\n',
      'event: error\\ndata: {"json":{"defined":false,"code":"INTERNAL_SERVER_ERROR","status":500,"message":"reconnect"}}\\n\\n',
    ].join('');
    const secondStream = [
      'event: message\\ndata: {"json":"B-item"}\\n\\n',
      'event: done\\ndata: {"json":null}\\n\\n',
    ].join('');
    let reconnectFetches = 0;
    let reconnectParentSpanId = null;
    const reconnectValues = [];
    const reconnectLink = createHttpClientLink({
      ...linkOptions,
      contributions: [secondContribution, authContribution],
      fetch: (_request, init) => {
        captureAttempt('reconnect', init);
        const body = reconnectFetches === 0 ? firstStream : secondStream;
        reconnectFetches += 1;
        return Promise.resolve(new Response(encoder.encode(body), {
          headers: { 'content-type': 'text/event-stream' },
        }));
      },
    });
    await provider.getTracer('sdk-observability-test').startActiveSpan(
      'test.reconnect-parent',
      async (parentSpan) => {
        reconnectParentSpanId = parentSpan.spanContext().spanId;
        try {
          const output = await reconnectLink.call(['echo'], { stream: true }, {
            context: {
              retry: 1,
              retryDelay: 0,
              traceHeaders: {
                traceparent: staleTraceparent,
                tracestate: staleTracestate,
              },
            },
          });
          if (output === null || typeof output !== 'object' || !('next' in output)) {
            throw new TypeError('Expected reconnect output to be an async iterator');
          }
          const iterator = output;
          reconnectValues.push((await iterator.next()).value);
          reconnectValues.push((await iterator.next()).value);
          await iterator.return?.();
        } finally {
          parentSpan.end();
        }
      },
    );

    let disabledParentSpanId = null;
    let disabledAttempt = null;
    const disabledLink = createHttpClientLink({
      ...linkOptions,
      propagateTraceContext: false,
      contributions,
      fetch: (_request, init) => {
        const headers = new Headers(init?.headers);
        disabledAttempt = {
          entries: [...headers.entries()],
          traceparent: headers.get('traceparent'),
          tracestate: headers.get('tracestate'),
        };
        return Promise.reject(new Error('disabled transport stop'));
      },
    });
    await provider.getTracer('sdk-observability-test').startActiveSpan(
      'test.disabled-parent',
      async (parentSpan) => {
        disabledParentSpanId = parentSpan.spanContext().spanId;
        try {
          await disabledLink.call(['echo'], { ok: true }, { context: {} });
        } catch {
          // Expected: the test fetch seam stops after observing the final request.
        } finally {
          parentSpan.end();
        }
      },
    );

    await provider.forceFlush();
    const spans = exporter.getFinishedSpans();
    const clientSpans = spans.filter((span) => span.name === 'rpc.client');
    const clientSpanSnapshots = clientSpans.map((span) => ({
      spanId: span.spanContext().spanId,
      traceId: span.spanContext().traceId,
      parentSpanId: span.parentSpanContext?.spanId ?? null,
      kind: span.kind,
      rpcSystem: span.attributes['rpc.system'] ?? null,
      serverAddress: span.attributes['server.address'] ?? null,
    }));
    const spanSnapshot = JSON.stringify(spans.map((span) => ({
      name: span.name,
      kind: span.kind,
      attributes: span.attributes,
      events: span.events,
      status: span.status,
    })));
    await provider.shutdown();
    context.disable();
    contextManager.disable();
    trace.disable();
    globalThis.console.log(JSON.stringify({
      attempts,
      clientSpanSnapshots,
      firstPreparations,
      secondPreparations,
      retryParentSpanId,
      reconnectParentSpanId,
      disabledParentSpanId,
      disabledAttempt,
      reconnectValues,
      staleTraceparent,
      expectedKind: 2,
      spanLeakedSecret:
        spanSnapshot.includes(firstSecret) || spanSnapshot.includes(secondSecret),
    }));
  `;

  const child = await new Deno.Command(Deno.execPath(), {
    args: ['eval', '--config', sdkConfig.pathname, source],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(child.stdout).trim();
  const stderr = new TextDecoder().decode(child.stderr);
  if (!child.success) {
    throw new Error(`observability child failed (exit ${child.code}):\n${stderr}`);
  }
  const result: {
    readonly attempts: readonly {
      readonly phase: 'retry' | 'reconnect';
      readonly entries: readonly (readonly [string, string])[];
      readonly traceparent: string | null;
      readonly traceparentCount: number;
    }[];
    readonly clientSpanSnapshots: readonly {
      readonly spanId: string;
      readonly traceId: string;
      readonly parentSpanId: string | null;
      readonly kind: number;
      readonly rpcSystem: unknown;
      readonly serverAddress: unknown;
    }[];
    readonly firstPreparations: number;
    readonly secondPreparations: number;
    readonly retryParentSpanId: string;
    readonly reconnectParentSpanId: string;
    readonly disabledParentSpanId: string;
    readonly disabledAttempt: {
      readonly entries: readonly (readonly [string, string])[];
      readonly traceparent: string | null;
      readonly tracestate: string | null;
    };
    readonly reconnectValues: readonly string[];
    readonly staleTraceparent: string;
    readonly expectedKind: number;
    readonly spanLeakedSecret: boolean;
  } = JSON.parse(stdout);

  assertEquals(result.attempts.length, 4);
  assertEquals(result.attempts.map((attempt) => attempt.phase), [
    'retry',
    'retry',
    'reconnect',
    'reconnect',
  ]);
  assertEquals(result.firstPreparations, 4);
  assertEquals(result.secondPreparations, 4);
  assertEquals(result.reconnectValues, ['A-item', 'B-item']);
  assertEquals(result.clientSpanSnapshots.length, result.attempts.length + 1);

  for (const attempt of result.attempts) {
    assertEquals(attempt.traceparentCount, 1);
    assert(attempt.traceparent?.startsWith('00-'));
    assertFalse(attempt.traceparent === result.staleTraceparent);
    if (attempt.traceparent === null) throw new Error('Expected transport traceparent');
    assertEquals(
      attempt.entries.filter(([name]) => name === 'authorization'),
      [['authorization', 'Bearer first-header-secret']],
    );
    assertEquals(
      attempt.entries.filter(([name]) => name === 'x-second-observed'),
      [['x-second-observed', 'second-header-secret']],
    );

    const [, traceId, spanId] = attempt.traceparent.split('-');
    const clientSpan = result.clientSpanSnapshots.find((span) => span.spanId === spanId);
    assert(clientSpan !== undefined);
    assertEquals(clientSpan.traceId, traceId);
    assertEquals(clientSpan.kind, result.expectedKind);
    assertEquals(clientSpan.rpcSystem, 'orpc');
    assertEquals(clientSpan.serverAddress, '127.0.0.1');
    assertEquals(
      clientSpan.parentSpanId,
      attempt.phase === 'retry' ? result.retryParentSpanId : result.reconnectParentSpanId,
    );
  }
  assertEquals(result.disabledAttempt.traceparent, null);
  assertEquals(result.disabledAttempt.tracestate, null);
  assertEquals(
    result.disabledAttempt.entries.filter(([name]) => name === 'authorization'),
    [['authorization', 'Bearer first-header-secret']],
  );
  assertEquals(
    result.disabledAttempt.entries.filter(([name]) => name === 'x-second-observed'),
    [['x-second-observed', 'second-header-secret']],
  );
  const disabledClientSpan = result.clientSpanSnapshots.find(
    (span) => span.parentSpanId === result.disabledParentSpanId,
  );
  assert(disabledClientSpan !== undefined);
  assertEquals(disabledClientSpan.kind, result.expectedKind);
  assertEquals(disabledClientSpan.rpcSystem, 'orpc');
  assertEquals(disabledClientSpan.serverAddress, '127.0.0.1');
  assertFalse(result.spanLeakedSecret);
  assertFalse(stderr.includes('first-header-secret'));
  assertFalse(stderr.includes('second-header-secret'));
});
