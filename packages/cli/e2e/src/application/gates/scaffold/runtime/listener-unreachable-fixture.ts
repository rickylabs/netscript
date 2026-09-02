import type { DatabaseEngine } from '../../../../domain/extension-axes.ts';
import {
  LISTENER_FAULT_ACK_FILE,
  LISTENER_FAULT_STATE_FILE,
  type ListenerFaultState,
  parseListenerFaultState,
  TEST_ONLY_GARNET_HEALTH_KEY,
  TEST_ONLY_POSTGRES_HEALTH_KEY,
} from './listener-fault-controller.ts';
import {
  type ListenerFaultExpectation,
  listenerFaultExpectations,
  parseListenerFaultDatabase,
} from './listener-readiness-gates.ts';
import {
  type ListenerHealthReport,
  readListenerHealthReport,
} from './verify-listener-readiness.ts';
import { type ResourceUpdate, watchResourceUpdates } from './resource-state-stream.ts';

/** Test-failure ceiling for the fixture-owned file-controller acknowledgement protocol. */
const CONTROLLER_ACK_DEADLINE_MS = 5_000;
/** Sampling interval for the fixture-owned acknowledgement file, not Aspire resource state. */
const CONTROLLER_ACK_POLL_MS = 50;
/**
 * Test-failure ceiling for coarse initial readiness before D-101 subscribes and induces a change.
 * It bounds a hung setup; it is not an assumed Aspire readiness schedule.
 */
const BASELINE_READY_FAILURE_CEILING_SECONDS = 120;
/**
 * Test-failure ceiling for a follower that hangs without emitting the induced transition.
 * The stream returns on the event; this value never defines how long Aspire is expected to take.
 */
const RESOURCE_TRANSITION_FAILURE_CEILING_MS = 120_000;

interface ListenerRecoveryReceipt {
  readonly resource: string;
  readonly healthCheckKey: string;
  readonly realHealthCheckKey: string;
  readonly baseline: {
    readonly testOnly: ListenerHealthReport;
    readonly realBacking: readonly ListenerHealthReport[];
  };
  readonly unhealthy: ListenerHealthReport;
  readonly recovered: ListenerHealthReport;
  readonly transitionEvidence: {
    readonly departure: TransitionEvidenceSource;
    readonly recovery: TransitionEvidenceSource;
  };
  readonly realKeyContinuity: {
    readonly duringFailure: readonly ListenerHealthReport[];
    readonly afterRecovery: readonly ListenerHealthReport[];
  };
}

type TransitionEvidenceSource = 'follow-event' | 'post-transition-snapshot';

interface AspireResult {
  readonly code: number;
  readonly success: boolean;
  readonly stdout: string;
  readonly stderr: string;
}

/**
 * Exercise D-101's harness-owned close → Unhealthy → reopen → Healthy transition flow.
 *
 * The backing Postgres/Garnet resources never stop or pause. An Aspire-managed E2E task owns two
 * synthetic listeners and applies revisioned file commands, so the fixture exercises the exact
 * shipped TCP/RESP health factories without Docker, signals, relays, or resource lifecycle calls.
 */
export async function verifyListenerFailureRecovery(
  appHost: string,
  projectRoot: string,
  database: DatabaseEngine,
): Promise<readonly ListenerRecoveryReceipt[]> {
  const expectations = listenerFaultExpectations(database);
  for (const expectation of expectations) assertOwnedListenerFaultExpectation(expectation);

  const baselines: ListenerReportPair[] = [];
  for (const expectation of expectations) {
    await requireResourceHealthy(
      appHost,
      expectation.resource,
      BASELINE_READY_FAILURE_CEILING_SECONDS,
    );
    baselines.push(await baselineReports(appHost, expectation));
  }
  await commandListenerFaultController(projectRoot, { postgresOpen: true, garnetOpen: true });

  const receipts: ListenerRecoveryReceipt[] = [];
  let primaryFailure: unknown;
  let cleanupFailure: unknown;
  try {
    for (let index = 0; index < expectations.length; index += 1) {
      const expectation = expectations[index];
      const subscription = await watchResourceUpdates(appHost, expectation.resource);
      try {
        await commandListenerFaultController(projectRoot, closedState(expectation));
        const departure = await subscription.waitFor(
          (update) => resourceHealthIs(update, 'Unhealthy'),
          RESOURCE_TRANSITION_FAILURE_CEILING_MS,
        );
        const unhealthyEvidence = await reportsAfterTransition(
          appHost,
          departure,
          expectation,
          'Unhealthy',
        );

        await commandListenerFaultController(projectRoot, reopenedState(expectation));
        const recovery = await subscription.waitFor(
          (update) => resourceHealthIs(update, 'Healthy'),
          RESOURCE_TRANSITION_FAILURE_CEILING_MS,
        );
        const recoveredEvidence = await reportsAfterTransition(
          appHost,
          recovery,
          expectation,
          'Healthy',
        );
        receipts.push({
          resource: expectation.resource,
          healthCheckKey: expectation.healthCheckKey,
          realHealthCheckKey: expectation.realHealthCheckKey,
          baseline: {
            testOnly: baselines[index].testOnly,
            realBacking: [baselines[index].realBacking],
          },
          unhealthy: unhealthyEvidence.testOnly,
          recovered: recoveredEvidence.testOnly,
          transitionEvidence: {
            departure: unhealthyEvidence.source,
            recovery: recoveredEvidence.source,
          },
          realKeyContinuity: {
            duringFailure: [unhealthyEvidence.realBacking],
            afterRecovery: [recoveredEvidence.realBacking],
          },
        });
      } finally {
        await subscription.close();
      }
    }
  } catch (error) {
    primaryFailure = error;
  } finally {
    try {
      await commandListenerFaultController(projectRoot, { postgresOpen: true, garnetOpen: true });
    } catch (error) {
      cleanupFailure = error;
    }
  }
  if (primaryFailure && cleanupFailure) {
    throw new AggregateError(
      [primaryFailure, cleanupFailure],
      'listener recovery failed and the controller could not reopen every listener',
    );
  }
  if (primaryFailure) throw primaryFailure;
  if (cleanupFailure) throw cleanupFailure;

  const receiptDir = `${projectRoot}/.netscript/e2e`;
  const receiptPath = `${receiptDir}/listener-unreachable-receipt.json`;
  await Deno.mkdir(receiptDir, { recursive: true });
  await Deno.writeTextFile(receiptPath, `${JSON.stringify(receipts, null, 2)}\n`);
  console.info(`listener failure/recovery receipt: ${receiptPath}`);
  return receipts;
}

function closedState(
  expectation: ListenerFaultExpectation,
): Pick<ListenerFaultState, 'postgresOpen' | 'garnetOpen'> {
  assertOwnedListenerFaultExpectation(expectation);
  return expectation.controllerListener === 'postgres'
    ? { postgresOpen: false, garnetOpen: true }
    : { postgresOpen: true, garnetOpen: false };
}

function reopenedState(
  expectation: ListenerFaultExpectation,
): Pick<ListenerFaultState, 'postgresOpen' | 'garnetOpen'> {
  assertOwnedListenerFaultExpectation(expectation);
  return { postgresOpen: true, garnetOpen: true };
}

/** Fail closed unless a target is one of D-101's two hardcoded test-only checks. */
export function assertOwnedListenerFaultExpectation(
  expectation: ListenerFaultExpectation,
): void {
  const ownedPostgres = expectation.controllerListener === 'postgres' &&
    expectation.resource === 'postgres' &&
    expectation.healthCheckKey === TEST_ONLY_POSTGRES_HEALTH_KEY &&
    expectation.realHealthCheckKey === 'postgres_listener';
  const ownedGarnet = expectation.controllerListener === 'garnet' &&
    expectation.resource === 'garnet' &&
    expectation.healthCheckKey === TEST_ONLY_GARNET_HEALTH_KEY &&
    expectation.realHealthCheckKey === 'garnet_resp';
  if (!ownedPostgres && !ownedGarnet) {
    throw new Error('listener fault fixture refused a non-test-only health-check target');
  }
}

/**
 * The listener health checks carry a structured failure code in the report's data bag alongside a
 * human-readable description. Assert on the code whenever it is present: the description is
 * diagnostic prose and has already been reworded once (`unreachable` -> `unhealthy`, gaining
 * host/port/elapsed detail), which broke this gate while the behaviour under test was correct.
 * The description stays a fallback for report shapes that carry no data bag, and now tolerates
 * both wordings.
 */
const EXPECTED_FAILURE_CODES = ['ECONNREFUSED', 'ETIMEDOUT'] as const;

/**
 * The structured failure code the listener health checks publish in the report's data bag.
 *
 * `malformed` is distinguished from `absent` so a present-but-non-string `code` fails closed rather
 * than silently falling through to the description, which is weaker evidence.
 */
type FailureCodeLookup =
  | { readonly kind: 'string'; readonly code: string }
  | { readonly kind: 'malformed' }
  | { readonly kind: 'absent' };

function readFailureCode(report: ListenerHealthReport): FailureCodeLookup {
  const data = report.data;
  if (typeof data !== 'object' || data === null || !('code' in data)) return { kind: 'absent' };
  const code = Reflect.get(data, 'code');
  return typeof code === 'string' ? { kind: 'string', code } : { kind: 'malformed' };
}

/**
 * Description fallback for report shapes that carry no data bag.
 *
 * Anchored at the start and closed with a non-word lookahead on purpose. The RESP description
 * embeds arbitrary received bytes (`received="..."`), so an unanchored pattern accepts a genuinely
 * wrong failure whose diagnostic payload merely quotes an expected code — and without the lookahead
 * `ECONNREFUSED_BOGUS` matches `ECONNREFUSED`. Both were real holes.
 */
function expectedUnhealthyDescription(expectation: ListenerFaultExpectation): RegExp {
  const listener = expectation.controllerListener === 'postgres' ? 'tcp' : 'RESP';
  return new RegExp(
    `^${listener} listener (?:unreachable|unhealthy): (?:${
      EXPECTED_FAILURE_CODES.join('|')
    })(?=$|\\s)`,
  );
}

/** True when the report names one of the expected socket failures, by code or by description. */
export function matchesExpectedFailure(
  report: ListenerHealthReport,
  expectation: ListenerFaultExpectation,
): boolean {
  // Status is checked here rather than trusted from the caller: a Healthy report carrying a stale
  // ECONNREFUSED data bag would otherwise satisfy the assertion on any path that forgot the guard.
  if (report.status !== 'Unhealthy') return false;
  const found = readFailureCode(report);
  if (found.kind === 'malformed') return false;
  if (found.kind === 'string') {
    return (EXPECTED_FAILURE_CODES as readonly string[]).includes(found.code);
  }
  return report.description !== undefined &&
    expectedUnhealthyDescription(expectation).test(report.description);
}

/** Require D-101's structured socket-failure code, with prose only as a legacy fallback. */
export function assertExpectedListenerFailure(
  report: ListenerHealthReport,
  expectation: ListenerFaultExpectation,
): void {
  if (matchesExpectedFailure(report, expectation)) return;
  throw new Error(
    `${expectation.resource} healthReports.${expectation.healthCheckKey} went Unhealthy but ` +
      `neither its failure code nor its description names ` +
      `${EXPECTED_FAILURE_CODES.join(' or ')}: ${report.description ?? '(no description)'}`,
  );
}

/** Block on Aspire's own wait until it observes the resource healthy; fail loudly if it does not. */
async function requireResourceHealthy(
  appHost: string,
  resource: string,
  timeoutSeconds: number,
): Promise<void> {
  const result = await runAspire([
    'wait',
    resource,
    '--status',
    'healthy',
    '--timeout',
    String(timeoutSeconds),
    '--apphost',
    appHost,
    '--non-interactive',
    '--nologo',
  ]);
  if (result.code === 0) return;
  throw new Error(
    `aspire wait ${resource} --status healthy did not observe healthy within ${timeoutSeconds}s ` +
      `(exit ${result.code}); this is Aspire's own observation, not a polling deadline: ` +
      `${result.stderr.trim() || result.stdout.trim()}`,
  );
}

interface ListenerReportPair {
  readonly testOnly: ListenerHealthReport;
  readonly realBacking: ListenerHealthReport;
}

interface TransitionReports extends ListenerReportPair {
  readonly source: TransitionEvidenceSource;
}

function resourceHealthIs(update: ResourceUpdate, expected: 'Healthy' | 'Unhealthy'): boolean {
  const healthStatus = update.resource.healthStatus;
  if (typeof healthStatus !== 'string') {
    throw new Error(
      `Aspire follow update for the scoped resource has no string healthStatus; raw line: ` +
        update.rawLine,
    );
  }
  return healthStatus.toLowerCase() === expected.toLowerCase();
}

/**
 * Attribute a transition from its rich event when possible, otherwise from one settled snapshot.
 *
 * The snapshot fallback never discovers the transition: the follower already emitted the expected
 * aggregate health state. Reading once here only obtains the undocumented per-check report needed
 * for the structured failure-code and real-backing assertions; it must never become a poll loop.
 */
async function reportsAfterTransition(
  appHost: string,
  update: ResourceUpdate,
  expectation: ListenerFaultExpectation,
  expected: 'Healthy' | 'Unhealthy',
): Promise<TransitionReports> {
  const eventHasReports = carriesReports(update, [
    expectation.healthCheckKey,
    expectation.realHealthCheckKey,
  ]);
  const source: TransitionEvidenceSource = eventHasReports
    ? 'follow-event'
    : 'post-transition-snapshot';
  const topology = eventHasReports
    ? { resources: [update.resource] }
    : JSON.parse(await describeResource(appHost, expectation.resource));
  const testOnly = readListenerHealthReport(
    topology,
    expectation.resource,
    expectation.healthCheckKey,
  );
  if (testOnly.status !== expected) {
    throw new Error(
      `${expectation.resource} healthReports.${expectation.healthCheckKey} is ${testOnly.status}, ` +
        `expected ${expected} after the follow stream emitted aggregate ${expected}: ` +
        `${testOnly.description ?? '(no description)'}`,
    );
  }
  if (expected === 'Unhealthy') assertExpectedListenerFailure(testOnly, expectation);

  const realBacking = readListenerHealthReport(
    topology,
    expectation.resource,
    expectation.realHealthCheckKey,
  );
  if (realBacking.status !== 'Healthy') {
    throw new Error(
      `${expectation.resource} real backing health ${expectation.realHealthCheckKey} changed to ` +
        realBacking.status,
    );
  }
  console.info(
    `${expectation.resource} ${expected} transition attributed from ${source}`,
  );
  return { testOnly, realBacking, source };
}

function carriesReports(update: ResourceUpdate, keys: readonly string[]): boolean {
  const reports = update.resource.healthReports;
  return isRecord(reports) && keys.every((key) => Object.hasOwn(reports, key));
}

/** Read the initial per-check baseline once after coarse readiness has settled. */
async function baselineReports(
  appHost: string,
  expectation: ListenerFaultExpectation,
): Promise<ListenerReportPair> {
  const topology = JSON.parse(await describeResource(appHost, expectation.resource));
  const testOnly = readListenerHealthReport(
    topology,
    expectation.resource,
    expectation.healthCheckKey,
  );
  if (testOnly.status !== 'Healthy') {
    throw new Error(
      `${expectation.resource} healthReports.${expectation.healthCheckKey} is ${testOnly.status}, ` +
        `expected Healthy after Aspire settled: ${testOnly.description ?? '(no description)'}`,
    );
  }
  const realBacking = readListenerHealthReport(
    topology,
    expectation.resource,
    expectation.realHealthCheckKey,
  );
  if (realBacking.status !== 'Healthy') {
    throw new Error(
      `${expectation.resource} real backing health ${expectation.realHealthCheckKey} changed to ` +
        realBacking.status,
    );
  }
  return { testOnly, realBacking };
}

export async function commandListenerFaultController(
  projectRoot: string,
  desired: Pick<ListenerFaultState, 'postgresOpen' | 'garnetOpen'>,
): Promise<ListenerFaultState> {
  const statePath = `${projectRoot}/${LISTENER_FAULT_STATE_FILE}`;
  const current = parseListenerFaultState(await Deno.readTextFile(statePath));
  const next: ListenerFaultState = {
    revision: current.revision + 1,
    ...desired,
  };
  await writeJsonAtomically(statePath, next);

  const acknowledgementPath = `${projectRoot}/${LISTENER_FAULT_ACK_FILE}`;
  const deadline = Date.now() + CONTROLLER_ACK_DEADLINE_MS;
  while (Date.now() < deadline) {
    try {
      const acknowledged = parseListenerFaultState(await Deno.readTextFile(acknowledgementPath));
      if (acknowledged.revision === next.revision) {
        if (
          acknowledged.postgresOpen !== next.postgresOpen ||
          acknowledged.garnetOpen !== next.garnetOpen
        ) {
          throw new Error(`listener controller acknowledged revision ${next.revision} incorrectly`);
        }
        return acknowledged;
      }
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
    await delay(CONTROLLER_ACK_POLL_MS);
  }
  throw new Error(
    `listener controller did not acknowledge revision ${next.revision} within ` +
      `${CONTROLLER_ACK_DEADLINE_MS}ms`,
  );
}

async function writeJsonAtomically(path: string, value: unknown): Promise<void> {
  const temporary = `${path}.tmp-${Deno.pid}`;
  await Deno.writeTextFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await Deno.rename(temporary, path);
}

async function describeResource(appHost: string, resource: string): Promise<string> {
  return (await requireAspireSuccess([
    'describe',
    resource,
    '--apphost',
    appHost,
    '--format',
    'Json',
    '--non-interactive',
    '--nologo',
  ])).stdout;
}

async function requireAspireSuccess(args: readonly string[]): Promise<AspireResult> {
  const result = await runAspire(args);
  if (!result.success) {
    throw new Error(
      `aspire ${args.join(' ')} failed (${result.code}): ${result.stderr || result.stdout}`,
    );
  }
  return result;
}

async function runAspire(args: readonly string[]): Promise<AspireResult> {
  const output = await new Deno.Command('aspire', {
    args: [...args],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  return {
    code: output.code,
    success: output.success,
    stdout: new TextDecoder().decode(output.stdout).trim(),
    stderr: new TextDecoder().decode(output.stderr).trim(),
  };
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

if (import.meta.main) {
  const appHost = Deno.args[0];
  const projectRoot = Deno.args[1];
  const database = Deno.args[2];
  if (!appHost) throw new Error('AppHost path argument is required');
  if (!projectRoot) throw new Error('project root argument is required');
  if (!database) throw new Error('database argument is required');
  await verifyListenerFailureRecovery(
    appHost,
    projectRoot,
    parseListenerFaultDatabase(database),
  );
}
