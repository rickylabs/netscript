const DB_APPHOST_START_TIMEOUT_SECONDS = '90';
const DB_COMMAND_TIMEOUT_MS = 120_000;
export const DB_RESTORE_MAX_ATTEMPTS = 2;

const RESTORE_CANCELED_MARKERS = [
  'Failed to prepare: A task was canceled',
  'Failed to prepare AppHost server',
] as const;
const RESTORE_START_TIMEOUT_MARKERS = [
  'Timed out waiting ',
  ' for AppHost to start',
  'See AppHost logs at',
] as const;

export interface DatabaseCommandResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
}

export type DatabaseCommandRunner = (
  command: readonly string[],
  cwd: string,
  timeoutMs: number,
) => Promise<DatabaseCommandResult>;

/** Whether a database CLI invocation failed in Aspire's bundled-NuGet preparation path. */
export function isRetryableDatabaseRestoreFailure(result: DatabaseCommandResult): boolean {
  const output = `${result.stdout}\n${result.stderr}`;
  return (result.code === 6 &&
    RESTORE_CANCELED_MARKERS.every((marker) => output.includes(marker))) ||
    (result.code === 2 &&
      RESTORE_START_TIMEOUT_MARKERS.every((marker) => output.includes(marker)));
}

/** Run the three documented database commands, retrying only classified Aspire restore failures. */
export async function runBoundedDatabaseWalk(
  cliSpecifier: string,
  projectRoot: string,
  run: DatabaseCommandRunner = runDatabaseCommand,
): Promise<void> {
  const commands = [
    ['db', 'init', '--project-root', '.', '--db', 'postgres', '--name', 'init'],
    ['db', 'generate', '--project-root', '.', '--db', 'postgres'],
    ['db', 'seed', '--project-root', '.', '--db', 'postgres'],
  ] as const;

  for (const args of commands) {
    const command = [
      'deno',
      'run',
      '-A',
      '--minimum-dependency-age=0',
      cliSpecifier,
      ...args,
    ];
    for (let attempt = 1; attempt <= DB_RESTORE_MAX_ATTEMPTS; attempt++) {
      const result = await run(command, projectRoot, DB_COMMAND_TIMEOUT_MS);
      if (result.stdout) console.info(result.stdout);
      if (result.code === 0) break;
      if (!isRetryableDatabaseRestoreFailure(result) || attempt === DB_RESTORE_MAX_ATTEMPTS) {
        const classification = isRetryableDatabaseRestoreFailure(result)
          ? 'quickstart.database.aspire-restore.infrastructure:#1227'
          : 'quickstart.database.product-failure';
        throw new Error(`${classification}: ${args[1]} failed (${result.code}): ${result.stderr}`);
      }
      console.warn(
        `Aspire bundled NuGet restore failed during db ${args[1]}; retrying (${
          attempt + 1
        }/${DB_RESTORE_MAX_ATTEMPTS}).`,
      );
    }
  }
}

async function runDatabaseCommand(
  command: readonly string[],
  cwd: string,
  timeoutMs: number,
): Promise<DatabaseCommandResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const [executable, ...args] = command;
    const output = await new Deno.Command(executable, {
      args,
      cwd,
      env: { ASPIRE_CLI_START_TIMEOUT: DB_APPHOST_START_TIMEOUT_SECONDS },
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
    if (!(error instanceof DOMException) || error.name !== 'AbortError') throw error;
    return {
      code: 124,
      stdout: '',
      stderr: 'Command exceeded its 120s outer bound.',
      timedOut: true,
    };
  } finally {
    clearTimeout(timeout);
  }
}

if (import.meta.main) {
  const [cliSpecifier, projectRoot] = Deno.args;
  if (!cliSpecifier || !projectRoot) throw new Error('cliSpecifier and projectRoot are required');
  await runBoundedDatabaseWalk(cliSpecifier, projectRoot);
}
