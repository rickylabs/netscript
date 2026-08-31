import { App, type FreshConfig, type Middleware } from 'fresh';
import { defineFreshApp } from './define-fresh-app.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function decode(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

class TrackingApp extends App<Record<string, never>> {
  readonly fsRouteCalls: Array<string | null> = [];

  override fsRoutes(pattern?: string): this {
    this.fsRouteCalls.push(pattern ?? null);
    return this;
  }
}

type TrackingMiddleware = NonNullable<
  Parameters<App<Record<string, never>>['use']>[1]
>;

class TelemetryTrackingApp extends App<Record<string, never>> {
  useCalls = 0;

  override use(...middleware: TrackingMiddleware[]): this;
  override use(path: string, ...middleware: TrackingMiddleware[]): this;
  override use(
    pathOrMiddleware: string | TrackingMiddleware,
    ...middleware: TrackingMiddleware[]
  ): this {
    this.useCalls += typeof pathOrMiddleware === 'string'
      ? middleware.length
      : middleware.length + 1;
    return this;
  }
}

Deno.test('defineFreshApp installs the cache provider only when called', async () => {
  const moduleUrl = new URL('./define-fresh-app.ts', import.meta.url).href;
  const childSource = `
    const { resetCacheProvider } = await import('@netscript/sdk/cache');
    const { hasCacheProvider } = await import('@netscript/sdk/query');
    resetCacheProvider();

    const { defineFreshApp } = await import(${JSON.stringify(moduleUrl)});
    if (hasCacheProvider() !== false) {
      throw new Error('importing the Fresh server bootstrap installed a cache provider');
    }

    defineFreshApp({
      fsRoutes: false,
      queryCacheInvalidation: false,
      staticFiles: false,
      telemetry: false,
    });
    if (hasCacheProvider() !== true) {
      throw new Error('calling defineFreshApp did not install the cache provider');
    }
  `;
  const child = await new Deno.Command(Deno.execPath(), {
    args: ['eval', '--quiet', childSource],
    stderr: 'piped',
    stdout: 'piped',
  }).output();

  assert(
    child.success,
    `Fresh cache registration child failed (exit ${child.code}):\n${decode(child.stderr)}`,
  );
});

Deno.test('defineFreshApp reuses a provided app instance', () => {
  const app = new TrackingApp();
  const result = defineFreshApp({ app, staticFiles: false, fsRoutes: false });

  assert(result === app, 'Expected defineFreshApp to return the provided app instance');
});

Deno.test('defineFreshApp can construct through an adapter factory', () => {
  const app = new TrackingApp();
  const freshConfig: FreshConfig = {};
  let receivedConfig: FreshConfig | undefined;

  const result = defineFreshApp({
    freshConfig,
    createApp: (config) => {
      receivedConfig = config;
      return app;
    },
    staticFiles: false,
    fsRoutes: false,
  });

  assert(result === app, 'Expected defineFreshApp to return the factory app instance');
  assert(receivedConfig === freshConfig, 'Expected factory to receive Fresh config');
});

Deno.test('defineFreshApp activates request telemetry unless explicitly disabled', () => {
  const enabled = new TelemetryTrackingApp();
  defineFreshApp({
    app: enabled,
    name: 'dashboard',
    telemetry: {
      serviceName: 'dashboard-web',
      attributes: { 'deployment.environment.name': 'test' },
    },
    staticFiles: false,
    fsRoutes: false,
  });

  const disabled = new TelemetryTrackingApp();
  defineFreshApp({
    app: disabled,
    telemetry: false,
    staticFiles: false,
    fsRoutes: false,
  });

  assert(enabled.useCalls === 1, 'Expected telemetry defaults to register request middleware');
  assert(disabled.useCalls === 0, 'Expected telemetry false to skip request middleware');
});

Deno.test('defineFreshApp applies lifecycle hooks before request middleware runs', async () => {
  const lifecycle: string[] = [];
  const app = defineFreshApp<{ shared?: string }>({
    name: 'playground',
    fsRoutes: false,
    staticFiles: false,
    preConfigure: () => {
      lifecycle.push('preConfigure');
    },
    middleware: [
      async (ctx) => {
        lifecycle.push('middleware');
        ctx.state.shared = 'hello from middleware';
        return await ctx.next();
      },
    ],
    configure: (configuredApp) => {
      lifecycle.push('configure');
      configuredApp.get('/health', (ctx) => new Response(ctx.state.shared ?? 'missing'));
    },
  });

  const response = await app.handler()(new Request('http://localhost/health'));
  const text = await response.text();

  assert(response.status === 200, `Expected 200 response, received ${response.status}`);
  assert(text === 'hello from middleware', `Unexpected response body: ${text}`);
  assert(
    lifecycle.join(',') === 'preConfigure,configure,middleware',
    `Unexpected lifecycle order: ${lifecycle.join(',')}`,
  );
});

Deno.test('defineFreshApp can override static middleware registration', async () => {
  const customStatic: Middleware<Record<string, never>> = () => new Response('custom static');
  const app = defineFreshApp({
    staticFiles: customStatic,
    fsRoutes: false,
  });

  const response = await app.handler()(new Request('http://localhost/asset.txt'));
  const text = await response.text();

  assert(response.status === 200, `Expected custom static response, received ${response.status}`);
  assert(text === 'custom static', `Unexpected static response body: ${text}`);
});

Deno.test('defineFreshApp can disable static middleware through the adapter seam', async () => {
  const app = defineFreshApp({
    staticFiles: false,
    fsRoutes: false,
    configure: (configuredApp) => {
      configuredApp.get('/health', () => new Response('ok'));
    },
  });

  const response = await app.handler()(new Request('http://localhost/health'));
  const text = await response.text();

  assert(response.status === 200, `Expected route response, received ${response.status}`);
  assert(text === 'ok', `Unexpected route response body: ${text}`);
});

Deno.test('defineFreshApp can mount file-system routes at a pattern', () => {
  const app = new TrackingApp();

  defineFreshApp({
    app,
    staticFiles: false,
    fsRoutes: '/docs',
  });

  assert(app.fsRouteCalls.length === 1, 'Expected a single fsRoutes call');
  assert(app.fsRouteCalls[0] === '/docs', `Unexpected fsRoutes pattern: ${app.fsRouteCalls[0]}`);
});

Deno.test('defineFreshApp can override file-system route registration', () => {
  const app = new TrackingApp();
  let receivedApp: App<Record<string, never>> | undefined;
  let receivedPattern: string | undefined;

  defineFreshApp({
    app,
    staticFiles: false,
    fsRoutes: (target, pattern) => {
      receivedApp = target;
      receivedPattern = pattern;
    },
  });

  assert(receivedApp === app, 'Expected fsRoutes override to receive the app');
  assert(receivedPattern === undefined, `Unexpected fsRoutes pattern: ${receivedPattern}`);
  assert(app.fsRouteCalls.length === 0, 'Expected default fsRoutes not to run');
});

Deno.test('defineFreshApp registers the standard server-query invalidation route', async () => {
  const app = defineFreshApp({ staticFiles: false, fsRoutes: false });

  const response = await app.handler()(
    new Request(
      'http://localhost/_netscript/query-cache/invalidate',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ queryKey: ['boards', 'board', 'acme'] }),
      },
    ),
  );

  assert(response.status === 204, `Expected 204 response, received ${response.status}`);
});

Deno.test('defineFreshApp can disable or move the server-query invalidation route', async () => {
  const disabled = defineFreshApp({
    staticFiles: false,
    fsRoutes: false,
    queryCacheInvalidation: false,
  });
  const disabledResponse = await disabled.handler()(
    new Request(
      'http://localhost/_netscript/query-cache/invalidate',
      { method: 'POST' },
    ),
  );
  assert(disabledResponse.status === 404, 'Expected the disabled route to return 404');

  const moved = defineFreshApp({
    staticFiles: false,
    fsRoutes: false,
    queryCacheInvalidation: { path: '/internal/cache/invalidate' },
  });
  const movedResponse = await moved.handler()(
    new Request(
      'http://localhost/internal/cache/invalidate',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ queryKey: ['boards'] }),
      },
    ),
  );
  assert(movedResponse.status === 204, `Expected moved route 204, got ${movedResponse.status}`);
});
