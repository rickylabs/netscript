/**
 * @module
 *
 * Workspace and resource path resolution utilities.
 *
 * Resolves file paths relative to the AppHost directory, following the
 * same conventions as the C# NuGet's path resolution.
 */

import { join, resolve } from '@std/path';

/**
 * Resolves a workspace-relative path from the AppHost directory.
 *
 * The AppHost directory is typically `dotnet/AppHost/`, two levels deep
 * from the workspace root. This function navigates up two levels and then
 * resolves the relative path.
 *
 * Equivalent to the C# NuGet's:
 * ```csharp
 * Path.GetFullPath(Path.Combine(builder.AppHostDirectory, "..", "..", relativePath))
 * ```
 *
 * @param appHostDir - Absolute path to the AppHost directory
 * @param relativePath - Path relative to the workspace root
 * @returns Absolute resolved path
 *
 * @example
 * ```ts
 * resolveWorkspacePath('/project/dotnet/AppHost', 'services/users');
 * // '/project/services/users'
 * ```
 */
export function resolveWorkspacePath(
  appHostDir: string,
  relativePath: string,
): string {
  return resolve(appHostDir, '..', '..', relativePath);
}

/**
 * Resolves the default working directory for a resource entry.
 *
 * If an explicit `Workdir` is provided in the config, it is used directly.
 * Otherwise, a default is derived from the section name and resource key.
 *
 * @param section - Config section name (e.g., "services", "plugins", "apps")
 * @param key - Resource entry key (e.g., "users", "workers-api")
 * @param explicitWorkdir - Explicit workdir from the config entry
 * @returns The resolved working directory path (relative to workspace root)
 *
 * @example
 * ```ts
 * resolveWorkdir('services', 'users');           // 'services/users'
 * resolveWorkdir('plugins', 'workers-api');       // 'plugins/workers-api'
 * resolveWorkdir('services', 'users', 'custom/'); // 'custom/'
 * ```
 */
export function resolveWorkdir(
  section: string,
  key: string,
  explicitWorkdir?: string,
): string {
  return explicitWorkdir ?? join(section, key);
}

/**
 * Resolves the data path for a persistent resource (database, cache).
 *
 * If a relative `dataPath` is specified in the config, it is resolved
 * relative to the workspace root via the AppHost directory. If no path
 * is specified, a default under `.data/{resourceName}` is used.
 *
 * @param appHostDir - Absolute path to the AppHost directory
 * @param dataPath - Data path from the config entry
 * @param resourceName - Resource name for default path generation
 * @returns Absolute resolved data path
 *
 * @example
 * ```ts
 * resolveDataPath('/project/dotnet/AppHost', 'data/postgres', 'postgres');
 * // '/project/data/postgres'
 *
 * resolveDataPath('/project/dotnet/AppHost', undefined, 'garnet');
 * // '/project/.data/garnet'
 * ```
 */
export function resolveDataPath(
  appHostDir: string,
  dataPath: string | undefined,
  resourceName: string,
): string {
  const relativePath = dataPath ?? join('.data', resourceName);
  return resolveWorkspacePath(appHostDir, relativePath);
}
