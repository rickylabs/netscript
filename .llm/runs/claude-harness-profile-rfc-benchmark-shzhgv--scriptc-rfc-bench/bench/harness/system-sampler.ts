/**
 * System-wide CPU/RAM sampler (owner review follow-up on PR #1678): runs alongside a series and
 * samples, at a fixed interval,
 *   - total CPU utilization across all cores (/proc/stat busy-jiffy delta),
 *   - aggregate RSS of live task subprocesses (matched by /proc/<pid>/cmdline signature),
 *   - count of live task subprocesses,
 *   - system used memory (MemTotal - MemAvailable).
 *
 * Runs until SIGTERM/SIGINT, then flushes JSONL (one meta, N samples, one summary with
 * cpu-jiffy totals so per-task CPU-seconds can be derived).
 *
 *   deno run --allow-read --allow-write bench/harness/system-sampler.ts \
 *     --out results/raw/sys_<series>.jsonl --interval 100 \
 *     --match task-scriptc-native --match task-rust-native --match task-deno.ts
 */

const RUN_DIR = new URL('../..', import.meta.url).pathname;

function args(name: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < Deno.args.length - 1; i++) {
    if (Deno.args[i] === `--${name}`) out.push(Deno.args[i + 1]);
  }
  return out;
}

const outPath = `${RUN_DIR}${args('out')[0] ?? 'results/raw/sys.jsonl'}`;
const intervalMs = Number(args('interval')[0] ?? '100');
const matches = args('match');
if (matches.length === 0) throw new Error('need at least one --match');

type CpuTimes = { busy: number; total: number };
function readCpu(): CpuTimes {
  const line = Deno.readTextFileSync('/proc/stat').split('\n')[0];
  const f = line.trim().split(/\s+/).slice(1).map(Number);
  const idle = f[3] + (f[4] ?? 0); // idle + iowait
  const total = f.reduce((a, b) => a + b, 0);
  return { busy: total - idle, total };
}

function readUsedMemKb(): number {
  const m = Deno.readTextFileSync('/proc/meminfo');
  const total = Number(m.match(/MemTotal:\s*(\d+)/)?.[1] ?? 0);
  const avail = Number(m.match(/MemAvailable:\s*(\d+)/)?.[1] ?? 0);
  return total - avail;
}

function taskProcs(): { count: number; rssKb: number } {
  let count = 0;
  let rssKb = 0;
  for (const entry of Deno.readDirSync('/proc')) {
    if (!/^\d+$/.test(entry.name)) continue;
    if (Number(entry.name) === Deno.pid) continue; // never match the sampler itself
    try {
      const cmdline = Deno.readTextFileSync(`/proc/${entry.name}/cmdline`).replaceAll('\0', ' ');
      // Skip the sampler/harness processes: their argv contains the match strings.
      if (cmdline.includes('system-sampler.ts') || cmdline.includes('run-series.ts')) continue;
      if (!matches.some((m) => cmdline.includes(m))) continue;
      const status = Deno.readTextFileSync(`/proc/${entry.name}/status`);
      const rss = Number(status.match(/VmRSS:\s*(\d+)/)?.[1] ?? 0);
      count++;
      rssKb += rss;
    } catch { /* process exited between readdir and read */ }
  }
  return { count, rssKb };
}

const lines: string[] = [];
lines.push(JSON.stringify({
  kind: 'meta',
  sampler: 'system',
  intervalMs,
  matches,
  cores: navigator.hardwareConcurrency,
  startedAt: new Date().toISOString(),
}));

const cpu0 = readCpu();
let prev = cpu0;
let running = true;
const flush = () => {
  const cpu1 = readCpu();
  lines.push(JSON.stringify({
    kind: 'summary',
    busyJiffies: cpu1.busy - cpu0.busy,
    totalJiffies: cpu1.total - cpu0.total,
    clkTck: 100, // Linux USER_HZ
    finishedAt: new Date().toISOString(),
  }));
  Deno.mkdirSync(outPath.substring(0, outPath.lastIndexOf('/')), { recursive: true });
  Deno.writeTextFileSync(outPath, lines.join('\n') + '\n');
  console.log(`sampler -> ${outPath} (${lines.length - 2} samples)`);
  running = false;
};
Deno.addSignalListener('SIGTERM', flush);
Deno.addSignalListener('SIGINT', flush);

while (running) {
  await new Promise((r) => setTimeout(r, intervalMs));
  if (!running) break;
  const cpu = readCpu();
  const procs = taskProcs();
  const dTotal = cpu.total - prev.total;
  const cpuPct = dTotal > 0 ? ((cpu.busy - prev.busy) / dTotal) * 100 : 0;
  prev = cpu;
  lines.push(JSON.stringify({
    kind: 'sample',
    tMs: performance.now(),
    cpuPct: Math.round(cpuPct * 10) / 10,
    taskProcCount: procs.count,
    taskProcRssKb: procs.rssKb,
    systemUsedKb: readUsedMemKb(),
  }));
}
Deno.exit(0);
