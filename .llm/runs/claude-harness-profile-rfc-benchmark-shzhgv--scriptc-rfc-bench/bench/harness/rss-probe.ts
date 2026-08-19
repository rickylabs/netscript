/**
 * Cold-spawn peak-RSS probe (S6): runs each subject's exact adapter command under
 * `/usr/bin/time -v` and records "Maximum resident set size". Exists because Deno gates
 * /proc reads behind --allow-all, so the sandboxed subject-A task cannot self-report VmHWM
 * (drift D-6). Direct spawn, labeled — matches the prior data point's methodology.
 *
 *   deno run --allow-all bench/harness/rss-probe.ts --spawns 30 --out results/raw/rss-probe.jsonl
 */

const RUN_DIR = new URL('../..', import.meta.url).pathname;
const BUILD = `${RUN_DIR}bench/tasks/build`;
const TASKS = `${RUN_DIR}bench/tasks`;
const N = '100000';
const SEED = '42';

type Probe = { id: string; cmd: string[] };

const PROBES: Probe[] = [
  {
    id: 'A-deno-sandboxed',
    cmd: [Deno.execPath(), 'run', '--allow-env=CORRELATION_ID', `${TASKS}/task-deno.ts`, N, SEED],
  },
  {
    // Production default when .permissions() is omitted (permission-flags.ts → --allow-all).
    id: 'A-deno-allow-all',
    cmd: [Deno.execPath(), 'run', '--allow-all', `${TASKS}/task-deno.ts`, N, SEED],
  },
  { id: 'B-scriptc', cmd: [`${BUILD}/task-scriptc-native`, N, SEED] },
  { id: 'D-rust', cmd: [`${BUILD}/task-rust-native`, N, SEED] },
];

function arg(name: string, fallback: string): string {
  const i = Deno.args.indexOf(`--${name}`);
  return i >= 0 && Deno.args[i + 1] ? Deno.args[i + 1] : fallback;
}

async function timeV(cmd: string[]): Promise<{ maxRssKb: number; wallMs: number }> {
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
  const m = err.match(/Maximum resident set size \(kbytes\): (\d+)/);
  if (!m) throw new Error('no RSS line in time -v output');
  return { maxRssKb: Number(m[1]), wallMs };
}

const spawns = Number(arg('spawns', '30'));
const outPath = `${RUN_DIR}${arg('out', 'results/raw/rss-probe.jsonl')}`;
const lines: string[] = [];
lines.push(JSON.stringify({ kind: 'meta', probe: 'cold-spawn-rss', spawns, n: Number(N), startedAt: new Date().toISOString() }));
for (const probe of PROBES) {
  for (let i = 0; i < spawns; i++) {
    const { maxRssKb, wallMs } = await timeV(probe.cmd);
    lines.push(JSON.stringify({ kind: 'rss', id: probe.id, seq: i, maxRssKb, wallMs }));
  }
  console.log(`${probe.id}: ${spawns} spawns done`);
}
await Deno.mkdir(outPath.substring(0, outPath.lastIndexOf('/')), { recursive: true });
await Deno.writeTextFile(outPath, lines.join('\n') + '\n');
console.log(`-> ${outPath}`);
