/**
 * Laptop benchmark: the same method as the container run (bench/runner.ts),
 * on real hardware. Writes a JSON + Markdown report to the home directory.
 */
import { type BenchVariant, runBench, summarize } from '../bench/runner.ts';

const exe = Deno.execPath();
const separator = Deno.build.os === 'windows' ? '\\' : '/';
const dir = exe.slice(0, exe.lastIndexOf(separator));
const compareArg = Deno.args.find((arg) => arg.startsWith('--compare='))?.slice('--compare='.length);
const runs = Number(Deno.args.find((arg) => arg.startsWith('--runs='))?.slice('--runs='.length) ?? 5);
const only = Deno.args.find((arg) => arg.startsWith('--variants='))?.slice('--variants='.length).split(',');
const parallel = Deno.args.find((arg) => arg.startsWith('--parallel='))?.slice('--parallel='.length).split(',').map(Number);

const candidates = [
  compareArg,
  `${dir}${separator}webview${separator}NetScript-Webview${Deno.build.os === 'windows' ? '.exe' : ''}`,
  `${dir}${separator}webview${separator}netscript-webview`,
].filter((value): value is string => Boolean(value));
const webview = candidates.find((path) => {
  try {
    return Deno.statSync(path).isFile;
  } catch {
    return false;
  }
});

// The real NetScript graph ships next to the executable (`stack/`) in real-stack builds.
const stackDir = `${dir}${separator}stack`;
let hasStack = false;
try {
  hasStack = Deno.statSync(`${stackDir}${separator}workspace`).isDirectory;
} catch { /* embedded-only build */ }
const REAL = { NETSCRIPT_STACK: 'real', NETSCRIPT_STACK_DIR: stackDir };
const NATIVE = { NETSCRIPT_UI: 'native' };
const EMBEDDED = { NETSCRIPT_STACK: 'embedded' };

const all: BenchVariant[] = [
  { id: 'gpuix', label: 'GPUIX + Preact (this build)', command: exe, env: EMBEDDED },
  { id: 'gpuix-native', label: 'GPUIX-first + Preact', command: exe, env: { ...EMBEDDED, ...NATIVE } },
];
if (webview) {
  all.push({ id: 'webview', label: 'Deno Desktop webview (same app)', command: webview, profileViaEnv: true, env: EMBEDDED });
  all.push({ id: 'webview-budget', label: 'Deno Desktop webview · 250 ms budget', command: webview, profileViaEnv: true, env: { ...EMBEDDED, NETSCRIPT_LIVE_BUDGET_MS: '250' } });
}
if (hasStack) {
  all.push({ id: 'gpuix-real', label: 'GPUIX + Preact · real stack', command: exe, env: REAL });
  all.push({ id: 'gpuix-native-real', label: 'GPUIX-first · real stack', command: exe, env: { ...REAL, ...NATIVE } });
  if (webview) {
    all.push({ id: 'webview-real', label: 'Deno Desktop webview · real stack', command: webview, profileViaEnv: true, env: REAL });
    all.push({ id: 'webview-budget-real', label: 'Deno Desktop webview · 250 ms budget · real stack', command: webview, profileViaEnv: true, env: { ...REAL, NETSCRIPT_LIVE_BUDGET_MS: '250' } });
  }
}
const variants = only ? all.filter((variant) => only.includes(variant.id)) : all;

const home = Deno.env.get('USERPROFILE') ?? Deno.env.get('HOME') ?? '.';
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const base = `${home}${separator}netscript-bench-${Deno.build.os}-${stamp}`;
console.log(`NetScript desktop benchmark · ${Deno.build.os}-${Deno.build.arch} · ${navigator.hardwareConcurrency} CPUs`);
console.log(webview ? `Comparing with ${webview}` : 'No webview build found next to this executable: measuring GPUIX only (pass --compare=<path>).');
console.log(`Variants: ${variants.map((variant) => variant.id).join(', ')}${hasStack ? ' (real NetScript stack found)' : ''}`);
console.log('Windows will open and close repeatedly for a few minutes. Do not use the machine meanwhile.\n');

const report = await runBench({
  variants,
  runs,
  ...(parallel ? { parallel } : {}),
  log: (line) => console.log(line),
  onPartial: (partial) => Deno.writeTextFile(`${base}.json`, JSON.stringify(partial, null, 2)),
});
await Deno.writeTextFile(`${base}.json`, JSON.stringify(report, null, 2));
const summary = summarize(report);
await Deno.writeTextFile(`${base}.md`, `# NetScript desktop benchmark\n\n${summary}\n\n\`\`\`json\n${JSON.stringify(report.environment, null, 2)}\n\`\`\`\n`);
console.log(`\n${summary}\n\nReport: ${base}.json\n        ${base}.md`);
Deno.exit(0);
