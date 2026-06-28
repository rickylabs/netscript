import { join, normalize } from '@std/path';

import { DenoFileSystemAdapter } from '../adapters/mod.ts';
import type { FileSystemPort } from '../ports/mod.ts';
import type {
  PluginScaffoldEntrypoint,
  ScaffolderContext,
  ScaffoldResult,
} from '../protocol/mod.ts';
import type { ScaffoldArtifact } from './artifact.ts';
import type { PluginScaffoldManifestSpec } from './manifest-spec.ts';

/** Constructor shape accepted by {@link toEntrypoint}. */
export interface PluginScaffolderConstructor {
  /** Create a plugin scaffolder with its default filesystem adapter. */
  new (): PluginScaffolder;
}

/** Base class for plugin-owned scaffolders that write planned artifacts through a filesystem port. */
export abstract class PluginScaffolder {
  /** Published plugin name handled by this scaffolder. */
  abstract readonly pluginName: string;
  /** Static manifest data for this plugin's `scaffold.plugin.json`. */
  abstract readonly manifestSpec: PluginScaffoldManifestSpec;

  /**
   * Create a plugin scaffolder.
   *
   * @param fileSystem - File system port used for writes and dry-run comparisons.
   */
  constructor(private readonly fileSystem: FileSystemPort = new DenoFileSystemAdapter()) {}

  /**
   * Build plugin-specific artifacts for the supplied scaffold context.
   *
   * @param context - Scaffolder context supplied by the installer.
   * @returns Workspace-relative artifacts to plan or write.
   */
  protected abstract buildArtifacts(
    context: ScaffolderContext,
  ): readonly ScaffoldArtifact[] | Promise<readonly ScaffoldArtifact[]>;

  /**
   * Plan or write this plugin's artifacts into a workspace.
   *
   * @param context - Scaffolder context supplied by the installer.
   * @returns Scaffold result describing created or modified files.
   */
  async scaffold(context: ScaffolderContext): Promise<ScaffoldResult> {
    const artifacts = await this.buildArtifacts(context);
    const createdFiles: string[] = [];
    const modifiedFiles: string[] = [];

    for (const artifact of artifacts) {
      const absolutePath = safeJoin(context.workspaceRoot, artifact.path);
      const exists = await this.fileSystem.exists(absolutePath);
      const existing = exists ? await this.fileSystem.readText(absolutePath) : undefined;
      if (existing === artifact.content) {
        continue;
      }

      if (exists) {
        modifiedFiles.push(artifact.path);
      } else {
        createdFiles.push(artifact.path);
      }

      if (!context.dryRun) {
        await this.fileSystem.writeText(absolutePath, artifact.content);
      }
    }

    const changed = createdFiles.length > 0 || modifiedFiles.length > 0;
    return {
      status: context.dryRun ? 'planned' : changed ? 'applied' : 'skipped',
      createdFiles,
      modifiedFiles,
      databaseMigrationsAdded: artifacts.some((artifact) => artifact.path.endsWith('.prisma')),
    };
  }
}

/**
 * Convert a scaffolder class into the protocol entrypoint consumed by installers.
 *
 * @param constructor - Scaffolder constructor with default dependencies.
 * @returns Protocol-compatible scaffold entrypoint.
 */
export function toEntrypoint(
  constructor: PluginScaffolderConstructor,
): PluginScaffoldEntrypoint {
  return (context: ScaffolderContext): Promise<ScaffoldResult> =>
    new constructor().scaffold(context);
}

function safeJoin(workspaceRoot: string, relativePath: string): string {
  const root = normalize(workspaceRoot);
  const absolutePath = normalize(join(root, relativePath));
  if (absolutePath !== root && !absolutePath.startsWith(`${root}/`)) {
    throw new Error(`Refusing to write outside workspace root: ${relativePath}`);
  }
  return absolutePath;
}
