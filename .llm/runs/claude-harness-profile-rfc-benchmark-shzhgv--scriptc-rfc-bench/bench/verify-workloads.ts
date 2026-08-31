/**
 * S4 correctness gate: build every task variant and assert identical LCG results for fixed
 * (seed, n) across subjects A/B/C/D and the boundary cores (wasm, in-process JS).
 *
 * Run from repo root:
 *   deno run --allow-all .llm/runs/<run-id>/bench/verify-workloads.ts
 *
 * Exits non-zero on any mismatch or build failure. Prints a table + binary sizes.
 */

const RUN_DIR = new URL('.', import.meta.url).pathname;
const TASKS = `${RUN_DIR}tasks`;
const BUILD = `${TASKS}/build`;

const SEED = 42;
const CASES = [
  { n: 100_000, label: 'short' },
  { n: 10_000_000, label: 'long' },
] as const;

type ResultJson = { acc: number; n: number; seed: number };

function lcgReference(n: number, seed: number): number {
  let state = seed;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    state = (state * 48271) % 2147483647;
    acc = (acc + state) % 1000000007;
  }
  return acc;
}

async function run(cmd: string[], cwd?: string): Promise<{ code: number; out: string; err: string }> {
  const c = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  });
  const { code, stdout, stderr } = await c.output();
  return { code, out: new TextDecoder().decode(stdout), err: new TextDecoder().decode(stderr) };
}

function lastJsonLine(stdout: string): ResultJson {
  const line = stdout.trim().split('\n').pop() ?? '';
  return JSON.parse(line) as ResultJson;
}

async function main(): Promise<void> {
  await Deno.mkdir(BUILD, { recursive: true });
  const failures: string[] = [];

  console.log('== building variants ==');
  const scriptcBuild = await run([
    'scriptc',
    'build',
    `${TASKS}/task-scriptc.ts`,
    '-o',
    `${BUILD}/task-scriptc-native`,
  ]);
  if (scriptcBuild.code !== 0) failures.push(`scriptc build failed:\n${scriptcBuild.err}`);

  const cargoBin = await run(
    ['cargo', 'build', '--release', '--bin', 'task-rust-native'],
    `${TASKS}/rust-lcg`,
  );
  if (cargoBin.code !== 0) failures.push(`cargo bin build failed:\n${cargoBin.err}`);

  const cargoLib = await run(['cargo', 'build', '--release', '--lib'], `${TASKS}/rust-lcg`);
  if (cargoLib.code !== 0) failures.push(`cargo cdylib build failed:\n${cargoLib.err}`);

  const wasmTarget = await run(['rustup', 'target', 'add', 'wasm32-unknown-unknown']);
  if (wasmTarget.code !== 0) failures.push(`rustup target add failed:\n${wasmTarget.err}`);
  const cargoWasm = await run(
    ['cargo', 'build', '--release', '--lib', '--target', 'wasm32-unknown-unknown'],
    `${TASKS}/rust-lcg`,
  );
  if (cargoWasm.code !== 0) failures.push(`cargo wasm build failed:\n${cargoWasm.err}`);

  if (failures.length) {
    console.error(failures.join('\n---\n'));
    Deno.exit(1);
  }

  // Copy artifacts into build/ so the harness has one stable root.
  const rustTarget = `${TASKS}/rust-lcg/target`;
  await Deno.copyFile(`${rustTarget}/release/task-rust-native`, `${BUILD}/task-rust-native`);
  await Deno.copyFile(`${rustTarget}/release/liblcg.so`, `${BUILD}/liblcg.so`);
  await Deno.copyFile(
    `${rustTarget}/wasm32-unknown-unknown/release/lcg.wasm`,
    `${BUILD}/lcg.wasm`,
  );

  console.log('== verifying result identity ==');
  const rows: string[] = [];
  for (const { n, label } of CASES) {
    const expected = lcgReference(n, SEED);
    const subjects: Array<{ id: string; cmd: string[] }> = [
      {
        id: 'A-deno',
        cmd: [
          Deno.execPath(),
          'run',
          '--allow-read=/proc/self/status',
          '--allow-env=CORRELATION_ID',
          `${TASKS}/task-deno.ts`,
          String(n),
          String(SEED),
        ],
      },
      { id: 'B/C-scriptc', cmd: [`${BUILD}/task-scriptc-native`, String(n), String(SEED)] },
      { id: 'D-rust', cmd: [`${BUILD}/task-rust-native`, String(n), String(SEED)] },
    ];
    for (const s of subjects) {
      const r = await run(s.cmd);
      if (r.code !== 0) {
        failures.push(`${s.id} (${label}) exited ${r.code}: ${r.err}`);
        continue;
      }
      const json = lastJsonLine(r.out);
      const ok = json.acc === expected && json.n === n && json.seed === SEED;
      rows.push(`${s.id.padEnd(14)} ${label.padEnd(6)} acc=${json.acc} expected=${expected} ${ok ? 'OK' : 'MISMATCH'}`);
      if (!ok) failures.push(`${s.id} (${label}): acc=${json.acc} != ${expected}`);
    }

    // Boundary cores: wasm + FFI share lib.rs; verify via wasm instantiation here.
    const wasmBytes = await Deno.readFile(`${BUILD}/lcg.wasm`);
    const { instance } = await WebAssembly.instantiate(wasmBytes, {});
    const lcgRun = instance.exports.lcg_run as (n: bigint, seed: bigint) => bigint;
    const wasmAcc = Number(lcgRun(BigInt(n), BigInt(SEED)));
    const wasmOk = wasmAcc === expected;
    rows.push(`${'E-wasm-core'.padEnd(14)} ${label.padEnd(6)} acc=${wasmAcc} expected=${expected} ${wasmOk ? 'OK' : 'MISMATCH'}`);
    if (!wasmOk) failures.push(`E-wasm (${label}): acc=${wasmAcc} != ${expected}`);
  }

  console.log(rows.join('\n'));

  console.log('== artifact sizes ==');
  for (const f of ['task-scriptc-native', 'task-rust-native', 'liblcg.so', 'lcg.wasm']) {
    const st = await Deno.stat(`${BUILD}/${f}`);
    console.log(`${f.padEnd(22)} ${st.size} bytes`);
  }

  if (failures.length) {
    console.error('\nFAILURES:\n' + failures.join('\n'));
    Deno.exit(1);
  }
  console.log('\nS4 gate: PASS');
}

await main();
