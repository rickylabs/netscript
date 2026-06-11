import { assertEquals } from '@std/assert';
import { createService } from '../mod.ts';
import type {
  ContextFactory,
  CorsOptions,
  Database,
  FetchHandler,
  ServiceMiddleware,
  ServiceRouter,
} from '../mod.ts';

Deno.test('public structural types are assignable through builder APIs', () => {
  const router: ServiceRouter = {};
  const corsOptions: CorsOptions = { origin: '*' };
  const database: Database = {
    $queryRaw: () => Promise.resolve(1),
  };
  const contextFactory: ContextFactory = () => ({ tenant: 'alpha' });
  const middleware: ServiceMiddleware = async (_ctx, next) => {
    await next();
  };

  const app = createService(router, { name: 'types' })
    .withCors(corsOptions)
    .withDatabase({ primary: database }, database)
    .withContext(contextFactory)
    .use(middleware)
    .route('get', '/ping', () => new Response('pong'))
    .build();

  assertEquals(typeof app.fetch, 'function');
});

Deno.test('FetchHandler mirror accepts oRPC-style handler result', async () => {
  const handler: FetchHandler = {
    handle: () =>
      Promise.resolve({
        matched: true,
        response: new Response('ok'),
      }),
  };

  const result = await handler.handle(new Request('http://localhost/api'), {
    prefix: '/api',
  });

  assertEquals(result.matched, true);
  assertEquals(await result.response.text(), 'ok');
});
