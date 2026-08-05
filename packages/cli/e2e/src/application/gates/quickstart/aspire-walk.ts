/** Failure classifications emitted when a Quickstart Aspire command exceeds its bound. */
export const ASPIRE_TIMEOUT_CLASSIFICATION = {
  RESTORE: 'quickstart.aspire.restore.timeout:#1227',
  START: 'quickstart.aspire.start.timeout:#1227',
  WAIT: 'quickstart.aspire.wait.timeout:#1227',
} as const;

/** Maximum attempts for the observed Aspire bundled-NuGet cancellation. */
export const ASPIRE_RESTORE_MAX_ATTEMPTS = 2;

const ASPIRE_RESTORE_CANCELED_MARKERS = [
  'Failed to prepare: A task was canceled.',
  'Failed to prepare AppHost server.',
] as const;

/** Minimal subprocess result consumed by the bounded Aspire walk. */
export interface AspireCommandResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
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
  await requireAspireRestoreSuccess(
    ['aspire', 'restore', '--apphost', appHost, '--non-interactive', '--nologo'],
    aspireRoot,
    timeoutMs,
    ASPIRE_TIMEOUT_CLASSIFICATION.RESTORE,
    run,
  );
  await requireAspireSuccess(
    ['aspire', 'start', '--apphost', appHost, '--non-interactive', '--nologo'],
    aspireRoot,
    timeoutMs,
    ASPIRE_TIMEOUT_CLASSIFICATION.START,
    run,
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
  );
}

/** Identifies the exit-6 failure emitted by Aspire's bundled NuGet restore. */
export function isRetryableAspireRestoreCancellation(result: AspireCommandResult): boolean {
  return result.code === 6 &&
    ASPIRE_RESTORE_CANCELED_MARKERS.every((marker) => result.stderr.includes(marker));
}

async function requireAspireRestoreSuccess(
  command: readonly string[],
  cwd: string,
  timeoutMs: number,
  timeoutClassification: string,
  run: AspireCommandRunner,
): Promise<void> {
  for (let attempt = 1; attempt <= ASPIRE_RESTORE_MAX_ATTEMPTS; attempt++) {
    const result = await run(command, cwd, timeoutMs);
    if (result.timedOut) throw new Error(timeoutClassification);
    if (result.code === 0) {
      if (result.stdout) console.info(result.stdout);
      return;
    }
    if (!isRetryableAspireRestoreCancellation(result) || attempt === ASPIRE_RESTORE_MAX_ATTEMPTS) {
      throw new Error(`${command[0]} ${command[1]} failed (${result.code}): ${result.stderr}`);
    }
    console.warn(
      `Aspire bundled NuGet restore canceled; retrying (${
        attempt + 1
      }/${ASPIRE_RESTORE_MAX_ATTEMPTS}).`,
    );
  }
}

async function requireAspireSuccess(
  command: readonly string[],
  cwd: string,
  timeoutMs: number,
  timeoutClassification: string,
  run: AspireCommandRunner,
): Promise<void> {
  const result = await run(command, cwd, timeoutMs);
  if (result.timedOut) throw new Error(timeoutClassification);
  if (result.code !== 0) {
    throw new Error(`${command[0]} ${command[1]} failed (${result.code}): ${result.stderr}`);
  }
  if (result.stdout) console.info(result.stdout);
}

async function runAspireCommand(
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
  await runBoundedAspireWalk(appHost, projectRoot, Number(timeout));
}
