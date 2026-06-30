export type { PluginCliArgs, PluginCliCommand, PluginCliResult } from './types.ts';
export { PluginCli } from './base/plugin-cli.ts';
export { PluginRuntimeConfigCli } from './base/plugin-runtime-config-cli.ts';
export { isDoctorReportPassing } from './base/doctor-report.ts';
export type { DoctorCheck, DoctorReport } from './base/doctor-report.ts';
export { runMountedCommand } from './composition/cliffy-runner.ts';
export { mountPluginCli } from './composition/mount-plugin-cli.ts';
export { formatPluginHelp } from './presentation/help-formatter.ts';
export { routeVerb } from './presentation/verb-router.ts';
export { LocalProjectFiles, resolveProjectRoot } from './adapters/project-files.ts';
export type { ProjectFileEntry, ProjectFiles } from './adapters/project-files.ts';
export { renderRegistryModule, toRegistryImportSpecifier } from './application/registry-emitter.ts';
export type { RegistryEmitItem, RegistryModuleSpec } from './application/registry-emitter.ts';
export { normalizePluginArgv, parsePluginCliArgs } from './application/argv.ts';
export type { NormalizedPluginArgv } from './application/argv.ts';
export { createBaseMetaCommands } from './application/base-meta-commands.ts';
export type { PluginBaseMeta } from './application/base-meta-commands.ts';
export {
  findGeneratedProjectRoot,
  loadGeneratedProjectRegistry,
} from './application/generated-project-registry.ts';
export type {
  DefinitionGuard,
  GeneratedProjectRegistryOptions,
} from './application/generated-project-registry.ts';
