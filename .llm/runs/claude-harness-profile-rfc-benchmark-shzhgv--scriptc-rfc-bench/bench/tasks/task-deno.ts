/**
 * Subject A — `deno` TaskType entrypoint.
 *
 * MINSTD LCG workload (plan.md L3). Contract per polyglot-tasks doc: input via argv + env,
 * result as the last JSON line of stdout. The LCG core is duplicated verbatim across all
 * variants; `verify-workloads.ts` gates behavioral identity (worklog Design §1).
 */

const MINSTD_MULTIPLIER = 48271;
const MINSTD_MODULUS = 2147483647;
const ACC_MODULUS = 1000000007;

function runLcg(n: number, seed: number): number {
  let state = seed;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    state = (state * MINSTD_MULTIPLIER) % MINSTD_MODULUS;
    acc = (acc + state) % ACC_MODULUS;
  }
  return acc;
}

function readVmHwmKb(): number | null {
  try {
    const status = Deno.readTextFileSync('/proc/self/status');
    const line = status.split('\n').find((l) => l.startsWith('VmHWM:'));
    if (!line) return null;
    const kb = Number(line.replace(/[^0-9]/g, ''));
    return Number.isFinite(kb) ? kb : null;
  } catch {
    return null;
  }
}

const n = Number(Deno.args[0] ?? '100000');
const seed = Number(Deno.args[1] ?? '42');
const acc = runLcg(n, seed);
const correlationId = Deno.env.get('CORRELATION_ID') ?? null;
console.log(JSON.stringify({ acc, n, seed, correlationId, vmHwmKb: readVmHwmKb() }));
