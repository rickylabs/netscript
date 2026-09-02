import { assert, assertEquals, assertFalse } from '@std/assert';

const contributionModule = new URL('../src/client/sdk-client-contribution.ts', import.meta.url);
const linkModule = new URL('../src/client/http-client-link.ts', import.meta.url);
const discoveryModule = new URL('../src/discovery/service-url.ts', import.meta.url);
const policyModule = new URL('../src/internal/transport-policy.ts', import.meta.url);
const sdkConfig = new URL('../deno.json', import.meta.url);

Deno.test('contributed headers retain CLIENT span and final trace injection', async () => {
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

    const secret = 'header-secret-value';
    const serviceName = 'contribution-observability';
    Deno.env.set(createServerServiceEnvKey(serviceName), 'http://127.0.0.1:9');
    const contract = {
      echo: os.route({ method: 'POST', path: '/echo' }).handler(
        ({ input }) => input,
      ),
    };
    const contribution = defineSdkClientContribution()({
      protocol: { family: 'netscript.sdk-client', major: 1 },
      id: 'test:observability',
      context: {},
      headerKeys: ['x-observed'],
      responseCache: { mode: 'invariant' },
      prepare: () => ({ headers: { 'x-observed': secret } }),
    });
    let contributedHeader = null;
    let traceparent = null;
    const link = createHttpClientLink({
      transportPolicy: resolveTransportPolicy(contract),
      serviceName,
      protocol: 'http',
      rpcPath: '/api/rpc/v1/contribution-observability',
      propagateTraceContext: false,
      getTraceHeaders: () => ({}),
      contributions: [contribution],
      fetch: (_request, init) => {
        const headers = new Headers(init?.headers);
        contributedHeader = headers.get('x-observed');
        traceparent = headers.get('traceparent');
        return Promise.reject(new Error('expected transport stop'));
      },
    });
    try {
      await link.call(['echo'], { ok: true }, { context: {} });
    } catch {
      // Expected: the test fetch seam stops after observing the final request.
    }
    await provider.forceFlush();
    const spans = exporter.getFinishedSpans();
    const clientSpan = spans.find((span) => span.name === 'rpc.client');
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
      contributedHeader,
      traceparent,
      clientSpan: clientSpan === undefined ? null : {
        name: clientSpan.name,
        kind: clientSpan.kind,
      },
      expectedKind: 2,
      spanLeakedSecret: spanSnapshot.includes(secret),
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
    readonly contributedHeader: string | null;
    readonly traceparent: string | null;
    readonly clientSpan: { readonly name: string; readonly kind: number } | null;
    readonly expectedKind: number;
    readonly spanLeakedSecret: boolean;
  } = JSON.parse(stdout);

  assertEquals(result.contributedHeader, 'header-secret-value');
  assert(result.traceparent?.startsWith('00-'));
  assertEquals(result.clientSpan, {
    name: 'rpc.client',
    kind: result.expectedKind,
  });
  assertFalse(result.spanLeakedSecret);
  assertFalse(stderr.includes('header-secret-value'));
});
