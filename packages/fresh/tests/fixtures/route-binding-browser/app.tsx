import { App } from 'fresh';
import { Partial } from 'fresh/runtime';
import { QueryClient } from '@tanstack/query-core';
import { definePage } from '../../../src/application/builders/mod.ts';
import { dehydrateQueryClient } from '../../../src/application/query/mod.ts';
import { routes } from './routes.ts';
import ServiceShowcaseLab from './routes/examples/(_islands)/ServiceShowcaseLab.tsx';
import { ServiceExampleLabPanel } from './routes/examples/service/(_components)/lab-panel.tsx';

type FixtureState = Record<string, never>;

const serviceListQueryKey = ['route-binding-browser', 'service-list'] as const;

function serviceShowcaseProps() {
  const initialRow = { id: 1, name: 'Server row' };
  const initialDataUpdatedAt = Date.now();
  const queryClient = new QueryClient();
  queryClient.setQueryData(serviceListQueryKey, initialRow, {
    updatedAt: initialDataUpdatedAt,
  });

  return {
    dehydratedState: dehydrateQueryClient(queryClient),
    initialRow,
    initialDataUpdatedAt,
  };
}

const generatedOrderRoute = routes.orders.$id.$route;

const orderPage = definePage<FixtureState>()
  .withRoute(generatedOrderRoute)
  .withResource('orderId', (ctx) => ctx.path.id)
  .withLayout((_slots, ctx) => {
    const orderId: string = ctx.resource('orderId');
    const selfHref = ctx.route.href({ path: { id: orderId } });

    return (
      <html>
        <body f-client-nav>
          <Partial name='order-detail'>
            <main>
              <h1>Generated order route</h1>
              <output id='order-id'>{orderId}</output>
              <a id='order-self-link' href={selfHref}>Current order</a>
            </main>
          </Partial>
        </body>
      </html>
    );
  })
  .build();

function ServiceExampleRouteLayout(): object {
  const slots = serviceShowcasePage.hooks.useSlots();

  return (
    <html>
      <body>
        <main id='service-showcase-layout'>{slots.lab()}</main>
      </body>
    </html>
  );
}

const serviceShowcasePage = definePage<FixtureState>()
  .withRouteContract({ $route: '/examples/service' })
  .withLayer('lab', ServiceExampleLabPanel, serviceShowcaseProps)
  .withLayout(() => <ServiceExampleRouteLayout />)
  .build();

function indexPage() {
  const orderLink = generatedOrderRoute.getLinkProps({
    path: { id: 'order-42' },
  });

  return (
    <html>
      <body f-client-nav>
        <Partial name='order-detail'>
          <main>
            <h1>Generated route binding fixture</h1>
            <a id='load-order' {...orderLink}>Load order 42</a>
          </main>
        </Partial>
      </body>
    </html>
  );
}

function directServiceShowcasePage() {
  return (
    <html>
      <body>
        <main id='service-showcase-direct'>
          <ServiceShowcaseLab {...serviceShowcaseProps()} />
        </main>
      </body>
    </html>
  );
}

/** Create the real Fresh app used by the generated route binding browser test. */
export function createRouteBindingBrowserApp(): App<FixtureState> {
  const app = new App<FixtureState>();

  app.get('/favicon.ico', () => new Response(null, { status: 204 }));
  app.get('/', (ctx) => ctx.render(indexPage()));
  app.get('/examples/service-direct', (ctx) => ctx.render(directServiceShowcasePage()));
  app.get('/orders/:id', async (ctx) => ctx.render(await orderPage.page(ctx)));
  app.get(
    '/examples/service',
    async (ctx) => ctx.render(await serviceShowcasePage.page(ctx)),
  );

  return app;
}

/** Fresh application exported for the Vite browser fixture. */
export const app: App<FixtureState> = createRouteBindingBrowserApp();
