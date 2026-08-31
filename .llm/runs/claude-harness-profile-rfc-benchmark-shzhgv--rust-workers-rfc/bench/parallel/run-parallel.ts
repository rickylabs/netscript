/**
 * T3 parallelism suite — labeled DIRECT measurements for the rust-workers RFC.
 *
 * Two parallelism shapes, each at K ∈ {1,2,4,8} on a 4-core host, long workload (10M MINSTD):
 *
 *   P1  sequential JS baseline (single isolate, K jobs run back-to-back)
 *   P2  Web Worker fan-out (K isolates, one job each) — isolate startup + RSS measured
 *   P3  FFI within-job split (`lcg_run_parallel(n, seed, K)` — std::thread, blocking call)
 *   P4  FFI nonblocking across-jobs (K concurrent `nonblocking` calls, one job each)
 *        + event-loop liveness: a 5 ms heartbeat runs during every config; max delay recorded.
 *
 * Correctness: per-config expected values computed by a TS mirror of the Rust split;
 * every measured rep asserts its acc. Output: results/raw/parallel.jsonl.
 *
 *   deno run --allow-all bench/parallel/run-parallel.ts --reps 10 --out results/raw/parallel.jsonl
 */

const RUN_DIR = new URL('../..', import.meta.url).pathname;
const LIB = `${RUN_DIR}bench/parallel/rust-lcg-par/target/release/liblcgpar.so`;
const WORKER_URL = new URL('./worker-lcg.ts', import.meta.url).href;

const N = 10_000_000n;
const SEED = 42n;
const KS = [1, 2, 4, 8];

function lcgJs(n: number, seed: number): number {
  let state = seed;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    state = (state * 48271) % 2147483647;
    acc = (acc + state) % 1000000007;
  }
  return acc;
}

/** TS mirror of lib.rs lcg_run_parallel splitting (per-thread seed+k, remainder spread). */
function expectedParallel(n: bigint, seed: bigint, threads: number): bigint {
  const t = BigInt(Math.max(1, threads));
  const per = n / t;
  const rem = n % t;
  let acc = 0n;
  for (let k = 0n; k < t; k++) {
    const chunk = per + (k < rem ? 1n : 0n);
    acc = (acc + BigInt(lcgJs(Number(chunk), Number(seed + k)))) % 1000000007n;
  }
  return acc;
}

const EXPECTED_SINGLE = BigInt(lcgJs(Number(N), Number(SEED)));

function arg(name: string, fallback: string): string {
  const i = Deno.args.indexOf(`--${name}`);
  return i >= 0 && Deno.args[i + 1] ? Deno.args[i + 1] : fallback;
}

const reps = Number(arg('reps', '10'));
const outPath = `${RUN_DIR}${arg('out', 'results/raw/parallel.jsonl')}`;
const lines: string[] = [];
const emit = (o: Record<string, unknown>) => lines.push(JSON.stringify(o));

function rssKb(): number {
  const m = Deno.readTextFileSync('/proc/self/status').match(/VmRSS:\s*(\d+)/);
  return Number(m?.[1] ?? 0);
}

/** 5 ms heartbeat; returns stop() → max observed gap over the window (event-loop liveness). */
function heartbeat(): () => number {
  let last = performance.now();
  let maxGap = 0;
  const id = setInterval(() => {
    const now = performance.now();
    maxGap = Math.max(maxGap, now - last - 5);
    last = now;
  }, 5);
  return () => {
    clearInterval(id);
    return Math.round(maxGap * 100) / 100;
  };
}

/** Let the starved heartbeat callback fire once before reading its max gap. */
async function settleStop(stop: () => number): Promise<number> {
  await new Promise((r) => setTimeout(r, 15));
  return stop();
}

const lib = Deno.dlopen(LIB, {
  lcg_run: { parameters: ['u64', 'u64'], result: 'u64' },
  lcg_run_parallel: { parameters: ['u64', 'u64', 'u64'], result: 'u64' },
  lcg_run_nb: { name: 'lcg_run', parameters: ['u64', 'u64'], result: 'u64', nonblocking: true },
} as const);

emit({
  kind: 'meta',
  bench: 'parallel',
  n: Number(N),
  seed: Number(SEED),
  ks: KS,
  reps,
  cores: navigator.hardwareConcurrency,
  startedAt: new Date().toISOString(),
});

for (const k of KS) {
  // P1 — sequential JS: k jobs back-to-back in the main isolate.
  for (let rep = 0; rep < reps; rep++) {
    const stop = heartbeat();
    const t0 = performance.now();
    for (let j = 0; j < k; j++) {
      const acc = BigInt(lcgJs(Number(N), Number(SEED)));
      if (acc !== EXPECTED_SINGLE) throw new Error('P1 acc mismatch');
    }
    const wallMs = performance.now() - t0;
    emit({ kind: 'par', id: 'P1-seq-js', k, rep, wallMs, jitterMs: await settleStop(stop), jobs: k });
  }

  // P2 — Web Worker fan-out: k isolates, one job each (cold: spawn + run + terminate).
  for (let rep = 0; rep < reps; rep++) {
    const rss0 = rssKb();
    const stop = heartbeat();
    const t0 = performance.now();
    const spawnedAt: number[] = [];
    const results = await Promise.all(
      Array.from({ length: k }, () =>
        new Promise<{ acc: number; readyMs: number }>((resolve, reject) => {
          const ts = performance.now();
          const w = new Worker(WORKER_URL, { type: 'module' });
          w.onmessage = (e) => {
            resolve({ acc: e.data.acc, readyMs: ts });
            w.terminate();
          };
          w.onerror = (e) => reject(e);
          w.postMessage({ n: Number(N), seed: Number(SEED) });
          spawnedAt.push(ts);
        })),
    );
    const wallMs = performance.now() - t0;
    const rssPeak = rssKb();
    for (const r of results) {
      if (BigInt(r.acc) !== EXPECTED_SINGLE) throw new Error('P2 acc mismatch');
    }
    emit({
      kind: 'par',
      id: 'P2-web-worker',
      k,
      rep,
      wallMs,
      jitterMs: await settleStop(stop),
      jobs: k,
      rssDeltaKb: rssPeak - rss0,
    });
  }

  // P3 — FFI within-job split: ONE job's n iterations across k threads (blocking call).
  const expectedK = expectedParallel(N, SEED, k);
  for (let rep = 0; rep < reps; rep++) {
    const stop = heartbeat();
    const t0 = performance.now();
    const acc = lib.symbols.lcg_run_parallel(N, SEED, BigInt(k)) as bigint;
    const wallMs = performance.now() - t0;
    if (acc !== expectedK) throw new Error(`P3 acc mismatch k=${k}: ${acc} != ${expectedK}`);
    emit({ kind: 'par', id: 'P3-ffi-split', k, rep, wallMs, jitterMs: await settleStop(stop), jobs: 1 });
  }

  // P4 — FFI nonblocking across-jobs: k concurrent jobs, each a full n on the blocking pool.
  for (let rep = 0; rep < reps; rep++) {
    const stop = heartbeat();
    const t0 = performance.now();
    const accs = await Promise.all(
      Array.from({ length: k }, () => lib.symbols.lcg_run_nb(N, SEED) as Promise<bigint>),
    );
    const wallMs = performance.now() - t0;
    for (const acc of accs) {
      if (acc !== EXPECTED_SINGLE) throw new Error('P4 acc mismatch');
    }
    emit({ kind: 'par', id: 'P4-ffi-nonblocking', k, rep, wallMs, jitterMs: await settleStop(stop), jobs: k });
  }
  console.log(`k=${k} done`);
}

lib.close();
emit({ kind: 'summary', finishedAt: new Date().toISOString() });
await Deno.mkdir(outPath.substring(0, outPath.lastIndexOf('/')), { recursive: true });
await Deno.writeTextFile(outPath, lines.join('\n') + '\n');
console.log(`-> ${outPath}`);
