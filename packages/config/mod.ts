/**
 * @module
 *
 * NetScript project configuration for Deno-first applications.
 *
 * The config package owns the public schema, loader, environment, workspace,
 * merge, and diagnostic primitives used by the framework. The usual path is
 * to define a project config once, load it at process startup, and pass the
 * validated object to framework packages that need project topology.
 *
 * Use `defineConfig` in `netscript.config.ts` for the 80 percent path. Use
 * `defineConfigAsync` when configuration depends on the current command or
 * environment mode. Use `loadConfig` and `initConfig` at runtime to resolve
 * the authored config into a validated `NetScriptConfig`.
 *
 * The root package exposes the authoring, loading, environment, workspace, and
 * diagnostic contract. Schema-only APIs live on subpaths such as
 * `@netscript/config/schema/plugins` so the public root surface does not leak
 * Zod internals.
 *
 * @example Define a project config
 * ```ts
 * import { defineConfig } from "@netscript/config";
 *
 * export default defineConfig({
 *   name: "orders",
 *   version: "1.0.0",
 *   databases: {
 *     active: "postgres",
 *     config: [{ provider: "postgres", schema: "database/postgres/schema" }],
 *   },
 *   services: {
 *     api: { port: 3000 },
 *   },
 * });
 * ```
 *
 * @example Load and inspect config
 * ```ts
 * import { initConfig, inspectConfig } from "@netscript/config";
 *
 * const config = await initConfig();
 * const report = inspectConfig(config);
 * const summary = report.summary;
 * ```
 *
 * @see README.md
 * @see docs/getting-started.md
 * @see https://netscript.dev/packages/config
 */

// Definitions
export { defineConfig, defineConfigAsync } from './src/public/mod.ts';

// Runtime
export {
  clearConfigCache,
  getConfig,
  initConfig,
  isConfigLoaded,
  loadConfig,
} from './src/public/mod.ts';

// Builders
export { defineSagas } from './src/public/mod.ts';
export type { SagaDefinitionInput, SagaGroupInput, SagasConfigInput } from './src/public/mod.ts';

// Adapters
export {
  discoverWorkspace,
  findMember,
  findWorkspaceRoot,
  getMemberEntrypoint,
} from './src/public/mod.ts';

// Types
export type {
  AppConfig,
  AspireConfig,
  ConfigEnv,
  DatabaseConfig,
  DatabaseProvider,
  DatabasesConfig,
  DeployConfig,
  DeployTargetBase,
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
  TriggerDefinitionConfigInput,
  TriggerGroup,
  TriggerGroupInput,
  TriggerRetentionConfig,
  TriggerScalingConfig,
  TriggersConfig,
  TriggersConfigInput,
  WebhookConfig,
  WindowsDeployTarget,
  WorkspaceMap,
  WorkspaceMember,
  WorkspaceMemberType,
} from './src/public/mod.ts';

// Runtime
export { getEnv, getMode, hasEnv, isDev, isProd, isTest, resolveEnv } from './src/public/mod.ts';

// Diagnostics
export { inspectConfig } from './src/public/mod.ts';
export type { InspectionReport } from './src/public/mod.ts';
