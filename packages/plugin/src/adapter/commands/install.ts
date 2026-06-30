import type { FileSystemPort } from '../../ports/mod.ts';
import type { ScaffolderContext, ScaffoldResult } from '../../protocol/mod.ts';
import type { NetScriptPlugin, PluginCommandContext } from '../contract.ts';
import { artifactText, type ScaffoldArtifact } from '../item/artifact.ts';
import { resolveWorkspacePath } from '../defaults.ts';

/** Input consumed by the mandatory install command. */
export interface RunInstallCommandOptions {
  /** Plugin contract supplying install seams. */
  readonly plugin: NetScriptPlugin;
  /** Shared command context. */
  readonly context: PluginCommandContext;
}

/**
 * Run the core-owned plugin install algorithm.
 *
 * @param options Plugin contract and command context.
 * @returns Scaffold result describing planned or applied artifacts.
 *
 * @example
 * ```ts
 * const result = await runInstallCommand({ plugin, context });
 * console.log(result.status);
 * ```
 */
export async function runInstallCommand(
  options: RunInstallCommandOptions,
): Promise<ScaffoldResult> {
  const artifacts = collectInstallArtifacts(options.plugin);
  return await writeArtifacts({
    artifacts,
    context: options.context,
    fileSystem: options.context.fileSystem,
  });
}

/**
 * Create a scaffolder protocol entrypoint from the install command.
 *
 * @param plugin Plugin contract supplying install seams.
 * @param fileSystem File-system port used to write artifacts.
 * @returns Protocol scaffold entrypoint.
 *
 * @example
 * ```ts
 * const entrypoint = createInstallScaffoldEntrypoint(plugin, fileSystem);
 * console.log(typeof entrypoint);
 * ```
 */
export function createInstallScaffoldEntrypoint(
  plugin: NetScriptPlugin,
  fileSystem: FileSystemPort,
): (context: ScaffolderContext) => Promise<ScaffoldResult> {
  return async (context: ScaffolderContext): Promise<ScaffoldResult> => {
    return await runInstallCommand({
      plugin,
      context: {
        workspaceRoot: context.workspaceRoot,
        options: context.options,
        config: {},
        dryRun: context.dryRun,
        fileSystem,
      },
    });
  };
}

/**
 * Emit starter artifacts from the plugin's install seams.
 *
 * @param plugin Plugin contract supplying starter resources.
 * @returns Artifacts emitted by every starter resource.
 *
 * @example
 * ```ts
 * const artifacts = collectInstallArtifacts(plugin);
 * console.log(artifacts.length);
 * ```
 */
export function collectInstallArtifacts(plugin: NetScriptPlugin): readonly ScaffoldArtifact[] {
  return plugin.install.starterResources.flatMap((starter) =>
    starter.scaffolder.emit(starter.input)
  );
}

interface WriteArtifactsOptions {
  readonly artifacts: readonly ScaffoldArtifact[];
  readonly context: PluginCommandContext;
  readonly fileSystem: FileSystemPort;
}

async function writeArtifacts(options: WriteArtifactsOptions): Promise<ScaffoldResult> {
  const createdFiles: string[] = [];
  const modifiedFiles: string[] = [];

  for (const artifact of options.artifacts) {
    const targetPath = resolveWorkspacePath(options.context.workspaceRoot, artifact.path);
    const exists = await options.fileSystem.exists(targetPath);
    const current = exists ? await options.fileSystem.readText(targetPath) : undefined;
    const next = artifactText(artifact);

    if (current === next) {
      continue;
    }

    if (exists) {
      modifiedFiles.push(artifact.path);
    } else {
      createdFiles.push(artifact.path);
    }

    if (!options.context.dryRun) {
      await options.fileSystem.writeText(targetPath, next);
    }
  }

  const changed = createdFiles.length > 0 || modifiedFiles.length > 0;
  const status = options.context.dryRun && changed ? 'planned' : changed ? 'applied' : 'skipped';

  return {
    status,
    createdFiles,
    modifiedFiles,
    databaseMigrationsAdded: options.artifacts.some((artifact) =>
      artifact.databaseMigration === true
    ),
  };
}
