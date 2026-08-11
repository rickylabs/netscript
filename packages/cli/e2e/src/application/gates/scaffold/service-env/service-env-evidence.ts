/**
 * @module
 *
 * The #1447 verdicts, split from the gate entrypoint so they are testable without
 * an AppHost: what `aspire describe --format Json` says about a resource, and
 * what the resource's own process environment says about every documented
 * precedence category.
 *
 * The two are not interchangeable. The topology verdict can only show what the
 * AppHost *intends*; the process verdict shows what the service actually got, and
 * it is the one that decides the categories. The expensive suite is the only place
 * this code runs for real, which is exactly why its failure modes are worth
 * pinning cheaply.
 */

import type { DeclaredEnvironmentCase } from './service-env-contract.ts';
import type { ProcessEvidence } from './process-evidence.ts';

/**
 * States that count as "the resource is up".
 *
 * An allowlist, not a terminal-state denylist: `Starting`, `Waiting`, `Stopped`,
 * `Unhealthy` and any spelling nobody thought of must fail, because #1447's whole
 * symptom was a resource that looked configured and was not serving. Absence of a
 * published state is handled by the caller, which proves healthiness through
 * `aspire wait --status healthy` instead of inferring it here.
 */
const RUNNING_STATES = ['running', 'healthy'];

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
 * Returns one message per way the described topology fails the #1447 contract,
 * empty when it holds.
 *
 * Collected rather than thrown one at a time so a failing gate names everything
 * wrong in a run that costs many minutes to reproduce.
 *
 * @param evidence - What `aspire describe` published for the resource.
 * @param serviceName - Resource name, for messages.
 * @param cases - The declared cases the fixture wrote for this resource.
 */
export function collectTopologyFailures(
  evidence: DescribedResourceEvidence,
  serviceName: string,
  cases: readonly DeclaredEnvironmentCase[],
): string[] {
  const failures: string[] = [];
  const { environment, state } = evidence;

  if (environment.size === 0) {
    failures.push(`resource ${serviceName} published no environment at all`);
    return failures;
  }

  for (const entry of cases) {
    const actual = environment.get(entry.key);
    if (entry.rule === 'declared-wins' && actual !== entry.value) {
      failures.push(
        `declared ${entry.key} is ${JSON.stringify(actual ?? null)} in the resource model, ` +
          `expected ${JSON.stringify(entry.value)}`,
      );
      continue;
    }
    if (entry.rule === 'generated-wins' && actual === entry.value) {
      failures.push(
        `precedence inverted for ${entry.key}: the declared literal reached the resource model, ` +
          `so ${serviceName} points at something the AppHost never allocated`,
      );
      continue;
    }
    if (entry.rule === 'refused' && actual === entry.value) {
      failures.push(
        `${entry.key} was applied with the declared value: Aspire's endpoint allocation owns it, ` +
          'so the generator must refuse it',
      );
    }
  }

  if (state !== undefined && !RUNNING_STATES.includes(normalizeState(state))) {
    failures.push(
      `resource state is ${JSON.stringify(state)}; the gate requires one of ${
        RUNNING_STATES.join(', ')
      }`,
    );
  }

  return failures;
}

/**
 * Returns one message per way the running process fails the #1447 contract, empty
 * when it holds.
 *
 * This is the verdict that decides the precedence categories: it reads what the
 * process was actually given, so a category whose documented rule stopped holding
 * fails here even if the resource model still looks right.
 *
 * @param process - Environment read from `/proc/<pid>/environ`.
 * @param serviceName - Resource name, for messages.
 * @param cases - The declared cases the fixture wrote for this resource.
 */
export function collectProcessFailures(
  process: ProcessEvidence,
  serviceName: string,
  cases: readonly DeclaredEnvironmentCase[],
): string[] {
  const failures: string[] = [];
  const where = `${serviceName} process ${process.pid}`;
  if (cases.length === 0) {
    failures.push(`${where}: no declared case to verify — this gate must not pass vacuously`);
    return failures;
  }

  for (const entry of cases) {
    const actual = process.environment.get(entry.key);
    const seen = JSON.stringify(actual ?? null);

    switch (entry.expectation.kind) {
      case 'declared': {
        if (actual !== entry.value) {
          failures.push(
            `${where} does not observe declared ${entry.key}: ${seen}, expected ${
              JSON.stringify(entry.value)
            } (${entry.category})`,
          );
        }
        break;
      }
      case 'differs': {
        if (actual === undefined || actual === '') {
          failures.push(`${where} has no ${entry.key} at all (${entry.category})`);
          break;
        }
        if (actual === entry.value) {
          failures.push(
            `${where} kept the declared ${entry.key} (${seen}); the generated value must win it ` +
              `(${entry.category})`,
          );
          break;
        }
        const { prefix } = entry.expectation;
        if (prefix !== undefined && !actual.startsWith(prefix)) {
          failures.push(
            `${where} has ${entry.key}=${seen}, which is not the allocated ${prefix}… value ` +
              `(${entry.category})`,
          );
        }
        break;
      }
      case 'equals': {
        if (actual !== entry.expectation.value) {
          failures.push(
            `${where} has ${entry.key}=${seen}, expected the generated ${
              JSON.stringify(entry.expectation.value)
            } (${entry.category})`,
          );
        }
        break;
      }
      case 'matches': {
        const other = process.environment.get(entry.expectation.key);
        if (actual === entry.value) {
          failures.push(
            `${where} kept the declared ${entry.key} (${seen}); the generated value must win it ` +
              `(${entry.category})`,
          );
          break;
        }
        if (actual === undefined || actual !== other) {
          failures.push(
            `${where} has ${entry.key}=${seen} but ${entry.expectation.key}=${
              JSON.stringify(other ?? null)
            }; the generated helper assigns both the same allocated value (${entry.category})`,
          );
        }
        break;
      }
      case 'refused': {
        if (actual === entry.value) {
          failures.push(
            `${where} observes the declared ${entry.key} (${seen}); Aspire's endpoint allocation ` +
              `owns it, so it must never be applied (${entry.category})`,
          );
          break;
        }
        if (actual === undefined || actual === '') {
          failures.push(
            `${where} has no ${entry.key}; refusing the declared value must not stop Aspire from ` +
              `injecting its own (${entry.category})`,
          );
        }
        break;
      }
    }
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
