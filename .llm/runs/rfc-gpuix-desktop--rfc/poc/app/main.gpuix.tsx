/**
 * Native entry: Deno process + GPUIX window + embedded NetScript service.
 *
 *   deno run -A app/main.gpuix.tsx [--service-url=https://...] [--profile=<dir>]
 *
 * Bench/smoke environment:
 *   NETSCRIPT_BENCH=1            sign in automatically, print NETSCRIPT_READY
 *   NETSCRIPT_BENCH_RATE=<n>     background events per second (simulated, or real load)
 *   NETSCRIPT_UI=native          GPUIX-first variant: native virtual lists, live-update budget
 *                                (≤4 stream commits/s), adaptive frame pump (8 ms active, 50 ms idle)
 *   NETSCRIPT_STACK=real         supervise the real NetScript graph (Garnet, SQLite, users,
 *                                workers, sagas, triggers, streams) instead of the simulated store
 */
import { render } from 'gpuix-preact';
import { GpuixRenderer } from '@gpuix/native';
import { DenoKvAdapter } from '@netscript/kv';
import { setPlatform } from './ui/primitives.ts';
import { type HostServices, installHost } from './client/host.ts';
import { App, boot } from './app.tsx';
import { setLiveBudget, showToast } from './client/state.ts';
import { SESSION_COOKIE } from './contract.ts';
import { type RunningWorkspaceService, startWorkspaceService } from './service/service.ts';
import type { RealStackHandle } from '../realstack/host.ts';

const started = performance.now();
const args = new Map(Deno.args.map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || 'true'] as const;
}));
const bench = Deno.env.get('NETSCRIPT_BENCH') === '1';

function appDataDir(): string {
  if (args.has('profile')) return args.get('profile')!;
  const home = Deno.env.get('HOME') ?? Deno.env.get('USERPROFILE') ?? '.';
  switch (Deno.build.os) {
    case 'windows':
      return `${Deno.env.get('APPDATA') ?? home}\\NetScript GPUIX PoC`;
    case 'darwin':
      return `${home}/Library/Application Support/NetScript GPUIX PoC`;
    default:
      return `${Deno.env.get('XDG_DATA_HOME') ?? `${home}/.local/share`}/netscript-gpuix-poc`;
  }
}

const dataDir = appDataDir();
await Deno.mkdir(dataDir, { recursive: true });
// Packaged real-stack builds ship `stack/` next to the executable and use it by default.
const bundledStack = (() => {
  try {
    return Deno.statSync(`${Deno.execPath().replace(/[\\/][^\\/]+$/, '')}/stack/workspace`).isDirectory;
  } catch {
    return false;
  }
})();
const stackMode = args.get('stack') ?? Deno.env.get('NETSCRIPT_STACK') ?? (bundledStack ? 'real' : 'embedded');
const uiMode = (args.get('ui') ?? Deno.env.get('NETSCRIPT_UI')) === 'native' ? 'native' : 'portable';
// GPUIX-first commits stream changes at most every 250 ms; NETSCRIPT_LIVE_BUDGET_MS overrides either mode.
setLiveBudget(Number(Deno.env.get('NETSCRIPT_LIVE_BUDGET_MS') ?? (uiMode === 'native' ? 250 : 0)));
let realStack: RealStackHandle | undefined;
let service: RunningWorkspaceService | null = null;
let shuttingDown = false;
async function shutdown(code = 0): Promise<never> {
  if (!shuttingDown) {
    shuttingDown = true;
    // Bounded: the BFF's graceful shutdown would wait on the UI's open SSE connection.
    const bounded = (work: Promise<unknown> | undefined, ms: number) =>
      Promise.race([work?.catch(() => {}), new Promise((resolve) => setTimeout(resolve, ms))]);
    await Promise.all([bounded(service?.stop(), 500), bounded(realStack?.stop(), 4_000)]);
  }
  Deno.exit(code);
}
for (const signal of (Deno.build.os === 'windows' ? ['SIGINT', 'SIGBREAK'] : ['SIGINT', 'SIGTERM']) as Deno.Signal[]) {
  Deno.addSignalListener(signal, () => void shutdown(0));
}

// 1. Window first: the shell paints while the service boots.
setPlatform('gpuix');
const app = render(<App />, {
  title: 'NetScript',
  appName: 'NetScript',
  appId: 'dev.netscript.gpuix-poc',
  width: 1320,
  height: 860,
  minWidth: 960,
  minHeight: 600,
  onClose: () => void shutdown(0),
  ...(uiMode === 'native' ? { framePump: 'adaptive' as const, idleFrameMs: 50 } : {}),
});
const renderer = app.renderer as GpuixRenderer;

// Bundled fonts keep typography identical across machines.
for (const file of ['Inter-Regular.otf', 'Inter-Medium.otf', 'Inter-SemiBold.otf', 'JetBrainsMono-Regular.ttf', 'JetBrainsMono-Medium.ttf']) {
  try {
    renderer.registerFont(await Deno.readFile(new URL(`../assets/fonts/${file}`, import.meta.url)) as never);
  } catch {
    // Missing fonts fall back to the platform default.
  }
}

// 2. Embedded NetScript service (the desktop BFF) on loopback, unless pointed at a remote one.
//    With NETSCRIPT_STACK=real the process first supervises the whole NetScript graph.
const remote = args.get('service-url');
let diagnosticsFor = (_stack: RealStackHandle): (() => Promise<unknown>) | undefined => undefined;
if (stackMode === 'real' && !remote) {
  const { startRealStack, stackDiagnostics } = await import('../realstack/host.ts');
  diagnosticsFor = (stack) => () => stackDiagnostics(stack.graph);
  realStack = await startRealStack({
    dataDir: `${dataDir}/stack`,
    onEvent: bench ? undefined : (event) => console.error(`[stack ${String(event.at).padStart(5)} ms] ${event.node} ${event.state}`),
  });
}
service = remote ? null : await startWorkspaceService({
  kvPath: `${dataDir}/service.kv`,
  eventsPerSecond: Number(Deno.env.get('NETSCRIPT_BENCH_RATE') ?? 0.5),
  ...(realStack ? { backend: realStack.backend, diagnostics: diagnosticsFor(realStack) } : {}),
});
const baseUrl = remote ?? service!.url;

// 3. Host port: cookie jar + settings in @netscript/kv, native capabilities from GPUIX.
const clientKv = new DenoKvAdapter(undefined, `${dataDir}/client.kv`);
const jar = new Map<string, string>(
  Object.entries((await clientKv.get<Record<string, string>>(['desktop', 'cookies']))?.value ?? {}),
);
async function captureCookies(response: Response): Promise<void> {
  const setCookies = response.headers.getSetCookie();
  if (setCookies.length === 0) return;
  for (const line of setCookies) {
    const [pair, ...attributes] = line.split(';');
    const at = pair.indexOf('=');
    const name = pair.slice(0, at).trim();
    const value = pair.slice(at + 1).trim();
    const expired = attributes.some((attribute) => /^\s*max-age\s*=\s*0\s*$/i.test(attribute));
    if (expired || value === '') jar.delete(name);
    else jar.set(name, value);
  }
  await clientKv.set(['desktop', 'cookies'], Object.fromEntries(jar));
}
const cookieHeader = () => jar.size === 0 ? undefined : [...jar].map(([name, value]) => `${name}=${value}`).join('; ');

const jarFetch: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  const sameOrigin = new URL(request.url).origin === new URL(baseUrl).origin;
  const cookie = cookieHeader();
  if (sameOrigin && cookie && !request.headers.has('cookie')) request.headers.set('cookie', cookie);
  const response = await fetch(request);
  if (sameOrigin) await captureCookies(response);
  return response;
};

let notificationSeq = 0;
const host: HostServices = {
  baseUrl,
  fetch: jarFetch,
  authHeaders: (): Record<string, string> => {
    const token = jar.get(SESSION_COOKIE);
    return token ? { authorization: `Bearer ${token}` } : {};
  },
  settings: {
    async get<T>(key: string) {
      return (await clientKv.get<T>(['desktop', 'settings', key]))?.value ?? undefined;
    },
    async set(key, value) {
      await clientKv.set(['desktop', 'settings', key], value);
    },
  },
  native: {
    setTitle: (title) => renderer.setWindowTitle(title),
    // OS notifications and clipboard landed on GPUIX main after 0.11.0: feature-detect,
    // fall back to an in-app toast so the PoC runs on the published release.
    notify: (title, body) => {
      const native = renderer as unknown as { notify?: (options: { tag: string; title: string; body?: string }) => void };
      if (typeof native.notify === 'function') {
        try {
          native.notify({ tag: `ns-${++notificationSeq}`, title, body });
          return;
        } catch (error) {
          console.warn('[notify]', String(error));
        }
      }
      showToast(`${title} — ${body}`);
    },
    copy: (text) => {
      const native = renderer as unknown as { writeToClipboard?: (text: string) => void };
      if (typeof native.writeToClipboard === 'function') native.writeToClipboard(text);
      else showToast('Clipboard API is not in GPUIX 0.11.0 (landed on main after release).');
    },
    pickDirectory: async () => (await renderer.promptForPaths({ directories: true, files: false, multiple: false, prompt: 'Export here' }))?.[0] ?? null,
    writeTextFile: (path, text) => Deno.writeTextFile(path, text),
    frameStats: () => {
      try {
        return renderer.getDebugFrameOverlayStats() as unknown as Record<string, number>;
      } catch {
        return null;
      }
    },
  },
  runtime: {
    renderer: `GPUIX 0.11 · Preact${uiMode === 'native' ? ' · GPUIX-first' : ''}${realStack ? ' · real stack' : ''}`,
    ui: uiMode,
    runtime: `Deno ${Deno.version.deno}`,
    platform: `${Deno.build.os}-${Deno.build.arch}`,
    memoryMb: () => Deno.memoryUsage().rss / 1_048_576,
  },
  onReady() {
    // The data-backed tree was committed; report after the next painted frames.
    setTimeout(() => {
      const ms = performance.now() - started;
      console.log(`NETSCRIPT_READY ${JSON.stringify({
        host: 'gpuix-deno',
        ui: uiMode,
        stack: realStack ? 'real' : 'embedded',
        readyMs: Math.round(ms),
        rssMb: Math.round(Deno.memoryUsage().rss / 1_048_576),
        ...(realStack ? { stackReadyMs: realStack.graph.readyMs, stackPids: realStack.graph.pids() } : {}),
      })}`);
    }, 24);
  },
};
installHost(host);

const forcedScheme = Deno.env.get('NETSCRIPT_SCHEME');
await boot({
  ...(bench ? { autoSignIn: { email: 'bench@netscript.dev', password: 'netscript' } } : {}),
  ...(forcedScheme === 'dark' || forcedScheme === 'light' ? { scheme: forcedScheme } : {}),
  ...(Deno.env.get('NETSCRIPT_PATH') ? { initialPath: Deno.env.get('NETSCRIPT_PATH') } : {}),
});
