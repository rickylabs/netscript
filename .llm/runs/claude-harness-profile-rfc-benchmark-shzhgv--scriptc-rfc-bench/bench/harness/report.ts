/**
 * S8 report generator — reads every raw JSONL under results/raw/ plus environment.json and
 * emits results/results.md. All tables are computed here from raw samples; results.md contains
 * no hand-typed numbers (plan.md S8 gate). Percentiles are nearest-rank on sorted samples.
 *
 *   deno run --allow-read --allow-write bench/harness/report.ts
 */

const RUN_DIR = new URL('../..', import.meta.url).pathname;
const RAW = `${RUN_DIR}results/raw`;

type ExecRec = {
  kind: string;
  seq: number;
  warmup: boolean;
  enqueuedAtMs: number | null;
  completedAtMs: number | null;
  endToEndMs: number | null;
  executorWallMs: number | null;
  adapterDurationMs: number | null;
  exitCode: number | null;
  status: string;
  acc: number | null;
  vmHwmKb: number | null;
};
type SeriesMeta = {
  seriesId: string;
  subject: string;
  workload: string;
  mode: string;
  concurrency: number;
  measure: number;
};
type Series = { meta: SeriesMeta; execs: ExecRec[]; hostHwmKb: number | null; failures: number };

function pct(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank - 1))];
}
const f1 = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : 'n/a');
const f2 = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : 'n/a');

function stats(values: number[]): { p50: number; p95: number; p99: number; p999: number; mean: number } {
  const s = [...values].sort((a, b) => a - b);
  const mean = s.reduce((a, b) => a + b, 0) / (s.length || 1);
  return { p50: pct(s, 50), p95: pct(s, 95), p99: pct(s, 99), p999: pct(s, 99.9), mean };
}

async function loadSeries(): Promise<Series[]> {
  const out: Series[] = [];
  for await (const entry of Deno.readDir(RAW)) {
    if (!entry.name.endsWith('.jsonl') || entry.name.startsWith('smoke') ||
      entry.name.startsWith('boundary') || entry.name.startsWith('rss-probe')) continue;
    const lines = (await Deno.readTextFile(`${RAW}/${entry.name}`)).trim().split('\n').map((l) => JSON.parse(l));
    const meta = lines.find((l) => l.kind === 'meta') as SeriesMeta & { kind: string };
    const execs = lines.filter((l) => l.kind === 'exec') as ExecRec[];
    const rss = lines.filter((l) => l.kind === 'hostRss') as { vmHwmKb: number }[];
    const summary = lines.find((l) => l.kind === 'summary') as { failures: number } | undefined;
    out.push({
      meta,
      execs,
      hostHwmKb: rss.length ? Math.max(...rss.map((r) => r.vmHwmKb)) : null,
      failures: summary?.failures ?? NaN,
    });
  }
  return out.sort((a, b) => a.meta.seriesId.localeCompare(b.meta.seriesId));
}

function measured(s: Series): ExecRec[] {
  return s.execs.filter((e) => !e.warmup && e.status === 'completed');
}

function throughput(s: Series): number {
  const m = measured(s).filter((e) => e.enqueuedAtMs !== null && e.completedAtMs !== null);
  if (m.length < 2) return NaN;
  const t0 = Math.min(...m.map((e) => e.enqueuedAtMs as number));
  const t1 = Math.max(...m.map((e) => e.completedAtMs as number));
  return m.length / ((t1 - t0) / 1000);
}

function seriesRow(s: Series, field: (e: ExecRec) => number | null): string {
  const vals = measured(s).map(field).filter((v): v is number => v !== null && Number.isFinite(v));
  const st = stats(vals);
  return `${f1(st.p50)} | ${f1(st.p95)} | ${f1(st.p99)} | ${f1(st.p999)}`;
}

async function main(): Promise<void> {
  const env = JSON.parse(await Deno.readTextFile(`${RUN_DIR}results/environment.json`));
  const series = await loadSeries();
  const md: string[] = [];
  const w = (s: string) => md.push(s);

  w('# Benchmark results — scriptc task runtime vs polyglot baselines');
  w('');
  w(`Generated ${new Date().toISOString()} by \`bench/harness/report.ts\` from \`results/raw/*.jsonl\`.`);
  w('All numbers computed from raw samples; percentiles are nearest-rank. Series: warmup 20');
  w('discarded, measured completions only. See plan.md L1-L5 for locked methodology and');
  w('pre-registered verdict criteria; drift.md D-2/D-5 for hosting/backend substitutions.');
  w('');
  w('## Environment manifest');
  w('');
  w('| Pin | Value |');
  w('| --- | --- |');
  for (
    const k of ['os', 'kernel', 'cpuModel', 'cores', 'deno', 'scriptc', 'clang', 'rustc', 'node', 'netscriptWorkspace', 'queueProvider', 'hosting']
  ) w(`| ${k} | ${String(env[k])} |`);
  w('');

  for (const mode of ['queue', 'direct']) {
    w(`## ${mode === 'queue' ? 'Through-the-queue (end-to-end enqueue → completed)' : 'Direct executor.execute() (dispatch-tax isolation)'}`);
    w('');
    w('| Subject | Workload | c | n | fail | e2e p50 | p95 | p99 | p999 (ms) | exec-wall p50 | adapter-dur p50 | tasks/s |');
    w('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |');
    for (const s of series.filter((x) => x.meta.mode === mode)) {
      const m = measured(s);
      const e2e = stats(m.map((e) => e.endToEndMs).filter((v): v is number => v !== null));
      const ew = stats(m.map((e) => e.executorWallMs).filter((v): v is number => v !== null));
      const ad = stats(m.map((e) => e.adapterDurationMs).filter((v): v is number => v !== null));
      w(`| ${s.meta.subject} | ${s.meta.workload} | ${s.meta.concurrency} | ${m.length} | ${s.failures} | ${f1(e2e.p50)} | ${f1(e2e.p95)} | ${f1(e2e.p99)} | ${f1(e2e.p999)} | ${f1(ew.p50)} | ${f1(ad.p50)} | ${f1(throughput(s))} |`);
    }
    w('');
  }

  w('## Per-subprocess peak RSS (task self-report, VmHWM)');
  w('');
  w('| Subject | Workload | c | median vmHwm (KB) | samples |');
  w('| --- | --- | --- | --- | --- |');
  for (const s of series) {
    const vals = measured(s).map((e) => e.vmHwmKb).filter((v): v is number => v !== null);
    if (!vals.length) continue;
    const sorted = [...vals].sort((a, b) => a - b);
    w(`| ${s.meta.subject} | ${s.meta.workload} | ${s.meta.concurrency}/${s.meta.mode} | ${pct(sorted, 50)} | ${vals.length} |`);
  }
  w('| A-deno | (sandboxed — cannot self-report; see rss-probe below and drift D-6) | | | |');
  w('');

  // RSS probe
  try {
    const probeLines = (await Deno.readTextFile(`${RAW}/rss-probe.jsonl`)).trim().split('\n').map((l) => JSON.parse(l));
    const byId = new Map<string, { rss: number[]; wall: number[] }>();
    for (const l of probeLines.filter((x) => x.kind === 'rss')) {
      const e = byId.get(l.id) ?? { rss: [], wall: [] };
      e.rss.push(l.maxRssKb);
      e.wall.push(l.wallMs);
      byId.set(l.id, e);
    }
    w('## Cold-spawn probe (`/usr/bin/time -v`, direct spawn, 100k workload, 30 reps)');
    w('');
    w('| Command | max RSS median (KB) | max RSS p95 | wall p50 (ms) |');
    w('| --- | --- | --- | --- |');
    for (const [id, e] of byId) {
      const rs = [...e.rss].sort((a, b) => a - b);
      const ws = [...e.wall].sort((a, b) => a - b);
      w(`| ${id} | ${pct(rs, 50)} | ${pct(rs, 95)} | ${f1(pct(ws, 50))} |`);
    }
    w('');
  } catch { w('_rss-probe.jsonl missing_'); w(''); }

  // Boundary
  try {
    const bLines = (await Deno.readTextFile(`${RAW}/boundary.jsonl`)).trim().split('\n').map((l) => JSON.parse(l));
    const groups = new Map<string, number[]>();
    for (const l of bLines.filter((x) => x.kind === 'boundary' && !x.warmup)) {
      const key = `${l.id} | ${l.workload} | ${l.phase}`;
      groups.set(key, [...(groups.get(key) ?? []), l.wallMs]);
    }
    w('## Execution-boundary microbenchmarks (in-process, labeled DIRECT — not queue numbers)');
    w('');
    w('| Boundary | Workload | Phase | n | p50 (ms) | p95 | p99 |');
    w('| --- | --- | --- | --- | --- | --- | --- |');
    for (const [key, vals] of groups) {
      const st = stats(vals);
      w(`| ${key} | ${vals.length} | ${f2(st.p50)} | ${f2(st.p95)} | ${f2(st.p99)} |`);
    }
    w('');
  } catch { w('_boundary.jsonl missing_'); w(''); }

  // Host RSS
  w('## Worker-host RSS (harness process VmHWM per series, KB)');
  w('');
  w('| Series | host peak RSS (KB) |');
  w('| --- | --- |');
  for (const s of series) if (s.hostHwmKb) w(`| ${s.meta.seriesId} | ${s.hostHwmKb} |`);
  w('');

  // Pre-registered verdict computation (plan.md L5)
  const find = (subject: string, workload: string, mode: string, c: number) =>
    series.find((s) =>
      s.meta.subject === subject && s.meta.workload === workload && s.meta.mode === mode &&
      s.meta.concurrency === c
    );
  const a = find('A-deno', 'short', 'queue', 1);
  const b = find('B-scriptc', 'short', 'queue', 1);
  const cS = find('C-executable-control', 'short', 'queue', 1);
  w('## Pre-registered verdict inputs (plan.md L5)');
  w('');
  if (a && b) {
    const p50 = (s: Series) => stats(measured(s).map((e) => e.endToEndMs).filter((v): v is number => v !== null)).p50;
    const ap50 = p50(a), bp50 = p50(b);
    const improvement = ((ap50 - bp50) / ap50) * 100;
    w(`- Queue e2e p50, short, c=1: A-deno = ${f1(ap50)} ms; B-scriptc = ${f1(bp50)} ms; **improvement = ${f1(improvement)}%** (criterion: <20% → recipe/customAdapters; ≥20% + RSS ratio ≥5× → built-in defensible)`);
    if (cS) w(`- Sanity B≈C: C p50 = ${f1(p50(cS))} ms (same binary; delta is run-to-run noise floor)`);
    const aw = stats(measured(a).map((e) => e.executorWallMs).filter((v): v is number => v !== null)).p50;
    const bw = stats(measured(b).map((e) => e.executorWallMs).filter((v): v is number => v !== null)).p50;
    w(`- Executor-wall p50, short, c=1: A = ${f1(aw)} ms; B = ${f1(bw)} ms (runtime-only delta = ${f1(aw - bw)} ms)`);
  } else {
    w('_missing series for verdict computation_');
  }
  w('');

  await Deno.writeTextFile(`${RUN_DIR}results/results.md`, md.join('\n') + '\n');
  console.log(`wrote results/results.md (${md.length} lines, ${series.length} series)`);
}

await main();
