/**
 * Container benchmark CLI (Linux, Xvfb + lavapipe). Same method as the
 * installable's `--bench` mode: see bench/runner.ts.
 *
 *   deno run -A bench/bench.ts --out=<json> [--runs=5] [--variants=gpuix,gpuix-run,webview,cef] [--parallel=1,4,8]
 */
import { type BenchVariant, runBench, summarize } from './runner.ts';

const args = new Map(Deno.args.map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || 'true'] as const;
}));
const out = args.get('out') ?? 'bench-results.json';

const ALL: BenchVariant[] = [
  { id: 'gpuix', label: 'GPUIX + Preact · deno compile', command: 'build/linux-x64/netscript-gpuix' },
  { id: 'gpuix-run', label: 'GPUIX + Preact · deno run (cached)', command: 'deno', args: ['run', '-A', '--cached-only', 'app/main.tsx'] },
  { id: 'webview', label: 'Deno Desktop · WebKitGTK webview', command: 'build/netscript-webview/netscript-webview', profileViaEnv: true },
  { id: 'cef', label: 'Deno Desktop · CEF (Chromium)', command: 'build/netscript-cef/netscript-cef', profileViaEnv: true },
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
