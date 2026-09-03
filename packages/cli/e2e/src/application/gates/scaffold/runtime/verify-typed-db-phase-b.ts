import type { DatabaseEngine } from '../../../../domain/extension-axes.ts';
import { TEST_ONLY_POSTGRES_HEALTH_KEY } from './listener-fault-controller.ts';
import {
  type ListenerFaultExpectation,
  listenerFaultExpectations,
  parseListenerFaultDatabase,
} from './listener-readiness-gates.ts';
import {
  commandListenerFaultController,
  type InducedDepartureEvidence,
  observeInducedListenerDeparture,
} from './listener-unreachable-fixture.ts';

/** Bound on the NetScript CLI's own database wait; the Unhealthy departure is not on this clock. */
const WAIT_TIMEOUT_SECONDS = 10;

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
  database: DatabaseEngine,
): Promise<void> {
  if (database === 'sqlite') throw new Error('S8 Phase-B requires a listener-backed database');
  const expectation = ownedPostgresExpectation(database);
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

  let listenerFaulted = false;
  let departure: InducedDepartureEvidence | undefined;
  let boundedFailure: CommandResult | undefined;
  try {
    // Subscribe to the scoped resource stream before commanding the close, then wait for the
    // aggregate Unhealthy event under the fixture's shared test-failure ceiling. Canary 6 (run
    // 33684157301) timed out here on a private 30s poll while the listener-unreachable gate had
    // observed the same departure moments earlier: Aspire's re-evaluation cadence is not ours.
    departure = await observeInducedListenerDeparture(appHost, expectation, async () => {
      await commandListenerFaultController(projectRoot, {
        postgresOpen: false,
        garnetOpen: true,
      });
      listenerFaulted = true;
    });
    // #1720 A4 / #863 name `netscript db init` as the exact command that must exit bounded
    // against an Unhealthy-but-Running Postgres. `db migrate` exercised a different code path
    // and did not prove the acceptance box.
    boundedFailure = await runCommand(
      'deno',
      [
        'run',
        '-A',
        cliEntrypoint,
        'db',
        'init',
        '--project-root',
        projectRoot,
        '--db',
        database,
        '--name',
        'init',
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
    if (listenerFaulted) {
      await commandListenerFaultController(projectRoot, {
        postgresOpen: true,
        garnetOpen: true,
      });
    }
  }

  if (!departure || !boundedFailure) {
    throw new Error('bounded unhealthy database evidence was not captured');
  }
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
    unhealthy: {
      status: `${departure.testOnly.status}: ${
        departure.testOnly.description ?? '(no description)'
      }`,
      healthCheckKey: expectation.healthCheckKey,
      failureCode: readFailureCode(departure.testOnly.data),
      realBacking: { key: expectation.realHealthCheckKey, status: departure.realBacking.status },
      transitionEvidence: departure.source,
      departureCeilingMs: departure.departureCeilingMs,
      timeoutSeconds: WAIT_TIMEOUT_SECONDS,
    },
    boundedFailure,
    appHostCount: { before, after },
  };
  const receiptDir = `${projectRoot}/.netscript/e2e`;
  const receiptPath = `${receiptDir}/typed-db-phase-b-receipt.json`;
  await Deno.mkdir(receiptDir, { recursive: true });
  await Deno.writeTextFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
  console.info(`typed database Phase-B receipt: ${receiptPath}`);
}

/** Phase-B only faults the controller-owned Postgres listener; refuse anything else. */
function ownedPostgresExpectation(database: DatabaseEngine): ListenerFaultExpectation {
  const expectation = listenerFaultExpectations(database).find((candidate) =>
    candidate.controllerListener === 'postgres' &&
    candidate.healthCheckKey === TEST_ONLY_POSTGRES_HEALTH_KEY
  );
  if (!expectation) {
    throw new Error(`S8 Phase-B has no controller-owned Postgres listener for ${database}`);
  }
  return expectation;
}

function readFailureCode(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null) return undefined;
  const code = Reflect.get(data, 'code');
  return typeof code === 'string' ? code : undefined;
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
    throw new Error(formatCommandFailure('aspire', args, result));
  }
  return result;
}

/** Format a failed command without allowing one captured stream to mask the other. */
export function formatCommandFailure(
  executable: string,
  args: readonly string[],
  result: CommandResult,
): string {
  const streams = [
    result.stderr ? `stderr:\n${result.stderr}` : '',
    result.stdout ? `stdout:\n${result.stdout}` : '',
  ].filter((stream) => stream.length > 0);
  const detail = streams.join('\n') || '(no captured output)';
  return `${executable} ${args.join(' ')} failed (${result.code}):\n${detail}`;
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
  await verifyTypedDbPhaseB(
    appHost,
    projectRoot,
    cliEntrypoint,
    parseListenerFaultDatabase(database),
  );
}
