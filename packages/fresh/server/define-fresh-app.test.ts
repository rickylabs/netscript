import { App } from 'fresh';
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
  const result = defineFreshApp({ app, serveStaticFiles: false, registerFsRoutes: false });

  assert(result === app, 'Expected defineFreshApp to return the provided app instance');
});

Deno.test('defineFreshApp applies middleware and configure hooks before handling requests', async () => {
  const lifecycle: string[] = [];
  const app = defineFreshApp<{ shared?: string }>({
    name: 'playground',
    registerFsRoutes: false,
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
    lifecycle.join(',') === 'configure,middleware',
    `Unexpected lifecycle order: ${lifecycle.join(',')}`,
  );
});

Deno.test('defineFreshApp can mount file-system routes at a pattern', () => {
  const app = new TrackingApp();

  defineFreshApp({
    app,
    serveStaticFiles: false,
    registerFsRoutes: '/docs',
  });

  assert(app.fsRouteCalls.length === 1, 'Expected a single fsRoutes call');
  assert(app.fsRouteCalls[0] === '/docs', `Unexpected fsRoutes pattern: ${app.fsRouteCalls[0]}`);
});