import { bindDesktopRpcWindow } from '@netscript/fresh/desktop';
import { startAutoUpdate } from '@netscript/sdk/auto-update';
import { desktopFixtureRouter } from './router.ts';

interface NativeFixtureWindow extends EventTarget {
  bind(
    name: string,
    handler: (operation: unknown, payload?: unknown) => Promise<unknown>,
  ): void;
  unbind(name: string): void;
}

const browserWindow = Reflect.get(Deno, 'BrowserWindow');
if (typeof browserWindow !== 'function') {
  throw new Error('Deno Desktop BrowserWindow is absent.');
}
const window: NativeFixtureWindow = Reflect.construct(browserWindow, [{
  title: 'NetScript Desktop E2E',
}]);
const binding = bindDesktopRpcWindow({
  window,
  router: desktopFixtureRouter,
  context: {},
});
if (binding.status !== 'bound') {
  throw new Error('Desktop RPC binding was not activated.');
}

const releaseBaseUrl = Deno.env.get('NETSCRIPT_DESKTOP_E2E_RELEASE_URL');
const publicKey = Deno.env.get('NETSCRIPT_DESKTOP_E2E_PUBLIC_KEY');
const manualUpdateUrl = Deno.env.get('NETSCRIPT_DESKTOP_E2E_MANUAL_URL');
if (releaseBaseUrl && publicKey && manualUpdateUrl) {
  startAutoUpdate({
    release: { baseUrl: releaseBaseUrl, publicKey, manualUpdateUrl },
    policy: { checkOnLaunch: true },
    onUpdateReady(event) {
      console.log(`NETSCRIPT_DESKTOP_UPDATE_READY ${JSON.stringify(event)}`);
    },
    onRollback(event) {
      console.log(`NETSCRIPT_DESKTOP_ROLLBACK ${JSON.stringify(event)}`);
    },
  });
}

const renderer = await Deno.readTextFile(
  new URL('../dist/renderer.js', import.meta.url),
);
const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>NetScript Desktop E2E</title></head>
<body><main><h1>NetScript Desktop E2E</h1><output id="evidence">pending</output></main>
<script type="module">${renderer.replaceAll('</script>', '<\\/script>')}</script></body></html>`;

const server = Deno.serve(() =>
  new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
);

window.addEventListener('close', async () => {
  await binding.close();
  await server.shutdown();
});
