export { composeAppHost } from './compose-apphost.ts';
export type {
  ComposeAppHostOptions,
  ComposeAppHostResult,
  ComposePluginManifest,
} from './compose-apphost.ts';
export { createPortAllocator } from './port-allocation.ts';
export type { PortAllocationOptions } from './port-allocation.ts';
export { buildViteEnvVarName } from './build-vite-env-var-name.ts';
export type { ViteEnvVarNames } from './build-vite-env-var-name.ts';
export { buildOtelEnvVars } from './resolve-env-vars.ts';
export type { OtelMode } from './resolve-env-vars.ts';
export { resolveDataPath, resolveWorkdir, resolveWorkspacePath } from './resolve-paths.ts';
export { resolvePermissions } from './resolve-permissions.ts';
export {
  extractDependencies,
  extractPluginReferences,
  extractServiceReferences,
} from './resolve-references.ts';
export type { AspireResource, AspireResourceKind, ContributionContext } from '../domain/mod.ts';
export type { AspireBuilder } from '../ports/mod.ts';
export { ContributionRegistry } from '../runtime/mod.ts';
