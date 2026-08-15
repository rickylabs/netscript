import { App } from 'fresh';
import { h } from 'preact';
import QueryHydrationAgeBrowser from './app.tsx';

const app: App<unknown> = new App();

app.get('/', (ctx) => {
  const mode = ctx.url.searchParams.get('mode') === 'old' ? 'old' : 'fresh';
  const hydrationNow = Number(ctx.url.searchParams.get('hydrationNow'));
  if (!Number.isFinite(hydrationNow)) {
    return new Response('hydrationNow is required', { status: 400 });
  }

  return ctx.render(
    h('html', null, h('body', null, h(QueryHydrationAgeBrowser, { mode, hydrationNow }))),
  );
});

export { app };
export default app;
