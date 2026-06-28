import { join, normalize } from '@std/path/posix';
import type { FileSystemPort } from '../ports/mod.ts';
import type {
  PluginScaffoldEntrypoint,
  ScaffolderContext,
  ScaffoldResult,
} from '../protocol/mod.ts';
import type { ScaffoldArtifact } from './artifact.ts';

/**
 * Build the userland artifacts a scaffolder emits for a given context.
 *
 * Implementations return the typed file descriptors for the run; they perform no file I/O. The
 * factory created by {@linkcode createPluginScaffold} is responsible for writing them through the
 * injected {@linkcode FileSystemPort}.
 *
 * @param context The scaffolder context supplied by the installer.
 * @returns The artifacts to write, synchronously or as a promise.
 */
export type BuildArtifacts = (
  context: ScaffolderContext,
) => readonly ScaffoldArtifact[] | Promise<readonly ScaffoldArtifact[]>;

/** Composition inputs for {@linkcode createPluginScaffold}. */
export interface PluginScaffoldSpec {
  /** File system port used to read existing content and write artifacts. */
  readonly fileSystem: FileSystemPort;
  /** Builder that produces the userland artifacts for a scaffold run. */
  readonly buildArtifacts: BuildArtifacts;
}

/**
 * Create a plugin scaffold entrypoint by composing a file system port with an artifact builder.
 *
 * This is a composition factory, not a base class: it holds the injected
 * {@linkcode FileSystemPort} and {@linkcode BuildArtifacts}, and returns a
 * {@linkcode PluginScaffoldEntrypoint}. The returned entrypoint builds the artifacts, then writes
 * only the ones whose content differs from what already exists. When `context.dryRun` is set it
 * writes nothing and reports `status: 'planned'`.
 *
 * @param spec The injected file system port and artifact builder.
 * @returns A scaffold entrypoint suitable for a plugin's `./scaffold` export.
 * @example
 * ```ts
 * import { createPluginScaffold } from '@netscript/plugin/scaffold';
 *
 * export const scaffold = createPluginScaffold({
 *   fileSystem,
 *   buildArtifacts: (context) => buildWorkerArtifacts(context),
 * });
 * ```
 */
export function createPluginScaffold(spec: PluginScaffoldSpec): PluginScaffoldEntrypoint {
  return async (context: ScaffolderContext): Promise<ScaffoldResult> => {
    const artifacts = await spec.buildArtifacts(context);
    const createdFiles: string[] = [];
    const modifiedFiles: string[] = [];
    const pendingWrites: { readonly path: string; readonly content: string }[] = [];

    for (const artifact of artifacts) {
      const absolutePath = safeJoin(context.workspaceRoot, artifact.path);
      const alreadyExists = await spec.fileSystem.exists(absolutePath);
      if (alreadyExists) {
        const existing = await spec.fileSystem.readText(absolutePath);
        if (existing === artifact.content) {
          continue;
        }
        modifiedFiles.push(artifact.path);
      } else {
        createdFiles.push(artifact.path);
      }
      pendingWrites.push({ path: absolutePath, content: artifact.content });
    }

    if (!context.dryRun) {
      for (const write of pendingWrites) {
        await spec.fileSystem.writeText(write.path, write.content);
      }
    }

    const changed = createdFiles.length > 0 || modifiedFiles.length > 0;
    return {
      status: context.dryRun ? 'planned' : changed ? 'applied' : 'skipped',
      createdFiles,
      modifiedFiles,
      databaseMigrationsAdded: artifacts.some((artifact) => artifact.path.endsWith('.prisma')),
    };
  };
}

/** Join a workspace-relative path onto the root, refusing traversal outside the root. */
function safeJoin(workspaceRoot: string, relativePath: string): string {
  const root = normalize(workspaceRoot);
  const absolutePath = normalize(join(root, relativePath));
  if (absolutePath !== root && !absolutePath.startsWith(`${root}/`)) {
    throw new Error(`Refusing to write outside workspace root: ${relativePath}`);
  }
  return absolutePath;
}
