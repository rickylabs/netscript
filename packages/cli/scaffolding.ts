/**
 * Public scaffolding primitives for plugin packages and host tooling.
 *
 * @module
 *
 * @example Create a plugin scaffold context.
 * ```ts
 * import { createPluginScaffoldContext } from "@netscript/cli/scaffolding";
 *
 * const context = createPluginScaffoldContext({
 *   targetPath: "/workspace/plugins/audit-log",
 *   pluginName: "audit-log",
 * });
 * ```
 */

/**
 * Plugin scaffold planning and writing helpers.
 *
 * @example Create a plugin scaffold context.
 * ```ts
 * import { createPluginScaffoldContext } from "@netscript/cli/scaffolding";
 *
 * const context = createPluginScaffoldContext({
 *   targetPath: "/workspace/plugins/audit-log",
 *   pluginName: "audit-log",
 * });
 * ```
 */
export {
  createPluginScaffoldContext,
  planPluginScaffoldFiles,
  writePluginScaffoldFiles,
} from './src/public/scaffolding/plugin-scaffolding.ts';
export type {
  PlannedPluginScaffoldFile,
  PluginScaffoldContext,
  PluginScaffoldContextOptions,
  PluginScaffoldDefinition,
  PluginScaffoldDependencies,
  PluginScaffoldDirectory,
  PluginScaffoldTemplate,
} from './src/public/scaffolding/plugin-scaffolding.ts';

/**
 * Filesystem and template contracts used by scaffold integrations.
 *
 * @example Type a plugin scaffold adapter boundary.
 * ```ts
 * import type { FileSystemPort, TemplatePort } from "@netscript/cli/scaffolding";
 *
 * interface Dependencies {
 *   readonly fs: FileSystemPort;
 *   readonly template: TemplatePort;
 * }
 * ```
 */
export type { ScaffoldResult } from './src/kernel/domain/core-types.ts';
export type {
  DirEntry,
  FileInfo,
  ScaffoldOptions,
  WalkEntry,
} from './src/kernel/domain/core-types.ts';
export type { FileSystemPort } from './src/kernel/ports/file-system-port.ts';
export type { ScaffolderPort, TemplatePort } from './src/kernel/ports/template-port.ts';

/**
 * Built-in scaffold adapters.
 *
 * @example Create the default string-template renderer.
 * ```ts
 * import { StringTemplateAdapter } from "@netscript/cli/scaffolding";
 *
 * declare const hostTemplateAdapter: StringTemplateAdapter;
 * const template: StringTemplateAdapter = hostTemplateAdapter;
 * ```
 */
export { DenoFileSystem } from './src/kernel/adapters/runtime/file-system/deno-file-system.ts';
export { MemoryFileSystemAdapter } from './src/kernel/adapters/scaffold/memory-fs.ts';
export { Scaffolder } from './src/kernel/adapters/scaffold/scaffolder.ts';
export {
  renderTemplate,
  StringTemplateAdapter,
} from './src/kernel/adapters/scaffold/template-adapter.ts';
