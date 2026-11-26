#!/usr/bin/env -S deno run --no-lock -A
/**
 * Wave-0 Empirical Probe B:
 *   @fresh/plugin-vite@^1.1.2 + vite@7.2.2 + createNetScriptVitePlugin
 *   - Dependency-island matrix (app / local plugin / linked @netscript/fresh defer / simulated JSR HTTP)
 *   - Single preact (^10.29.2) & @preact/signals (2.11.3) identity verification (static + runtime)
 *   - #2655 content-hashing compatibility & immutable headers
 *   - Route/island CSS splitting vs bloated cold CSS + CSS Cascade Level 5 @layer ordering
 *   - Dev edit loops (route edit, island edit, route add/unlink vs islandSpecifiers, config edit)
 */

import { fromFileUrl, join, relative, resolve } from 'jsr:@std/path@1';
import { assert, assertEquals } from 'jsr:@std/assert@1';

const SCRIPT_DIR = resolve(fromFileUrl(new URL('.', import.meta.url)));
const REPO_ROOT = resolve(SCRIPT_DIR, '../../../..');
const FIXTURE_SOURCE_ROOT = join(SCRIPT_DIR, 'probe-b-fixture');
let FIXTURE_ROOT = '';
let WEB_ROOT = '';
let LOCAL_PLUGIN_ROOT = '';

async function copyDirRecursive(src: string, dest: string): Promise<void> {
  await Deno.mkdir(dest, { recursive: true });
  for await (const entry of Deno.readDir(src)) {
    if (
      entry.name === 'node_modules' ||
      entry.name === '_fresh' ||
      entry.name === '.vite' ||
      entry.name === '.deno'
    ) {
      continue;
    }
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory) {
      await copyDirRecursive(srcPath, destPath);
    } else if (entry.isFile) {
      await Deno.copyFile(srcPath, destPath);
    }
  }
}

async function stageFixtureWorkspace(): Promise<string> {
  const stageRoot = await Deno.makeTempDir({ prefix: 'probe-b-work-' });
  await copyDirRecursive(FIXTURE_SOURCE_ROOT, stageRoot);
  const repoPackages = join(REPO_ROOT, 'packages');

  const rootDenoPath = join(stageRoot, 'deno.json');
  const rootRel = relative(stageRoot, repoPackages);
  const rootDenoText = (await Deno.readTextFile(rootDenoPath)).replaceAll('../../../../../packages/', `${rootRel}/`).replaceAll(
    '../../../../../packages',
    rootRel,
  );
  await Deno.writeTextFile(rootDenoPath, rootDenoText);

  const webDenoPath = join(stageRoot, 'apps/web/deno.json');
  const webRel = relative(join(stageRoot, 'apps/web'), repoPackages);
  await Deno.writeTextFile(
    webDenoPath,
    (await Deno.readTextFile(webDenoPath)).replaceAll('../../../../../../../packages/', `${webRel}/`),
  );

  const viteCfgPath = join(stageRoot, 'apps/web/vite.config.ts');
  await Deno.writeTextFile(
    viteCfgPath,
    (await Deno.readTextFile(viteCfgPath)).replace(
      "resolve(import.meta.dirname!, '../../../../../../..')",
      JSON.stringify(REPO_ROOT),
    ),
  );

  const assetsRel = relative(join(stageRoot, 'apps/web/assets'), repoPackages);
  for (const cssFile of ['apps/web/assets/bloated-global.css', 'apps/web/assets/split-tailwind-shell.css']) {
    const p = join(stageRoot, cssFile);
    await Deno.writeTextFile(
      p,
      (await Deno.readTextFile(p)).replaceAll('../../../../../../../../packages/', `${assetsRel}/`),
    );
  }
  return stageRoot;
}
const BROWSER_EXECUTABLE =
  Deno.env.get('NETSCRIPT_E2E_BROWSER_EXECUTABLE') ??
  '/home/agent/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';

interface MatrixRow {
  readonly id: string;
  readonly cell: string;
  readonly status: 'PASS' | 'FAIL' | 'CAVEAT';
  readonly evidence: string;
}

const matrix: MatrixRow[] = [];

function record(id: string, cell: string, status: MatrixRow['status'], evidence: string): void {
  matrix.push({ id, cell, status, evidence });
  console.log(`[MATRIX] ${id} | ${cell} | ${status} | ${evidence}`);
}

function section(title: string): void {
  console.log(`\n================================================================================`);
  console.log(`SECTION: ${title}`);
  console.log(`================================================================================`);
}

function reservePort(): number {
  const listener = Deno.listen({ hostname: '127.0.0.1', port: 0 });
  const { port } = listener.addr as Deno.NetAddr;
  listener.close();
  return port;
}

function filterNoise(text: string): string {
  return text
    .split('\n')
    .filter((line) => !line.startsWith('WARN RS') && !line.endsWith('/package.json'))
    .join('\n');
}

interface CmdResult {
  readonly code: number;
  readonly output: string;
}

async function runCmd(
  cmd: readonly string[],
  cwd: string,
  env?: Record<string, string>,
): Promise<CmdResult> {
  const mergedEnv = { ...Deno.env.toObject(), ...(env ?? {}) };
  const proc = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd,
    env: mergedEnv,
    stdout: 'piped',
    stderr: 'piped',
  });
  const out = await proc.output();
  const stdout = new TextDecoder().decode(out.stdout);
  const stderr = new TextDecoder().decode(out.stderr);
  return {
    code: out.code,
    output: filterNoise(`${stdout}${stderr ? `\n${stderr}` : ''}`).trim(),
  };
}

interface RunningProcess {
  readonly child: Deno.ChildProcess;
  readonly logs: () => string;
  readonly stop: () => Promise<void>;
}

function spawnBackground(
  cmd: readonly string[],
  cwd: string,
  env?: Record<string, string>,
): RunningProcess {
  const mergedEnv = { ...Deno.env.toObject(), ...(env ?? {}) };
  const child = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd,
    env: mergedEnv,
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();

  const chunks: string[] = [];
  const decoder = new TextDecoder();
  const drain = async (stream: ReadableStream<Uint8Array>) => {
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = filterNoise(decoder.decode(value, { stream: true }));
        if (text) chunks.push(text);
        if (chunks.length > 400) chunks.shift();
      }
    } catch {
      // stream closed on exit
    }
  };
  const drainStdout = drain(child.stdout);
  const drainStderr = drain(child.stderr);

  return {
    child,
    logs: () => chunks.join(''),
    stop: async () => {
      try {
        child.kill('SIGTERM');
      } catch {
        // already exited
      }
      await Promise.race([
        child.status,
        new Promise((resolveWait) => setTimeout(resolveWait, 3000)),
      ]);
      try {
        child.kill('SIGKILL');
      } catch {
        // already dead
      }
      await Promise.allSettled([child.status, drainStdout, drainStderr]);
    },
  };
}

async function waitForHttp(url: string, proc: RunningProcess, timeoutMs = 25_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const exited = await Promise.race([
      proc.child.status.then((s) => s),
      new Promise<null>((r) => setTimeout(() => r(null), 100)),
    ]);
    if (exited) {
      throw new Error(
        `Server exited early (${exited.code}) waiting for ${url}\n--- LOGS ---\n${proc.logs()}`,
      );
    }
    try {
      const res = await fetch(url);
      await res.body?.cancel();
      if (res.status < 500) return;
    } catch {
      // not listening yet
    }
  }
  throw new Error(`Timed out waiting for ${url}\n--- LOGS ---\n${proc.logs()}`);
}

class MiniCdpClient {
  #ws: WebSocket;
  #nextId = 1;
  #pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  #events: Array<{ method: string; params: Record<string, unknown> }> = [];
  #waiters: Array<{
    method: string;
    pred?: (params: Record<string, unknown>) => boolean;
    resolve: (params: Record<string, unknown>) => void;
  }> = [];

  private constructor(ws: WebSocket) {
    this.#ws = ws;
    ws.onmessage = (ev) => {
      const msg = JSON.parse(String(ev.data)) as {
        id?: number;
        result?: unknown;
        error?: { message: string };
        method?: string;
        params?: Record<string, unknown>;
      };
      if (typeof msg.id === 'number') {
        const p = this.#pending.get(msg.id);
        if (p) {
          this.#pending.delete(msg.id);
          if (msg.error) p.reject(new Error(`CDP ${msg.error.message}`));
          else p.resolve(msg.result);
        }
      } else if (msg.method) {
        const params = msg.params ?? {};
        this.#events.push({ method: msg.method, params });
        if (this.#events.length > 500) this.#events.shift();
        for (let i = this.#waiters.length - 1; i >= 0; i--) {
          const w = this.#waiters[i];
          if (w.method === msg.method && (!w.pred || w.pred(params))) {
            this.#waiters.splice(i, 1);
            w.resolve(params);
          }
        }
      }
    };
  }

  static async connect(wsUrl: string): Promise<MiniCdpClient> {
    const ws = new WebSocket(wsUrl);
    await new Promise<void>((resolveOpen, rejectOpen) => {
      ws.onopen = () => resolveOpen();
      ws.onerror = (e) => rejectOpen(new Error(`CDP WS error: ${String(e)}`));
    });
    return new MiniCdpClient(ws);
  }

  send<T = Record<string, unknown>>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const id = this.#nextId++;
    this.#ws.send(JSON.stringify({ id, method, params }));
    return new Promise<T>((resolve, reject) => {
      this.#pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
    });
  }

  waitForEvent(
    method: string,
    pred?: (params: Record<string, unknown>) => boolean,
    timeoutMs = 10_000,
  ): Promise<Record<string, unknown>> {
    for (const ev of this.#events) {
      if (ev.method === method && (!pred || pred(ev.params))) {
        return Promise.resolve(ev.params);
      }
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.#waiters.indexOf(entry);
        if (idx >= 0) this.#waiters.splice(idx, 1);
        reject(new Error(`Timed out waiting for CDP event ${method}`));
      }, timeoutMs);
      const entry = {
        method,
        pred,
        resolve: (params: Record<string, unknown>) => {
          clearTimeout(timer);
          resolve(params);
        },
      };
      this.#waiters.push(entry);
    });
  }

  clearEvents(): void {
    this.#events.length = 0;
  }

  events(): ReadonlyArray<{ method: string; params: Record<string, unknown> }> {
    return this.#events;
  }

  async evalJson<T = unknown>(expression: string): Promise<T> {
    const res = await this.send<{
      result?: { value?: T; type?: string; description?: string };
      exceptionDetails?: { text?: string; exception?: { description?: string } };
    }>('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(
        `Browser JS exception: ${res.exceptionDetails.exception?.description ?? res.exceptionDetails.text ?? 'unknown'}`,
      );
    }
    return res.result?.value as T;
  }

  close(): void {
    try {
      this.#ws.close();
    } catch {
      // ignore
    }
  }
}

interface BrowserSession {
  readonly cdp: MiniCdpClient;
  readonly errors: string[];
  readonly navigate: (url: string) => Promise<void>;
  readonly waitUntil: <T>(fnExpr: string, timeoutMs?: number) => Promise<T>;
  readonly close: () => Promise<void>;
}

async function openBrowserSession(): Promise<BrowserSession> {
  const cdpPort = reservePort();
  const profileDir = await Deno.makeTempDir({ prefix: 'probe-b-cdp-' });
  const browserProc = spawnBackground(
    [
      BROWSER_EXECUTABLE,
      '--headless=new',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-background-networking',
      `--remote-debugging-port=${cdpPort}`,
      `--user-data-dir=${profileDir}`,
      'about:blank',
    ],
    WEB_ROOT,
  );

  let wsUrl = '';
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${cdpPort}/json/list`);
      if (res.ok) {
        const targets = (await res.json()) as Array<{ type?: string; webSocketDebuggerUrl?: string }>;
        const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (page?.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      }
    } catch {
      // retrying
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  if (!wsUrl) {
    await browserProc.stop();
    await Deno.remove(profileDir, { recursive: true }).catch(() => {});
    throw new Error(`Chromium CDP did not start on port ${cdpPort}\n${browserProc.logs()}`);
  }

  const cdp = await MiniCdpClient.connect(wsUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });

  const errors: string[] = [];
  // Keep lightweight error tracking from console/exception events
  const pollErrors = () => {
    for (const ev of cdp.events()) {
      if (ev.method === 'Runtime.exceptionThrown') {
        const desc = (ev.params.exceptionDetails as { exception?: { description?: string }; text?: string })
          ?.exception?.description ?? 'Runtime.exceptionThrown';
        if (!errors.includes(desc)) errors.push(desc);
      } else if (ev.method === 'Runtime.consoleAPICalled' && ev.params.type === 'error') {
        const args = (ev.params.args as Array<{ value?: unknown; description?: string }>) ?? [];
        const msg = args.map((a) => String(a.value ?? a.description ?? '')).join(' ');
        if (!errors.includes(msg)) errors.push(msg);
      }
    }
  };

  return {
    cdp,
    get errors() {
      pollErrors();
      return errors;
    },
    navigate: async (url: string) => {
      errors.length = 0;
      cdp.clearEvents();
      const loaded = cdp.waitForEvent('Page.loadEventFired', undefined, 15_000);
      await cdp.send('Page.navigate', { url });
      await loaded;
      await new Promise((r) => setTimeout(r, 120));
      pollErrors();
    },
    waitUntil: async <T>(fnExpr: string, timeoutMs = 10_000): Promise<T> => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const val = await cdp.evalJson<T>(fnExpr);
        if (val) return val;
        await new Promise((r) => setTimeout(r, 60));
      }
      pollErrors();
      throw new Error(`waitUntil timed out for: ${fnExpr} (errors=${JSON.stringify(errors)})`);
    },
    close: async () => {
      cdp.close();
      await browserProc.stop();
      await Deno.remove(profileDir, { recursive: true }).catch(() => {});
    },
  };
}

interface ClientManifestEntry {
  file: string;
  name?: string;
  src?: string;
  isEntry?: boolean;
  imports?: string[];
  css?: string[];
}

async function readClientManifest(): Promise<Record<string, ClientManifestEntry>> {
  const txt = await Deno.readTextFile(join(WEB_ROOT, '_fresh/client/.vite/manifest.json'));
  return JSON.parse(txt);
}

async function readServerManifest(): Promise<Record<string, ClientManifestEntry>> {
  const txt = await Deno.readTextFile(join(WEB_ROOT, '_fresh/server/.vite/manifest.json'));
  return JSON.parse(txt);
}

async function inspectClientRuntimeIdentityChunks(): Promise<{
  readonly preactChunks: Array<{ file: string; hitCount: number }>;
  readonly signalsChunks: Array<{ file: string; hitCount: number }>;
}> {
  const clientDir = join(WEB_ROOT, '_fresh/client');
  const preactChunks: Array<{ file: string; hitCount: number }> = [];
  const signalsChunks: Array<{ file: string; hitCount: number }> = [];
  for await (const ent of Deno.readDir(clientDir)) {
    if (!ent.isFile || !ent.name.endsWith('.mjs')) continue;
    const text = await Deno.readTextFile(join(clientDir, ent.name));
    // Identify bundled Preact core IS_NON_DIMENSIONAL regex & @preact/signals devtools marker
    if (text.includes('acit|ex(?:s|g|n|p|$)|rph|grid') || text.includes('__PREACT_DEVTOOLS__')) {
      preactChunks.push({ file: ent.name, hitCount: 1 });
    }
    if (text.includes('__PREACT_SIGNALS_DEVTOOLS__')) {
      signalsChunks.push({ file: ent.name, hitCount: 1 });
    }
  }
  return { preactChunks, signalsChunks };
}

function extractStylesheetHrefs(html: string): string[] {
  return [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
}

function extractModuleScriptText(html: string): string {
  const match = html.match(/<script\b[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/);
  return match?.[1] ?? '';
}

async function cleanFreshBuild(env?: Record<string, string>, nativeConfigLoader = false): Promise<CmdResult> {
  await Deno.remove(join(WEB_ROOT, '_fresh'), { recursive: true }).catch(() => {});
  const args = nativeConfigLoader
    ? ['deno', 'run', '--no-lock', '-A', 'npm:vite', '--configLoader', 'native', 'build']
    : ['deno', 'run', '--no-lock', '-A', 'npm:vite', 'build'];
  return await runCmd(args, WEB_ROOT, env);
}

async function fetchHtml(url: string): Promise<{ status: number; headers: Headers; body: string }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
  const body = await res.text();
  return { status: res.status, headers: res.headers, body };
}

async function measureCssServedBytes(baseUrl: string, hrefs: string[]): Promise<{
  readonly hrefs: Array<{ href: string; bytes: number; status: number }>;
  readonly totalBytes: number;
}> {
  const seen = new Set<string>();
  const rows: Array<{ href: string; bytes: number; status: number }> = [];
  let totalBytes = 0;
  for (const href of hrefs) {
    if (seen.has(href)) continue;
    seen.add(href);
    const res = await fetch(`${baseUrl}${href}`);
    const bytes = (await res.arrayBuffer()).byteLength;
    rows.push({ href, bytes, status: res.status });
    totalBytes += bytes;
  }
  return { hrefs: rows, totalBytes };
}

async function main(): Promise<void> {
  FIXTURE_ROOT = await stageFixtureWorkspace();
  WEB_ROOT = join(FIXTURE_ROOT, 'apps', 'web');
  LOCAL_PLUGIN_ROOT = join(FIXTURE_ROOT, 'packages', 'local-plugin');

  const activeCssPath = join(WEB_ROOT, 'assets/active-entry.css');
  const origActiveCss = await Deno.readTextFile(activeCssPath);
  const localIslandPath = join(LOCAL_PLUGIN_ROOT, 'island.tsx');
  const origLocalIsland = await Deno.readTextFile(localIslandPath);
  const rootDenoPath = join(FIXTURE_ROOT, 'deno.json');
  const origRootDeno = await Deno.readTextFile(rootDenoPath);
  const webDenoPath = join(WEB_ROOT, 'deno.json');
  const origWebDeno = await Deno.readTextFile(webDenoPath);
  const viteConfigPath = join(WEB_ROOT, 'vite.config.ts');
  const origViteConfig = await Deno.readTextFile(viteConfigPath);
  const localPluginDenoPath = join(LOCAL_PLUGIN_ROOT, 'deno.json');
  const origLocalPluginDeno = await Deno.readTextFile(localPluginDenoPath);
  const routeExplicitPath = join(LOCAL_PLUGIN_ROOT, 'route-explicit.tsx');
  const origRouteExplicit = await Deno.readTextFile(routeExplicitPath);

  const browser = await openBrowserSession();

  try {
    // =========================================================================
    // SECTION 1: Baseline Production Build + #2655 Hashes + SSR + Hydration + Preact/Signals Identity
    // =========================================================================
    section('1. Baseline Prod Build + #2655 Content-Hashing + Single Preact/Signals Identity + Hydration');
    await Deno.writeTextFile(activeCssPath, "@import './prelude-app-wins.css';\n");
    const buildA = await cleanFreshBuild();
    console.log(buildA.output);
    assertEquals(buildA.code, 0, 'Baseline vite build must exit 0');

    const manifestA = await readClientManifest();
    const serverManifestA = await readServerManifest();
    const clientFilesA = Object.values(manifestA).map((e) => e.file);
    const serverFilesA = Object.values(serverManifestA).map((e) => e.file);
    assert(
      clientFilesA.every((f) => /-[A-Za-z0-9_-]{8}\.mjs$/.test(f)),
      `Expected all client chunks to match [name]-[hash].mjs: ${JSON.stringify(clientFilesA)}`,
    );
    assert(
      serverFilesA.every((f) => f.endsWith('.mjs') && !/-[A-Za-z0-9_-]{8}\.mjs$/.test(f)),
      `Expected unhashed SSR modules: ${JSON.stringify(serverFilesA)}`,
    );

    const idChunksA = await inspectClientRuntimeIdentityChunks();
    console.log('Static Preact chunks:', idChunksA.preactChunks);
    console.log('Static @preact/signals chunks:', idChunksA.signalsChunks);
    assertEquals(idChunksA.preactChunks.length, 1, 'Must have exactly 1 Preact runtime chunk');
    assertEquals(idChunksA.signalsChunks.length, 1, 'Must have exactly 1 @preact/signals chunk');
    record(
      'P1',
      'Static client identity (app + local-plugin + defer)',
      'PASS',
      `1 preact chunk (${idChunksA.preactChunks[0].file}), 1 @preact/signals chunk (${idChunksA.signalsChunks[0].file}), all client [name]-[hash].mjs`,
    );

    const prodPortA = reservePort();
    const prodSrvA = spawnBackground(
      ['deno', 'serve', '--no-lock', '-A', '--port', String(prodPortA), '--host', '127.0.0.1', '_fresh/server.js'],
      WEB_ROOT,
    );
    try {
      const baseUrl = `http://127.0.0.1:${prodPortA}`;
      await waitForHttp(`${baseUrl}/`, prodSrvA);

      // Route SSR HTML & immutable Cache-Control checks
      const homeHtml = await fetchHtml(`${baseUrl}/`);
      const islandsHtml = await fetchHtml(`${baseUrl}/islands`);
      const fsPluginHtml = await fetchHtml(`${baseUrl}/plugin-fs`);
      const mountedHtml = await fetchHtml(`${baseUrl}/plugin-mounted`);
      const mountedExplicitHtml = await fetchHtml(`${baseUrl}/plugin-mounted-explicit`);
      const eagerExplicitHtml = await fetchHtml(`${baseUrl}/plugin-eager-explicit`);

      assertEquals(homeHtml.status, 200);
      assertEquals(islandsHtml.status, 200);
      assertEquals(fsPluginHtml.status, 200);
      assertEquals(mountedHtml.status, 200);
      assertEquals(mountedExplicitHtml.status, 200);
      assertEquals(eagerExplicitHtml.status, 200);

      const homeCssHrefs = extractStylesheetHrefs(homeHtml.body);
      const fsCssHrefs = extractStylesheetHrefs(fsPluginHtml.body);
      const mountedCssHrefs = extractStylesheetHrefs(mountedHtml.body);
      const mountedExplicitCssHrefs = extractStylesheetHrefs(mountedExplicitHtml.body);
      const eagerExplicitCssHrefs = extractStylesheetHrefs(eagerExplicitHtml.body);

      console.log('Home CSS hrefs:', homeCssHrefs);
      console.log('/plugin-fs CSS hrefs:', fsCssHrefs);
      console.log('/plugin-mounted CSS hrefs:', mountedCssHrefs);
      console.log('/plugin-mounted-explicit CSS hrefs:', mountedExplicitCssHrefs);
      console.log('/plugin-eager-explicit CSS hrefs:', eagerExplicitCssHrefs);

      assertEquals(homeCssHrefs.length, 1, 'Cold home must only load global client-entry CSS');
      assert(!homeHtml.body.includes('boot('), 'Cold home must emit zero island hydration scripts');
      assert(
        fsCssHrefs.some((h) => h.includes('_fresh-route___plugin_fs-')),
        '/plugin-fs must emit route-scoped fresh:route-css stylesheet',
      );
      assert(
        fsCssHrefs.some((h) => h.includes('fresh-island__island_7-')),
        '/plugin-fs must emit island-scoped stylesheet',
      );
      assert(
        !mountedCssHrefs.some((h) => h.includes('route-')),
        'Programmatic app.route side-effect CSS is NOT wired into <head> by @fresh/plugin-vite@1.1.2',
      );
      assert(
        mountedCssHrefs.some((h) => h.includes('fresh-island__island_7-')),
        'Programmatic app.route STILL receives island-scoped stylesheet automatically',
      );
      assert(
        mountedExplicitCssHrefs.includes('/mounted-explicit.css'),
        'Lazy app.route with export const css wires stylesheet via Fresh setAdditionalStyles',
      );
      assert(
        !eagerExplicitCssHrefs.includes('/mounted-explicit.css'),
        'Eager app.route skips def.css (matches @fresh/core@2.3.3 commands.ts:316)',
      );

      // Verify immutable Cache-Control on hashed island & CSS assets
      const localIslandEntry = Object.values(manifestA).find((e) => e.src?.includes('local-plugin/island.tsx'))!;
      const localIslandAssetRes = await fetch(`${baseUrl}/${localIslandEntry.file}`);
      await localIslandAssetRes.body?.cancel();
      const cacheControlJs = localIslandAssetRes.headers.get('cache-control') ?? '';
      const clientCssPath = homeCssHrefs[0].split('?')[0];
      const clientCssRes = await fetch(`${baseUrl}${clientCssPath}`);
      await clientCssRes.body?.cancel();
      const cacheControlCss = clientCssRes.headers.get('cache-control') ?? '';
      console.log(`Cache-Control JS (${localIslandEntry.file}): ${cacheControlJs}`);
      console.log(`Cache-Control CSS (${clientCssPath}): ${cacheControlCss}`);
      assert(cacheControlJs.includes('immutable'), 'Hashed island JS must carry immutable Cache-Control');

      record(
        'P2',
        'Prod build + SSR + CSS delivery routing',
        'PASS',
        `cold / loads 1 CSS; fsRoute injects route+island CSS; lazy app.route(css) injects explicit CSS; programmatic side-effect CSS omitted (island CSS preserved); eager app.route omits css`,
      );

      // Browser CDP hydration + cross-island Preact/Signals identity + Defer partial refresh
      await browser.navigate(`${baseUrl}/islands`);
      await browser.waitUntil(
        `document.querySelector('#host-app-island')?.dataset.hydrated === 'true' && document.querySelector('#local-plugin-island')?.dataset.hydrated === 'true'`,
      );
      await browser.waitUntil(
        `document.querySelector('#defer-target')?.dataset.deferState === 'loaded'`,
      );
      const runtimeId = await browser.cdp.evalJson<{
        optSize: number;
        sources: string[];
        isBrowser: string | undefined;
        deferText: string | undefined;
      }>(`(() => ({
        optSize: window.__probePreactOptions ? window.__probePreactOptions.size : -1,
        sources: window.__probePreactSources ?? [],
        isBrowser: document.querySelector('#local-plugin-island')?.dataset.isBrowser,
        deferText: document.querySelector('#defer-target')?.textContent,
      }))()`);
      console.log('Browser runtime identity on /islands:', runtimeId);
      assertEquals(runtimeId.optSize, 1, 'Host app and local plugin island must share exact Preact options ref');
      assertEquals(runtimeId.isBrowser, 'true');
      assertEquals(runtimeId.deferText, 'loaded-from-partial');

      // Click Host App button -> assert shared signal updates BOTH Host App and Local Plugin islands
      await browser.cdp.evalJson(`document.querySelector('#host-app-btn').click()`);
      await browser.waitUntil(
        `document.querySelector('#host-app-island')?.dataset.sharedSignal === '11' && document.querySelector('#local-plugin-island')?.dataset.sharedSignal === '11'`,
      );
      await browser.cdp.evalJson(`document.querySelector('#local-plugin-btn').click()`);
      await browser.waitUntil(
        `document.querySelector('#host-app-island')?.dataset.sharedSignal === '12' && document.querySelector('#local-plugin-island')?.dataset.sharedSignal === '12'`,
      );
      assertEquals(browser.errors.length, 0, `Unexpected browser errors: ${JSON.stringify(browser.errors)}`);

      record(
        'P3',
        'Prod browser hydration (AppCounter + @acme/local-plugin/island + @netscript/fresh/defer/island)',
        'PASS',
        `All 3 islands hydrated cleanly; defer partial swapped to loaded-from-partial; options.size===1; shared signal synced 10->11->12 across host & plugin`,
      );

      // Verify Cascade Layer order in browser on /plugin-fs and /plugin-mounted-explicit (App beats Plugin!)
      await browser.navigate(`${baseUrl}/plugin-fs`);
      await browser.waitUntil(`document.querySelector('#local-plugin-island')?.dataset.hydrated === 'true'`);
      const fsCascade = await browser.cdp.evalJson<{ color: string; panelPadding: string }>(`(() => ({
        color: getComputedStyle(document.querySelector('#cascade-probe')).color,
        panelPadding: getComputedStyle(document.querySelector('.plugin-route-panel')).paddingTop,
      }))()`);
      console.log('Prod /plugin-fs cascade style (@layer ns-plugins, ns-app):', fsCascade);
      assertEquals(fsCascade.color, 'rgb(22, 163, 74)', '@layer ns-app MUST beat @layer ns-plugins even when client CSS is linked first');
      assertEquals(fsCascade.panelPadding, '16px');

      await browser.navigate(`${baseUrl}/plugin-mounted-explicit`);
      await browser.waitUntil(`document.querySelector('#local-plugin-island')?.dataset.hydrated === 'true'`);
      const explicitCascade = await browser.cdp.evalJson<{ color: string; borderStyle: string }>(`(() => ({
        color: getComputedStyle(document.querySelector('#cascade-probe')).color,
        borderStyle: getComputedStyle(document.querySelector('.plugin-explicit-box')).borderTopStyle,
      }))()`);
      console.log('Prod /plugin-mounted-explicit cascade style:', explicitCascade);
      assertEquals(explicitCascade.color, 'rgb(22, 163, 74)');
      assertEquals(explicitCascade.borderStyle, 'dashed');
    } finally {
      await prodSrvA.stop();
    }

    // =========================================================================
    // SECTION 2: #2655 Content-Hashing Invalidation Build A -> Edit -> Build B
    // =========================================================================
    section('2. #2655 Content-Hashing Verification (Build A vs Build B after plugin island edit)');
    await Deno.writeTextFile(
      localIslandPath,
      origLocalIsland.replace("data-island-version='v1'", "data-island-version='v2'"),
    );
    const buildB = await cleanFreshBuild();
    assertEquals(buildB.code, 0, 'Build B must succeed');
    const manifestB = await readClientManifest();
    const pickFile = (m: Record<string, ClientManifestEntry>, needle: string) =>
      Object.values(m).find((e) => e.src?.includes(needle) || e.name === needle)?.file;

    const hashComparison = {
      appCounterA: pickFile(manifestA, 'islands/AppCounter.tsx'),
      appCounterB: pickFile(manifestB, 'islands/AppCounter.tsx'),
      deferA: pickFile(manifestA, 'packages/fresh/src/application/defer/island.ts'),
      deferB: pickFile(manifestB, 'packages/fresh/src/application/defer/island.ts'),
      localPluginA: pickFile(manifestA, 'local-plugin/island.tsx'),
      localPluginB: pickFile(manifestB, 'local-plugin/island.tsx'),
      clientEntryA: manifestA['fresh:client-entry']?.file,
      clientEntryB: manifestB['fresh:client-entry']?.file,
    };
    console.log('Build A vs Build B client chunk hashes:', hashComparison);
    assert(hashComparison.localPluginA !== hashComparison.localPluginB, 'Edited island MUST get new content hash');
    assertEquals(hashComparison.appCounterA, hashComparison.appCounterB, 'Untouched AppCounter MUST keep identical hash');
    assertEquals(hashComparison.deferA, hashComparison.deferB, 'Untouched Defer island MUST keep identical hash');

    const prodPortB = reservePort();
    const prodSrvB = spawnBackground(
      ['deno', 'serve', '--no-lock', '-A', '--port', String(prodPortB), '--host', '127.0.0.1', '_fresh/server.js'],
      WEB_ROOT,
    );
    try {
      await waitForHttp(`http://127.0.0.1:${prodPortB}/islands`, prodSrvB);
      await browser.navigate(`http://127.0.0.1:${prodPortB}/islands`);
      const v2Version = await browser.waitUntil<string | null>(
        `document.querySelector('#local-plugin-island')?.dataset.hydrated === 'true' ? document.querySelector('#local-plugin-island').dataset.islandVersion : null`,
      );
      assertEquals(v2Version, 'v2');
      record(
        'P4',
        '#2655 content-hashing Build A -> Edit -> Build B',
        'PASS',
        `local-plugin chunk rotated (${hashComparison.localPluginA} -> ${hashComparison.localPluginB}); AppCounter & Defer hashes unchanged; browser hydrated v2`,
      );
    } finally {
      await prodSrvB.stop();
      await Deno.writeTextFile(localIslandPath, origLocalIsland);
    }

    // =========================================================================
    // SECTION 3: CSS Byte-Size & Cascade Layer Matrix + @fresh/plugin-vite CSS Pitfalls
    // =========================================================================
    section('3. CSS Byte-Size Comparison (C0 Bloated vs C1 Split) + @layer Cascade Proof + CSS Pitfalls');
    const cssBenchmarks: Array<{ mode: string; clientCssBytes: number; homeColdBytes: number; fsRouteBytes: number }> = [];

    for (const [modeName, importTarget] of [
      ['C0_bloated_global', "@import './bloated-global.css';\n"],
      ['C1_split_tailwind_shell', "@import './split-tailwind-shell.css';\n"],
      ['C1_prelude_app_wins', "@import './prelude-app-wins.css';\n"],
      ['C1_prelude_only', "@import './prelude-only.css';\n"],
      ['C1_prelude_plugin_wins_bug', "@import './prelude-plugin-wins.css';\n"],
    ] as const) {
      await Deno.writeTextFile(activeCssPath, importTarget);
      const b = await cleanFreshBuild();
      assertEquals(b.code, 0, `${modeName} build must succeed:\n${b.output}`);
      const m = await readClientManifest();
      const entryCssRel = m['fresh:client-entry']?.css?.[0];
      assert(entryCssRel, `${modeName} must emit client-entry CSS`);
      const diskBytes = (await Deno.stat(join(WEB_ROOT, '_fresh/client', entryCssRel))).size;
      if (modeName === 'C1_prelude_only') {
        const bareCssText = await Deno.readTextFile(join(WEB_ROOT, '_fresh/client', entryCssRel));
        console.log(`C1_prelude_only emitted CSS (${diskBytes} B): ${JSON.stringify(bareCssText)}`);
        assert(bareCssText.includes('@layer ns-plugins,ns-app'), 'Vite must preserve standalone @layer declaration');
      }

      const cssPort = reservePort();
      const srv = spawnBackground(
        ['deno', 'serve', '--no-lock', '-A', '--port', String(cssPort), '--host', '127.0.0.1', '_fresh/server.js'],
        WEB_ROOT,
      );
      try {
        const baseUrl = `http://127.0.0.1:${cssPort}`;
        await waitForHttp(`${baseUrl}/`, srv);
        const homeRes = await fetchHtml(`${baseUrl}/`);
        const fsRes = await fetchHtml(`${baseUrl}/plugin-fs`);
        const homeMeasured = await measureCssServedBytes(baseUrl, extractStylesheetHrefs(homeRes.body));
        const fsMeasured = await measureCssServedBytes(baseUrl, extractStylesheetHrefs(fsRes.body));
        console.log(`CSS [${modeName}] clientEntry=${diskBytes}B | cold /=${homeMeasured.totalBytes}B | /plugin-fs=${fsMeasured.totalBytes}B`);
        cssBenchmarks.push({
          mode: modeName,
          clientCssBytes: diskBytes,
          homeColdBytes: homeMeasured.totalBytes,
          fsRouteBytes: fsMeasured.totalBytes,
        });

        if (modeName === 'C1_prelude_plugin_wins_bug') {
          await browser.navigate(`${baseUrl}/plugin-fs`);
          await browser.waitUntil(`document.querySelector('#local-plugin-island')?.dataset.hydrated === 'true'`);
          const bugColor = await browser.cdp.evalJson<string>(
            `getComputedStyle(document.querySelector('#cascade-probe')).color`,
          );
          console.log(`Browser cascade with DRAFT order "@layer ns-app, ns-plugins;": ${bugColor}`);
          assertEquals(
            bugColor,
            'rgb(220, 38, 38)',
            'Draft RFC order "@layer ns-app, ns-plugins;" causes plugin red to beat app green!',
          );
        }
      } finally {
        await srv.stop();
      }
    }
    await Deno.writeTextFile(activeCssPath, "@import './prelude-app-wins.css';\n");

    const c0 = cssBenchmarks.find((x) => x.mode === 'C0_bloated_global')!;
    const c1Tw = cssBenchmarks.find((x) => x.mode === 'C1_split_tailwind_shell')!;
    const c1Min = cssBenchmarks.find((x) => x.mode === 'C1_prelude_app_wins')!;
    const c1Only = cssBenchmarks.find((x) => x.mode === 'C1_prelude_only')!;
    record(
      'C1',
      'CSS byte-size comparison (cold / vs /plugin-fs)',
      'PASS',
      `C0 bloated=${c0.homeColdBytes}B; C1 split+tailwind=${c1Tw.homeColdBytes}B (fs=${c1Tw.fsRouteBytes}B); C1 minimal shell+prelude=${c1Min.homeColdBytes}B (fs=${c1Min.fsRouteBytes}B); bare @layer prelude=${c1Only.homeColdBytes}B`,
    );
    record(
      'C2',
      'CSS @layer cascade precedence proof',
      'CAVEAT',
      `Draft "@layer ns-app, ns-plugins;" makes plugin beat app (rgb(220,38,38)); corrected "@layer ns-plugins, ns-app;" makes app beat plugin (rgb(22,163,74)) even when app CSS loads first`,
    );

    // Pitfall 3a: ?url query stripped by deno.ts
    const urlProbeRoute = join(WEB_ROOT, 'routes/_probe_url_css.tsx');
    try {
      await Deno.writeTextFile(
        urlProbeRoute,
        "import { define } from '@app/utils.ts';\nimport routeCssUrl from '@acme/local-plugin/route.css?url';\nexport default define.page(() => <div data-url={routeCssUrl} />);\n",
      );
      const urlFail = await cleanFreshBuild();
      console.log(`Pitfall 3a (?url CSS import in @fresh/plugin-vite@1.1.2) exit=${urlFail.code}`);
      console.log(urlFail.output.split('\n').slice(-8).join('\n'));
      assert(urlFail.code !== 0, 'Expected ?url CSS import to fail under @fresh/plugin-vite deno.ts');
      record(
        'C3',
        'CSS ?url asset import in Deno module',
        'FAIL',
        '@fresh/plugin-vite@1.1.2 deno.ts strips ?url query -> Rollup error: "default" is not exported by route.css',
      );
    } finally {
      await Deno.remove(urlProbeRoute).catch(() => {});
    }

    // Pitfall 3b: Two routes importing same CSS asset crash server_entry.ts:160 Deno.rename
    const sharedProbeRoute = join(WEB_ROOT, 'routes/_probe_shared_css.tsx');
    try {
      await Deno.writeTextFile(
        sharedProbeRoute,
        "import { define } from '@app/utils.ts';\nimport '@acme/local-plugin/route.css';\nexport default define.page(() => <div id='dup-css'>dup</div>);\n",
      );
      const sharedFail = await cleanFreshBuild();
      console.log(`Pitfall 3b (Shared SSR CSS asset across 2 routes) exit=${sharedFail.code}`);
      console.log(sharedFail.output.split('\n').slice(-10).join('\n'));
      assert(sharedFail.code !== 0 && sharedFail.output.includes('No such file or directory'));
      record(
        'C4',
        'Shared route CSS across >=2 SSR chunks (@fresh/plugin-vite@1.1.2)',
        'FAIL',
        'server_entry.ts:160 runs parallel non-deduplicated Deno.rename on manifest item.css -> ENOENT os error 2',
      );
    } finally {
      await Deno.remove(sharedProbeRoute).catch(() => {});
    }

    // =========================================================================
    // SECTION 4: Simulated External/JSR HTTP Island & Linked Workspace JSX Matrix
    // =========================================================================
    section('4. External/JSR-Style HTTP Island Matrix (Dev + Prod + Dedupe + cachedOnly + Linked JSX)');

    // 4a: Linked external un-pragmatized TSX without root deno.json JSX compilerOptions
    const noJsxRootCfg = JSON.parse(origRootDeno);
    delete noJsxRootCfg.imports;
    noJsxRootCfg.compilerOptions = {
      strict: true,
      lib: ['dom', 'dom.asynciterable', 'dom.iterable', 'deno.ns', 'deno.unstable'],
    };
    await Deno.writeTextFile(rootDenoPath, JSON.stringify(noJsxRootCfg, null, 2));
    try {
      const noJsxBuild = await cleanFreshBuild();
      assertEquals(noJsxBuild.code, 0, 'Vite build succeeds (client uses esbuild preact; SSR compiles DeferIsland with React.createElement)');
      const ssrEntryCode = await Deno.readTextFile(join(WEB_ROOT, '_fresh/server/server-entry.mjs'));
      assert(ssrEntryCode.includes('React.createElement("form"'), 'SSR emitted React.createElement for linked DeferIsland');
      const pNoJsx = reservePort();
      const sNoJsx = spawnBackground(
        ['deno', 'serve', '--no-lock', '-A', '--port', String(pNoJsx), '--host', '127.0.0.1', '_fresh/server.js'],
        WEB_ROOT,
      );
      try {
        await waitForHttp(`http://127.0.0.1:${pNoJsx}/`, sNoJsx);
        const res = await fetchHtml(`http://127.0.0.1:${pNoJsx}/islands`);
        console.log(`Linked DeferIsland without root JSX /islands status=${res.status}`);
        assertEquals(res.status, 500);
        assert(sNoJsx.logs().includes('React is not defined'), 'SSR fails with ReferenceError: React is not defined');
        record(
          'M1',
          'Linked external un-pragmatized TSX (@netscript/fresh/defer/island) without root JSX',
          'CAVEAT',
          'Client esbuild compiles to Preact, but @fresh/plugin-vite deno.ts SSR loader uses root deno.json -> React.createElement -> HTTP 500 unless root deno.json sets jsx+preact OR workspace member OR JSR pragma',
        );
      } finally {
        await sNoJsx.stop();
      }
    } finally {
      await Deno.writeTextFile(rootDenoPath, origRootDeno);
    }

    // Start ephemeral HTTP server simulating JSR remote registry
    const jsrSimRoot = await Deno.makeTempDir({ prefix: 'probe-b-jsr-' });
    const makeRemoteIsland = (signalsRange: string, withCss: boolean, nameId: string) => `/** @jsxRuntime automatic *//** @jsxImportSource npm:preact@^10.29.2 */
import { options } from 'npm:preact@^10.29.2';
import { useEffect, useState } from 'npm:preact@^10.29.2/hooks';
import { signal, useSignal } from '${signalsRange}';
${withCss ? "import './remote.css';" : ''}

const SHARED_SIGNAL_KEY = '__probeSharedSignalBus';
function getSharedSignal(): ReturnType<typeof signal<number>> {
  const g = globalThis as Record<string, unknown>;
  if (!g[SHARED_SIGNAL_KEY]) g[SHARED_SIGNAL_KEY] = signal(10);
  return g[SHARED_SIGNAL_KEY] as ReturnType<typeof signal<number>>;
}

export function RemoteJsrIsland({ initialCount = 10 }: { initialCount?: number }) {
  const g = globalThis as Record<string, unknown>;
  const map = (g.__probePreactOptions ??= new Set<unknown>()) as Set<unknown>;
  map.add(options);
  const sources = (g.__probePreactSources ??= []) as string[];
  if (!sources.includes('${nameId}')) sources.push('${nameId}');

  const [hydrated, setHydrated] = useState(false);
  const [count, setCount] = useState(initialCount);
  const sig = useSignal(initialCount);
  const sharedSig = getSharedSignal();
  useEffect(() => { setHydrated(true); }, []);
  return (
    <div
      id='${nameId}'
      class='${withCss ? 'remote-plugin-island' : ''}'
      data-hydrated={String(hydrated)}
      data-count={String(count)}
      data-shared-signal={String(sharedSig.value)}
    >
      <button
        id='${nameId}-btn'
        type='button'
        onClick={() => { setCount((c) => c + 1); sig.value += 1; sharedSig.value += 1; }}
      >
        ${nameId}: {count} / sig={sig.value} / shared={sharedSig.value}
      </button>
    </div>
  );
}
export default RemoteJsrIsland;
`;

    await Deno.writeTextFile(
      join(jsrSimRoot, 'remote.css'),
      '@layer ns-plugins {\n  .remote-plugin-island {\n    border: 2px solid rgb(59, 130, 246);\n    padding: 10px;\n  }\n}\n',
    );
    await Deno.writeTextFile(join(jsrSimRoot, 'island-aligned.tsx'), makeRemoteIsland('npm:@preact/signals@2.11.3', false, 'remote-jsr-aligned'));
    await Deno.writeTextFile(join(jsrSimRoot, 'island-with-css.tsx'), makeRemoteIsland('npm:@preact/signals@2.11.3', true, 'remote-jsr-css'));
    await Deno.writeTextFile(join(jsrSimRoot, 'island-mismatch.tsx'), makeRemoteIsland('npm:@preact/signals@^2.11.0', false, 'remote-jsr-mismatch'));
    await Deno.writeTextFile(join(jsrSimRoot, 'uncached-live.tsx'), makeRemoteIsland('npm:@preact/signals@2.11.3', false, 'remote-jsr-uncached'));

    const jsrPort = reservePort();
    const jsrSrv = Deno.serve(
      { hostname: '127.0.0.1', port: jsrPort, onListen: () => {} },
      async (req) => {
        const pathname = new URL(req.url).pathname.replace(/^\/+/, '');
        const filePath = join(jsrSimRoot, pathname);
        try {
          const data = await Deno.readFile(filePath);
          const ct = pathname.endsWith('.css')
            ? 'text/css; charset=utf-8'
            : 'application/typescript; charset=utf-8';
          return new Response(data, { status: 200, headers: { 'content-type': ct } });
        } catch {
          return new Response('Not Found', { status: 404 });
        }
      },
    );

    const remoteRoutePath = join(WEB_ROOT, 'routes/_probe_remote_islands.tsx');
    try {
      const baseHttp = `http://127.0.0.1:${jsrPort}`;
      const webDenoCfg = JSON.parse(origWebDeno);
      webDenoCfg.imports['@acme/remote-aligned'] = `${baseHttp}/island-aligned.tsx`;
      webDenoCfg.imports['@acme/remote-css'] = `${baseHttp}/island-with-css.tsx`;
      webDenoCfg.imports['@acme/remote-mismatch'] = `${baseHttp}/island-mismatch.tsx`;
      webDenoCfg.imports['@acme/remote-uncached'] = `${baseHttp}/uncached-live.tsx`;
      webDenoCfg.imports['@acme/remote-offline'] = 'http://127.0.0.1:9/offline.tsx';
      await Deno.writeTextFile(webDenoPath, JSON.stringify(webDenoCfg, null, 2));

      // 4b: Offline unreachable uncached remote specifier
      const offlineBuild = await cleanFreshBuild({ PROBE_EXTRA_ISLAND_SPECIFIERS: '@acme/remote-offline' });
      console.log(`4b Offline uncached remote exit=${offlineBuild.code}`);
      assert(offlineBuild.code !== 0 && offlineBuild.output.includes('Fetch failed'));
      record(
        'M2',
        'Offline/unreachable uncached HTTP remote specifier',
        'FAIL',
        `Fails in [deno] load hook with TypeError: Fetch failed`,
      );

      // 4c: Live uncached HTTP specifier EVEN WITH --cached-only (probe @deno/loader@0.4.0 behavior)
      await Deno.remove(join(WEB_ROOT, '_fresh'), { recursive: true }).catch(() => {});
      const coOut = await runCmd(
        ['deno', 'run', '--cached-only', '--no-lock', '-A', 'npm:vite', 'build'],
        WEB_ROOT,
        { PROBE_EXTRA_ISLAND_SPECIFIERS: '@acme/remote-uncached' },
      );
      console.log(`4c Uncached HTTP under deno run --cached-only exit=${coOut.code}`);
      const sawLiveDownload = coOut.output.includes('uncached-live.tsx');
      assertEquals(coOut.code, 0);
      record(
        'M3',
        'Uncached HTTP remote specifier under --cached-only (cachedOnly: true in deno.ts)',
        'CAVEAT',
        `Exit=${coOut.code}; @deno/loader@0.4.0 still performs live HTTP download despite cachedOnly:true & --cached-only (${sawLiveDownload ? 'observed Downloading uncached-live.tsx' : 'cached'}), failing only when offline/404`,
      );

      // 4d: Pre-cached JSR-style HTTP islands (aligned @preact/signals@2.11.3, with & without CSS) across PROD + DEV + CDP
      const cacheRes = await runCmd(
        [
          'deno',
          'cache',
          '--no-lock',
          `--allow-import=127.0.0.1:${jsrPort}`,
          `${baseHttp}/island-aligned.tsx`,
          `${baseHttp}/island-with-css.tsx`,
        ],
        WEB_ROOT,
      );
      assertEquals(cacheRes.code, 0, `deno cache remote JSR-style islands failed:\n${cacheRes.output}`);

      await Deno.writeTextFile(
        remoteRoutePath,
        `import { define } from '@app/utils.ts';
import AppCounter from '@app/islands/AppCounter.tsx';
import { LocalPluginIsland } from '@acme/local-plugin/island';
import RemoteAligned from '@acme/remote-aligned';
import RemoteCss from '@acme/remote-css';

export default define.page(function RemoteIslandsPage() {
  return (
    <section id='remote-islands-page'>
      <AppCounter initialCount={1} />
      <LocalPluginIsland initialCount={2} label='local-with-remote' />
      <RemoteAligned initialCount={10} />
      <RemoteCss initialCount={20} />
    </section>
  );
});
`,
      );

      const extraSpecs = '@acme/remote-aligned,@acme/remote-css';
      const remoteProdBuild = await cleanFreshBuild({ PROBE_EXTRA_ISLAND_SPECIFIERS: extraSpecs });
      assertEquals(remoteProdBuild.code, 0, `Prod build with remote JSR-sim islands failed:\n${remoteProdBuild.output}`);
      const remoteManifest = await readClientManifest();
      const remoteCssEntry = Object.values(remoteManifest).find((e) => e.src?.includes('island-with-css.tsx'));
      assert(remoteCssEntry?.css?.length, 'Remote HTTP island with CSS must emit manifest css array');
      const idRemote = await inspectClientRuntimeIdentityChunks();
      console.log('Prod remote aligned Preact/Signals chunks:', idRemote);
      assertEquals(idRemote.preactChunks.length, 1, 'Expected 1 single Preact chunk across app+local+defer+remote-aligned');
      assertEquals(idRemote.signalsChunks.length, 1, 'Expected 1 single @preact/signals chunk when version matches 2.11.3');

      const remoteProdPort = reservePort();
      const remoteProdSrv = spawnBackground(
        ['deno', 'serve', '--no-lock', '-A', '--port', String(remoteProdPort), '--host', '127.0.0.1', '_fresh/server.js'],
        WEB_ROOT,
      );
      try {
        const baseUrl = `http://127.0.0.1:${remoteProdPort}`;
        await waitForHttp(`${baseUrl}/_probe_remote_islands`, remoteProdSrv);
        const homeRemote = await fetchHtml(`${baseUrl}/`);
        assert(
          !homeRemote.body.includes('fresh-island__acme_remote_css'),
          'Remote island CSS must NOT leak onto cold /',
        );

        await browser.navigate(`${baseUrl}/_probe_remote_islands`);
        await browser.waitUntil(
          `document.querySelector('#host-app-island')?.dataset.hydrated === 'true' && document.querySelector('#local-plugin-island')?.dataset.hydrated === 'true' && document.querySelector('#remote-jsr-aligned')?.dataset.hydrated === 'true' && document.querySelector('#remote-jsr-css')?.dataset.hydrated === 'true'`,
        );
        const remoteRuntime = await browser.cdp.evalJson<{
          optSize: number;
          sources: string[];
          remoteBorder: string;
        }>(`(() => ({
          optSize: window.__probePreactOptions ? window.__probePreactOptions.size : -1,
          sources: window.__probePreactSources ?? [],
          remoteBorder: getComputedStyle(document.querySelector('#remote-jsr-css')).borderTopColor,
        }))()`);
        console.log('Prod remote JSR-sim browser identity:', remoteRuntime);
        assertEquals(remoteRuntime.optSize, 1);
        assertEquals(remoteRuntime.remoteBorder, 'rgb(59, 130, 246)');

        await browser.cdp.evalJson(`document.querySelector('#remote-jsr-aligned-btn').click()`);
        await browser.waitUntil(
          `document.querySelector('#host-app-island')?.dataset.sharedSignal === '11' && document.querySelector('#local-plugin-island')?.dataset.sharedSignal === '11' && document.querySelector('#remote-jsr-css')?.dataset.sharedSignal === '11'`,
        );
        assertEquals(browser.errors.length, 0);
        record(
          'M4',
          'Cached HTTP/JSR-style remote islands (TSX + CSS) in PROD + SSR + Hydration',
          'PASS',
          `1 preact chunk, 1 @preact/signals chunk; remote CSS isolated to /_probe_remote_islands; options.size===1; shared signal synced across Host + Local + Remote`,
        );
      } finally {
        await remoteProdSrv.stop();
      }

      // Also test cached remote JSR-sim islands in DEV mode
      const remoteDevPort = reservePort();
      const remoteDevSrv = spawnBackground(
        [
          'deno',
          'run',
          '--no-lock',
          '-A',
          'npm:vite',
          '--configLoader',
          'native',
          '--host',
          '127.0.0.1',
          '--port',
          String(remoteDevPort),
          '--strictPort',
        ],
        WEB_ROOT,
        { PROBE_EXTRA_ISLAND_SPECIFIERS: extraSpecs },
      );
      try {
        const devUrl = `http://127.0.0.1:${remoteDevPort}`;
        await waitForHttp(`${devUrl}/_probe_remote_islands`, remoteDevSrv);
        await browser.navigate(`${devUrl}/_probe_remote_islands`);
        await browser.waitUntil(
          `document.querySelector('#remote-jsr-aligned')?.dataset.hydrated === 'true' && document.querySelector('#remote-jsr-css')?.dataset.hydrated === 'true'`,
        );
        const devOptSize = await browser.cdp.evalJson<number>(
          `window.__probePreactOptions ? window.__probePreactOptions.size : -1`,
        );
        assertEquals(devOptSize, 1);
        record(
          'M5',
          'Cached HTTP/JSR-style remote islands in DEV (vite --configLoader native)',
          'PASS',
          `Dev SSR + hydration succeeded with options.size===1`,
        );
      } finally {
        await remoteDevSrv.stop();
      }

      // 4e: Version mismatch & --configLoader native probe (@preact/signals@^2.11.0 -> 2.11.4 vs host 2.11.3)
      await Deno.remove(remoteRoutePath).catch(() => {});
      await runCmd(
        ['deno', 'cache', '--no-lock', `--allow-import=127.0.0.1:${jsrPort}`, `${baseHttp}/island-mismatch.tsx`],
        WEB_ROOT,
      );
      const mismatchBuild = await cleanFreshBuild({ PROBE_EXTRA_ISLAND_SPECIFIERS: '@acme/remote-mismatch' });
      assertEquals(mismatchBuild.code, 0);
      const idMismatch = await inspectClientRuntimeIdentityChunks();
      console.log('Version-mismatch chunks (vite build, @preact/signals@^2.11.0 vs pinned 2.11.3):', idMismatch);

      const nativeMismatchBuild = await cleanFreshBuild({ PROBE_EXTRA_ISLAND_SPECIFIERS: '@acme/remote-mismatch' }, true);
      assertEquals(nativeMismatchBuild.code, 0);
      const idNativeMismatch = await inspectClientRuntimeIdentityChunks();
      console.log('Version-mismatch chunks (vite --configLoader native build):', idNativeMismatch);

      record(
        'M6',
        'Semver mismatch (@preact/signals@^2.11.0 -> 2.11.4 vs host exact pin 2.11.3)',
        idMismatch.signalsChunks.length > 1 || idNativeMismatch.signalsChunks.length > 1 ? 'CAVEAT' : 'PASS',
        `vite build: preact=${idMismatch.preactChunks.length}, signals=${idMismatch.signalsChunks.length}; vite --configLoader native build: preact=${idNativeMismatch.preactChunks.length}, signals=${idNativeMismatch.signalsChunks.length} (${idNativeMismatch.signalsChunks.map((c) => c.file).join(', ')})`,
      );
    } finally {
      await Deno.remove(remoteRoutePath).catch(() => {});
      await Deno.writeTextFile(webDenoPath, origWebDeno);
      await jsrSrv.shutdown();
      await Deno.remove(jsrSimRoot, { recursive: true }).catch(() => {});
    }

    // =========================================================================
    // SECTION 5: Dev Edit-Loop Probes (Baseline Dev, Route Edit, Island Edit, Route Add/Unlink, Vite Config Edit)
    // =========================================================================
    section('5. Dev Mode Baseline & Live Edit-Loop Probes');
    const devPort = reservePort();
    const devProc = spawnBackground(
      [
        'deno',
        'run',
        '--no-lock',
        '-A',
        'npm:vite',
        '--configLoader',
        'native',
        '--host',
        '127.0.0.1',
        '--port',
        String(devPort),
        '--strictPort',
      ],
      WEB_ROOT,
    );

    const tempRoutePath = join(WEB_ROOT, 'routes/_probe_temp_route.tsx');
    const extraIslandPath = join(LOCAL_PLUGIN_ROOT, 'extra-island.tsx');
    const extraRoutePath = join(WEB_ROOT, 'routes/_probe_extra_island_page.tsx');
    try {
      const devUrl = `http://127.0.0.1:${devPort}`;
      await waitForHttp(`${devUrl}/`, devProc);

      // Baseline Dev CDP hydration + Defer + @layer cascade
      await browser.navigate(`${devUrl}/islands`);
      await browser.waitUntil(
        `document.querySelector('#host-app-island')?.dataset.hydrated === 'true' && document.querySelector('#local-plugin-island')?.dataset.hydrated === 'true' && document.querySelector('#defer-target')?.dataset.deferState === 'loaded'`,
      );
      await browser.navigate(`${devUrl}/plugin-fs`);
      await browser.waitUntil(`document.querySelector('#local-plugin-island')?.dataset.hydrated === 'true'`);
      const devCascadeColor = await browser.cdp.evalJson<string>(
        `getComputedStyle(document.querySelector('#cascade-probe')).color`,
      );
      assertEquals(devCascadeColor, 'rgb(22, 163, 74)');
      record(
        'D1',
        'Dev mode baseline (SSR + hydration + Defer + @layer cascade)',
        'PASS',
        `Dev server hydrated AppCounter, LocalPluginIsland, DeferComponent; /plugin-fs cascade rgb(22, 163, 74)`,
      );

      // Edit-loop 5a: Edit plugin route module
      await Deno.writeTextFile(
        routeExplicitPath,
        origRouteExplicit.replace(
          'Mounted Plugin Route (explicit export const css)',
          'Mounted Plugin Route (DEV-EDITED)',
        ),
      );
      let sawEditedRoute = false;
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 250));
        const editedRouteRes = await fetchHtml(`${devUrl}/plugin-mounted-explicit`);
        if (editedRouteRes.body.includes('Mounted Plugin Route (DEV-EDITED)')) {
          sawEditedRoute = true;
          break;
        }
      }
      assert(sawEditedRoute, 'Edited plugin route must reflect in dev');
      await Deno.writeTextFile(routeExplicitPath, origRouteExplicit);
      record('D2', 'Dev edit-loop: edit plugin route module', 'PASS', 'SSR reflected edited heading without restart');

      // Edit-loop 5b: Edit plugin island module
      await Deno.writeTextFile(
        localIslandPath,
        origLocalIsland.replace("data-island-version='v1'", "data-island-version='dev-v2'"),
      );
      let devV2: string | null = null;
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 250));
        await browser.navigate(`${devUrl}/islands`);
        const v = await browser.cdp.evalJson<string | null>(
          `document.querySelector('#local-plugin-island')?.dataset.hydrated === 'true' ? document.querySelector('#local-plugin-island').dataset.islandVersion : null`,
        );
        if (v === 'dev-v2') {
          devV2 = v;
          break;
        }
      }
      assertEquals(devV2, 'dev-v2');
      await Deno.writeTextFile(localIslandPath, origLocalIsland);
      await new Promise((r) => setTimeout(r, 300));
      record('D3', 'Dev edit-loop: edit plugin island module', 'PASS', 'Browser hydrated updated dev-v2 island module cleanly');

      // Edit-loop 5c: Add a route file under routes/ -> observe server_snapshot.ts:112 islandSpecByName.clear()
      await Deno.writeTextFile(
        tempRoutePath,
        "import { define } from '@app/utils.ts';\nexport default define.page(() => <div id='probe-temp-route'>added-in-dev</div>);\n",
      );
      await new Promise((r) => setTimeout(r, 800));
      const tempRes = await fetchHtml(`${devUrl}/_probe_temp_route`);
      assertEquals(tempRes.status, 200);
      const islandsAfterAdd = await fetchHtml(`${devUrl}/islands`);
      const bootScriptAfterAdd = extractModuleScriptText(islandsAfterAdd.body);
      console.log('Dev /islands boot script AFTER adding route file:', bootScriptAfterAdd);
      const droppedExternalIslands = !bootScriptAfterAdd.includes('island_7') && !bootScriptAfterAdd.includes('DeferComponent');
      record(
        'D4',
        'Dev edit-loop: add/unlink fsRoute file with islandSpecifiers',
        droppedExternalIslands ? 'CAVEAT' : 'PASS',
        droppedExternalIslands
          ? `Upstream @fresh/plugin-vite@1.1.2 server_snapshot.ts:112 calls islandSpecByName.clear() on fsRoute add/unlink and only re-scans islands/, silently dropping external islandSpecifiers (@acme/local-plugin/island, @netscript/fresh/defer/island) from hydration until Vite restarts!`
          : 'External islandSpecifiers preserved after fsRoute add',
      );
      await Deno.remove(tempRoutePath).catch(() => {});
      await new Promise((r) => setTimeout(r, 500));

      // Edit-loop 5d: Edit vite.config.ts to register a brand new plugin island specifier
      await browser.navigate('about:blank');
      await Deno.writeTextFile(
        extraIslandPath,
        `import { useEffect, useState } from 'preact/hooks';
export default function ExtraPluginIsland() {
  const [ok, setOk] = useState(false);
  useEffect(() => setOk(true), []);
  return <div id='extra-plugin-island' data-hydrated={String(ok)}>extra-ok</div>;
}
`,
      );
      const localDeno = JSON.parse(origLocalPluginDeno);
      localDeno.exports['./extra-island'] = './extra-island.tsx';
      await Deno.writeTextFile(localPluginDenoPath, JSON.stringify(localDeno, null, 2));
      await Deno.writeTextFile(
        extraRoutePath,
        "import { define } from '@app/utils.ts';\nimport ExtraPluginIsland from '@acme/local-plugin/extra-island';\nexport default define.page(() => <ExtraPluginIsland />);\n",
      );
      await Deno.writeTextFile(
        viteConfigPath,
        origViteConfig.replace(
          "'@acme/local-plugin/island',",
          "'@acme/local-plugin/island',\n    '@acme/local-plugin/extra-island',",
        ),
      );
      // Poll until Vite finishes config reload & serves the newly registered island hydrated
      let extraHydrated = false;
      for (let attempt = 0; attempt < 30; attempt++) {
        await new Promise((r) => setTimeout(r, 400));
        try {
          const r = await fetchHtml(`${devUrl}/_probe_extra_island_page`);
          if (r.status === 200 && extractModuleScriptText(r.body).includes('boot(')) {
            await browser.navigate(`${devUrl}/_probe_extra_island_page`);
            const ok = await browser.cdp.evalJson<boolean>(
              `document.querySelector('#extra-plugin-island')?.dataset.hydrated === 'true'`,
            );
            if (ok) {
              extraHydrated = true;
              break;
            }
          }
        } catch {
          // server reloading config
        }
      }
      assert(extraHydrated, 'Editing vite.config.ts to add new plugin island specifier must restart and hydrate');
      record(
        'D5',
        'Dev edit-loop: add new plugin island specifier in vite.config.ts',
        'PASS',
        'Vite reloaded config and hydrated newly added @acme/local-plugin/extra-island cleanly',
      );
    } finally {
      await devProc.stop();
      await Deno.remove(tempRoutePath).catch(() => {});
      await Deno.remove(extraRoutePath).catch(() => {});
      await Deno.remove(extraIslandPath).catch(() => {});
      await Deno.writeTextFile(viteConfigPath, origViteConfig);
      await Deno.writeTextFile(localPluginDenoPath, origLocalPluginDeno);
      await Deno.writeTextFile(routeExplicitPath, origRouteExplicit);
    }

    // Restore clean baseline prod build before exiting
    await Deno.writeTextFile(activeCssPath, "@import './prelude-app-wins.css';\n");
    const finalBuild = await cleanFreshBuild();
    assertEquals(finalBuild.code, 0, 'Final clean baseline rebuild failed');

    section('FINAL MATRIX SUMMARY');
    for (const row of matrix) {
      console.log(`| ${row.id} | ${row.cell} | ${row.status} | ${row.evidence} |`);
    }
    console.log('\nCSS_BENCHMARKS_JSON=' + JSON.stringify(cssBenchmarks));
  } finally {
    await browser.close();
    await Deno.writeTextFile(activeCssPath, origActiveCss);
    await Deno.writeTextFile(localIslandPath, origLocalIsland);
    await Deno.writeTextFile(rootDenoPath, origRootDeno);
    await Deno.writeTextFile(webDenoPath, origWebDeno);
    await Deno.writeTextFile(viteConfigPath, origViteConfig);
    await Deno.writeTextFile(localPluginDenoPath, origLocalPluginDeno);
    await Deno.writeTextFile(routeExplicitPath, origRouteExplicit);
    if (FIXTURE_ROOT) {
      await Deno.remove(FIXTURE_ROOT, { recursive: true }).catch(() => {});
    }
  }
}

await main();
