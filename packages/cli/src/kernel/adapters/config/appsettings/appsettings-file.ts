/**
 * @module infra/config/appsettings-file
 *
 * Locates the project's `appsettings.json`, the infrastructure-config
 * authority every service/database/config command reads in both Aspire and
 * `--no-aspire` projects.
 */

import { join } from '@std/path';

import { SCAFFOLD_FILES } from '../../../constants/scaffold/scaffold-files.ts';
import { ConfigNotFoundError } from '../../../domain/errors.ts';
import type { FileSystemPort } from '../../../ports/file-system-port.ts';

const MISSING_APPSETTINGS_REMEDY = `${SCAFFOLD_FILES.APPSETTINGS} is the NetScript ` +
  `infrastructure config; 'netscript init' writes it with or without --no-aspire. ` +
  `Run this command from the project root (or pass --project-root), or restore the file`;

/**
 * Return the path of the project's `appsettings.json`, failing closed when it
 * is absent so a reader never reports an empty configuration as a success.
 *
 * @param fs - Filesystem adapter.
 * @param projectRoot - Absolute project root.
 * @returns Absolute `appsettings.json` path.
 * @throws {ConfigNotFoundError} When the file does not exist.
 */
export async function requireAppsettingsPath(
  fs: FileSystemPort,
  projectRoot: string,
): Promise<string> {
  const path = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
  if (!await fs.exists(path)) throw appsettingsNotFound(path);
  return path;
}

/**
 * Build the named missing-config error for an absent `appsettings.json`.
 *
 * @param path - Absolute path that was searched.
 * @returns Error carrying the config-not-found exit code and recovery hint.
 */
export function appsettingsNotFound(path: string): ConfigNotFoundError {
  return new ConfigNotFoundError([path], MISSING_APPSETTINGS_REMEDY);
}
