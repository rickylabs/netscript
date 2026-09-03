/** Failure classifications emitted when a Quickstart Aspire command exceeds its bound. */
export const ASPIRE_TIMEOUT_CLASSIFICATION = {
  RESTORE: 'quickstart.aspire.restore.timeout:#1227',
  START: 'quickstart.aspire.start.timeout:#1227',
  WAIT: 'quickstart.aspire.wait.timeout:#1227',
} as const;

/** Minimal subprocess result consumed by the bounded Aspire walk. */
export interface AspireCommandResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
}

/** Failure from one bounded Aspire subprocess, including the wrapper's exit code. */
export class AspireCommandFailure extends Error {
  constructor(message: string, readonly exitCode: number) {
    super(message);
    this.name = 'AspireCommandFailure';
  }
}

/** Runs one Aspire command with a deadline. */
export type AspireCommandRunner = (
  command: readonly string[],
  cwd: string,
  timeoutMs: number,
) => Promise<AspireCommandResult>;

/** Execute restore, start, and database readiness as one independently reported Quickstart step. */
export async function runBoundedAspireWalk(
  appHost: string,
  projectRoot: string,
  timeoutMs: number,
  run: AspireCommandRunner = runAspireCommand,
): Promise<void> {
  const aspireRoot = `${projectRoot}/aspire`;
  await requireAspireSuccess(
    ['aspire', 'restore', '--apphost', appHost, '--non-interactive', '--nologo'],
    aspireRoot,
    timeoutMs,
    ASPIRE_TIMEOUT_CLASSIFICATION.RESTORE,
    run,
    true,
  );
  await requireAspireSuccess(
    ['aspire', 'start', '--apphost', appHost, '--non-interactive', '--nologo'],
    aspireRoot,
    timeoutMs,
    ASPIRE_TIMEOUT_CLASSIFICATION.START,
    run,
    false,
  );
  await requireAspireSuccess(
    [
      'aspire',
      'wait',
      'postgres',
      '--status',
      'healthy',
      '--timeout',
      String(Math.ceil(timeoutMs / 1_000)),
      '--apphost',
      appHost,
      '--non-interactive',
      '--nologo',
    ],
    aspireRoot,
    timeoutMs,
    ASPIRE_TIMEOUT_CLASSIFICATION.WAIT,
    run,
    false,
  );
}

async function requireAspireSuccess(
  command: readonly string[],
  cwd: string,
  timeoutMs: number,
  timeoutClassification: string,
  run: AspireCommandRunner,
  retryableRestore: boolean,
): Promise<void> {
  const result = await run(command, cwd, timeoutMs);
  if (result.timedOut) {
    throw new AspireCommandFailure(timeoutClassification, retryableRestore ? 124 : 1);
  }
  if (result.code !== 0) {
    throw new AspireCommandFailure(
      `${command[0]} ${command[1]} failed (${result.code}): ${result.stderr}`,
      retryableRestore ? result.code : 1,
    );
  }
  if (result.stdout) console.info(result.stdout);
}

export async function runAspireCommand(
  command: readonly string[],
  cwd: string,
  timeoutMs: number,
): Promise<AspireCommandResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const [executable, ...args] = command;
    const output = await new Deno.Command(executable, {
      args,
      cwd,
      stdout: 'piped',
      stderr: 'piped',
      signal: controller.signal,
    }).output();
    return {
      code: output.code,
      stdout: new TextDecoder().decode(output.stdout),
      stderr: new TextDecoder().decode(output.stderr),
      timedOut: false,
    };
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'AbortError';
    if (!timedOut) throw error;
    return { code: 124, stdout: '', stderr: 'Command timed out.', timedOut: true };
  } finally {
    clearTimeout(timeout);
  }
}

if (import.meta.main) {
  const [appHost, projectRoot, timeout] = Deno.args;
  if (!appHost || !projectRoot) throw new Error('appHost and projectRoot are required');
  try {
    await runBoundedAspireWalk(appHost, projectRoot, Number(timeout));
  } catch (error) {
    if (error instanceof AspireCommandFailure) {
      console.error(error.message);
      Deno.exitCode = error.exitCode;
    } else {
      throw error;
    }
  }
}
