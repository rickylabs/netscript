import type { PluginContributions } from './plugin-contributions.ts';

/**
 * Namespace in which a contribution identity must be unique.
 *
 * - `root`: one namespace shared by every plugin the root host composes (service names, topics).
 * - `plugin`: unique within the declaring plugin only (plugin-relative paths, contract versions).
 * - `singleton`: a single value per plugin (`aspire`, `doctor`); it never merges into a shared slot.
 */
export type ContributionIdentityScope = 'root' | 'plugin' | 'singleton';

/** Identity rule for one `PluginContributions` key. */
export interface ContributionIdentityRule {
  /** Namespace in which the identities must be unique. */
  readonly scope: ContributionIdentityScope;
  /** Read the identities a contribution value declares, or `undefined` when the value is malformed. */
  readonly identities: (value: unknown) => readonly string[] | undefined;
}

/** Contribution key, derived from the public manifest model rather than a parallel list. */
export type ContributionKey = keyof PluginContributions;

function keyedEntries(key: string): ContributionIdentityRule['identities'] {
  return (value) => {
    if (!Array.isArray(value)) return undefined;
    const identities: string[] = [];
    for (const entry of value) {
      const identity = entry !== null && typeof entry === 'object'
        ? Reflect.get(entry, key)
        : undefined;
      if (typeof identity !== 'string' || identity.length === 0) return undefined;
      identities.push(identity);
    }
    return identities;
  };
}

function singletonModule(value: unknown): readonly string[] | undefined {
  return typeof value === 'string' && value.length > 0 ? [value] : undefined;
}

function cliDoctorChecks(value: unknown): readonly string[] | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const checks = Reflect.get(value, 'doctorChecks');
  if (checks === undefined) return [];
  if (!Array.isArray(checks) || !checks.every((check) => typeof check === 'string')) {
    return undefined;
  }
  return checks;
}

function rule(
  scope: ContributionIdentityScope,
  identities: ContributionIdentityRule['identities'],
): ContributionIdentityRule {
  return { scope, identities };
}

/**
 * Identity rule for every `PluginContributions` key.
 *
 * The `satisfies` clause makes this table exhaustive over the public manifest model: adding a
 * contribution key without an identity rule is a type error, and its keys are the only contribution
 * keys a manifest may declare.
 */
export const CONTRIBUTION_IDENTITY_RULES: Readonly<
  Record<ContributionKey, ContributionIdentityRule>
> = Object.freeze(
  {
    cli: rule('root', cliDoctorChecks),
    services: rule('root', keyedEntries('name')),
    sdkClients: rule('root', keyedEntries('id')),
    backgroundProcessors: rule('root', keyedEntries('name')),
    streamTopics: rule('root', keyedEntries('name')),
    databaseSchemas: rule('plugin', keyedEntries('path')),
    runtimeConfigTopics: rule('root', keyedEntries('name')),
    contractVersions: rule('plugin', keyedEntries('version')),
    e2e: rule('root', keyedEntries('name')),
    telemetry: rule('root', keyedEntries('name')),
    migrations: rule('plugin', keyedEntries('name')),
    aspire: rule('singleton', singletonModule),
    doctor: rule('singleton', singletonModule),
  } satisfies { readonly [Key in ContributionKey]-?: ContributionIdentityRule },
);

/** Check whether a string is a contribution key defined by the public manifest model. */
export function isContributionKey(key: string): key is ContributionKey {
  return Object.hasOwn(CONTRIBUTION_IDENTITY_RULES, key);
}

/** Contribution keys whose scope is `singleton`. */
export const SINGLETON_CONTRIBUTION_KEYS: readonly ContributionKey[] = Object.freeze(
  (Object.keys(CONTRIBUTION_IDENTITY_RULES) as ContributionKey[]).filter((key) =>
    CONTRIBUTION_IDENTITY_RULES[key].scope === 'singleton'
  ),
);
