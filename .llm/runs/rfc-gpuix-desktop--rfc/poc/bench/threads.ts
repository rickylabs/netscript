/**
 * Per-thread CPU breakdown (Linux) for one host under a given event rate:
 * separates software-rasterizer threads (lavapipe/llvmpipe, which a real GPU
 * replaces) from JS, runtime and web-engine threads.
 *
 *   deno run -A bench/threads.ts --variant=gpuix|webview|cef --rate=20 --out=<json>
 */
const args = new Map(Deno.args.map((arg) => {
  const [key, ...rest] = arg.replace(/^--/, '').split('=');
  return [key, rest.join('=') || 'true'] as const;
}));
const variant = args.get('variant') ?? 'gpuix';
const rate = Number(args.get('rate') ?? 20);
const windowMs = Number(args.get('window') ?? 10_000);
const commands: Record<string, { cmd: string; env?: boolean }> = {
  gpuix: { cmd: 'build/linux-x64/netscript-gpuix' },
  webview: { cmd: 'build/netscript-webview/netscript-webview', env: true },
  cef: { cmd: 'build/netscript-cef/netscript-cef', env: true },
};
const { cmd, env: viaEnv } = commands[variant];
const profile = await Deno.makeTempDir();
const env: Record<string, string> = { NETSCRIPT_BENCH: '1', NETSCRIPT_BENCH_RATE: String(rate) };
if (viaEnv) env.NETSCRIPT_BENCH_PROFILE = profile;
const child = new Deno.Command(cmd, { args: viaEnv ? [] : [`--profile=${profile}`], env, stdout: 'piped', stderr: 'null' }).spawn();
const reader = child.stdout.getReader();
let buffer = '';
while (!buffer.includes('NETSCRIPT_READY')) {
  const { value, done } = await reader.read();
  if (done) throw new Error('exited');
  buffer += new TextDecoder().decode(value);
}
void (async () => {
  while (!(await reader.read()).done) { /* drain */ }
})();
await new Promise((resolve) => setTimeout(resolve, 2_000));

function descendants(root: number): number[] {
  const parents = new Map<number, number[]>();
  for (const entry of Deno.readDirSync('/proc')) {
    if (!/^\d+$/.test(entry.name)) continue;
    try {
      const stat = Deno.readTextFileSync(`/proc/${entry.name}/stat`);
      const ppid = Number(stat.slice(stat.lastIndexOf(')') + 2).split(' ')[1]);
      parents.set(ppid, [...(parents.get(ppid) ?? []), Number(entry.name)]);
    } catch { /* gone */ }
  }
  const out: number[] = [];
  const walk = (pid: number) => {
    out.push(pid);
    for (const next of parents.get(pid) ?? []) walk(next);
  };
  walk(root);
  return out;
}

function threads(): Map<string, { process: string; thread: string; ticks: number }> {
  const map = new Map<string, { process: string; thread: string; ticks: number }>();
  for (const pid of descendants(child.pid)) {
    let process = '?';
    try {
      process = Deno.readTextFileSync(`/proc/${pid}/comm`).trim();
    } catch { continue; }
    try {
      for (const task of Deno.readDirSync(`/proc/${pid}/task`)) {
        try {
          const stat = Deno.readTextFileSync(`/proc/${pid}/task/${task.name}/stat`);
          const name = stat.slice(stat.indexOf('(') + 1, stat.lastIndexOf(')'));
          const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
          map.set(`${pid}/${task.name}`, { process, thread: name, ticks: Number(fields[11]) + Number(fields[12]) });
        } catch { /* gone */ }
      }
    } catch { /* gone */ }
  }
  return map;
}

function category(process: string, thread: string): string {
  const name = thread.toLowerCase();
  if (/llvmpipe|lavapipe|lp:|lvp/.test(name)) return 'software rasterizer (lavapipe/llvmpipe)';
  if (/webkitwebproc|webprocess/.test(process.toLowerCase()) || process.toLowerCase().startsWith('webkitwebpro')) return `web content process: ${name.replace(/[:\d-]+$/, '') || 'main'}`;
  if (/webkitnetwork/.test(process.toLowerCase())) return 'web network process';
  if (name === process.toLowerCase() || name.startsWith('netscript')) return 'host main thread (JS + platform loop)';
  if (/tokio|worker|deno/.test(name)) return 'runtime workers (tokio/deno)';
  if (/v8|isolate/.test(name)) return 'V8 helper threads';
  return `other: ${name.replace(/[:\d-]+$/, '')}`;
}

const before = threads();
await new Promise((resolve) => setTimeout(resolve, windowMs));
const after = threads();
const totals = new Map<string, number>();
const raw = new Map<string, number>();
for (const [key, entry] of after) {
  const delta = entry.ticks - (before.get(key)?.ticks ?? 0);
  if (delta <= 0) continue;
  const bucket = category(entry.process, entry.thread);
  totals.set(bucket, (totals.get(bucket) ?? 0) + delta);
  const rawKey = `${entry.process} › ${entry.thread.replace(/[:\d-]+$/, '')}`;
  raw.set(rawKey, (raw.get(rawKey) ?? 0) + delta);
}
const topThreads = [...raw].map(([thread, ticks]) => ({ thread, cpuPct: Math.round((ticks / 100) / (windowMs / 1000) * 1000) / 10 }))
  .sort((a, b) => b.cpuPct - a.cpuPct).slice(0, 14);
const breakdown = [...totals].map(([bucket, ticks]) => ({ bucket, cpuPct: Math.round((ticks / 100) / (windowMs / 1000) * 1000) / 10 }))
  .sort((a, b) => b.cpuPct - a.cpuPct);
const result = { variant, rate, windowMs, totalCpuPct: Math.round(breakdown.reduce((sum, entry) => sum + entry.cpuPct, 0) * 10) / 10, breakdown, topThreads };
console.log(JSON.stringify(result, null, 2));
if (args.get('out')) {
  const out = args.get('out')!;
  let existing: unknown[] = [];
  try {
    existing = JSON.parse(await Deno.readTextFile(out));
  } catch { /* new */ }
  await Deno.writeTextFile(out, JSON.stringify([...existing, result], null, 2));
}
for (const pid of descendants(child.pid).reverse()) {
  try {
    Deno.kill(pid, 'SIGKILL');
  } catch { /* gone */ }
}
Deno.exit(0);
