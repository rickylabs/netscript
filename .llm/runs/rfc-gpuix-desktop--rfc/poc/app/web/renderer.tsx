/**
 * Webview renderer: the identical app tree rendered as HTML by the OS webview
 * (WebKitGTK / WebView2 / WKWebView) or CEF under `deno desktop`. This is the
 * baseline the GPUIX build is measured against.
 */
import { render } from 'preact';
import { setPlatform } from '../ui/primitives.ts';
import { type HostServices, installHost } from '../client/host.ts';
import { App, boot } from '../app.tsx';
import { setLiveBudget } from '../client/state.ts';

// Config is injected by the host page (Deno Desktop's window always loads `/`).
const injected = (globalThis as { __NS__?: { bench?: boolean; backend?: string; scheme?: string; stack?: string; liveBudgetMs?: number } }).__NS__ ?? {};
const params = new URLSearchParams(location.search);
const backend = injected.backend ?? params.get('backend') ?? 'webview';
const benchMode = injected.bench === true || params.get('bench') === '1';
const startScheme = injected.scheme ?? params.get('scheme');

const host: HostServices = {
  baseUrl: location.origin,
  // Same origin: the browser owns the HttpOnly session cookie.
  fetch: (input, init) => fetch(input, { credentials: 'same-origin', ...init }),
  authHeaders: () => ({}),
  settings: {
    get<T>(key: string) {
      const raw = localStorage.getItem(`ns:${key}`);
      return Promise.resolve(raw === null ? undefined : JSON.parse(raw) as T);
    },
    set(key, value) {
      localStorage.setItem(`ns:${key}`, JSON.stringify(value));
      return Promise.resolve();
    },
  },
  native: null,
  runtime: {
    renderer: `${backend === 'cef' ? 'CEF' : 'OS webview'} · Preact${injected.stack === 'real' ? ' · real stack' : ''}`,
    runtime: 'Deno Desktop',
    platform: navigator.platform,
    memoryMb: () => {
      const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
      return memory ? memory.usedJSHeapSize / 1_048_576 : null;
    },
  },
  onReady() {
    // Two animation frames: the data-backed tree has been painted.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        void fetch(`/__bench/ready?ms=${Math.round(performance.now())}`, { method: 'POST' });
      })
    );
  },
};

setPlatform('dom');
installHost(host);
if (injected.liveBudgetMs) setLiveBudget(injected.liveBudgetMs);
render(<App />, document.getElementById('app')!);
await boot({
  ...(benchMode ? { autoSignIn: { email: 'bench@netscript.dev', password: 'netscript' } } : {}),
  ...(startScheme === 'dark' ? { scheme: 'dark' as const } : {}),
});
