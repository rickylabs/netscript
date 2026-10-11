/**
 * @module adapters/aspire/apphost-package-dependencies
 *
 * Keeps an existing TypeScript AppHost `package.json` in step with the helpers generated from
 * `appsettings.json`. Both regeneration entry points — `netscript service generate` (and every
 * command that regenerates helpers through it) and `netscript db add|remove` — call this one
 * seam, so a helper that loads an npm package (e.g. `pg` for the PostgreSQL `<name>_auth`
 * credential check) never ships without the package declared.
 */

import { join } from '@std/path';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import type { DbEngineChoice } from '../../domain/db-engine.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import { reconcileAppHostPackageJson } from '../../templates/aspire/generate-apphost-package-json.ts';

/** Options for {@link reconcileAppHostPackageDependencies}. */
export interface ReconcileAppHostPackageDependenciesOptions {
  /** Report the change without writing it. */
  readonly dryRun?: boolean;
}

/**
 * Add the npm packages the configured databases' generated helpers load to `aspire/package.json`.
 * Project-owned entries are kept as written and nothing is removed.
 *
 * @param fs - Filesystem port.
 * @param aspireDir - The AppHost directory (`<project>/aspire`).
 * @param databases - `NetScript.Databases` from `appsettings.json`.
 * @param options - Dry-run control.
 * @returns The `package.json` path when it changed (or would change in dry-run), else `null`.
 */
export async function reconcileAppHostPackageDependencies(
  fs: FileSystemPort,
  aspireDir: string,
  databases: Readonly<Record<string, { readonly Engine?: string }>>,
  options: ReconcileAppHostPackageDependenciesOptions = {},
): Promise<string | null> {
  const packageJsonPath = join(aspireDir, SCAFFOLD_FILES.PACKAGE_JSON);
  if (!(await fs.exists(packageJsonPath))) return null;
  const reconciled = reconcileAppHostPackageJson(
    await fs.readFile(packageJsonPath),
    collectConfiguredDbEngines(databases),
  );
  if (reconciled === null) return null;
  if (!options.dryRun) await fs.writeFile(packageJsonPath, reconciled);
  return packageJsonPath;
}

/**
 * Map configured `NetScript.Databases` entries to the distinct engine choices they use.
 *
 * @param databases - `NetScript.Databases` from `appsettings.json`.
 * @returns Distinct engines, in first-seen order.
 */
export function collectConfiguredDbEngines(
  databases: Readonly<Record<string, { readonly Engine?: string }>>,
): DbEngineChoice[] {
  const engines = new Set<DbEngineChoice>();
  for (const entry of Object.values(databases)) {
    const engine = toDbEngineChoice(entry.Engine);
    if (engine) engines.add(engine);
  }
  return [...engines];
}

function toDbEngineChoice(engine: string | undefined): DbEngineChoice | undefined {
  switch (engine) {
    case 'Postgres':
      return 'postgres';
    case 'Mysql':
      return 'mysql';
    case 'Mssql':
      return 'mssql';
    case 'Sqlite':
      return 'sqlite';
    default:
      return undefined;
  }
}
