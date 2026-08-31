/** H4 — Bootsharp module in Deno: boot + correctness + warm per-call wall (long workload). */
import bootsharp, { Lcg } from './bin/bootsharp/index.mjs';
const EXPECTED = 777999478;
const t0 = performance.now();
await bootsharp.boot();
const bootMs = performance.now() - t0;
const rows: string[] = [];
rows.push(JSON.stringify({ kind: 'meta', bench: 'bootsharp', bootMs, startedAt: new Date().toISOString() }));
for (let rep = 0; rep < 120; rep++) {
  const t1 = performance.now();
  const acc = Lcg.run(10_000_000, 42);
  const wallMs = performance.now() - t1;
  if (acc !== EXPECTED) throw new Error(`acc ${acc} != ${EXPECTED}`);
  rows.push(JSON.stringify({ kind: 'par', id: 'H4-bootsharp', k: 1, rep, warmup: rep < 20, wallMs, jobs: 1 }));
}
const out = new URL('../../results/raw/bootsharp.jsonl', import.meta.url).pathname;
await Deno.writeTextFile(out, rows.join('\n') + '\n');
const walls = rows.slice(1).map((r) => JSON.parse(r)).filter((r) => !r.warmup).map((r) => r.wallMs).sort((a, b) => a - b);
console.log(`H4 bootsharp long: boot=${bootMs.toFixed(0)}ms p50=${walls[Math.floor(walls.length / 2)].toFixed(1)}ms n=${walls.length}`);
