#!/usr/bin/env -S deno run -A
/**
 * prove-aspire-deno-runtime.ts — self-contained, re-runnable targeted proof that
 * a fresh NetScript DB-less scaffold boots under the Aspire *fork* and exercises
 * BOTH fork features end to end:
 *
 *   Layer A — TypeScript-AppHost Deno toolchain resolver.
 *     The scaffolded `aspire/` AppHost emits `aspire/deno.json`
 *     (`unstable: ["sloppy-imports"]`) and NO `aspire/package.json`, so the
 *     fork resolver runs `apphost.mts` under Deno. Proof: deno.json present +
 *     package.json absent; `deno check apphost.mts` exit 0; the running AppHost
 *     reports SDK `13.5.0-dev` via `aspire ps --format Json`.
 *
 *   Layer B — `AddDenoApp` / `DenoAppResource` in `Aspire.Hosting.JavaScript`.
 *     Services are hosted via `builder.addDenoApp(name, workdir, entrypoint)`
 *     (fixed `deno run -A <script>`), OTel via env-only
 *     `buildOtelEnvVars(name, ver, 'denoApp')` = exactly 3 vars (OTEL_DENO=true
 *     + service name + service.version), ZERO app-side OpenTelemetry SDK. The
 *     fork's `WithDenoDefaults()` wires the OTLP exporter env natively. Proof:
 *     the running resource has source=="deno", appArgs starts with ["run","-A"],
 *     state Running / health Healthy; the resolved endpoint serves a healthy
 *     `/health`; the resource env carries the 3 denoApp vars plus the
 *     fork-injected OTLP exporter env; the service source imports no
 *     `@opentelemetry` SDK.
 *
 * Docker is intentionally NOT required: the scaffold is DB-less (`--db none`)
 * and hosts only a plain HTTP `deno run -A` service, so no redis/garnet/postgres
 * containers are involved.
 *
 * FORK BRIDGE. `aspire` must resolve to the fork CLI in dev mode. This harness
 * applies the same env the scratchpad `fork-aspire-env.sh` shim applies, with
 * env-var overrides:
 *   ASPIRE_FORK_CLI_DIR  dir containing the fork aspire.exe
 *                        (default C:\Dev\repos\aspire\artifacts\bin\Aspire.Cli\Debug\net10.0)
 *   ASPIRE_REPO_ROOT     fork repo root; presence triggers CLI DEV MODE
 *                        (default C:\Dev\repos\aspire) — REQUIRED, without it
 *                        restore fails "No code generator for TypeScript".
 *   DOTNET_ROOT          (default C:\Dev\repos\aspire\.dotnet)
 *
 * Usage:
 *   deno run -A .llm/tools/dogfood/prove-aspire-deno-runtime.ts [--keep-running] [--no-cleanup]
 *
 * Exit code 0 = every assertion passed; non-zero = at least one failed.
 */

import { dirname, fromFileUrl, join } from 'jsr:@std/path@1';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SCRIPT_DIR = dirname(fromFileUrl(import.meta.url));
// .llm/tools/dogfood -> repo/worktree root is three levels up.
const REPO_ROOT = join(SCRIPT_DIR, '..', '..', '..');

const FORK_CLI_DIR = Deno.env.get('ASPIRE_FORK_CLI_DIR') ??
  'C:\\Dev\\repos\\aspire\\artifacts\\bin\\Aspire.Cli\\Debug\\net10.0';
const ASPIRE_REPO_ROOT = Deno.env.get('ASPIRE_REPO_ROOT') ?? 'C:\\Dev\\repos\\aspire';
const DOTNET_ROOT = Deno.env.get('DOTNET_ROOT') ?? 'C:\\Dev\\repos\\aspire\\.dotnet';
const ASPIRE_EXE = join(FORK_CLI_DIR, 'aspire.exe');

const EXPECTED_SDK = '13.5.0-dev';
const SERVICE_NAME = 'users';
const SERVICE_VERSION = '1.0.0';

const args = new Set(Deno.args);
const KEEP_RUNNING = args.has('--keep-running');
const NO_CLEANUP = args.has('--no-cleanup') || KEEP_RUNNING;

const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const PROJECT_NAME = 'aspiredenoproof';
const TMP_PARENT = join(REPO_ROOT, '.llm', 'tmp', 'dogfood', `proof-${RUN_ID}`);
const PROJECT_ROOT = join(TMP_PARENT, PROJECT_NAME);
const ASPIRE_DIR = join(PROJECT_ROOT, 'aspire');
const APPHOST_PATH = join(ASPIRE_DIR, 'apphost.mts');

// ---------------------------------------------------------------------------
// Assertion ledger
// ---------------------------------------------------------------------------

interface Assertion {
  id: string;
  layer: string;
  desc: string;
  pass: boolean;
  detail: string;
}
const ledger: Assertion[] = [];
function assert(id: string, layer: string, desc: string, pass: boolean, detail: string) {
  ledger.push({ id, layer, desc, pass, detail });
  const mark = pass ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${id} (${layer}) — ${desc}`);
  console.log(`        ${detail}`);
}

// ---------------------------------------------------------------------------
// Shell helpers
// ---------------------------------------------------------------------------

function forkEnv(): Record<string, string> {
  const env = Deno.env.toObject();
  const priorPath = env.PATH ?? env.Path ?? '';
  return {
    ...env,
    PATH: `${FORK_CLI_DIR};${priorPath}`,
    ASPIRE_REPO_ROOT,
    DOTNET_ROOT,
  };
}

interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

async function run(
  cmd: string,
  cmdArgs: string[],
  opts: { cwd?: string; env?: Record<string, string> } = {},
): Promise<RunResult> {
  const label = `${cmd} ${cmdArgs.join(' ')}`;
  console.log(`\n$ ${label}${opts.cwd ? `   (cwd=${opts.cwd})` : ''}`);
  const p = new Deno.Command(cmd, {
    args: cmdArgs,
    cwd: opts.cwd,
    env: opts.env,
    stdout: 'piped',
    stderr: 'piped',
  });
  const out = await p.output();
  const stdout = new TextDecoder().decode(out.stdout);
  const stderr = new TextDecoder().decode(out.stderr);
  if (stdout.trim()) console.log(stdout.trimEnd());
  if (stderr.trim()) console.log(`[stderr] ${stderr.trimEnd()}`);
  console.log(`[exit ${out.code}] ${label}`);
  return { code: out.code, stdout, stderr };
}

// deno-lint-ignore no-control-regex
const ANSI = /\[[0-9;]*[A-Za-z]|\]8;[^]*/g;

// deno-lint-ignore no-explicit-any
function extractJson(raw: string): any {
  const clean = raw.replace(ANSI, '');
  const objIdx = clean.indexOf('{');
  const arrIdx = clean.indexOf('[');
  let start = -1;
  if (objIdx === -1) start = arrIdx;
  else if (arrIdx === -1) start = objIdx;
  else start = Math.min(objIdx, arrIdx);
  if (start === -1) throw new Error(`no JSON found in output:\n${clean}`);
  return JSON.parse(clean.slice(start));
}

function normPath(p: string): string {
  return p.replace(/\\/g, '/').toLowerCase();
}

async function poll<T>(
  desc: string,
  fn: () => Promise<T | null>,
  timeoutMs: number,
  intervalMs = 3000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  let last: unknown = null;
  while (Date.now() < deadline) {
    try {
      const v = await fn();
      if (v !== null) return v;
    } catch (e) {
      last = e;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`timeout waiting for: ${desc}${last ? ` (last error: ${last})` : ''}`);
}

// ---------------------------------------------------------------------------
// Teardown
// ---------------------------------------------------------------------------

let stopped = false;
async function teardown() {
  if (KEEP_RUNNING) {
    console.log(`\n[teardown] --keep-running: leaving AppHost up at ${ASPIRE_DIR}`);
    return;
  }
  if (!stopped) {
    try {
      await run(ASPIRE_EXE, ['stop', '--apphost', ASPIRE_DIR, '--non-interactive'], { env: forkEnv() });
    } catch (e) {
      console.log(`[teardown] stop failed: ${e}`);
    }
    stopped = true;
  }
  if (!NO_CLEANUP) {
    try {
      await Deno.remove(TMP_PARENT, { recursive: true });
      console.log(`[teardown] removed ${TMP_PARENT}`);
    } catch (e) {
      console.log(`[teardown] cleanup failed (non-fatal): ${e}`);
    }
  } else {
    console.log(`[teardown] --no-cleanup: kept ${TMP_PARENT}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('='.repeat(78));
  console.log('Aspire Deno-runtime targeted proof');
  console.log(`  repo root:     ${REPO_ROOT}`);
  console.log(`  fork CLI:      ${ASPIRE_EXE}`);
  console.log(`  ASPIRE_REPO_ROOT (dev mode): ${ASPIRE_REPO_ROOT}`);
  console.log(`  project:       ${PROJECT_ROOT}`);
  console.log('='.repeat(78));

  // --- 0. Verify fork CLI is present + dev-mode version --------------------
  const ver = await run(ASPIRE_EXE, ['--version'], { env: forkEnv() });
  const sdkFromCli = ver.stdout.replace(ANSI, '').trim();
  assert(
    'FORK-CLI',
    'bridge',
    `fork aspire CLI resolves and reports ${EXPECTED_SDK}`,
    ver.code === 0 && sdkFromCli.includes(EXPECTED_SDK),
    `aspire --version => "${sdkFromCli}" (exit ${ver.code})`,
  );

  // --- 1. Fresh DB-less scaffold ------------------------------------------
  await Deno.mkdir(TMP_PARENT, { recursive: true });
  const scaffold = await run('deno', [
    'run',
    '-A',
    'packages/cli/bin/netscript-dev.ts',
    'init',
    PROJECT_NAME,
    '--path',
    TMP_PARENT,
    '--db',
    'none',
    '--service',
    '--service-name',
    SERVICE_NAME,
    '--service-port',
    '3001',
    '--editor',
    'none',
    '--ci',
    '--yes',
    '--no-git',
    '--force',
  ], { cwd: REPO_ROOT, env: Deno.env.toObject() });
  assert(
    'SCAFFOLD',
    'setup',
    'fresh DB-less scaffold with a users addDenoApp HTTP service',
    scaffold.code === 0,
    `netscript-dev init exit ${scaffold.code}; project at ${PROJECT_ROOT}`,
  );
  if (scaffold.code !== 0) throw new Error('scaffold failed — cannot continue');

  // --- 2. LAYER A static: deno.json present, package.json absent -----------
  const denoJsonPath = join(ASPIRE_DIR, 'deno.json');
  const pkgJsonPath = join(ASPIRE_DIR, 'package.json');
  const denoJsonExists = await exists(denoJsonPath);
  const pkgJsonExists = await exists(pkgJsonPath);
  const denoJsonText = denoJsonExists ? await Deno.readTextFile(denoJsonPath) : '';
  const hasSloppy = denoJsonText.includes('sloppy-imports');
  assert(
    'A1-DENO-JSON',
    'Layer A',
    'aspire/deno.json present (Deno resolver path) AND aspire/package.json absent (no Node path)',
    denoJsonExists && !pkgJsonExists && hasSloppy,
    `deno.json exists=${denoJsonExists} (sloppy-imports=${hasSloppy}); package.json exists=${pkgJsonExists}`,
  );

  // --- 3. LAYER B codegen: addDenoApp + denoApp OTEL, no withOtlpExporter --
  const regServicesPath = join(ASPIRE_DIR, '.helpers', 'register-services.mts');
  const regServices = await Deno.readTextFile(regServicesPath);
  const hasAddDenoApp = /builder\.addDenoApp\(/.test(regServices);
  const hasDenoAppOtel = /buildOtelEnvVars\([^)]*'denoApp'\)/.test(regServices);
  const hasNoOtlpExporter = !/withOtlpExporter/.test(regServices);
  assert(
    'B1-CODEGEN',
    'Layer B',
    "register-services.mts hosts via addDenoApp + buildOtelEnvVars(...,'denoApp') and drops withOtlpExporter",
    hasAddDenoApp && hasDenoAppOtel && hasNoOtlpExporter,
    `addDenoApp=${hasAddDenoApp}; denoApp-otel=${hasDenoAppOtel}; no-withOtlpExporter=${hasNoOtlpExporter}`,
  );

  // --- 4. OTEL zero-SDK: service source imports no @opentelemetry ----------
  const serviceSrcDir = join(PROJECT_ROOT, 'services', SERVICE_NAME);
  const otelHits = await grepDir(serviceSrcDir, /opentelemetry|OpenTelemetry SDK|@opentelemetry/);
  assert(
    'OTEL-ZERO-SDK',
    'Layer B',
    'scaffolded users service imports NO @opentelemetry SDK (env-only native OTel)',
    otelHits.length === 0,
    otelHits.length === 0
      ? 'no @opentelemetry / OpenTelemetry SDK references in services/users source'
      : `unexpected OTel SDK references: ${otelHits.join('; ')}`,
  );

  // --- 5. aspire restore ---------------------------------------------------
  // Restore first: it materializes `.aspire/modules/*.mts`, which apphost.mts
  // imports (via sloppy-imports as `.mjs`). `deno check` before restore fails
  // with TS2307 because those modules do not exist yet.
  const restore = await run(ASPIRE_EXE, ['restore', '--non-interactive'], { cwd: ASPIRE_DIR, env: forkEnv() });
  assert(
    'RESTORE',
    'setup',
    'aspire restore (fork dev-mode TypeScript codegen) exits 0',
    restore.code === 0,
    `aspire restore exit ${restore.code}`,
  );
  if (restore.code !== 0) throw new Error('restore failed — cannot boot');

  // --- 6. LAYER A: deno check apphost.mts exit 0 (against restored modules) -
  const check = await run('deno', ['check', 'apphost.mts'], { cwd: ASPIRE_DIR, env: Deno.env.toObject() });
  assert(
    'A2-DENO-CHECK',
    'Layer A',
    'deno check apphost.mts exits 0 (AppHost type-checks under Deno against restored .aspire modules)',
    check.code === 0,
    `deno check exit ${check.code}`,
  );

  // --- 7. aspire start --isolated -----------------------------------------
  const start = await run(
    ASPIRE_EXE,
    ['start', '--isolated', '--non-interactive', '--format', 'Json', '--apphost', ASPIRE_DIR],
    { cwd: ASPIRE_DIR, env: forkEnv() },
  );
  assert(
    'START',
    'setup',
    'aspire start --isolated launches the AppHost in the background',
    start.code === 0,
    `aspire start exit ${start.code}`,
  );
  if (start.code !== 0) throw new Error('start failed');

  // --- 8. LAYER A live: running AppHost reports sdk 13.5.0-dev -------------
  const wantApphost = normPath(APPHOST_PATH);
  // deno-lint-ignore no-explicit-any
  const psEntry = await poll<any>('AppHost running in aspire ps', async () => {
    const ps = await run(ASPIRE_EXE, ['ps', '--format', 'Json', '--non-interactive'], { env: forkEnv() });
    if (ps.code !== 0) return null;
    // deno-lint-ignore no-explicit-any
    const list = extractJson(ps.stdout) as any[];
    const mine = list.find((e) => normPath(String(e.appHostPath)) === wantApphost);
    if (mine && String(mine.status).toLowerCase() === 'running') return mine;
    return null;
  }, 120_000);
  assert(
    'A3-SDK-LIVE',
    'Layer A',
    `running AppHost reports SDK ${EXPECTED_SDK} (fork Deno toolchain path)`,
    String(psEntry.sdkVersion) === EXPECTED_SDK,
    `aspire ps: status=${psEntry.status}, sdkVersion=${psEntry.sdkVersion}, pid=${psEntry.appHostPid}`,
  );

  // --- 9. LAYER B live: resource source=="deno", appArgs run -A, Running/Healthy
  // deno-lint-ignore no-explicit-any
  const resource = await poll<any>('users resource Running+Healthy', async () => {
    const d = await run(
      ASPIRE_EXE,
      ['describe', SERVICE_NAME, '--format', 'Json', '--apphost', ASPIRE_DIR, '--non-interactive'],
      { env: forkEnv() },
    );
    if (d.code !== 0) return null;
    const doc = extractJson(d.stdout);
    const res = (doc.resources ?? []).find((r: { displayName?: string; name?: string }) =>
      r.displayName === SERVICE_NAME || String(r.name).startsWith(SERVICE_NAME)
    );
    if (!res) return null;
    if (res.state === 'Running' && res.healthStatus === 'Healthy') return res;
    return null;
  }, 120_000);

  const source = String(resource.source);
  const appArgs: string[] = (resource.properties?.['resource.appArgs'] ?? []) as string[];
  const appArgsOk = appArgs[0] === 'run' && appArgs[1] === '-A';
  assert(
    'B2-DENO-RESOURCE',
    'Layer B',
    'users resource is source=="deno", appArgs starts ["run","-A"], state Running, health Healthy',
    source === 'deno' && appArgsOk && resource.state === 'Running' && resource.healthStatus === 'Healthy',
    `source=${source}; appArgs=${JSON.stringify(appArgs)}; state=${resource.state}; health=${resource.healthStatus}`,
  );

  // --- 10. Service discovery / live endpoint ------------------------------
  const httpUrl = (resource.urls ?? []).find((u: { name?: string }) => u.name === 'http')?.url as
    | string
    | undefined;
  let healthOk = false;
  let healthDetail = `no http url in resource JSON`;
  if (httpUrl) {
    const healthUrl = `${httpUrl.replace(/\/$/, '')}/health`;
    try {
      const resp = await fetch(healthUrl);
      const body = await resp.json();
      healthOk = resp.status === 200 && body.status === 'healthy' && body.version === SERVICE_VERSION;
      healthDetail = `GET ${healthUrl} => HTTP ${resp.status} ${JSON.stringify(body)}`;
    } catch (e) {
      healthDetail = `GET ${healthUrl} threw ${e}`;
    }
  }
  assert(
    'DISCOVERY-HEALTH',
    'Layer B',
    'resolved service URL (from resource JSON, not hardcoded) serves HTTP 200 healthy /health',
    healthOk,
    healthDetail,
  );

  // --- 11. OTEL env-only native bridge ------------------------------------
  const env = (resource.environment ?? {}) as Record<string, string>;
  const denoAppVars = {
    OTEL_DENO: env.OTEL_DENO,
    OTEL_SERVICE_NAME: env.OTEL_SERVICE_NAME,
    OTEL_RESOURCE_ATTRIBUTES: env.OTEL_RESOURCE_ATTRIBUTES,
  };
  const denoAppVarsOk = env.OTEL_DENO === 'true' &&
    env.OTEL_SERVICE_NAME === SERVICE_NAME &&
    env.OTEL_RESOURCE_ATTRIBUTES === `service.version=${SERVICE_VERSION}`;
  const forkOtlpNative = typeof env.OTEL_EXPORTER_OTLP_ENDPOINT === 'string' &&
    env.OTEL_EXPORTER_OTLP_ENDPOINT.length > 0;
  assert(
    'OTEL-ENV',
    'Layer B',
    "3 scaffold denoApp vars (buildOtelEnvVars(...,'denoApp')) present incl OTEL_DENO=true, plus fork-native OTLP exporter env (WithDenoDefaults)",
    denoAppVarsOk && forkOtlpNative,
    `denoApp vars=${JSON.stringify(denoAppVars)}; fork-native OTEL_EXPORTER_OTLP_ENDPOINT=${env.OTEL_EXPORTER_OTLP_ENDPOINT ?? '(absent)'}`,
  );

  // Note on live-trace assertion: the Dashboard telemetry API is not reachable
  // in headless isolated mode (`aspire otel traces` => "dashboard is not
  // available"), so the OTel proof rests on the env + zero-SDK assertions above,
  // which is the task's accepted fallback.
  console.log(
    '\n[note] Live-trace assertion skipped: `aspire otel traces` cannot reach the ' +
      'dashboard telemetry API headlessly (environmental). OTel proof = OTEL-ENV + OTEL-ZERO-SDK.',
  );
}

async function exists(p: string): Promise<boolean> {
  try {
    await Deno.stat(p);
    return true;
  } catch {
    return false;
  }
}

async function grepDir(dir: string, re: RegExp): Promise<string[]> {
  const hits: string[] = [];
  for await (const entry of walk(dir)) {
    if (!entry.endsWith('.ts') && !entry.endsWith('.tsx')) continue;
    const text = await Deno.readTextFile(entry);
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (re.test(lines[i])) hits.push(`${entry}:${i + 1}: ${lines[i].trim()}`);
    }
  }
  return hits;
}

async function* walk(dir: string): AsyncGenerator<string> {
  for await (const e of Deno.readDir(dir)) {
    const full = join(dir, e.name);
    if (e.isDirectory) yield* walk(full);
    else yield full;
  }
}

// ---------------------------------------------------------------------------

let exitCode = 0;
try {
  await main();
} catch (e) {
  console.log(`\n[FATAL] ${e instanceof Error ? e.stack ?? e.message : e}`);
  assert('HARNESS', 'fatal', 'harness ran to completion', false, String(e));
} finally {
  await teardown();
}

console.log('\n' + '='.repeat(78));
console.log('ASSERTION SUMMARY');
console.log('='.repeat(78));
for (const a of ledger) {
  console.log(`${a.pass ? 'PASS' : 'FAIL'}  ${a.id.padEnd(18)} ${a.layer.padEnd(8)} ${a.desc}`);
}
const failed = ledger.filter((a) => !a.pass);
const proofAssertions = ledger.filter((a) => a.layer.startsWith('Layer'));
console.log('-'.repeat(78));
console.log(
  `${failed.length === 0 ? 'OVERALL: PASS' : 'OVERALL: FAIL'} — ` +
    `${ledger.length - failed.length}/${ledger.length} assertions passed ` +
    `(${proofAssertions.filter((a) => a.pass).length}/${proofAssertions.length} Layer A/B proof assertions)`,
);
exitCode = failed.length === 0 ? 0 : 1;
Deno.exit(exitCode);
