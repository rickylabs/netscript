import { App, staticFiles } from 'fresh';
import { h } from 'preact';
import ModalHarness, { type ModalScenario } from './app.tsx';

// The overlay is a later, translucent stacking context painted over the sticky header: a
// dialog that is not in the top layer is flattened under it (rickylabs/netscript#1688).
const styles = `
  body { margin: 0; font: 16px sans-serif; }
  header { position: sticky; top: 0; opacity: 0.98; display: flex; gap: 8px; padding: 8px; }
  dialog { width: 320px; height: 240px; }
  dialog::backdrop { background-color: rgb(10, 20, 30); }
  #overlay { position: fixed; inset: 120px 0 0 0; opacity: 0.99; background: rgb(240, 240, 240); }
`;

function page(scenario: ModalScenario) {
  return h(
    'html',
    null,
    h('head', null, h('title', null, 'fresh-ui modal'), h('style', null, styles)),
    h('body', null, h(ModalHarness, { scenario }), h('div', { id: 'overlay' }, 'page content')),
  );
}

const app: App<unknown> = new App();
app.use(staticFiles());
app.get('/favicon.ico', () => new Response(null, { status: 204 }));
app.get('/', (ctx) => ctx.render(page('interactive')));
app.get('/initial', (ctx) => ctx.render(page('initial')));
export { app };
export default app;
