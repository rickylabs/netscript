import { bindDesktopRpcWindow } from '@netscript/fresh/desktop';
import { startAutoUpdate } from '@netscript/sdk/auto-update';
import {
  EXPECTED_UPDATE_EVENT_ENV,
  RENDERER_EVIDENCE_ENV,
  UPDATE_EVIDENCE_ENV,
} from './constants.ts';
import { desktopFixtureRouter } from './router.ts';

interface NativeFixtureWindow extends EventTarget {
  bind(
    name: string,
    handler: (operation: unknown, payload?: unknown) => Promise<unknown>,
  ): void;
  unbind(name: string): void;
  close(): void;
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
const expectedUpdateEvent = Deno.env.get(EXPECTED_UPDATE_EVENT_ENV) ?? 'none';
let resolveUpdateEvent: (() => void) | undefined;
const updateEvent = expectedUpdateEvent === 'none'
  ? Promise.resolve()
  : new Promise<void>((resolve) => resolveUpdateEvent = resolve);

async function recordUpdateEvent(kind: 'ready' | 'rollback', event: unknown): Promise<void> {
  const path = Deno.env.get(UPDATE_EVIDENCE_ENV);
  if (!path) throw new Error(`${UPDATE_EVIDENCE_ENV} is required for ${kind} evidence.`);
  await Deno.writeTextFile(path, `${JSON.stringify({ kind, event })}\n`);
  if (expectedUpdateEvent === kind) resolveUpdateEvent?.();
}

if (releaseBaseUrl && publicKey && manualUpdateUrl) {
  startAutoUpdate({
    release: { baseUrl: releaseBaseUrl, publicKey, manualUpdateUrl },
    policy: { checkOnLaunch: true },
    onUpdateReady(event): void {
      console.log(`NETSCRIPT_DESKTOP_UPDATE_READY ${JSON.stringify(event)}`);
      void recordUpdateEvent('ready', event);
    },
    onRollback(event): void {
      console.log(`NETSCRIPT_DESKTOP_ROLLBACK ${JSON.stringify(event)}`);
      void recordUpdateEvent('rollback', event);
    },
  });
} else if (expectedUpdateEvent !== 'none') {
  throw new Error('Expected updater evidence but release configuration is incomplete.');
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

async function waitForFile(path: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await Deno.stat(path);
      return;
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Timed out waiting for renderer evidence at ${path}.`);
}

const rendererEvidence = Deno.env.get(RENDERER_EVIDENCE_ENV);
if (!rendererEvidence) throw new Error(`${RENDERER_EVIDENCE_ENV} is required.`);
await Promise.all([waitForFile(rendererEvidence), updateEvent]);
await binding.close();
await server.shutdown();
window.close();
