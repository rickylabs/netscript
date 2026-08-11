/**
 * @module
 *
 * Reads the #1447 evidence out of `aspire describe --format Json`: does the
 * running service resource carry the environment its config declared, did the
 * generated infrastructure value still win its collision, and is the process
 * actually running.
 *
 * Split from the gate entrypoint so the parse and the verdict are testable
 * without an AppHost. The expensive suite is the only place this code runs for
 * real, which is exactly why its failure modes are worth pinning cheaply.
 */

import {
  DECLARED_SERVICE_ENV,
  DECLARED_STALE_DATABASE_URL,
  GENERATED_DATABASE_URL_KEY,
} from './service-env-contract.ts';

/** States that mean the process is no longer running. */
const TERMINAL_STATES = ['finished', 'exited', 'failedtostart'];

/** What one described resource says about itself. */
export interface DescribedResourceEvidence {
  /** Environment the AppHost published for the resource. */
  readonly environment: ReadonlyMap<string, string>;
  /** Lifecycle state, when the describe output publishes one. */
  readonly state?: string;
}

/**
 * Extracts a resource's environment and state from `aspire describe` output.
 *
 * @throws if the output holds no JSON, or no resource by that name.
 */
export function readDescribedResource(
  describeOutput: string,
  serviceName: string,
): DescribedResourceEvidence {
  const resource = findResource(JSON.parse(extractJson(describeOutput)), serviceName);
  if (!resource) {
    throw new Error(`resource ${serviceName} was not present in aspire describe output`);
  }
  return { environment: readEnvironment(resource), state: readState(resource) };
}

/**
 * Returns one message per way the resource fails the #1447 contract, empty when
 * it holds. Collected rather than thrown one at a time so a failing gate names
 * everything wrong in a run that costs many minutes to reproduce.
 */
export function collectServiceEnvironmentFailures(
  evidence: DescribedResourceEvidence,
  serviceName: string,
): string[] {
  const failures: string[] = [];
  const { environment, state } = evidence;

  if (environment.size === 0) {
    failures.push(`resource ${serviceName} published no environment at all`);
    return failures;
  }

  for (const [key, expected] of Object.entries(DECLARED_SERVICE_ENV)) {
    const actual = environment.get(key);
    if (actual !== expected) {
      failures.push(
        `declared ${key} is ${JSON.stringify(actual ?? null)}, expected ${
          JSON.stringify(expected)
        }`,
      );
    }
  }

  const databaseUrl = environment.get(GENERATED_DATABASE_URL_KEY);
  if (databaseUrl === undefined) {
    failures.push(`generated ${GENERATED_DATABASE_URL_KEY} is missing`);
  } else if (databaseUrl === DECLARED_STALE_DATABASE_URL) {
    failures.push(
      `precedence inverted: the declared ${GENERATED_DATABASE_URL_KEY} beat the value the AppHost ` +
        `allocated, so ${serviceName} points at an address nothing listens on`,
    );
  }

  if (state && TERMINAL_STATES.includes(normalizeState(state))) {
    failures.push(
      `resource is ${state} — it carries its declared environment but is not running`,
    );
  }

  return failures;
}

function normalizeState(state: string): string {
  return state.toLowerCase().replaceAll(' ', '');
}

/** `aspire describe` may print a banner before its JSON; slice from the first brace/bracket. */
function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return trimmed;
  const indexes = [trimmed.indexOf('{'), trimmed.indexOf('[')].filter((index) => index >= 0);
  if (indexes.length === 0) throw new Error('aspire describe did not emit JSON');
  return trimmed.slice(Math.min(...indexes));
}

/**
 * Finds a resource in the top-level `resources[]` array.
 *
 * Anchored rather than a free depth-first walk, for the reason recorded in
 * `generated-app-endpoint.ts`: an unanchored search surfaces `relationships[]`
 * stubs that match by name but carry no environment of their own. DCP suffixes
 * instance ids (`users-sayhwbds`), so a prefix match is the documented fallback.
 */
function findResource(value: unknown, name: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined;
  const resources = value['resources'];
  if (!Array.isArray(resources)) return undefined;
  const entries = resources.filter(isRecord);
  const lowered = name.toLowerCase();
  return entries.find((entry) => matchesName(entry, lowered)) ??
    entries.find((entry) =>
      typeof entry['name'] === 'string' && entry['name'].toLowerCase().startsWith(`${lowered}-`)
    );
}

function matchesName(entry: Record<string, unknown>, lowered: string): boolean {
  for (const key of ['displayName', 'name']) {
    const candidate = entry[key];
    if (typeof candidate === 'string' && candidate.toLowerCase() === lowered) return true;
  }
  return false;
}

/**
 * Normalizes the resource environment, which Aspire publishes either as a
 * `{ KEY: value }` record or as a `[{ name, value }]` array depending on the
 * describe shape. Accepting both keeps the gate a statement about the topology
 * rather than about one CLI version's serialization.
 */
function readEnvironment(resource: Record<string, unknown>): Map<string, string> {
  const environment = new Map<string, string>();
  const declared = resource['environment'];

  if (isRecord(declared)) {
    for (const [key, value] of Object.entries(declared)) {
      if (typeof value === 'string') environment.set(key, value);
    }
    return environment;
  }

  if (Array.isArray(declared)) {
    for (const entry of declared) {
      if (!isRecord(entry)) continue;
      const key = entry['name'];
      const value = entry['value'];
      if (typeof key === 'string' && typeof value === 'string') environment.set(key, value);
    }
  }
  return environment;
}

/** Reads the resource lifecycle state under either published spelling. */
function readState(resource: Record<string, unknown>): string | undefined {
  for (const key of ['state', 'status']) {
    const candidate = resource[key];
    if (typeof candidate === 'string') return candidate;
    if (isRecord(candidate) && typeof candidate['text'] === 'string') return candidate['text'];
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
