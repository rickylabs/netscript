/**
 * Cold-spawn peak-RSS probe (S6): runs each subject's exact adapter command under
 * `/usr/bin/time -v` and records "Maximum resident set size". Exists because Deno gates
 * /proc reads behind --allow-all, so the sandboxed subject-A task cannot self-report VmHWM
 * (drift D-6). Direct spawn, labeled — matches the prior data point's methodology.
 *
 *   deno run --allow-all bench/harness/rss-probe.ts --spawns 30 --out results/raw/rss-probe.jsonl
 */

const RUN_DIR = new URL('../..', import.meta.url).pathname;
const TASKS = `${RUN_DIR}bench/tasks`;
const N = '100000';
const SEED = '42';

type Probe = { id: string; cmd: string[] };

const PROBES: Probe[] = [
  { id: 'G1-go', cmd: [`${TASKS}/go-lcg/build/task-go`, N, SEED] },
  { id: 'PY-python3', cmd: ['python3', `${TASKS}/task.py`, N, SEED] },
];

function arg(name: string, fallback: string): string {
  const i = Deno.args.indexOf(`--${name}`);
  return i >= 0 && Deno.args[i + 1] ? Deno.args[i + 1] : fallback;
}

type TimeVSample = {
  maxRssKb: number;
  wallMs: number;
  userCpuS: number;
  sysCpuS: number;
  volCtxSw: number;
  involCtxSw: number;
};

async function timeV(cmd: string[]): Promise<TimeVSample> {
  const t0 = performance.now();
  const c = new Deno.Command('/usr/bin/time', {
    args: ['-v', ...cmd],
    stdout: 'null',
    stderr: 'piped',
  });
  const { code, stderr } = await c.output();
  const wallMs = performance.now() - t0;
  const err = new TextDecoder().decode(stderr);
  if (code !== 0) throw new Error(`probe exited ${code}: ${err.slice(0, 200)}`);
  const num = (re: RegExp) => {
    const m = err.match(re);
    if (!m) throw new Error(`missing field ${re} in time -v output`);
    return Number(m[1]);
  };
  return {
    maxRssKb: num(/Maximum resident set size \(kbytes\): (\d+)/),
    wallMs,
    userCpuS: num(/User time \(seconds\): ([\d.]+)/),
    sysCpuS: num(/System time \(seconds\): ([\d.]+)/),
    volCtxSw: num(/Voluntary context switches: (\d+)/),
    involCtxSw: num(/Involuntary context switches: (\d+)/),
  };
}

const spawns = Number(arg('spawns', '30'));
const outPath = `${RUN_DIR}${arg('out', 'results/raw/rss-probe.jsonl')}`;
const lines: string[] = [];
lines.push(JSON.stringify({ kind: 'meta', probe: 'cold-spawn-rss', spawns, n: Number(N), startedAt: new Date().toISOString() }));
for (const probe of PROBES) {
  for (let i = 0; i < spawns; i++) {
    const s = await timeV(probe.cmd);
    lines.push(JSON.stringify({ kind: 'rss', id: probe.id, seq: i, ...s }));
  }
  console.log(`${probe.id}: ${spawns} spawns done`);
}
await Deno.mkdir(outPath.substring(0, outPath.lastIndexOf('/')), { recursive: true });
await Deno.writeTextFile(outPath, lines.join('\n') + '\n');
console.log(`-> ${outPath}`);
