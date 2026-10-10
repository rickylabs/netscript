/**
 * #1726 runtime proof: a wrong PostgreSQL password is reported as an auth-classified
 * `Unhealthy` credential check while the listener stays Healthy, `aspire wait` exits 18,
 * and neither the real nor the fixture password appears in Aspire's described state.
 */

import {
  CREDENTIAL_FAULT_PROBE_RESOURCE,
  CREDENTIAL_FAULT_STATE_FILE,
  type CredentialFaultState,
  POSTGRES_AUTH_HEALTH_KEY,
  TEST_ONLY_POSTGRES_AUTH_REJECTED_KEY,
} from './credential-fault-fixture.ts';
import { RESOURCE_TRANSITION_FAILURE_CEILING_MS } from './listener-unreachable-fixture.ts';
import { type ResourceUpdate, watchResourceUpdates } from './resource-state-stream.ts';
import {
  type ListenerHealthReport,
  readListenerHealthReport,
} from './verify-listener-readiness.ts';

const POSTGRES_RESOURCE = 'postgres';
const POSTGRES_LISTENER_HEALTH_KEY = 'postgres_listener';
/** Aspire CLI exit code when `aspire wait` reaches its timeout before the target status. */
export const ASPIRE_WAIT_TIMEOUT_EXIT_CODE = 18;
/** Bounded `aspire wait` budget; the probe can never become Healthy, so this is the whole wait. */
const BOUNDED_WAIT_SECONDS = 10;
/** Test-failure ceiling for the bounded wait command itself, not an Aspire schedule. */
const BOUNDED_WAIT_CEILING_MS = (BOUNDED_WAIT_SECONDS + 30) * 1_000;
const AUTH_REJECTED_DESCRIPTION =
  /^postgres credential check failed: auth 28P01 \(invalid_password\) at \S+:\d+ after \d+ ms$/u;

/** Health evidence selected from one settled `aspire describe` snapshot. */
export interface CredentialRejectionEvidence {
  readonly rejected: ListenerHealthReport;
  readonly listener: ListenerHealthReport;
  readonly accepted: ListenerHealthReport;
}

/** Outcome of the bounded `aspire wait` against the probe. */
export interface BoundedWaitResult {
  readonly code: number;
  readonly durationMs: number;
  readonly output: string;
}

/**
 * Require the wrong-credential report to be auth-classified, the real listener and credential
 * checks to stay Healthy, and the snapshot to carry no credential bytes.
 */
export function assertCredentialRejectionEvidence(
  rawSnapshot: string,
  secrets: readonly string[],
): CredentialRejectionEvidence {
  assertNoSecretBytes('aspire describe', rawSnapshot, secrets);
  const topology: unknown = JSON.parse(rawSnapshot);
  const rejected = readListenerHealthReport(
    topology,
    CREDENTIAL_FAULT_PROBE_RESOURCE,
    TEST_ONLY_POSTGRES_AUTH_REJECTED_KEY,
  );
  if (rejected.status !== 'Unhealthy') {
    throw new Error(`wrong-credential check is ${rejected.status}, expected Unhealthy`);
  }
  if (!AUTH_REJECTED_DESCRIPTION.test(rejected.description ?? '')) {
    throw new Error(
      `wrong-credential check is not auth-classified: ${JSON.stringify(rejected.description)}`,
    );
  }
  const reportedClass = isRecord(rejected.data) ? rejected.data.class : undefined;
  if (reportedClass !== undefined && reportedClass !== 'auth') {
    throw new Error(`wrong-credential check data.class is ${JSON.stringify(reportedClass)}`);
  }
  const listener = readListenerHealthReport(
    topology,
    POSTGRES_RESOURCE,
    POSTGRES_LISTENER_HEALTH_KEY,
  );
  const accepted = readListenerHealthReport(topology, POSTGRES_RESOURCE, POSTGRES_AUTH_HEALTH_KEY);
  for (const report of [listener, accepted]) {
    if (report.status !== 'Healthy') {
      throw new Error(
        `${report.resourceName} ${report.healthCheckKey} is ${report.status}; the fixture must ` +
          'leave the real server reachable and its real credential accepted',
      );
    }
  }
  return { rejected, listener, accepted };
}

/** Require `aspire wait` to time out with the documented exit code, bounded, without leaks. */
export function assertBoundedWaitRejected(
  result: BoundedWaitResult,
  secrets: readonly string[],
): void {
  assertNoSecretBytes('aspire wait', result.output, secrets);
  if (result.code !== ASPIRE_WAIT_TIMEOUT_EXIT_CODE) {
    throw new Error(
      `aspire wait ${CREDENTIAL_FAULT_PROBE_RESOURCE} exited ${result.code}, expected ` +
        `${ASPIRE_WAIT_TIMEOUT_EXIT_CODE}`,
    );
  }
  if (result.durationMs > BOUNDED_WAIT_CEILING_MS) {
    throw new Error(
      `aspire wait took ${result.durationMs}ms for a ${BOUNDED_WAIT_SECONDS}s budget`,
    );
  }
}

/** Fail when any credential appears in the text; the message never echoes the credential. */
export function assertNoSecretBytes(label: string, text: string, secrets: readonly string[]): void {
  for (const [index, secret] of secrets.entries()) {
    if (secret.length < 8) throw new Error(`credential #${index} is too short to scan for`);
    if (text.includes(secret)) throw new Error(`${label} output contains credential #${index}`);
  }
}

/** Observe the probe's Unhealthy transition, then attribute it from one settled snapshot. */
export async function verifyCredentialRejection(
  appHost: string,
  projectRoot: string,
): Promise<void> {
  const secrets = await readFixtureSecrets(projectRoot);
  const subscription = await watchResourceUpdates(appHost, CREDENTIAL_FAULT_PROBE_RESOURCE);
  try {
    await subscription.waitFor(
      (update) => healthStatusOf(update) === 'unhealthy',
      RESOURCE_TRANSITION_FAILURE_CEILING_MS,
    );
  } finally {
    await subscription.close();
  }

  const snapshot = await runAspire(['describe', '--apphost', appHost, '--format', 'Json']);
  if (snapshot.code !== 0) {
    assertNoSecretBytes('aspire describe', snapshot.output, secrets);
    throw new Error(`aspire describe failed (${snapshot.code}): ${snapshot.output}`);
  }
  assertNoSecretBytes('aspire describe diagnostics', snapshot.output, secrets);
  const evidence = assertCredentialRejectionEvidence(snapshot.stdout, secrets);

  const wait = await runAspire([
    'wait',
    CREDENTIAL_FAULT_PROBE_RESOURCE,
    '--status',
    'healthy',
    '--timeout',
    String(BOUNDED_WAIT_SECONDS),
    '--apphost',
    appHost,
  ]);
  assertBoundedWaitRejected(wait, secrets);

  const receiptDir = `${projectRoot}/.netscript/e2e`;
  const receiptPath = `${receiptDir}/credential-rejection-receipt.json`;
  await Deno.mkdir(receiptDir, { recursive: true });
  await Deno.writeTextFile(
    receiptPath,
    `${
      JSON.stringify(
        {
          ...evidence,
          boundedWait: { code: wait.code, durationMs: wait.durationMs },
          scannedCredentials: secrets.length,
        },
        null,
        2,
      )
    }\n`,
  );
  console.info(`credential rejection receipt: ${receiptPath}`);
}

async function readFixtureSecrets(projectRoot: string): Promise<readonly string[]> {
  const state = JSON.parse(
    await Deno.readTextFile(`${projectRoot}/${CREDENTIAL_FAULT_STATE_FILE}`),
  ) as CredentialFaultState;
  const realPassword = (
    await Deno.readTextFile(`${projectRoot}/.data/aspire-secrets/${POSTGRES_RESOURCE}.password`)
  ).trim();
  return [realPassword, state.wrongPassword];
}

function healthStatusOf(update: ResourceUpdate): string | undefined {
  const value = update.resource.healthStatus;
  return typeof value === 'string' ? value.toLowerCase() : undefined;
}

async function runAspire(
  args: readonly string[],
): Promise<BoundedWaitResult & { readonly stdout: string }> {
  const startedAt = performance.now();
  const result = await new Deno.Command('aspire', {
    args: [...args, '--non-interactive', '--nologo'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(result.stdout);
  return {
    code: result.code,
    durationMs: Math.round(performance.now() - startedAt),
    stdout,
    output: `${stdout}${new TextDecoder().decode(result.stderr)}`,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

if (import.meta.main) {
  const [appHost, projectRoot] = Deno.args;
  if (!appHost) throw new Error('AppHost path argument is required');
  if (!projectRoot) throw new Error('project root argument is required');
  await verifyCredentialRejection(appHost, projectRoot);
}
