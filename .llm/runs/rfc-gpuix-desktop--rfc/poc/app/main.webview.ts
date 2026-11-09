/**
 * Baseline host: today's NetScript desktop architecture. `deno desktop` opens an
 * OS webview (or CEF) on the embedded service's origin; the page is the same
 * Preact app rendered as HTML (see web/renderer.tsx).
 *
 *   deno task desktop:bundle && deno desktop --backend webview app/main.webview.ts
 */
import { startWorkspaceService } from './service/service.ts';
import type { RealStackHandle } from '../realstack/host.ts';

const started = performance.now();
const bench = Deno.env.get('NETSCRIPT_BENCH') === '1';
const backend = Deno.env.get('NETSCRIPT_BACKEND') ?? 'webview';
const scheme = Deno.env.get('NETSCRIPT_SCHEME') ?? 'light';
// Packaged real-stack builds ship `stack/` one level up (this baseline lives in `webview/`).
const bundledStack = (() => {
  try {
    return Deno.statSync(`${Deno.execPath().replace(/[\\/][^\\/]+$/, '')}/../stack/workspace`).isDirectory;
  } catch {
    return false;
  }
})();
const stack = (Deno.env.get('NETSCRIPT_STACK') ?? (bundledStack ? 'real' : 'embedded')) === 'real' ? 'real' : 'embedded';
// Same live-update budget as the GPUIX-first variant, for a like-for-like comparison.
const liveBudgetMs = Number(Deno.env.get('NETSCRIPT_LIVE_BUDGET_MS') ?? 0);
const renderer = await Deno.readTextFile(new URL('../dist/renderer.js', import.meta.url));
const fontFaces = [
  ['Inter', 400, 'Inter-Regular.otf'], ['Inter', 500, 'Inter-Medium.otf'], ['Inter', 600, 'Inter-SemiBold.otf'],
  ['JetBrains Mono', 400, 'JetBrainsMono-Regular.ttf'], ['JetBrains Mono', 500, 'JetBrainsMono-Medium.ttf'],
].map(([family, weight, file]) => `@font-face{font-family:'${family}';font-weight:${weight};src:url('/fonts/${file}')}`).join('');
const html = `<!doctype html><html><head><meta charset="utf-8"><title>NetScript</title>
<style>${fontFaces}*{box-sizing:border-box;margin:0}html,body,#app{width:100%;height:100%;overflow:hidden}body{font-family:Inter,system-ui,sans-serif;-webkit-font-smoothing:antialiased}input{font:inherit}</style>
<script>window.__NS__=${JSON.stringify({ bench, backend, scheme, stack, liveBudgetMs })}</script>
</head><body><div id="app"></div><script type="module">${renderer.replaceAll('</script>', '<\\/script>')}</script></body></html>`;

const dataDir = Deno.env.get('NETSCRIPT_BENCH_PROFILE') ?? await Deno.makeTempDir({ prefix: 'netscript-webview-' });
await Deno.mkdir(dataDir, { recursive: true });

// NETSCRIPT_STACK=real: this process supervises the real NetScript graph first (same as GPUIX).
let realStack: RealStackHandle | undefined;
let diagnostics: (() => Promise<unknown>) | undefined;
if (stack === 'real') {
  const { startRealStack, stackDiagnostics } = await import('../realstack/host.ts');
  realStack = await startRealStack({ dataDir: `${dataDir}/stack` });
  diagnostics = () => stackDiagnostics(realStack!.graph);
  const stop = () => {
    void Promise.race([realStack!.stop(), new Promise((resolve) => setTimeout(resolve, 4_000))]).finally(() => Deno.exit(0));
  };
  for (const signal of (Deno.build.os === 'windows' ? ['SIGINT', 'SIGBREAK'] : ['SIGINT', 'SIGTERM']) as Deno.Signal[]) {
    Deno.addSignalListener(signal, stop);
  }
}

const service = await startWorkspaceService({
  kvPath: `${dataDir}/service.kv`,
  eventsPerSecond: Number(Deno.env.get('NETSCRIPT_BENCH_RATE') ?? 0.5),
  ...(realStack ? { backend: realStack.backend, diagnostics } : {}),
  port: Number(Deno.env.get('NETSCRIPT_PORT') ?? 0),
  routes: async (request, path) => {
    if (path === '/' || path === '/index.html') {
      return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    }
    if (path.startsWith('/fonts/')) {
      const file = path.slice('/fonts/'.length).replace(/[^A-Za-z0-9.-]/g, '');
      try {
        const bytes = await Deno.readFile(new URL(`../assets/fonts/${file}`, import.meta.url));
        return new Response(bytes, { headers: { 'content-type': file.endsWith('.ttf') ? 'font/ttf' : 'font/otf', 'cache-control': 'max-age=31536000' } });
      } catch {
        return new Response('missing', { status: 404 });
      }
    }
    if (path === '/__bench/ready') {
      const pageMs = new URL(request.url).searchParams.get('ms');
      console.log(`NETSCRIPT_READY ${JSON.stringify({
        host: `${backend}-deno-desktop`,
        stack: realStack ? 'real' : 'embedded',
        readyMs: Math.round(performance.now() - started),
        pageMs: Number(pageMs),
        rssMb: Math.round(Deno.memoryUsage().rss / 1_048_576),
        ...(realStack ? { stackReadyMs: realStack.graph.readyMs, stackPids: realStack.graph.pids() } : {}),
      })}`);
      return new Response(null, { status: 204 });
    }
    return undefined;
  },
});

console.log(`NETSCRIPT_URL ${service.url}`);
// Deno Desktop opens the window itself, pointed at this process's Deno.serve()
// (auto-binding). Under plain `deno run` open NETSCRIPT_URL in a browser.

// The first BrowserWindow adopts the auto-opened window; match the GPUIX window size.
const BrowserWindow = Reflect.get(Deno, 'BrowserWindow') as
  | undefined
  | (new (options: { title: string; width?: number; height?: number }) => { setSize(width: number, height: number): void });
if (BrowserWindow) {
  const window = new BrowserWindow({ title: 'NetScript', width: 1320, height: 860 });
  window.setSize(1320, 860);
}
