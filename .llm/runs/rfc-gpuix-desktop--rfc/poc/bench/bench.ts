/**
 * Container benchmark CLI (Linux, Xvfb + lavapipe). Same method as the
 * installable's `--bench` mode: see bench/runner.ts.
 *
 *   deno run -A bench/bench.ts --out=<json> [--runs=5] [--variants=gpuix,gpuix-run,webview,cef,gpuix-real,webview-real] [--parallel=1,4,8]
 */
import { type BenchVariant, runBench, summarize } from './runner.ts';

const args = new Map(Deno.args.map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || 'true'] as const;
}));
const out = args.get('out') ?? 'bench-results.json';

const REAL = { NETSCRIPT_STACK: 'real', NETSCRIPT_STACK_DIR: `${Deno.cwd()}/build/stack-linux-x64` };
const EMBEDDED = { NETSCRIPT_STACK: 'embedded' };
const ALL: BenchVariant[] = [
  { id: 'gpuix', label: 'GPUIX + Preact · deno compile', command: 'build/linux-x64/netscript-gpuix', env: EMBEDDED },
  { id: 'gpuix-run', label: 'GPUIX + Preact · deno run (cached)', command: 'deno', args: ['run', '-A', '--cached-only', 'app/main.tsx'] },
  { id: 'webview', label: 'Deno Desktop · WebKitGTK webview', command: 'build/netscript-webview/netscript-webview', profileViaEnv: true, env: EMBEDDED },
  { id: 'cef', label: 'Deno Desktop · CEF (Chromium)', command: 'build/netscript-cef/netscript-cef', profileViaEnv: true },
  // Real NetScript graph (Garnet, SQLite, users, workers, sagas, triggers, streams) supervised by the app.
  { id: 'gpuix-real', label: 'GPUIX + Preact · real stack', command: 'build/linux-x64/netscript-gpuix', env: REAL },
  { id: 'webview-real', label: 'Deno Desktop · WebKitGTK · real stack', command: 'build/netscript-webview/netscript-webview', profileViaEnv: true, env: REAL },
  // GPUIX-first variant: native virtual lists, live-update budget, adaptive frame pump.
  { id: 'gpuix-native', label: 'GPUIX-first + Preact', command: 'build/linux-x64/netscript-gpuix', env: { ...EMBEDDED, NETSCRIPT_UI: 'native' } },
  { id: 'gpuix-native-real', label: 'GPUIX-first · real stack', command: 'build/linux-x64/netscript-gpuix', env: { ...REAL, NETSCRIPT_UI: 'native' } },
  // Multi-window: extra windows in the same app (GPUIX: same process and heap; webview: extra pages).
  { id: 'gpuix-w2', label: 'GPUIX · 2 windows', command: 'build/linux-x64/netscript-gpuix', env: { ...EMBEDDED, NETSCRIPT_WINDOWS: '2' } },
  { id: 'gpuix-w3', label: 'GPUIX · 3 windows', command: 'build/linux-x64/netscript-gpuix', env: { ...EMBEDDED, NETSCRIPT_WINDOWS: '3' } },
  { id: 'webview-w2', label: 'Deno Desktop · WebKitGTK · 2 windows', command: 'build/netscript-webview/netscript-webview', profileViaEnv: true, env: { ...EMBEDDED, NETSCRIPT_WINDOWS: '2' } },
  { id: 'webview-w3', label: 'Deno Desktop · WebKitGTK · 3 windows', command: 'build/netscript-webview/netscript-webview', profileViaEnv: true, env: { ...EMBEDDED, NETSCRIPT_WINDOWS: '3' } },
  // Controls: the budget alone on GPUIX (no adaptive pump), and on the webview
  { id: 'gpuix-budget', label: 'GPUIX + Preact · 250 ms budget only', command: 'build/linux-x64/netscript-gpuix', env: { ...EMBEDDED, NETSCRIPT_LIVE_BUDGET_MS: '250' } },
  // Control: the webview with the same 250 ms live-update budget (the renderer-agnostic part of GPUIX-first).
  { id: 'webview-budget', label: 'Deno Desktop · WebKitGTK · 250 ms budget', command: 'build/netscript-webview/netscript-webview', profileViaEnv: true, env: { ...EMBEDDED, NETSCRIPT_LIVE_BUDGET_MS: '250' } },
  { id: 'webview-budget-real', label: 'Deno Desktop · WebKitGTK · 250 ms budget · real stack', command: 'build/netscript-webview/netscript-webview', profileViaEnv: true, env: { ...REAL, NETSCRIPT_LIVE_BUDGET_MS: '250' } },
];
const wanted = (args.get('variants') ?? 'gpuix,webview,cef').split(',');
const variants = ALL.filter((variant) => wanted.includes(variant.id));

const report = await runBench({
  variants,
  runs: Number(args.get('runs') ?? 5),
  parallel: (args.get('parallel') ?? '1,4,8').split(',').map(Number),
  onPartial: (partial) => Deno.writeTextFile(out, JSON.stringify({
    ...partial,
    environment: {
      ...partial.environment,
      renderer: 'Xvfb 1440x900x24 + Mesa lavapipe (software Vulkan); WebKitGTK/CEF software compositing',
      note: 'No GPU here: CPU numbers include software rasterization for every host. Run `NetScript --bench` on real hardware.',
    },
  }, null, 2)),
});
console.error(`\n${summarize(report)}\n\nwrote ${out}`);
