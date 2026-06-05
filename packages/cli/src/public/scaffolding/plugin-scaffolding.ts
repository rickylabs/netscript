import { dirname, join } from '@std/path/posix';

import type { ScaffoldResult } from '../../kernel/domain/core-types.ts';
import type { FileSystemPort } from '../../kernel/ports/file-system-port.ts';
import type { TemplatePort } from '../../kernel/ports/template-port.ts';

/** One template owned by a plugin package. */
export interface PluginScaffoldTemplate {
  /** Target path relative to the scaffold target directory. */
  readonly path: string;
  /** Template source using the CLI string-template syntax. */
  readonly content: string;
}

/** One directory a plugin scaffold should create. */
export interface PluginScaffoldDirectory {
  /** Directory path relative to the scaffold target directory. */
  readonly path: string;
}

/** Plugin-owned scaffold definition. */
export interface PluginScaffoldDefinition {
  /** Directories to create before files are written. */
  readonly directories?: readonly PluginScaffoldDirectory[];
  /** Template files to render and write. */
  readonly templates: readonly PluginScaffoldTemplate[];
}

/** Runtime context for a plugin scaffold operation. */
export interface PluginScaffoldContext {
  /** Absolute target directory owned by this plugin scaffold. */
  readonly targetPath: string;
  /** Plugin package name. */
  readonly pluginName: string;
  /** Template variables supplied by the plugin or host. */
  readonly variables: Readonly<Record<string, string>>;
  /** Whether existing files should be overwritten. */
  readonly overwrite: boolean;
}

/** Options for creating a plugin scaffold context. */
export interface PluginScaffoldContextOptions {
  /** Absolute target directory owned by this plugin scaffold. */
  readonly targetPath: string;
  /** Plugin package name. */
  readonly pluginName: string;
  /** Additional template variables supplied by the plugin or host. */
  readonly variables?: Readonly<Record<string, string>>;
  /** Whether existing files should be overwritten. */
  readonly overwrite?: boolean;
}

/** Rendered file planned by a plugin scaffold operation. */
export interface PlannedPluginScaffoldFile {
  /** Absolute output path. */
  readonly path: string;
  /** Rendered output content. */
  readonly content: string;
}

/** Dependencies needed by plugin scaffold helpers. */
export interface PluginScaffoldDependencies {
  /** Filesystem used for writes and existence checks. */
  readonly fs: FileSystemPort;
  /** Template renderer used for plugin-owned templates. */
  readonly template: TemplatePort;
}

/** Create a normalized plugin scaffold context. */
export function createPluginScaffoldContext(
  options: PluginScaffoldContextOptions,
): PluginScaffoldContext {
  return {
    targetPath: options.targetPath,
    pluginName: options.pluginName,
    overwrite: options.overwrite ?? false,
    variables: {
      pluginName: options.pluginName,
      ...(options.variables ?? {}),
    },
  };
}

/** Render all files in a plugin scaffold definition without writing them. */
export async function planPluginScaffoldFiles(
  definition: PluginScaffoldDefinition,
  context: PluginScaffoldContext,
  dependencies: Pick<PluginScaffoldDependencies, 'template'>,
): Promise<readonly PlannedPluginScaffoldFile[]> {
  const files: PlannedPluginScaffoldFile[] = [];
  for (const template of definition.templates) {
    files.push({
      path: join(context.targetPath, template.path),
      content: await dependencies.template.render(template.content, context.variables),
    });
  }
  return files;
}

/** Render and write a plugin scaffold definition. */
export async function writePluginScaffoldFiles(
  definition: PluginScaffoldDefinition,
  context: PluginScaffoldContext,
  dependencies: PluginScaffoldDependencies,
): Promise<ScaffoldResult> {
  const start = performance.now();
  const filesCreated: string[] = [];
  const directoriesCreated: string[] = [];
  const filesSkipped: string[] = [];

  await dependencies.fs.createDir(context.targetPath);

  for (const directory of definition.directories ?? []) {
    const path = join(context.targetPath, directory.path);
    await dependencies.fs.createDir(path);
    directoriesCreated.push(path);
  }

  const plannedFiles = await planPluginScaffoldFiles(definition, context, dependencies);
  for (const file of plannedFiles) {
    if (await dependencies.fs.exists(file.path)) {
      if (!context.overwrite) {
        filesSkipped.push(file.path);
        continue;
      }
    }
    await dependencies.fs.createDir(dirname(file.path));
    await dependencies.fs.writeFile(file.path, file.content);
    filesCreated.push(file.path);
  }

  return {
    filesCreated,
    directoriesCreated,
    filesSkipped,
    totalOperations: filesCreated.length + directoriesCreated.length,
    durationMs: performance.now() - start,
  };
}
