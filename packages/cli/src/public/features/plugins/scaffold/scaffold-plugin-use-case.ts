/**
 * @module
 *
 * Host-side use case for scaffolding a NetScript plugin package.
 */

import { dirname, join } from '@std/path';
import { PLUGIN_SKELETON_TEMPLATES } from '@netscript/plugin/templates';

import { TEMPLATE_CONVENTIONS } from '../../../../kernel/constants/template-conventions.ts';
import { IoError, UsageError } from '../../../../kernel/domain/errors/cli-exit-error.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import { EXIT_CODES } from '../host/plugin-loader.ts';
import {
  createTemplateSubstitutionPort,
  expandTemplate,
  hasTemplateVariables,
  type TemplateSubstitutionPort,
  type TemplateVariables,
} from './template-substitution.ts';

/** Default folder for scaffolded plugin packages. */
export const DEFAULT_SCAFFOLD_TARGET = 'plugins';

/** Options for plugin skeleton scaffolding. */
export interface PluginScaffoldOptions {
  /** Full plugin package name, for example `@acme/plugin-billing`. */
  readonly pluginName: string;
  /** Directory that receives scaffolded files. */
  readonly targetPath: string;
  /** Directory containing plugin skeleton `.template` files. */
  readonly templateRoot: string;
  /** Template paths relative to `templateRoot`. */
  readonly templateRegistry?: readonly string[];
  /** Whether existing files may be overwritten. */
  readonly overwrite?: boolean;
}

/** Result of plugin skeleton scaffolding. */
export interface PluginScaffoldResult {
  /** Files written by the scaffold use case. */
  readonly filesCreated: readonly string[];
  /** Directories explicitly created by the scaffold use case. */
  readonly directoriesCreated: readonly string[];
  /** Files skipped because overwrite was disabled. */
  readonly filesSkipped: readonly string[];
  /** Variables used to expand templates. */
  readonly variables: TemplateVariables;
}

/** Dependencies required by the scaffold use case. */
export interface PluginScaffoldDependencies {
  /** Filesystem adapter used for all reads and writes. */
  readonly fs: FileSystemPort;
  /** Template substitution port. */
  readonly substitution?: TemplateSubstitutionPort;
}

/** Resolve the default package target under the project plugin directory. */
export function resolvePluginScaffoldTarget(projectRoot: string, pluginName: string): string {
  return join(projectRoot, DEFAULT_SCAFFOLD_TARGET, resolvePluginPackageSegment(pluginName));
}

/** Resolve template variables from a plugin package name. */
export function resolveTemplateVariables(pluginName: string): TemplateVariables {
  const packageSegment = resolvePluginPackageSegment(pluginName);
  const pluginScope = pluginName.startsWith('@') ? pluginName.split('/')[0] : '';
  const pluginBaseName = packageSegment.replace(/^plugin-/, '');
  const className = buildClassName(pluginBaseName);

  return {
    pluginName,
    pluginScope,
    pluginBaseName,
    className,
    ClassName: className,
    pluginNameKebab: pluginBaseName,
    'plugin-name': packageSegment,
  };
}

/** Scaffold a plugin package from the registered skeleton templates. */
export async function scaffoldPluginPackage(
  options: PluginScaffoldOptions,
  dependencies: PluginScaffoldDependencies,
): Promise<PluginScaffoldResult> {
  const substitution = dependencies.substitution ?? createTemplateSubstitutionPort();
  const templateRegistry = options.templateRegistry ?? PLUGIN_SKELETON_TEMPLATES;
  const variables = resolveTemplateVariables(options.pluginName);
  const filesCreated: string[] = [];
  const filesSkipped: string[] = [];
  const directoriesCreated: string[] = [];
  const createdDirectories = new Set<string>();

  try {
    await emitDirectory(
      options.targetPath,
      dependencies.fs,
      createdDirectories,
      directoriesCreated,
    );

    for (const templatePath of templateRegistry) {
      const sourcePath = join(options.templateRoot, templatePath);
      const outputPath = resolveTemplateOutputPath(options.targetPath, templatePath, variables);

      if (hasTemplateVariables(outputPath)) {
        throw new UsageError(
          EXIT_CODES.SCAFFOLD_FAILED,
          `Template output path still contains unresolved variables: ${outputPath}`,
        );
      }

      if (await dependencies.fs.exists(outputPath) && !options.overwrite) {
        filesSkipped.push(outputPath);
        continue;
      }

      await emitDirectory(
        dirname(outputPath),
        dependencies.fs,
        createdDirectories,
        directoriesCreated,
      );
      const template = await dependencies.fs.readFile(sourcePath);
      const content = substitution.expand(template, variables);
      await dependencies.fs.writeFile(outputPath, content);
      filesCreated.push(outputPath);
    }
  } catch (error: unknown) {
    if (error instanceof UsageError) throw error;
    throw new IoError(
      EXIT_CODES.SCAFFOLD_FAILED,
      `Could not scaffold plugin package "${options.pluginName}".`,
      { cause: error, context: { targetPath: options.targetPath } },
    );
  }

  return { filesCreated, directoriesCreated, filesSkipped, variables };
}

function resolveTemplateOutputPath(
  targetPath: string,
  templatePath: string,
  variables: TemplateVariables,
): string {
  const expandedPath = expandTemplate(templatePath, variables);
  const outputPath = expandedPath.endsWith(TEMPLATE_CONVENTIONS.TEMPLATE_EXTENSION)
    ? expandedPath.slice(0, -TEMPLATE_CONVENTIONS.TEMPLATE_EXTENSION.length)
    : expandedPath;
  return join(targetPath, outputPath);
}

function resolvePluginPackageSegment(pluginName: string): string {
  const packageSegment = pluginName.split('/').at(-1)?.trim();
  if (!packageSegment) {
    throw new UsageError(
      EXIT_CODES.SCAFFOLD_FAILED,
      `Plugin package name is invalid: ${pluginName}`,
    );
  }
  return packageSegment;
}

function buildClassName(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

async function emitDirectory(
  path: string,
  fs: FileSystemPort,
  created: Set<string>,
  directoriesCreated: string[],
): Promise<void> {
  if (created.has(path)) return;
  await fs.createDir(path);
  created.add(path);
  directoriesCreated.push(path);
}
