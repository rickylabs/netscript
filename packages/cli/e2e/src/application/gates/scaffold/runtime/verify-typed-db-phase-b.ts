import { readListenerHealthReport } from './evidence/listener-readiness.ts';

const WAIT_TIMEOUT_SECONDS = 10;
const REPORT_DEADLINE_MS = 30_000;
const REPORT_POLL_MS = 1_000;
const UNHEALTHY_DESCRIPTION = /listener unreachable: (?:ECONNREFUSED|ETIMEDOUT)/;

interface CommandResult {
  readonly code: number;
  readonly success: boolean;
  readonly stdout: string;
  readonly stderr: string;
  readonly durationMs: number;
}

/** Execute the lease-backed S8 runtime acceptance and write one structured receipt. */
export async function verifyTypedDbPhaseB(
  appHost: string,
  projectRoot: string,
  cliEntrypoint: string,
  database: string,
): Promise<void> {
  if (database === 'sqlite') throw new Error('S8 Phase-B requires a listener-backed database');
  const resource = `${database}-cli`;
  const before = await countMatchingAppHosts(appHost);
  if (before !== 1) {
    throw new Error(`expected one resident AppHost for ${appHost}, found ${before}`);
  }

  const help = await requireAspireSuccess([
    'resource',
    resource,
    '--help',
    '--apphost',
    appHost,
    '--non-interactive',
    '--nologo',
  ]);
  requireText(help.stdout, ['migrate', 'seed', 'reset'], 'typed resource help');
  const migrateHelp = await requireAspireSuccess([
    'resource',
    resource,
    'migrate',
    '--help',
    '--apphost',
    appHost,
    '--non-interactive',
    '--nologo',
  ]);
  requireText(migrateHelp.stdout, ['--timeout'], 'migrate help');
  const resetHelp = await requireAspireSuccess([
    'resource',
    resource,
    'reset',
    '--help',
    '--apphost',
    appHost,
    '--non-interactive',
    '--nologo',
  ]);
  requireText(resetHelp.stdout, ['--timeout', '--confirm'], 'reset help');

  const migrate = await requireAspireSuccess([
    'resource',
    resource,
    'migrate',
    '--timeout',
    '60',
    '--apphost',
    appHost,
    '--non-interactive',
    '--nologo',
  ]);

  const resetWithoutConfirm = await runAspire([
    'resource',
    resource,
    'reset',
    '--apphost',
    appHost,
    '--non-interactive',
    '--nologo',
  ]);
  if (resetWithoutConfirm.success) {
    throw new Error(`${resource} reset succeeded without --confirm true`);
  }
  requireText(
    `${resetWithoutConfirm.stdout}\n${resetWithoutConfirm.stderr}`,
    ['confirm'],
    'reset refusal',
  );

  let stopped = false;
  let unhealthyStatus = '';
  let boundedFailure: CommandResult | undefined;
  try {
    await requireAspireSuccess([
      'resource',
      database,
      'stop',
      '--apphost',
      appHost,
      '--non-interactive',
      '--nologo',
    ]);
    stopped = true;
    unhealthyStatus = await waitForListenerUnhealthy(appHost, database);
    boundedFailure = await runCommand(
      'deno',
      [
        'run',
        '-A',
        cliEntrypoint,
        'db',
        'migrate',
        '--db',
        database,
        '--project-root',
        projectRoot,
      ],
      projectRoot,
      { ASPIRE_CLI_START_TIMEOUT: String(WAIT_TIMEOUT_SECONDS) },
    );
    if (boundedFailure.success) {
      throw new Error('NetScript database operation succeeded while listener health was Unhealthy');
    }
    if (boundedFailure.durationMs > (WAIT_TIMEOUT_SECONDS + 10) * 1_000) {
      throw new Error(`bounded database wait took ${boundedFailure.durationMs}ms`);
    }
    requireText(
      `${boundedFailure.stdout}\n${boundedFailure.stderr}`,
      [database, String(WAIT_TIMEOUT_SECONDS)],
      'bounded database wait diagnostic',
    );
  } finally {
    if (stopped) {
      await requireAspireSuccess([
        'resource',
        database,
        'start',
        '--apphost',
        appHost,
        '--non-interactive',
        '--nologo',
      ]);
    }
  }

  if (!boundedFailure) throw new Error('bounded unhealthy database evidence was not captured');
  const after = await countMatchingAppHosts(appHost);
  if (after !== before) {
    throw new Error(`resident AppHost count changed from ${before} to ${after}`);
  }

  const receipt = {
    resource,
    help: {
      resource: { code: help.code, stdout: help.stdout },
      migrate: { code: migrateHelp.code, stdout: migrateHelp.stdout },
      reset: { code: resetHelp.code, stdout: resetHelp.stdout },
    },
    migrate: { code: migrate.code, stdout: migrate.stdout, stderr: migrate.stderr },
    resetWithoutConfirm: {
      code: resetWithoutConfirm.code,
      stdout: resetWithoutConfirm.stdout,
      stderr: resetWithoutConfirm.stderr,
    },
    unhealthy: { status: unhealthyStatus, timeoutSeconds: WAIT_TIMEOUT_SECONDS },
    boundedFailure,
    appHostCount: { before, after },
  };
  const receiptDir = `${projectRoot}/.netscript/e2e`;
  const receiptPath = `${receiptDir}/typed-db-phase-b-receipt.json`;
  await Deno.mkdir(receiptDir, { recursive: true });
  await Deno.writeTextFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  console.info(`typed database Phase-B receipt: ${receiptPath}`);
}

async function waitForListenerUnhealthy(appHost: string, database: string): Promise<string> {
  const healthCheckKey = `${database}_listener`;
  const deadline = Date.now() + REPORT_DEADLINE_MS;
  let last = 'report absent';
  while (Date.now() < deadline) {
    try {
      const describe = await requireAspireSuccess([
        'describe',
        '--apphost',
        appHost,
        '--format',
        'Json',
        '--non-interactive',
        '--nologo',
      ]);
      const report = readListenerHealthReport(
        JSON.parse(describe.stdout),
        database,
        healthCheckKey,
      );
      last = `${report.status}: ${report.description ?? '(no description)'}`;
      if (
        report.status === 'Unhealthy' && report.description !== undefined &&
        UNHEALTHY_DESCRIPTION.test(report.description)
      ) return last;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, REPORT_POLL_MS));
  }
  throw new Error(`${database} did not become listener-Unhealthy; last=${last}`);
}

async function countMatchingAppHosts(appHost: string): Promise<number> {
  const ps = await requireAspireSuccess([
    'ps',
    '--format',
    'Json',
    '--non-interactive',
    '--nologo',
  ]);
  const parsed: unknown = JSON.parse(ps.stdout);
  if (!Array.isArray(parsed)) throw new Error('aspire ps JSON was not an array');
  return parsed.filter((entry) => {
    if (typeof entry !== 'object' || entry === null) return false;
    const candidate = Reflect.get(entry, 'appHostPath');
    return typeof candidate === 'string' && normalizePath(candidate) === normalizePath(appHost);
  }).length;
}

async function requireAspireSuccess(args: readonly string[]): Promise<CommandResult> {
  const result = await runAspire(args);
  if (!result.success) {
    throw new Error(
      `aspire ${args.join(' ')} failed (${result.code}): ${result.stderr || result.stdout}`,
    );
  }
  return result;
}

function runAspire(args: readonly string[]): Promise<CommandResult> {
  return runCommand('aspire', args);
}

async function runCommand(
  executable: string,
  args: readonly string[],
  cwd?: string,
  env?: Readonly<Record<string, string>>,
): Promise<CommandResult> {
  const startedAt = performance.now();
  const output = await new Deno.Command(executable, {
    args: [...args],
    cwd,
    env,
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: output.code,
    success: output.success,
    stdout: new TextDecoder().decode(output.stdout).trim(),
    stderr: new TextDecoder().decode(output.stderr).trim(),
    durationMs: Math.round(performance.now() - startedAt),
  };
}

function requireText(output: string, expected: readonly string[], label: string): void {
  const lower = output.toLowerCase();
  for (const value of expected) {
    if (!lower.includes(value.toLowerCase())) {
      throw new Error(`${label} omitted ${value}: ${output}`);
    }
  }
}

function normalizePath(path: string): string {
  return path.replaceAll('/', '\\').toLowerCase();
}

if (import.meta.main) {
  const [appHost, projectRoot, cliEntrypoint, database] = Deno.args;
  if (!appHost || !projectRoot || !cliEntrypoint || !database) {
    throw new Error('expected apphost, project root, CLI entrypoint, and database arguments');
  }
  await verifyTypedDbPhaseB(appHost, projectRoot, cliEntrypoint, database);
}
