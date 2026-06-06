/**
 * Merge plugin-contributed config fragments into validated NetScript config.
 *
 * @module
 */

import type { NetScriptConfig } from '../../types.ts';

export type {
  AppConfig,
  AspireConfig,
  ConfigEnv,
  DatabaseConfig,
  DatabaseProvider,
  DatabasesConfig,
  DeployConfig,
  EnvDef,
  GatewayConfig,
  LoadConfigOptions,
  LoggingConfig,
  NetScriptConfig,
  NetScriptConfigInput,
  PathsConfig,
  PermissionConfig,
  PermissionValue,
  ResolvedEnvType,
  RuntimeConfigPathEntry,
  RuntimeConfigSection,
  SagaDefinition,
  SagaGroup,
  SagaRetentionConfig,
  SagaRetryConfig,
  SagaScalingConfig,
  SagasConfig,
  SagaStoreProvider,
  SagaTimeoutConfig,
  SagaTransportProvider,
  SdkConfig,
  ServiceConfig,
  TriggerDefinitionConfig,
  TriggerGroup,
  TriggerRetentionConfig,
  TriggerScalingConfig,
  TriggersConfig,
  WebhookConfig,
  WindowsDeployConfig,
} from '../../types.ts';

/** Database config entry accepted in plugin contribution fragments. */
export type DatabaseEntry = NetScriptConfig['databases']['config'][number];
type ServiceEntry = NonNullable<NetScriptConfig['services']>[string];
type AppEntry = NonNullable<NetScriptConfig['apps']>[string];

/** Service config entry accepted in plugin contribution fragments. */
export type ServiceContributionEntry =
  & Omit<
    NonNullable<NetScriptConfig['services']>[string],
    'runtime'
  >
  & {
    /** Optional service runtime; defaults to `deno` during merge. */
    readonly runtime?: NonNullable<NetScriptConfig['services']>[string]['runtime'];
  };

/** Application config entry accepted in plugin contribution fragments. */
export type AppContributionEntry =
  & Omit<
    NonNullable<NetScriptConfig['apps']>[string],
    'runtime'
  >
  & {
    /** Optional application runtime; defaults to `deno` during merge. */
    readonly runtime?: NonNullable<NetScriptConfig['apps']>[string]['runtime'];
  };

/** Partial NetScript config fragment contributed by a plugin manifest. */
export interface PartialConfig {
  /** Workspace path overrides contributed by a plugin. */
  readonly paths?: Partial<NetScriptConfig['paths']>;
  /** Logging overrides contributed by a plugin. */
  readonly logging?: NetScriptConfig['logging'];
  /** Aspire overrides contributed by a plugin. */
  readonly aspire?: NetScriptConfig['aspire'];
  /** Database configuration contributed by a plugin. */
  readonly databases?: {
    /** Active database provider override. */
    readonly active?: NetScriptConfig['databases']['active'];
    /** Database entries to merge by name or schema. */
    readonly config?: readonly DatabaseEntry[];
  };
  /** Service entries contributed by name. */
  readonly services?: Record<string, ServiceContributionEntry>;
  /** Application entries contributed by name. */
  readonly apps?: Record<string, AppContributionEntry>;
  /** Gateway overrides contributed by a plugin. */
  readonly gateway?: NetScriptConfig['gateway'];
  /** SDK generation overrides contributed by a plugin. */
  readonly sdk?: NetScriptConfig['sdk'];
  /** Deployment overrides contributed by a plugin. */
  readonly deploy?: NetScriptConfig['deploy'];
  /** Runtime schema/config output overrides contributed by a plugin. */
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
