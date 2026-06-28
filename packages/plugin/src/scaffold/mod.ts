/**
 * Typesafe core surface for plugin-owned scaffolders.
 *
 * This module is the shared foundation for every NetScript plugin's `./scaffold` export. A plugin
 * supplies a typed artifact builder and a file system port; {@linkcode createPluginScaffold}
 * composes them into a `PluginScaffoldEntrypoint`, and {@linkcode runScaffoldCli} runs that
 * entrypoint over the `--context-json` argv contract. Manifests are produced from typed specs via
 * {@linkcode buildScaffoldPluginJson}, and the userland plugin name is parsed and validated once by
 * {@linkcode readScaffoldPluginName}. The surface owns no string codegen and no casing module.
 *
 * @example
 * ```ts
 * import {
 *   createPluginScaffold,
 *   readScaffoldPluginName,
 *   runScaffoldCli,
 *   type ScaffoldArtifact,
 * } from '@netscript/plugin/scaffold';
 * import type { ScaffolderContext } from '@netscript/plugin/protocol';
 *
 * function buildArtifacts(context: ScaffolderContext): readonly ScaffoldArtifact[] {
 *   const pluginName = readScaffoldPluginName(context);
 *   return [{ path: `plugins/${pluginName}/health.ts`, content: healthStub }];
 * }
 *
 * export const scaffold = createPluginScaffold({ fileSystem, buildArtifacts });
 *
 * if (import.meta.main) {
 *   await runScaffoldCli({ entrypoint: scaffold });
 * }
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
export { scaffoldSchemaUrl } from './schema-url.ts';
export { buildScaffoldPluginJson } from './manifest-spec.ts';
export type { PluginScaffoldManifestSpec } from './manifest-spec.ts';
export { InvalidPluginNameError, readScaffoldPluginName } from './options.ts';
export type { ScaffoldPluginNameSource } from './options.ts';
export { createPluginScaffold } from './scaffold.ts';
export type { BuildArtifacts, PluginScaffoldSpec } from './scaffold.ts';
export { createDenoFileSystem, parseScaffolderContextArgs, runScaffoldCli } from './cli.ts';
export type { ParsedScaffolderContext, RunScaffoldCliOptions } from './cli.ts';
