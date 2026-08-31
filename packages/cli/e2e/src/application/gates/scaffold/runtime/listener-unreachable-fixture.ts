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

const REPORT_DEADLINE_MS = 30_000;
const REPORT_POLL_MS = 1_000;
const CONTROLLER_ACK_DEADLINE_MS = 5_000;
const CONTROLLER_ACK_POLL_MS = 50;
const HEALTHY_WAIT_TIMEOUT_SECONDS = 10;
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

  const baselineTests = await Promise.all(
    expectations.map((expectation) => pollHealthyReport(appHost, expectation, expectations)),
  );
  const baselineReal = await requireRealBackingHealthy(appHost, expectations);
  await commandController(projectRoot, { postgresOpen: true, garnetOpen: true });

  const receipts: ListenerRecoveryReceipt[] = [];
  let primaryFailure: unknown;
  let cleanupFailure: unknown;
  try {
    for (let index = 0; index < expectations.length; index += 1) {
      const expectation = expectations[index];
      await commandController(projectRoot, closedState(expectation));
      const unhealthy = await pollReport(
        appHost,
        expectation,
        expectations,
        (report) =>
          report.status === 'Unhealthy' &&
          report.description !== undefined &&
          expectedUnhealthyDescription(expectation).test(report.description),
      );
      const duringFailure = await requireRealBackingHealthy(appHost, expectations);

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
      const afterWait = await requireRealBackingHealthy(appHost, expectations);

      await commandController(projectRoot, reopenedState(expectation));
      const recovered = await pollHealthyReport(appHost, expectation, expectations);
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

async function pollHealthyReport(
  appHost: string,
  expectation: ListenerFaultExpectation,
  continuity: readonly ListenerFaultExpectation[],
): Promise<ListenerHealthReport> {
  return await pollReport(
    appHost,
    expectation,
    continuity,
    (report) => report.status === 'Healthy',
  );
}

async function pollReport(
  appHost: string,
  expectation: ListenerFaultExpectation,
  continuity: readonly ListenerFaultExpectation[],
  accepts: (report: ListenerHealthReport) => boolean,
): Promise<ListenerHealthReport> {
  const deadline = Date.now() + REPORT_DEADLINE_MS;
  let last = 'report absent';
  while (Date.now() < deadline) {
    let topology: unknown;
    try {
      topology = JSON.parse(await describe(appHost));
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
      await delay(REPORT_POLL_MS);
      continue;
    }
    assertRealBackingHealthy(topology, continuity);
    try {
      const report = readListenerHealthReport(
        topology,
        expectation.resource,
        expectation.healthCheckKey,
      );
      last = `${report.status}: ${report.description ?? '(no description)'}`;
      if (accepts(report)) return report;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await delay(REPORT_POLL_MS);
  }
  throw new Error(
    `${expectation.resource} healthReports.${expectation.healthCheckKey} missed its 30s transition; last=${last}`,
  );
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
