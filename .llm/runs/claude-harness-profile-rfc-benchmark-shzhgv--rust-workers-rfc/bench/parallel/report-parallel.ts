/**
 * T3/T4 report — emits results/results-parallel.md from results/raw/{parallel,wasmbuild}.jsonl.
 * All numbers computed here from raw samples (house rule: no hand-typed figures).
 */

const RUN_DIR = new URL('../..', import.meta.url).pathname;
const RAW = `${RUN_DIR}results/raw`;

type Row = {
  id: string;
  k: number;
  rep: number;
  wallMs: number;
  jitterMs?: number;
  jobs: number;
  rssDeltaKb?: number;
  warmup?: boolean;
};

function med(v: number[]): number {
  const s = [...v].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)] ?? NaN;
}
const f1 = (v: number) => (Number.isFinite(v) ? v.toFixed(1) : 'n/a');

const rows: Row[] = [];
for (const f of ['parallel.jsonl', 'wasmbuild.jsonl']) {
  for (const line of (await Deno.readTextFile(`${RAW}/${f}`)).trim().split('\n')) {
    const r = JSON.parse(line);
    if (r.kind === 'par' && !r.warmup) rows.push(r);
  }
}

const md: string[] = [];
md.push('# Parallelism suite results — rust-workers RFC (run 2)');
md.push('');
md.push(`Generated ${new Date().toISOString()} by \`report-parallel.ts\` from raw JSONL.`);
md.push('Workload: 10M-iteration MINSTD (identical to run 1); 4-core host, run-1 environment');
md.push('manifest applies. 10 reps/config (P5: 300). Correctness asserted on every rep.');
md.push('');
md.push('| Shape | k | wall p50 (ms) | jobs/s | event-loop jitter p50 / max (ms) | RSS Δ p50 (MB) |');
md.push('| --- | --- | --- | --- | --- | --- |');
for (const id of ['P1-seq-js', 'P2-web-worker', 'P3-ffi-split', 'P4-ffi-nonblocking', 'P5-wasmbuild']) {
  for (const k of [1, 2, 4, 8]) {
    const rs = rows.filter((r) => r.id === id && r.k === k);
    if (!rs.length) continue;
    const wall = med(rs.map((r) => r.wallMs));
    const jobsPerSec = rs[0].jobs / (wall / 1000);
    const jit = rs.some((r) => r.jitterMs !== undefined)
      ? `${f1(med(rs.map((r) => r.jitterMs as number)))} / ${f1(Math.max(...rs.map((r) => r.jitterMs as number)))}`
      : 'n/a';
    const rss = rs.some((r) => r.rssDeltaKb !== undefined)
      ? f1(med(rs.map((r) => (r.rssDeltaKb as number) / 1024)))
      : '—';
    md.push(`| ${id} | ${k} | ${f1(wall)} | ${f1(jobsPerSec)} | ${jit} | ${rss} |`);
  }
}
md.push('');
md.push('Legend: P1 sequential JS in the main isolate (today\'s job-handler model); P2 K Web');
md.push('Workers, one job each; P3 one job split across K std::threads via blocking FFI; P4 K');
md.push('jobs as concurrent `nonblocking` FFI calls; P5 wasmbuild-generated module (single');
md.push('call, k=1). Jitter = max delay of a 5 ms heartbeat on the main isolate during the');
md.push('config — the event-loop liveness measure plan.md L5 gates on.');
md.push('');

await Deno.writeTextFile(`${RUN_DIR}results/results-parallel.md`, md.join('\n') + '\n');
console.log(`wrote results/results-parallel.md (${rows.length} samples)`);
