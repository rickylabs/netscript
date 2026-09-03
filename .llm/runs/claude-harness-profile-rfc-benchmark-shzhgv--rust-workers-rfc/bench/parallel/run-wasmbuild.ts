/** P5 — wasmbuild-generated module: correctness + warm per-call wall (long workload). */
import { lcg_run } from './wasmbuild-lcg/lib/rs_lib.js';
const EXPECTED = 777999478n;
const rows: string[] = [];
rows.push(JSON.stringify({ kind: 'meta', bench: 'wasmbuild', startedAt: new Date().toISOString() }));
for (let rep = 0; rep < 320; rep++) {
  const t0 = performance.now();
  const acc = lcg_run(10_000_000n, 42n);
  const wallMs = performance.now() - t0;
  if (acc !== EXPECTED) throw new Error(`acc ${acc} != ${EXPECTED}`);
  rows.push(JSON.stringify({ kind: 'par', id: 'P5-wasmbuild', k: 1, rep, warmup: rep < 20, wallMs, jobs: 1 }));
}
const out = new URL('../../results/raw/wasmbuild.jsonl', import.meta.url).pathname;
await Deno.writeTextFile(out, rows.join('\n') + '\n');
const walls = rows.slice(1).map((r) => JSON.parse(r)).filter((r) => !r.warmup).map((r) => r.wallMs).sort((a, b) => a - b);
console.log(`P5 wasmbuild long: p50=${walls[Math.floor(walls.length / 2)].toFixed(1)}ms n=${walls.length} -> ${out}`);
