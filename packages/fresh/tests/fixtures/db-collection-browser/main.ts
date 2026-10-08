import { App, staticFiles } from 'fresh';
import { h } from 'preact';
import CollectionBrowser from './app.tsx';

const app: App<unknown> = new App();
app.use(staticFiles());
app.get('/favicon.ico', () => new Response(null, { status: 204 }));
let revision = 0;
app.get(
  '/',
  (ctx) =>
    ctx.render(h('html', null, h('body', null, h(CollectionBrowser, { baseUrl: ctx.url.origin })))),
);
app.post('/update', () => {
  revision++;
  return new Response(null, { status: 204 });
});
app.get('/v1/stream/netscript/workers', async (ctx) => {
  const offset = ctx.url.searchParams.get('offset');
  if (offset !== '-1' && offset !== null) await new Promise((resolve) => setTimeout(resolve, 150));
  const items = revision === 0 ? [] : [{
    type: 'execution',
    key: 'execution-1',
    value: {
      id: 'execution-1',
      jobId: 'job-1',
      status: 'running',
      progressMessage: `revision-${revision}`,
    },
    headers: { operation: 'upsert' },
  }];
  return new Response(JSON.stringify(items), {
    headers: {
      'Content-Type': 'application/json',
      'Stream-Next-Offset': String(revision),
      'Stream-Up-To-Date': 'true',
      'Stream-Cursor': String(revision),
    },
  });
});
export { app };
export default app;
