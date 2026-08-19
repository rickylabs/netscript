/**
 * Run-4 boundary — G2 official js/wasm target in Deno (wasm_exec.js glue) and G3 Go c-shared
 * via Deno.dlopen. Labeled DIRECT. Long workload (10M), correctness asserted per rep.
 *
 *   deno run --allow-read --allow-write --allow-ffi bench/harness/run-boundary-go.ts
 */

const RUN_DIR = new URL('../..', import.meta.url).pathname;
const BUILD = `${RUN_DIR}bench/tasks/go-lcg/build`;
const EXPECTED = 777999478;
const N = 10_000_000;
const SEED = 42;
const WARMUP = 20;
const MEASURE = 120;

const lines: string[] = [];
const emit = (o: Record<string, unknown>) => lines.push(JSON.stringify(o));
emit({ kind: 'meta', bench: 'go-boundary', startedAt: new Date().toISOString() });

// --- G2: official js/wasm + wasm_exec.js ---
// wasm_exec.js defines globalThis.Go (classic script; import it via side-effect eval).
const glue = await Deno.readTextFile(`${BUILD}/wasm_exec.js`);
new Function(glue)(); // installs globalThis.Go
// deno-lint-ignore no-explicit-any
const GoCtor = (globalThis as any).Go;
const go = new GoCtor();
const wasmBytes = await Deno.readFile(`${BUILD}/lcg-js.wasm`);
const t0 = performance.now();
const { instance } = await WebAssembly.instantiate(wasmBytes, go.importObject);
go.run(instance); // main() registers lcgRun then parks on select{}
await new Promise((r) => setTimeout(r, 50)); // let registration land
const bootMs = performance.now() - t0;
// deno-lint-ignore no-explicit-any
const lcgRun = (globalThis as any).lcgRun as (n: number, seed: number) => number;
if (typeof lcgRun !== 'function') throw new Error('lcgRun not registered by Go wasm');
for (let rep = 0; rep < WARMUP + MEASURE; rep++) {
  const t1 = performance.now();
  const acc = lcgRun(N, SEED);
  const wallMs = performance.now() - t1;
  if (acc !== EXPECTED) throw new Error(`G2 acc ${acc} != ${EXPECTED}`);
  emit({ kind: 'par', id: 'G2-go-jswasm', k: 1, rep, warmup: rep < WARMUP, wallMs, bootMs, jobs: 1 });
}
console.log(`G2 js/wasm boot=${bootMs.toFixed(0)}ms done`);

// --- G3: c-shared via Deno.dlopen ---
const lib = Deno.dlopen(`${BUILD}/liblcg-go.so`, {
  LcgRun: { parameters: ['u64', 'u64'], result: 'u64' },
} as const);
for (let rep = 0; rep < WARMUP + MEASURE; rep++) {
  const t1 = performance.now();
  const acc = Number(lib.symbols.LcgRun(BigInt(N), BigInt(SEED)) as bigint);
  const wallMs = performance.now() - t1;
  if (acc !== EXPECTED) throw new Error(`G3 acc ${acc} != ${EXPECTED}`);
  emit({ kind: 'par', id: 'G3-go-cshared-ffi', k: 1, rep, warmup: rep < WARMUP, wallMs, jobs: 1 });
}
lib.close();
console.log('G3 c-shared done');

emit({ kind: 'summary', finishedAt: new Date().toISOString() });
await Deno.writeTextFile(`${RUN_DIR}results/raw/go-boundary.jsonl`, lines.join('\n') + '\n');
console.log('-> results/raw/go-boundary.jsonl');
Deno.exit(0); // Go wasm runtime parks on select{}; exit explicitly
