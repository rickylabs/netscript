/**
 * Maintainer-only CLI surface for monorepo workflows and sync operations.
 */

export { computeLocalBase, detectMonorepoRoot } from './adapters/monorepo-detector.ts';
export { copyLocalPackages, createPackageCopier } from './adapters/packages-copier.ts';
export { orchestrateMaintainerInit } from './features/init/orchestrate-maintainer-init.ts';
export { probeMonorepo } from './features/probe/probe-monorepo.ts';
export { syncPackages } from './features/sync/packages/sync-packages.ts';
export { syncPlugin } from './features/sync/plugin/sync-plugin.ts';
export { syncTemplates } from './features/sync/templates/sync-templates.ts';
export { runScaffoldTest } from './features/test-scaffold/run-scaffold-test.ts';
export type {
  CopyLocalPackagesOptions,
  CopyLocalPackagesResult,
  PackageCopierPort,
} from './ports/package-copier-port.ts';
export type {
  MaintainerInitDependencies,
  MaintainerInitExecutionRequest,
  MaintainerInitRequest,
  MaintainerInitResult,
} from './features/init/orchestrate-maintainer-init.ts';
export type {
  ProbeMonorepoDependencies,
  ProbeMonorepoRequest,
  ProbeMonorepoResult,
} from './features/probe/probe-monorepo.ts';
export type {
  RunScaffoldTestDependencies,
  RunScaffoldTestRequest,
  RunScaffoldTestResult,
  ScaffoldTestFormat,
} from './features/test-scaffold/run-scaffold-test.ts';
export type {
  MaintainerPluginPackageSourceMode,
  OfficialPluginSourceDescriptor,
  SyncPluginCopyRequest,
  SyncPluginCopyResult,
  SyncPluginDependencies,
  SyncPluginRequest,
  SyncPluginResult,
} from './features/sync/plugin/sync-plugin.ts';
export type {
  SyncPackagesDependencies,
  SyncPackagesRequest,
} from './features/sync/packages/sync-packages.ts';
export type {
  SyncTemplatesDependencies,
  SyncTemplatesRequest,
  SyncTemplatesResult,
  TemplateSyncStep,
  TemplateSyncStepResult,
} from './features/sync/templates/sync-templates.ts';
export * from './domain/local-packages.ts';
export {
  createLocalImportResolver,
  resolveLocalImportSpecifier,
} from './adapters/local-import-resolver.ts';
export type { LocalImportResolverPort } from './ports/local-import-resolver-port.ts';
export {
  canCopyOfficialPlugin,
  findOfficialPluginSourceRoot,
  getOfficialPluginSource,
  registerOfficialPluginKindProviders,
} from './adapters/official-plugin-source.ts';
export { copyOfficialPlugin } from './features/sync/plugin/copy-official-plugin.ts';
export { createOfficialPluginCopier } from './infra/official-plugin-copier.ts';
export type {
  CopyOfficialPluginOptions,
  OfficialPluginCopyResult,
  OfficialPluginDependency,
  OfficialPluginSource,
  PluginSourceMode,
} from './adapters/official-plugin-source.ts';
