import { App } from 'fresh';
import { Partial } from 'fresh/runtime';
import type { ComponentChildren } from 'preact';
import { definePage } from '../../../src/application/builders/mod.ts';

export const DEFER_BOUNDARY_NAME = 'deferred-panel';

function DeferredPanel({ message }: { readonly message: string }) {
  return (
    <section data-defer-boundary={DEFER_BOUNDARY_NAME} data-defer-state='loaded'>
      <h2>{message}</h2>
    </section>
  );
}

const deferredPage = definePage<unknown>()
  .withLayer('panel', DeferredPanel, {
    loader: () => undefined,
    partial: '/partials/deferred/panel',
    partialName: DEFER_BOUNDARY_NAME,
    fallback: (
      <section data-defer-boundary={DEFER_BOUNDARY_NAME} data-defer-state='fallback'>
        <p>Loading deferred panel</p>
      </section>
    ),
    policy: {
      profile: 'balanced',
      prewarmOnMiss: false,
    },
  })
  .withLayout((slots) => (
    <main>
      <h1>Deferred client page</h1>
      {slots.panel()}
    </main>
  ))
  .build({ routePattern: '/deferred' });

function document(body: ComponentChildren) {
  return (
    <html>
      <body f-client-nav>
        <Partial name='defer-navigation-page'>{body}</Partial>
      </body>
    </html>
  );
}

/** Create the real Fresh app used by the deferred client-navigation browser test. */
export function createDeferClientNavigationBrowserApp(): App<unknown> {
  const app = new App();

  app.get('/', (ctx) =>
    ctx.render(
      document(
        <main>
          <h1>Deferred navigation fixture</h1>
          <a href='/deferred'>Open deferred panel</a>
        </main>,
      ),
    ));
  app.get('/deferred', async (ctx) => {
    return ctx.render(document(await deferredPage.default(ctx)));
  });
  app.get('/partials/deferred/panel', (ctx) => {
    return ctx.render(
      <Partial name={DEFER_BOUNDARY_NAME}>
        <DeferredPanel message='Deferred panel loaded' />
      </Partial>,
    );
  });

  return app;
}

/** Fresh application exported for the Vite browser fixture. */
export const app: App<unknown> = createDeferClientNavigationBrowserApp();
