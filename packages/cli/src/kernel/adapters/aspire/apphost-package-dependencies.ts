/**
 * @module adapters/aspire/apphost-package-dependencies
 *
 * Guards native Deno AppHost workspaces against unmigrated Node.js `aspire/package.json`
 * layouts and keeps `aspire/deno.json` imports in step with configured database engines.
 */

import { dirname, join } from '@std/path';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import type { DbEngineChoice } from '../../domain/db-engine.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import { reconcileAppHostDenoJson } from '../../templates/aspire/generate-apphost-deno-json.ts';

/** Options for {@link reconcileAppHostPackageDependencies}. */
export interface ReconcileAppHostPackageDependenciesOptions {
  /** Report the change without writing it. */
  readonly dryRun?: boolean;
}

/**
 * Fail closed when a workspace still carries a legacy Node.js `aspire/package.json` AppHost
 * (either alone or coexisting with `aspire/deno.json`). Workspaces without `aspire/`
 * (`--no-aspire`) pass cleanly.
 *
 * Call this at the first mutation boundary of every command that mutates Aspire config,
 * helpers, databases, services, or plugins so no partial edits or deletions can occur.
 *
 * @param fs - Filesystem port.
 * @param projectRoot - Workspace root directory.
 */
export async function assertNativeDenoAppHost(
  fs: FileSystemPort,
  projectRoot: string,
): Promise<void> {
  const aspireDir = join(projectRoot, SCAFFOLD_DIRS.ASPIRE_TS);
  if (!(await fs.exists(aspireDir))) return;
  const legacyPackageJson = join(aspireDir, SCAFFOLD_FILES.PACKAGE_JSON);
  if (await fs.exists(legacyPackageJson)) {
    throw new ScaffoldValidationError(
      `Legacy Node.js Aspire AppHost detected (${SCAFFOLD_DIRS.ASPIRE_TS}/${SCAFFOLD_FILES.PACKAGE_JSON}). ` +
        `Aspire 17.0.0 uses a native Deno AppHost (${SCAFFOLD_DIRS.ASPIRE_TS}/${SCAFFOLD_FILES.DENO_JSON}). ` +
        `Migrate before mutating this workspace: remove aspire/package.json, aspire/tsconfig.apphost.json, ` +
        `and aspire/node_modules/, create aspire/deno.json, add "./aspire" to root deno.json "workspace" ` +
        `and "sloppy-imports" to "unstable", update aspire/aspire.config.json to 17.0.0, then run ` +
        `"aspire restore" and "netscript generate aspire". ` +
        `See docs/site/orchestration-runtime/how-to/upgrade-aspire-17.md.`,
      { projectRoot, legacyPackageJson },
    );
  }
}

/**
 * Add the runtime imports the configured databases' generated helpers load to `aspire/deno.json`.
 * Project-owned entries are kept as written and nothing is removed. Refuses legacy Node.js
 * `aspire/package.json` workspaces fail-closed.
 *
 * @param fs - Filesystem port.
 * @param aspireDir - The AppHost directory (`<project>/aspire`).
 * @param databases - `NetScript.Databases` from `appsettings.json`.
 * @param options - Dry-run control.
 * @returns The `deno.json` path when it changed (or would change in dry-run), else `null`.
 */
export async function reconcileAppHostPackageDependencies(
  fs: FileSystemPort,
  aspireDir: string,
  databases: Readonly<Record<string, { readonly Engine?: string }>>,
  options: ReconcileAppHostPackageDependenciesOptions = {},
): Promise<string | null> {
  await assertNativeDenoAppHost(fs, dirname(aspireDir));
  const denoJsonPath = join(aspireDir, SCAFFOLD_FILES.DENO_JSON);
  if (!(await fs.exists(denoJsonPath))) return null;
  const reconciled = reconcileAppHostDenoJson(
    await fs.readFile(denoJsonPath),
    collectConfiguredDbEngines(databases),
  );
  if (reconciled === null) return null;
  if (!options.dryRun) await fs.writeFile(denoJsonPath, reconciled);
  return denoJsonPath;
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
