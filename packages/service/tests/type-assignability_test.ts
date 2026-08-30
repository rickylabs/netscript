import { assertEquals } from '@std/assert';
import { createService } from '../mod.ts';
import type {
  ContextFactory,
  CorsOptions,
  Database,
  FetchHandler,
  Principal,
  ServiceBuilder,
  ServiceHandlerContext,
  ServiceMiddleware,
  ServiceRouter,
} from '../mod.ts';

Deno.test('public structural types are assignable through builder APIs', () => {
  const router: ServiceRouter = {};
  const corsOptions: CorsOptions = { origin: '*' };
  const database: Database = {
    $queryRaw: () => Promise.resolve(1),
  };
  const contextFactory: ContextFactory<{ readonly tenant: 'alpha' }> = () => ({ tenant: 'alpha' });
  const middleware: ServiceMiddleware = async (_ctx, next) => {
    await next();
  };

  const builder: ServiceBuilder<ServiceRouter, { readonly tenant: 'alpha' }> = createService(
    router,
    { name: 'types' },
  )
    .withCors(corsOptions)
    .withDatabase({ primary: database }, database)
    .withContext(contextFactory)
    .use(middleware)
    .route('get', '/ping', () => new Response('pong'));

  const app = builder.build();

  const handlerContext: ServiceHandlerContext<{ readonly tenant: 'alpha' }> = {
    tenant: 'alpha',
    principal: undefined,
  };
  const principal: Principal | undefined = handlerContext.principal;

  assertEquals(typeof app.fetch, 'function');
  assertEquals(handlerContext.tenant, 'alpha');
  assertEquals(principal, undefined);
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
    context: { tenant: 'alpha' } satisfies ServiceHandlerContext<{ readonly tenant: 'alpha' }>,
  });

  assertEquals(result.matched, true);
  if (result.matched) {
    assertEquals(await result.response.text(), 'ok');
  }
});
