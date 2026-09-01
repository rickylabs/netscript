import { stripAnsiCode } from '@std/fmt/colors';

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

const CONTROLLER_ACK_DEADLINE_MS = 5_000;
const CONTROLLER_ACK_POLL_MS = 50;
const HEALTHY_WAIT_TIMEOUT_SECONDS = 10;
/**
 * Cap for the blocking `aspire wait --status healthy` used to observe recovery.
 *
 * This is a ceiling, not a schedule: `aspire wait` returns the moment Aspire observes the
 * transition, so a generous cap costs nothing on a healthy run and only bounds a genuine hang.
 * It replaces a hand-rolled 30s poll of `aspire describe`, which raced Aspire's own
 * (unobservable, untimestamped) health-evaluation cycle and was the source of #1898-adjacent flakes.
 */
const RECOVERY_WAIT_TIMEOUT_SECONDS = 120;
export const HEALTHY_WAIT_TIMEOUT_EXIT_CODE = 17;

interface ListenerRecoveryReceipt {
  readonly resource: string;
  readonly healthCheckKey: string;
  readonly realHealthCheckKey: string;
  readonly baseline: {
    readonly testOnly: ListenerHealthReport;
    readonly realBacking: readonly ListenerHealthReport[];
  };
  readonly unhealthy: ListenerHealthReport;
  readonly healthyWaitTimeoutExitCode: number;
  readonly healthyWaitTimeoutDiagnostic: string;
  readonly recovered: ListenerHealthReport;
  readonly realKeyContinuity: {
    readonly duringFailure: readonly ListenerHealthReport[];
    readonly afterWait: readonly ListenerHealthReport[];
    readonly afterRecovery: readonly ListenerHealthReport[];
  };
}

export interface AspireWaitResult {
  readonly code: number;
  readonly stdout: string;
  readonly stderr: string;
}

interface AspireResult extends AspireWaitResult {
  readonly success: boolean;
}

/**
 * Exercise D-101's harness-owned close → Unhealthy/wait-timeout → reopen → Healthy flow.
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

  const baselineTests: ListenerHealthReport[] = [];
  for (const expectation of expectations) {
    await requireResourceHealthy(appHost, expectation.resource, RECOVERY_WAIT_TIMEOUT_SECONDS);
    baselineTests.push(await readTestOnlyReport(appHost, expectation, expectations, 'Healthy'));
  }
  const baselineReal = await requireRealBackingHealthy(appHost, expectations);
  await commandController(projectRoot, { postgresOpen: true, garnetOpen: true });

  const receipts: ListenerRecoveryReceipt[] = [];
  let primaryFailure: unknown;
  let cleanupFailure: unknown;
  try {
    for (let index = 0; index < expectations.length; index += 1) {
      const expectation = expectations[index];
      await commandController(projectRoot, closedState(expectation));

      // Detection is Aspire's own blocking wait, not a poll of its cached snapshot: the resource
      // carries this test-only check, so closing the synthetic listener must stop it reaching
      // `healthy`. The timeout here is the assertion - we require it to elapse.
      const wait = await runAspire([
        'wait',
        expectation.resource,
        '--status',
        'healthy',
        '--timeout',
        String(HEALTHY_WAIT_TIMEOUT_SECONDS),
        '--apphost',
        appHost,
        '--non-interactive',
        '--nologo',
      ]);
      const healthyWaitTimeoutDiagnostic = requireHealthyWaitTimeout(
        expectation.resource,
        HEALTHY_WAIT_TIMEOUT_SECONDS,
        wait,
      );
      // Attribution, once, after Aspire has finished evaluating - so the snapshot is known-fresh
      // rather than raced. This is what distinguishes "the listener is down" from "the report is
      // stale", which the previous polling design could not tell apart.
      const unhealthy = await readTestOnlyReport(appHost, expectation, expectations, 'Unhealthy');
      const duringFailure = await requireRealBackingHealthy(appHost, expectations);
      const afterWait = duringFailure;

      await commandController(projectRoot, reopenedState(expectation));
      await requireResourceHealthy(appHost, expectation.resource, RECOVERY_WAIT_TIMEOUT_SECONDS);
      const recovered = await readTestOnlyReport(appHost, expectation, expectations, 'Healthy');
      const afterRecovery = await requireRealBackingHealthy(appHost, expectations);
      receipts.push({
        resource: expectation.resource,
        healthCheckKey: expectation.healthCheckKey,
        realHealthCheckKey: expectation.realHealthCheckKey,
        baseline: { testOnly: baselineTests[index], realBacking: baselineReal },
        unhealthy,
        healthyWaitTimeoutExitCode: wait.code,
        healthyWaitTimeoutDiagnostic,
        recovered,
        realKeyContinuity: { duringFailure, afterWait, afterRecovery },
      });
    }
  } catch (error) {
    primaryFailure = error;
  } finally {
    try {
      await commandController(projectRoot, { postgresOpen: true, garnetOpen: true });
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

/** Require Aspire's documented timeout result for a running resource that remains unhealthy. */
export function requireHealthyWaitTimeout(
  resource: string,
  timeoutSeconds: number,
  wait: AspireWaitResult,
): string {
  const expectedDiagnostic =
    `Timed out waiting for resource '${resource}' to be healthy after ${timeoutSeconds}s.`;
  const output = [wait.stderr, wait.stdout].filter((value) => value.length > 0).join('\n');
  const hasExactDiagnostic = [wait.stderr, wait.stdout].some((stream) =>
    stream.split(/\r?\n/u).some((line) =>
      stripAnsiCode(line).trim().replace(/^❌\s*/u, '') === expectedDiagnostic
    )
  );
  if (
    wait.code !== HEALTHY_WAIT_TIMEOUT_EXIT_CODE ||
    !hasExactDiagnostic
  ) {
    throw new Error(
      `aspire wait ${resource} exited ${wait.code}, expected exit ${HEALTHY_WAIT_TIMEOUT_EXIT_CODE} ` +
        `with diagnostic "${expectedDiagnostic}": ${output || '(no output)'}`,
    );
  }
  return expectedDiagnostic;
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

function expectedUnhealthyDescription(expectation: ListenerFaultExpectation): RegExp {
  return expectation.controllerListener === 'postgres'
    ? /tcp listener unreachable: (?:ECONNREFUSED|ETIMEDOUT)/
    : /RESP listener unreachable: (?:ECONNREFUSED|ETIMEDOUT)/;
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

/**
 * Read the test-only report once and require an exact status.
 *
 * Called only after a blocking `aspire wait` has settled, so the snapshot reflects a completed
 * evaluation. A mismatch here is a real product failure, never a refresh race.
 */
async function readTestOnlyReport(
  appHost: string,
  expectation: ListenerFaultExpectation,
  continuity: readonly ListenerFaultExpectation[],
  expected: 'Healthy' | 'Unhealthy',
): Promise<ListenerHealthReport> {
  const topology = JSON.parse(await describe(appHost));
  assertRealBackingHealthy(topology, continuity);
  const report = readListenerHealthReport(
    topology,
    expectation.resource,
    expectation.healthCheckKey,
  );
  if (report.status !== expected) {
    throw new Error(
      `${expectation.resource} healthReports.${expectation.healthCheckKey} is ${report.status}, ` +
        `expected ${expected} after Aspire settled: ${report.description ?? '(no description)'}`,
    );
  }
  if (expected === 'Unhealthy') {
    const pattern = expectedUnhealthyDescription(expectation);
    if (report.description === undefined || !pattern.test(report.description)) {
      throw new Error(
        `${expectation.resource} healthReports.${expectation.healthCheckKey} is Unhealthy but its ` +
          `description did not match ${pattern}: ${report.description ?? '(no description)'}`,
      );
    }
  }
  return report;
}

async function requireRealBackingHealthy(
  appHost: string,
  expectations: readonly ListenerFaultExpectation[],
): Promise<readonly ListenerHealthReport[]> {
  return assertRealBackingHealthy(JSON.parse(await describe(appHost)), expectations);
}

function assertRealBackingHealthy(
  topology: unknown,
  expectations: readonly ListenerFaultExpectation[],
): readonly ListenerHealthReport[] {
  return expectations.map((expectation) => {
    const report = readListenerHealthReport(
      topology,
      expectation.resource,
      expectation.realHealthCheckKey,
    );
    if (report.status !== 'Healthy') {
      throw new Error(
        `${expectation.resource} real backing health ${expectation.realHealthCheckKey} changed to ${report.status}`,
      );
    }
    return report;
  });
}

async function commandController(
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
  throw new Error(`listener controller did not acknowledge revision ${next.revision} within 5s`);
}

async function writeJsonAtomically(path: string, value: unknown): Promise<void> {
  const temporary = `${path}.tmp-${Deno.pid}`;
  await Deno.writeTextFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
  await Deno.rename(temporary, path);
}

async function describe(appHost: string): Promise<string> {
  return (await requireAspireSuccess([
    'describe',
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
