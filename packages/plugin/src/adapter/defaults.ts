import { dirname } from '@std/path';
import { join as posixJoin } from '@std/path/posix';

import type { FileSystemPort } from '../ports/mod.ts';

/** Default health endpoint used by plugin doctor commands. */
export const DEFAULT_PLUGIN_HEALTH_ENDPOINT: string = '/health';

/** Default workspace root used when a caller supplies no explicit root. */
export const DEFAULT_PLUGIN_WORKSPACE_ROOT: string = '.';

/**
 * Create the default Deno-backed file-system port for adapter commands.
 *
 * @returns A file-system port using Deno read/write primitives.
 *
 * @example
 * ```ts
 * const fileSystem = createDenoFileSystem();
 * console.log(await fileSystem.exists('deno.json'));
 * ```
 */
export function createDenoFileSystem(): FileSystemPort {
  return {
    async readText(path: string): Promise<string> {
      return await Deno.readTextFile(path);
    },
    async writeText(path: string, text: string): Promise<void> {
      await Deno.mkdir(dirname(path), { recursive: true });
      await Deno.writeTextFile(path, text);
    },
    async exists(path: string): Promise<boolean> {
      try {
        await Deno.stat(path);
        return true;
      } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
          return false;
        }
        throw error;
      }
    },
  };
}

/**
 * Resolve a workspace-relative path against a workspace root.
 *
 * Joins with POSIX separators so the resolved key is byte-deterministic across
 * operating systems: artifact paths are authored POSIX-relative, and Deno
 * accepts forward-slash paths for file-system writes on Windows. Using the
 * platform-native join here would emit backslash keys on Windows, diverging
 * from the POSIX `createdFiles` paths the command reports.
 *
 * @param workspaceRoot Absolute or relative workspace root.
 * @param artifactPath Workspace-relative artifact path.
 * @returns Path suitable for the file-system port.
 *
 * @example
 * ```ts
 * console.log(resolveWorkspacePath('/repo', 'src/mod.ts'));
 * ```
 */
export function resolveWorkspacePath(workspaceRoot: string, artifactPath: string): string {
  return posixJoin(workspaceRoot, artifactPath);
}
