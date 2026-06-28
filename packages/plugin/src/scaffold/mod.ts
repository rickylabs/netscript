/**
 * Shared primitives for plugin-owned scaffold entrypoints.
 *
 * @example Define a scaffold artifact
 * ```ts
 * import type { ScaffoldArtifact } from "@netscript/plugin/scaffold";
 *
 * const artifact: ScaffoldArtifact = {
 *   path: "plugins/example/mod.ts",
 *   content: "export const name = 'example';\n",
 * };
 * ```
 *
 * @module
 */

export type { PluginLogger } from '../domain/mod.ts';
export type { FileSystemPort } from '../ports/mod.ts';
export type {
  PluginManifestCapabilities,
  PluginManifestOfficialSource,
  PluginManifestPostScript,
  PluginManifestProvider,
  PluginManifestScaffolder,
  PluginScaffoldEntrypoint,
  PluginScaffolderRequiredPermissions,
  ScaffolderContext,
  ScaffoldResult,
} from '../protocol/mod.ts';
export type { ScaffoldArtifact } from './artifact.ts';
export { parseScaffolderContextArgs, runScaffoldCli } from './cli.ts';
export { buildPluginDenoJson } from './deno-json.ts';
export type { PluginDenoJsonCompilerOptions, PluginDenoJsonSpec } from './deno-json.ts';
export type { PluginDenoJsonPublish } from './deno-json.ts';
export { toEntrypoint } from './entrypoint.ts';
export type { PluginScaffolderConstructor } from './entrypoint.ts';
export { buildScaffoldPluginJson } from './manifest-spec.ts';
export type { PluginScaffoldManifestSpec } from './manifest-spec.ts';
export { readScaffoldPluginName } from './options.ts';
export type { ReadScaffoldPluginNameOptions } from './options.ts';
export { PluginScaffolder } from './plugin-scaffolder.ts';
export { scaffoldSchemaUrl } from './schema-url.ts';
export { buildStandardScaffoldArtifacts } from './standard-artifacts.ts';
export type { StandardScaffoldArtifactsSpec } from './standard-artifacts.ts';
