/**
 * S7 execution-boundary microbenchmarks — labeled DIRECT measurements, never presented as
 * queue numbers (plan.md L2). Same MINSTD workload as subjects A-D.
 *
 *   G  in-process JS        — the floor: plain function call in the host isolate
 *   E  in-process WASM      — cold (instantiate+call) and warm (call only), Rust wasm32 core
 *   F  in-process FFI       — Deno.dlopen cdylib, cold (open+call+close) and warm (call only)
 *
 *   deno run --allow-all --unstable-ffi bench/boundary/run-boundary.ts \
 *     --warmup 20 --measure 300 --out results/raw/boundary.jsonl
 */

const RUN_DIR = new URL('../..', import.meta.url).pathname;
const BUILD = `${RUN_DIR}bench/tasks/build`;
const SEED = 42n;
const WORKLOADS = { short: 100_000n, long: 10_000_000n } as const;
type WorkloadId = keyof typeof WORKLOADS;
const EXPECTED = { short: 846234426n, long: 777999478n } as const;

function lcgJs(n: number, seed: number): number {
  let state = seed;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    state = (state * 48271) % 2147483647;
    acc = (acc + state) % 1000000007;
  }
  return acc;
}

function arg(name: string, fallback: string): string {
  const i = Deno.args.indexOf(`--${name}`);
  return i >= 0 && Deno.args[i + 1] ? Deno.args[i + 1] : fallback;
}

const warmup = Number(arg('warmup', '20'));
const measure = Number(arg('measure', '300'));
const outPath = `${RUN_DIR}${arg('out', 'results/raw/boundary.jsonl')}`;
const total = warmup + measure;
const lines: string[] = [];
const emit = (o: Record<string, unknown>) => lines.push(JSON.stringify(o));
emit({ kind: 'meta', bench: 'boundary', warmup, measure, startedAt: new Date().toISOString() });

const wasmBytes = await Deno.readFile(`${BUILD}/lcg.wasm`);
const wasmModule = await WebAssembly.compile(wasmBytes);

type FfiLib = Deno.DynamicLibrary<{ lcg_run: { parameters: ['u64', 'u64']; result: 'u64' } }>;
const openLib = (): FfiLib =>
  Deno.dlopen(`${BUILD}/liblcg.so`, {
    lcg_run: { parameters: ['u64', 'u64'], result: 'u64' },
  } as const);

function record(id: string, workload: WorkloadId, phase: string, seq: number, wallMs: number, acc: bigint | number) {
  const ok = BigInt(acc) === EXPECTED[workload];
  emit({ kind: 'boundary', id, workload, phase, seq, warmup: seq < warmup, wallMs, acc: Number(acc), ok });
  if (!ok) throw new Error(`${id}/${workload}/${phase}: acc=${acc} != ${EXPECTED[workload]}`);
}

for (const workload of ['short', 'long'] as WorkloadId[]) {
  const nBig = WORKLOADS[workload];
  const nNum = Number(nBig);

  // G — in-process JS floor
  for (let seq = 0; seq < total; seq++) {
    const t0 = performance.now();
    const acc = lcgJs(nNum, 42);
    record('G-inprocess-js', workload, 'warm', seq, performance.now() - t0, acc);
  }

  // E — WASM warm (instance reused; per-call boundary cost)
  {
    const instance = await WebAssembly.instantiate(wasmModule, {});
    const lcgRun = instance.exports.lcg_run as (n: bigint, seed: bigint) => bigint;
    for (let seq = 0; seq < total; seq++) {
      const t0 = performance.now();
      const acc = lcgRun(nBig, SEED);
      record('E-wasm', workload, 'warm', seq, performance.now() - t0, acc);
    }
  }
  // E — WASM cold (instantiate per rep — the per-task-equivalent cost; short workload only
  // for long series time sanity, but instantiate cost is workload-independent)
  for (let seq = 0; seq < total; seq++) {
    const t0 = performance.now();
    const instance = await WebAssembly.instantiate(wasmModule, {});
    const lcgRun = instance.exports.lcg_run as (n: bigint, seed: bigint) => bigint;
    const acc = lcgRun(nBig, SEED);
    record('E-wasm', workload, 'cold', seq, performance.now() - t0, acc);
    if (workload === 'long' && seq >= warmup + 49) break; // 50 measured is plenty; wall-time cap
  }

  // F — FFI warm
  {
    const lib = openLib();
    for (let seq = 0; seq < total; seq++) {
      const t0 = performance.now();
      const acc = lib.symbols.lcg_run(nBig, SEED) as bigint;
      record('F-ffi', workload, 'warm', seq, performance.now() - t0, acc);
    }
    lib.close();
  }
  // F — FFI cold (dlopen+call+close per rep)
  for (let seq = 0; seq < total; seq++) {
    const t0 = performance.now();
    const lib = openLib();
    const acc = lib.symbols.lcg_run(nBig, SEED) as bigint;
    lib.close();
    record('F-ffi', workload, 'cold', seq, performance.now() - t0, acc);
    if (workload === 'long' && seq >= warmup + 49) break;
  }
  console.log(`${workload} done`);
}

emit({ kind: 'summary', finishedAt: new Date().toISOString() });
await Deno.mkdir(outPath.substring(0, outPath.lastIndexOf('/')), { recursive: true });
await Deno.writeTextFile(outPath, lines.join('\n') + '\n');
console.log(`-> ${outPath}`);
