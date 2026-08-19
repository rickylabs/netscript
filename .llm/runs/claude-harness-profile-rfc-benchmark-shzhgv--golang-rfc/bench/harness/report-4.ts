/**
 * Run-3 report — emits results/results-go.md from results/raw/*.jsonl (series + rss-probe +
 * bootsharp). All numbers computed from raw samples; nearest-rank percentiles (house rule).
 */

const RUN_DIR = new URL('../..', import.meta.url).pathname;
const RAW = `${RUN_DIR}results/raw`;

function pct(sorted: number[], p: number): number {
  if (!sorted.length) return NaN;
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))];
}
const f1 = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : 'n/a');

type Exec = {
  kind: string;
  warmup: boolean;
  endToEndMs: number | null;
  executorWallMs: number | null;
  status: string;
  vmHwmKb: number | null;
};

const md: string[] = [];
md.push('# Benchmark results — Go task runtime paths (run 4)');
md.push('');
md.push(`Generated ${new Date().toISOString()} by \`report-4.ts\` from \`results/raw/*.jsonl\`.`);
md.push('Series: warmup 20 discarded, 300 measured. G1 through the ExecutableRuntimeAdapter (the');
md.push('recipe seam Go uses — no go TaskType exists). Run-1 manifest applies.');
md.push('');
md.push('## Series (queue = enqueue→completed through the production dispatch path)');
md.push('');
md.push('| Subject | Workload | Mode | c | n | fail | e2e p50 | p95 (ms) | exec-wall p50 | vmHwm med (KB) |');
md.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
const seriesFiles: string[] = [];
for await (const e of Deno.readDir(RAW)) {
  if (e.name.endsWith('.jsonl') && !e.name.startsWith('smoke') && !e.name.startsWith('rss-probe') && !e.name.startsWith('go-boundary')) seriesFiles.push(e.name);
}
for (const f of seriesFiles.sort()) {
  const lines = (await Deno.readTextFile(`${RAW}/${f}`)).trim().split('\n').map((l) => JSON.parse(l));
  const meta = lines.find((l) => l.kind === 'meta');
  const summary = lines.find((l) => l.kind === 'summary');
  const ex = (lines.filter((l) => l.kind === 'exec') as Exec[]).filter((x) => !x.warmup && x.status === 'completed');
  const e2e = ex.map((x) => x.endToEndMs).filter((v): v is number => v !== null).sort((a, b) => a - b);
  const ew = ex.map((x) => x.executorWallMs).filter((v): v is number => v !== null).sort((a, b) => a - b);
  const hwm = ex.map((x) => x.vmHwmKb).filter((v): v is number => v !== null).sort((a, b) => a - b);
  md.push(`| ${meta.subject} | ${meta.workload} | ${meta.mode} | ${meta.concurrency} | ${ex.length} | ${summary?.failures ?? '?'} | ${f1(pct(e2e, 50))} | ${f1(pct(e2e, 95))} | ${f1(pct(ew, 50))} | ${hwm.length ? pct(hwm, 50) : 'n/a'} |`);
}
md.push('');

// rss-probe
try {
  const lines = (await Deno.readTextFile(`${RAW}/rss-probe.jsonl`)).trim().split('\n').map((l) => JSON.parse(l));
  const byId = new Map<string, { rss: number[]; wall: number[]; cpu: number[] }>();
  for (const l of lines.filter((x) => x.kind === 'rss')) {
    const e = byId.get(l.id) ?? { rss: [], wall: [], cpu: [] };
    e.rss.push(l.maxRssKb);
    e.wall.push(l.wallMs);
    if (typeof l.userCpuS === 'number') e.cpu.push((l.userCpuS + l.sysCpuS) * 1000);
    byId.set(l.id, e);
  }
  md.push('## Cold-spawn probe (`/usr/bin/time -v`, 100k workload, 30 reps)');
  md.push('');
  md.push('| Command | max RSS med (KB) | wall p50 (ms) | CPU p50 (user+sys, ms) |');
  md.push('| --- | --- | --- | --- |');
  for (const [id, e] of byId) {
    const rs = [...e.rss].sort((a, b) => a - b);
    const ws = [...e.wall].sort((a, b) => a - b);
    const cs = [...e.cpu].sort((a, b) => a - b);
    md.push(`| ${id} | ${pct(rs, 50)} | ${f1(pct(ws, 50))} | ${cs.length ? f1(pct(cs, 50)) : 'n/a'} |`);
  }
  md.push('');
} catch { md.push('_rss-probe missing_'); md.push(''); }

// bootsharp
try {
  const lines = (await Deno.readTextFile(`${RAW}/go-boundary.jsonl`)).trim().split('\n').map((l) => JSON.parse(l));
  md.push('## Boundary — G2 official js/wasm (wasm_exec.js) + G3 c-shared FFI in Deno (DIRECT)');
  md.push('');
  md.push('| Boundary | long-call p50 (ms) | p95 | n | boot (ms) |');
  md.push('| --- | --- | --- | --- | --- |');
  for (const id of ['G2-go-jswasm', 'G3-go-cshared-ffi']) {
    const rows = lines.filter((l) => l.kind === 'par' && l.id === id && !l.warmup);
    const walls = rows.map((l) => l.wallMs).sort((a: number, b: number) => a - b);
    const boot = rows.find((l) => typeof l.bootMs === 'number')?.bootMs;
    md.push(`| ${id} | ${f1(pct(walls, 50))} | ${f1(pct(walls, 95))} | ${walls.length} | ${boot !== undefined ? f1(boot) : '—'} |`);
  }
  md.push('');
} catch { md.push('_bootsharp.jsonl missing_'); md.push(''); }

await Deno.writeTextFile(`${RUN_DIR}results/results-go.md`, md.join('\n') + '\n');
console.log('wrote results/results-go.md');
