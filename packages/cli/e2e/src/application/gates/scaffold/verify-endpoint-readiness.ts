import { type ResourceUpdate, watchResourceUpdates } from './runtime/resource-state-stream.ts';

const RESOURCE_NAME = 'readiness-dead-port';
/** Test-failure ceiling for a follower that hangs; it is not an Aspire evaluation schedule. */
const READINESS_EVENT_FAILURE_CEILING_MS = 120_000;

/** Observe and validate the dead-port resource's failed readiness event. */
export async function verifyEndpointReadiness(
  appHost: string,
  watch: typeof watchResourceUpdates = watchResourceUpdates,
  readSnapshot: (appHost: string) => Promise<string> = readReadinessSnapshot,
): Promise<string> {
  const subscription = await watch(appHost, RESOURCE_NAME);
  try {
    try {
      await subscription.waitFor(
        (candidate) => stringField(candidate, 'healthStatus')?.toLowerCase() === 'unhealthy',
        READINESS_EVENT_FAILURE_CEILING_MS,
      );
    } catch (cause) {
      throw new Error(
        `Aspire did not observe ${RESOURCE_NAME} transition to Unhealthy`,
        { cause },
      );
    }
    // Follow output carries aggregate health but does not promise per-check reports. This single
    // snapshot does not discover the transition: the scoped stream already observed it.
    const rawSnapshot = await readSnapshot(appHost);
    return assertFailedReadinessEvidence(readinessResource(rawSnapshot), rawSnapshot);
  } finally {
    await subscription.close();
  }
}

/** Require the settled snapshot to carry the expected state and detailed report evidence. */
export function assertFailedReadinessEvidence(resource: Resource, rawSnapshot: string): string {
  const reportCount = Array.isArray(resource.healthReports)
    ? resource.healthReports.length
    : resource.healthReports && typeof resource.healthReports === 'object'
    ? Object.keys(resource.healthReports).length
    : 0;
  const observed = `${resource.state ?? 'unknown'} / ${
    resource.healthStatus ?? 'unknown'
  } / ${reportCount} reports`;
  if (resource.state?.toLowerCase() !== 'running' || reportCount === 0) {
    throw new Error(
      `Aspire observed ${RESOURCE_NAME} Unhealthy, but its evidence was wrong: ${observed}; ` +
        `snapshot: ${rawSnapshot}`,
    );
  }
  return observed;
}

async function readReadinessSnapshot(appHost: string): Promise<string> {
  const output = await new Deno.Command('aspire', {
    args: ['describe', '--apphost', appHost, '--format', 'Json', '--non-interactive', '--nologo'],
    stdout: 'piped',
    stderr: 'piped',
  }).output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);
  if (!output.success) {
    throw new Error(`aspire describe failed (${output.code}): ${stderr || stdout}`);
  }
  return stdout;
}

function readinessResource(rawSnapshot: string): Resource {
  const parsed = JSON.parse(extractJson(rawSnapshot)) as unknown;
  const candidates = isRecord(parsed) && Array.isArray(parsed.resources)
    ? parsed.resources
    : [parsed];
  const resource = candidates.find((candidate): candidate is Resource =>
    isRecord(candidate) && resourceNameMatches(candidate)
  );
  if (!resource) {
    throw new Error(
      `Aspire observed ${RESOURCE_NAME} Unhealthy, but its settled snapshot omitted the resource: ` +
        rawSnapshot,
    );
  }
  return resource;
}

function resourceNameMatches(resource: Readonly<Record<string, unknown>>): boolean {
  return ['displayName', 'name'].some((key) => {
    const value = resource[key];
    return typeof value === 'string' &&
      (value.toLowerCase() === RESOURCE_NAME ||
        value.toLowerCase().startsWith(`${RESOURCE_NAME}-`));
  });
}

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;
  const indexes = [trimmed.indexOf('{'), trimmed.indexOf('[')].filter((index) => index >= 0);
  if (indexes.length === 0) throw new Error('aspire describe did not emit JSON');
  return trimmed.slice(Math.min(...indexes));
}

function stringField(update: ResourceUpdate, key: string): string | undefined {
  const value = update.resource[key];
  return typeof value === 'string' ? value : undefined;
}

interface Resource extends Readonly<Record<string, unknown>> {
  readonly state?: string;
  readonly healthStatus?: string;
  readonly healthReports?: readonly unknown[] | Readonly<Record<string, unknown>>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

if (import.meta.main) {
  const appHost = Deno.args[0];
  if (!appHost) throw new Error('AppHost path argument is required');
  console.info(`readiness-dead-port observed ${await verifyEndpointReadiness(appHost)}`);
}
