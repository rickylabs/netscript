import { App, type FreshConfig, type Middleware } from 'fresh';
import { defineFreshApp } from './define-fresh-app.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

class TrackingApp extends App<Record<string, never>> {
  readonly fsRouteCalls: Array<string | null> = [];

  override fsRoutes(pattern?: string): this {
    this.fsRouteCalls.push(pattern ?? null);
    return this;
  }
}

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
    fsRoutes: (target) => target.fsRoutes('/docs'),
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
    fsRoutes: (target) => {
      receivedApp = target;
      receivedPattern = '/admin';
    },
  });

  assert(receivedApp === app, 'Expected fsRoutes override to receive the app');
  assert(receivedPattern === '/admin', `Unexpected fsRoutes pattern: ${receivedPattern}`);
  assert(app.fsRouteCalls.length === 0, 'Expected default fsRoutes not to run');
});
