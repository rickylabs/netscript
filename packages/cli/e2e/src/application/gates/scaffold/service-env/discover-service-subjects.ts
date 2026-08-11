/**
 * @module
 *
 * Discovers which service the #1447 gates are about, from the generated
 * `appsettings.json` rather than from a name written into the gate.
 *
 * A gate that names `users` agrees with the fixture on a subject neither of them
 * verified: rename the scaffolded service and both sides keep passing about a
 * resource that no longer exists. So the fixture asks this module which service
 * to declare on, the verifier asks it which services *did* declare, and the two
 * meet only through the file the CLI actually generated.
 *
 * {@link discoverDeclaringSubjects} throws when nothing declares an environment.
 * That is the load-bearing part: a verifier that iterated an empty list would
 * report success having asserted nothing, which is the vacuous-pass class this
 * gate exists to rule out.
 */

import { RESOURCE_DEFAULTS } from '@netscript/aspire/constants';
import { SCAFFOLD_DIRS } from '../../../../../../src/kernel/constants/scaffold/scaffold-dirs.ts';

/** A service entry, as far as the #1447 gates need to read it. */
export interface DiscoveredService {
  /** Resource name — the key under `NetScript.Services`. */
  readonly name: string;
  /** Working directory the AppHost starts the process in, relative to the project root. */
  readonly workdir: string;
  /** Entrypoint the process runs. */
  readonly entrypoint: string;
  /** Environment the entry declares, under either spelling; empty when it declares none. */
  readonly declared: Readonly<Record<string, string>>;
  /** Service and plugin references the entry carries, deduplicated in declaration order. */
  readonly references: readonly string[];
  /** Whether the entry is enabled (absent `Enabled` means enabled). */
  readonly enabled: boolean;
}

/** The parts of the generated config the #1447 gates read. */
export interface DiscoveredTopology {
  /** Primary database key, when the project has one. */
  readonly primaryDatabase?: string;
  /** Every declared service, in `appsettings.json` order. */
  readonly services: readonly DiscoveredService[];
}

/**
 * Reads the `NetScript` section of a generated `appsettings.json`.
 *
 * @param text - Raw file contents.
 * @returns Primary database and every service entry.
 * @throws if the file holds no `NetScript.Services` section, or a service
 *   declares a non-string environment value — both mean the fixture's assumption
 *   about the generated project is stale, which must fail loudly.
 */
export function readTopology(text: string): DiscoveredTopology {
  const parsed: unknown = JSON.parse(text);
  if (!isRecord(parsed)) throw new Error('appsettings.json is not a JSON object');
  const netscript = parsed['NetScript'];
  if (!isRecord(netscript)) throw new Error('appsettings.json declares no NetScript section');
  const services = netscript['Services'];
  if (!isRecord(services)) throw new Error('appsettings.json declares no NetScript.Services');

  const primaryDatabase = typeof netscript['PrimaryDatabase'] === 'string'
    ? netscript['PrimaryDatabase']
    : undefined;

  return {
    primaryDatabase,
    services: Object.entries(services).map(([name, entry]) => readService(name, entry)),
  };
}

/**
 * Picks the service the fixture declares its environment on.
 *
 * Deterministic by name so two runs of the same scaffold pick the same subject,
 * and restricted to enabled services because a disabled one never starts and so
 * could never produce process evidence.
 *
 * @param topology - Topology read from the generated `appsettings.json`.
 * @returns The subject service.
 * @throws if the project declares no enabled service.
 */
export function selectDeclarationSubject(topology: DiscoveredTopology): DiscoveredService {
  const candidates = topology.services
    .filter((service) => service.enabled)
    .toSorted((left, right) => left.name.localeCompare(right.name));
  const subject = candidates[0];
  if (!subject) {
    throw new Error(
      'the generated appsettings.json declares no enabled service, so there is nothing to ' +
        'declare an environment on — the scaffold changed shape and this gate must be updated',
    );
  }
  return subject;
}

/**
 * Returns every service that declares an environment.
 *
 * @param topology - Topology read from the generated `appsettings.json`.
 * @returns Services carrying at least one declared entry.
 * @throws if none do. The verification gate has nothing to prove in that case,
 *   and reporting success would be a pass by matching nothing.
 */
export function discoverDeclaringSubjects(
  topology: DiscoveredTopology,
): readonly DiscoveredService[] {
  const declaring = topology.services.filter((service) => Object.keys(service.declared).length > 0);
  if (declaring.length === 0) {
    throw new Error(
      `no service in the generated appsettings.json declares Environment or Env (${
        topology.services.map((service) => service.name).join(', ') || 'no services at all'
      }). The pre-start fixture did not run, or a later gate regenerated over it — this gate ` +
        'refuses to pass by matching nothing.',
    );
  }
  return declaring;
}

/**
 * Derives the engine URI environment key from the primary database name, the way
 * `_aspire-compat.ts.template`'s `buildDatabaseUriEnvKey` does.
 *
 * @param primaryDatabase - Primary database key, when the project has one.
 * @returns The URI key, or `undefined` when there is no primary database.
 */
export function databaseUriEnvKey(primaryDatabase: string | undefined): string | undefined {
  if (!primaryDatabase) return undefined;
  const prefix = primaryDatabase
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
  return prefix ? `${prefix}_URI` : undefined;
}

function readService(name: string, entry: unknown): DiscoveredService {
  if (!isRecord(entry)) throw new Error(`service ${name} is not a JSON object`);
  const declared = readEnvironment(name, entry['Environment'] ?? entry['Env']);
  return {
    name,
    workdir: typeof entry['Workdir'] === 'string'
      ? entry['Workdir']
      : `${SCAFFOLD_DIRS.SERVICES}/${name}`,
    entrypoint: typeof entry['Entrypoint'] === 'string'
      ? entry['Entrypoint']
      : RESOURCE_DEFAULTS.ServiceEntrypoint,
    declared,
    references: readReferences(entry),
    enabled: entry['Enabled'] !== false,
  };
}

function readEnvironment(name: string, value: unknown): Readonly<Record<string, string>> {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new Error(`service ${name} declares a non-object environment`);
  const environment: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== 'string') {
      throw new Error(`service ${name} declares a non-string value for ${key}`);
    }
    environment[key] = entry;
  }
  return environment;
}

function readReferences(entry: Record<string, unknown>): readonly string[] {
  const references = new Set<string>();
  for (const key of ['ServiceReferences', 'PluginReferences']) {
    const value = entry[key];
    if (!Array.isArray(value)) continue;
    for (const reference of value) {
      if (typeof reference === 'string') references.add(reference);
    }
  }
  return [...references];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
