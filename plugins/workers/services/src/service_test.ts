/**
 * Oracles for the public workers `./service` subpath.
 *
 * S1 scope: `@netscript/plugin-workers/service` resolves to `services/mod.ts`, imports inertly
 * with every capability (including read) denied, and `startWorkersService` asserts the caller's
 * auth posture before any env, KV, storage or listener work. Every product import happens in a
 * `deno run -` child (stdin module; `deno eval` ignores `--deny-*`) with a cleared environment,
 * scratch-only profile/temp roots, the task-owned module cache, a watchdog deadline and a byte
 * cap on captured output, so no real user state is reachable and no child can wait forever.
 */

import { assertEquals, assertRejects, assertStringIncludes } from 'jsr:@std/assert@^1';
import { fromFileUrl } from '@std/path';

const PUBLIC_SUBPATH = '@netscript/plugin-workers/service';
const PUBLIC_MODULE = new URL('../mod.ts', import.meta.url).href;
const PLUGIN_ROOT = fromFileUrl(new URL('../../', import.meta.url));
const CHILD_DEADLINE_MS = 10_000;
const SETTLE_GRACE_MS = 2_000;
const CHILD_OUTPUT_CAP = 32 * 1024;
const DENY_EVERYTHING: readonly string[] = [
  '--cached-only',
  '--deny-read',
  '--deny-env',
  '--deny-net',
  '--deny-write',
  '--deny-run',
  '--deny-sys',
  '--deny-ffi',
];
const NATIVE_POLICY_ERROR =
  'Service auth requires { authn: { authenticator }, authz?: { authorizer } } or { public: true, reason: "nonblank explanation" }; do not combine guarded and public fields.';
const DENIED_PORT_ERROR = 'Requires env access to "PORT", run again with the --allow-env flag';
const BLANK_REASONS: readonly string[] = ['', ' \t\n'];
const VALID_REASON = 'S1 ordering control: valid posture reaches the PORT read';

interface ChildRun {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

interface ChildSpec {
  readonly args: readonly string[];
  readonly cwd?: string;
  /** When present the child starts from this environment only. */
  readonly env?: Record<string, string>;
  readonly stdin?: string;
  readonly deadlineMs?: number;
}

interface Sandbox extends AsyncDisposable {
  readonly scratch: string;
  /** Runs `source` as a stdin module under every `--deny-*` flag. */
  run(
    source: string,
    options?: { readonly cwd?: string; readonly deadlineMs?: number },
  ): Promise<ChildRun>;
}

Deno.test({
  name:
    'permission controls: static module loading survives --deny-read while runtime read, env and net are refused',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    await using sandbox = await createSandbox();
    await Deno.writeTextFile(`${sandbox.scratch}/inert.ts`, 'export const inert = true;\n');
    const controls: ReadonlyArray<{ readonly label: string; readonly source: string } & ChildRun> =
      [
        {
          label: 'positive: a static local import loads while read stays denied',
          source: "import './inert.ts';\n" +
            "console.log(Deno.permissions.querySync({ name: 'read' }).state);\n",
          code: 0,
          stdout: 'denied\n',
          stderr: '',
        },
        {
          label: 'negative: a runtime file read at import time is refused',
          source: "await Deno.readTextFile(new URL('./inert.ts', import.meta.url));\n",
          code: 1,
          stdout: '',
          stderr: 'NotCapable: Requires read access',
        },
        {
          label: 'negative: an env read is refused',
          source: "Deno.env.get('PORT');\n",
          code: 1,
          stdout: '',
          stderr: 'NotCapable: Requires env access',
        },
        {
          label: 'negative: a loopback listen is refused',
          source: "Deno.listen({ hostname: '127.0.0.1', port: 0 });\n",
          code: 1,
          stdout: '',
          stderr: 'NotCapable: Requires net access',
        },
      ];
    for (const control of controls) {
      const run = await sandbox.run(control.source);
      assertEquals(run.code, control.code, `${control.label}: exit code\n${run.stderr}`);
      assertEquals(run.stdout, control.stdout, `${control.label}: stdout`);
      assertStringIncludes(run.stderr, control.stderr, `${control.label}: stderr`);
    }
  },
});

Deno.test({
  name: 'child controls: a stuck child and an over-cap stream are failures that still settle',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    await using sandbox = await createSandbox();
    await assertRejects(
      () =>
        sandbox.run('await new Promise((resolve) => setTimeout(resolve, 60_000));\n', {
          deadlineMs: 500,
        }),
      Error,
      'exceeded 500ms',
    );
    await assertRejects(
      () => sandbox.run(`console.log('x'.repeat(${CHILD_OUTPUT_CAP}));\n`),
      Error,
      `stdout: exceeded ${CHILD_OUTPUT_CAP} bytes`,
    );
  },
});

Deno.test({
  name:
    `${PUBLIC_SUBPATH} resolves to services/mod.ts and imports inertly with every capability denied under a cleared environment`,
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    await using sandbox = await createSandbox();
    const run = await sandbox.run(
      `import '${PUBLIC_SUBPATH}';\nconsole.log(import.meta.resolve('${PUBLIC_SUBPATH}'));\n`,
      { cwd: PLUGIN_ROOT },
    );
    assertEquals(run.stderr, '');
    assertEquals(run.stdout, `${PUBLIC_MODULE}\n`);
    assertEquals(run.code, 0);
  },
});

Deno.test({
  name: 'denied child: the auth assertion precedes every env, KV, storage and listener capability',
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
  async fn() {
    await using sandbox = await createSandbox();
    const run = await sandbox.run(createDeniedAuthProbe(), { cwd: PLUGIN_ROOT });
    assertEquals(run.stderr, '');
    assertEquals(run.code, 0);
    const report: unknown = JSON.parse(run.stdout);
    assertEquals(report, {
      envControl: 'NotCapable',
      rows: [
        ...BLANK_REASONS.map((reason) => ({ reason, outcome: ['TypeError', NATIVE_POLICY_ERROR] })),
        { reason: VALID_REASON, outcome: ['NotCapable', DENIED_PORT_ERROR] },
      ],
    });
  },
});

/**
 * Child module source: a plain runtime caller (no types, no casts) under every `--deny-*` flag.
 * A deliberately denied env read proves the permission oracle is active; any env/KV/storage/
 * listen touch before the auth assertion surfaces as `NotCapable` instead of the native
 * `TypeError`, and the valid posture must reach the denied `PORT` read and nothing else.
 */
function createDeniedAuthProbe(): string {
  return `import { startWorkersService } from '${PUBLIC_SUBPATH}';
const reasons = ${JSON.stringify([...BLANK_REASONS, VALID_REASON])};
const context = {
  db: { getClient: () => Promise.reject(new Error('db.getClient ran before the auth assertion')) },
  contracts: {},
  kv: {},
  logger: {},
  env: {},
};
const rows = [];
for (const reason of reasons) {
  rows.push({ reason, outcome: await attempt(() => startWorkersService(context, { auth: { public: true, reason } })) });
}
console.log(JSON.stringify({ envControl: describe(() => Deno.env.get('PORT')), rows }));
function describe(operation) {
  try {
    operation();
    return 'allowed';
  } catch (error) {
    return error instanceof Error ? error.name : String(error);
  }
}
async function attempt(operation) {
  try {
    await operation();
    return 'resolved';
  } catch (error) {
    return error instanceof Error ? [error.name, error.message] : ['non-error', String(error)];
  }
}
`;
}

/** Scratch-only profile/temp roots plus the task-owned module cache; disposal removes the roots. */
async function createSandbox(): Promise<Sandbox> {
  const env: Record<string, string> = { DENO_DIR: await resolveDenoDir() };
  const scratch = await Deno.makeTempDir({ prefix: 'workers-service-' });
  for (
    const name of [
      'HOME',
      'USERPROFILE',
      'LOCALAPPDATA',
      'TMP',
      'TEMP',
      'TMPDIR',
      'XDG_CACHE_HOME',
      'XDG_CONFIG_HOME',
      'XDG_DATA_HOME',
      'XDG_STATE_HOME',
    ]
  ) {
    env[name] = scratch;
  }
  const systemRoot = Deno.env.get('SystemRoot');
  if (systemRoot !== undefined) env.SystemRoot = systemRoot;
  return {
    scratch,
    run: (source, options = {}) =>
      runChild({
        args: ['run', ...DENY_EVERYTHING, '-'],
        cwd: options.cwd ?? scratch,
        env,
        stdin: source,
        deadlineMs: options.deadlineMs,
      }),
    [Symbol.asyncDispose]: () => Deno.remove(scratch, { recursive: true }),
  };
}

/** The module cache this test process already uses; never a guessed profile path. */
async function resolveDenoDir(): Promise<string> {
  const configured = Deno.env.get('DENO_DIR');
  if (configured !== undefined) return configured;
  const info = await runChild({ args: ['info', '--json'] });
  const parsed: unknown = JSON.parse(info.stdout);
  const denoDir = typeof parsed === 'object' && parsed !== null
    ? Reflect.get(parsed, 'denoDir')
    : undefined;
  if (typeof denoDir !== 'string' || denoDir.length === 0) {
    throw new Error('deno info did not report a denoDir; refusing to guess a cache location');
  }
  return denoDir;
}

/**
 * Runs this Deno binary once, keeping the original child handle. Both streams are captured
 * under `CHILD_OUTPUT_CAP`, stdin is written then closed, and a watchdog kills the child at the
 * deadline. Any problem (deadline, overflow, stdin, kill) aborts the child; the run then waits a
 * bounded grace for status and streams to settle and reports every recorded problem, primary
 * first. A child that will not settle is reported by pid, never ignored.
 */
async function runChild(spec: ChildSpec): Promise<ChildRun> {
  const deadlineMs = spec.deadlineMs ?? CHILD_DEADLINE_MS;
  const child = new Deno.Command(Deno.execPath(), {
    args: [...spec.args],
    cwd: spec.cwd,
    clearEnv: spec.env !== undefined,
    env: spec.env,
    stdin: spec.stdin === undefined ? 'null' : 'piped',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const problems: string[] = [];
  let exited = false;
  const abort = (problem: string): void => {
    problems.push(problem);
    if (exited) return;
    try {
      child.kill();
    } catch (error) {
      problems.push(`kill failed: ${describe(error)}`);
    }
  };
  const watchdog = setTimeout(() => abort(`exceeded ${deadlineMs}ms`), deadlineMs);
  const settled = Promise.all([
    child.status.then((status) => {
      exited = true;
      return status.code;
    }),
    readCapped(child.stdout).catch((error): string => {
      abort(`stdout: ${describe(error)}`);
      return '';
    }),
    readCapped(child.stderr).catch((error): string => {
      abort(`stderr: ${describe(error)}`);
      return '';
    }),
    spec.stdin === undefined ? undefined : writeStdin(child.stdin, spec.stdin, abort),
  ]);
  let grace: ReturnType<typeof setTimeout> | undefined;
  const unsettled = new Promise<undefined>((resolve) => {
    grace = setTimeout(resolve, deadlineMs + SETTLE_GRACE_MS, undefined);
  });
  try {
    const outcome = await Promise.race([settled, unsettled]);
    const command = `deno ${spec.args.join(' ')}`;
    if (outcome === undefined) {
      throw new Error(
        `${command} (pid ${child.pid}) did not settle within ${deadlineMs + SETTLE_GRACE_MS}ms` +
          `: ${problems.join('; ') || 'no recorded problem'}`,
      );
    }
    const [code, stdout, stderr] = outcome;
    if (problems.length > 0) {
      throw new Error(
        `${command} failed: ${
          problems.join('; ')
        }\nexit ${code}\nstdout:\n${stdout}\nstderr:\n${stderr}`,
      );
    }
    return { code, stdout, stderr };
  } finally {
    clearTimeout(watchdog);
    clearTimeout(grace);
  }
}

/** Writes the module source and closes stdin; either failure aborts the run. */
async function writeStdin(
  stdin: WritableStream<Uint8Array>,
  source: string,
  abort: (problem: string) => void,
): Promise<void> {
  const writer = stdin.getWriter();
  await writer.write(new TextEncoder().encode(source))
    .catch((error) => abort(`stdin write: ${describe(error)}`));
  await writer.close().catch((error) => abort(`stdin close: ${describe(error)}`));
}

/** Collects a child stream as text; more than `CHILD_OUTPUT_CAP` bytes fails, never truncates. */
async function readCapped(stream: ReadableStream<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  for await (const chunk of stream) {
    bytes += chunk.byteLength;
    if (bytes > CHILD_OUTPUT_CAP) throw new Error(`exceeded ${CHILD_OUTPUT_CAP} bytes`);
    text += decoder.decode(chunk, { stream: true });
  }
  return text + decoder.decode();
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
