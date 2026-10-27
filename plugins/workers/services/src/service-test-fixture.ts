/**
 * Child-process fixture shared by the workers `./service` test owners.
 *
 * Relocated unchanged from the reviewed S1 helper regions of `service_test.ts`: the bounded child
 * constants, the child run/spec/sandbox types and the scratch/process helpers. Every product
 * import a test makes happens in a `deno run -` child (stdin module; `deno eval` ignores
 * `--deny-*`) with a cleared environment, scratch-only profile/temp roots, the task-owned module
 * cache, a watchdog deadline and a byte cap on captured output, so no real user state is reachable
 * and no child can wait forever. This module registers no tests and imports no product code; it
 * exports only the symbols the test owners consume.
 *
 * @module
 */

const CHILD_DEADLINE_MS = 10_000;
const SETTLE_GRACE_MS = 2_000;
export const CHILD_OUTPUT_CAP: number = 32 * 1024;
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

export interface ChildRun {
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

/** Scratch-only profile/temp roots plus the task-owned module cache; disposal removes the roots. */
export async function createSandbox(): Promise<Sandbox> {
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
