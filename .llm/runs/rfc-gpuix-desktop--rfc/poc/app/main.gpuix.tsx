/**
 * Native entry: Deno process + GPUIX window + embedded NetScript service.
 *
 *   deno run -A app/main.gpuix.tsx [--service-url=https://...] [--profile=<dir>]
 *
 * Bench/smoke environment:
 *   NETSCRIPT_BENCH=1            sign in automatically, print NETSCRIPT_READY
 *   NETSCRIPT_BENCH_RATE=<n>     simulated worker events per second
 */
import { render } from 'gpuix-preact';
import { GpuixRenderer } from '@gpuix/native';
import { DenoKvAdapter } from '@netscript/kv';
import { setPlatform } from './ui/primitives.ts';
import { type HostServices, installHost } from './client/host.ts';
import { App, boot } from './app.tsx';
import { showToast } from './client/state.ts';
import { SESSION_COOKIE } from './contract.ts';
import { startWorkspaceService } from './service/service.ts';

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

// 2. Embedded NetScript service on loopback, unless pointed at a remote one.
const remote = args.get('service-url');
const service = remote ? null : await startWorkspaceService({
  kvPath: `${dataDir}/service.kv`,
  eventsPerSecond: Number(Deno.env.get('NETSCRIPT_BENCH_RATE') ?? 0.5),
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
    renderer: 'GPUIX 0.11 · Preact',
    runtime: `Deno ${Deno.version.deno}`,
    platform: `${Deno.build.os}-${Deno.build.arch}`,
    memoryMb: () => Deno.memoryUsage().rss / 1_048_576,
  },
  onReady() {
    // The data-backed tree was committed; report after the next painted frames.
    setTimeout(() => {
      const ms = performance.now() - started;
      console.log(`NETSCRIPT_READY ${JSON.stringify({ host: 'gpuix-deno', readyMs: Math.round(ms), rssMb: Math.round(Deno.memoryUsage().rss / 1_048_576) })}`);
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
