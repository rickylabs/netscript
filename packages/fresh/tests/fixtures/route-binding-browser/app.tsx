import { App } from 'fresh';
import { Partial } from 'fresh/runtime';
import { definePage } from '../../../src/application/builders/mod.ts';
import { routes } from './routes.ts';

type FixtureState = Record<string, never>;

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

/** Create the real Fresh app used by the generated route binding browser test. */
export function createRouteBindingBrowserApp(): App<FixtureState> {
  const app = new App<FixtureState>();

  app.get('/', (ctx) => ctx.render(indexPage()));
  app.get('/orders/:id', async (ctx) => ctx.render(await orderPage.page(ctx)));

  return app;
}

/** Fresh application exported for the Vite browser fixture. */
export const app: App<FixtureState> = createRouteBindingBrowserApp();
