import type { NetScriptConfig } from '../../types.ts';

type DatabaseEntry = NetScriptConfig['databases']['config'][number];
type ServiceEntry = NonNullable<NetScriptConfig['services']>[string];
type AppEntry = NonNullable<NetScriptConfig['apps']>[string];
type ServiceContributionEntry = Omit<ServiceEntry, 'runtime'> & {
  readonly runtime?: ServiceEntry['runtime'];
};
type AppContributionEntry = Omit<AppEntry, 'runtime'> & {
  readonly runtime?: AppEntry['runtime'];
};

/** Partial NetScript config fragment contributed by a plugin manifest. */
export interface PartialConfig {
  readonly paths?: Partial<NetScriptConfig['paths']>;
  readonly logging?: NetScriptConfig['logging'];
  readonly aspire?: NetScriptConfig['aspire'];
  readonly databases?: {
    readonly active?: NetScriptConfig['databases']['active'];
    readonly config?: readonly DatabaseEntry[];
  };
  readonly services?: Record<string, ServiceContributionEntry>;
  readonly apps?: Record<string, AppContributionEntry>;
  readonly gateway?: NetScriptConfig['gateway'];
  readonly sdk?: NetScriptConfig['sdk'];
  readonly deploy?: NetScriptConfig['deploy'];
  readonly runtimeConfig?: NetScriptConfig['runtimeConfig'];
}

function mergeDatabaseConfig(
  base: readonly DatabaseEntry[],
  contribution: readonly DatabaseEntry[] | undefined,
): DatabaseEntry[] {
  if (!contribution?.length) {
    return [...base];
  }

  const byKey = new Map<string, DatabaseEntry>();
  for (const entry of base) {
    byKey.set(entry.name ?? entry.schema, entry);
  }
  for (const entry of contribution) {
    byKey.set(entry.name ?? entry.schema, entry);
  }
  return [...byKey.values()];
}

function normalizeServices(
  services: Record<string, ServiceContributionEntry> | undefined,
): Record<string, ServiceEntry> | undefined {
  if (!services) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(services).map(([key, value]) => [key, { runtime: 'deno', ...value }]),
  );
}

function normalizeApps(
  apps: Record<string, AppContributionEntry> | undefined,
): Record<string, AppEntry> | undefined {
  if (!apps) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(apps).map(([key, value]) => [key, { runtime: 'deno', ...value }]),
  );
}

/**
 * Merge a plugin-contributed partial config into a validated NetScript config.
 *
 * @param base - Existing validated project config.
 * @param contribution - Plugin contribution fragment to merge.
 * @returns A new config object with contribution values merged in.
 *
 * @example
 * ```ts
 * import { mergePartialConfig } from "@netscript/config/merge";
 *
 * const next = mergePartialConfig(config, {
 *   services: { "workers-api": { port: 8091 } },
 * });
 * ```
 */
export function mergePartialConfig(
  base: NetScriptConfig,
  contribution: PartialConfig,
): NetScriptConfig {
  const services = normalizeServices(contribution.services);
  const apps = normalizeApps(contribution.apps);

  return {
    ...base,
    paths: contribution.paths ? { ...base.paths, ...contribution.paths } : base.paths,
    logging: contribution.logging ? { ...base.logging, ...contribution.logging } : base.logging,
    aspire: contribution.aspire ? { ...base.aspire, ...contribution.aspire } : base.aspire,
    databases: contribution.databases
      ? {
        ...base.databases,
        ...contribution.databases,
        config: mergeDatabaseConfig(base.databases.config, contribution.databases.config),
      }
      : base.databases,
    services: services ? { ...(base.services ?? {}), ...services } : base.services,
    apps: apps ? { ...(base.apps ?? {}), ...apps } : base.apps,
    gateway: contribution.gateway ? { ...base.gateway, ...contribution.gateway } : base.gateway,
    sdk: contribution.sdk ? { ...base.sdk, ...contribution.sdk } : base.sdk,
    deploy: contribution.deploy ? { ...base.deploy, ...contribution.deploy } : base.deploy,
    runtimeConfig: contribution.runtimeConfig
      ? { ...base.runtimeConfig, ...contribution.runtimeConfig }
      : base.runtimeConfig,
  };
}
