/**
 * @module templates/aspire/generate-apphost-package-json
 *
 * Tier 1 generator for the TypeScript AppHost `aspire/package.json`.
 *
 * The AppHost's Node package graph is isolated from the Deno workspace. Its runtime
 * dependencies follow the configured database engines the same way `aspire.config.json`
 * integration packages do: a container PostgreSQL resource carries a `<name>_auth`
 * credential readiness check that loads `pg` at evaluation time.
 */

import { SCAFFOLD_VERSIONS } from '../../constants/scaffold/scaffold-versions.ts';
import type { DbEngineChoice } from '../../domain/db-engine.ts';

/** Options for generating the AppHost `package.json`. */
export interface AppHostPackageJsonOptions {
  /** Workspace name; the package is named `<name>-apphost`. */
  readonly name: string;
  /** Configured database engines. */
  readonly dbEngines: readonly DbEngineChoice[];
}

const APPHOST_BASE_DEPENDENCIES: Readonly<Record<string, string>> = {
  'vscode-jsonrpc': '8.2.0',
};

const APPHOST_DEV_DEPENDENCIES: Readonly<Record<string, string>> = {
  '@types/node': '^22.0.0',
  tsx: '4.21.0',
  typescript: '^5.9.3',
};

/**
 * Runtime dependencies the generated AppHost helpers load for the given engines.
 *
 * @param dbEngines - Configured database engines.
 * @returns Package name → version range.
 */
export function appHostRuntimeDependencies(
  dbEngines: readonly DbEngineChoice[],
): Record<string, string> {
  return {
    ...APPHOST_BASE_DEPENDENCIES,
    ...(dbEngines.includes('postgres') ? { pg: SCAFFOLD_VERSIONS.APPHOST_PG } : {}),
  };
}

/**
 * Generate the contents of a fresh AppHost `package.json`.
 *
 * @param options - Workspace name and configured database engines.
 * @returns Serialized JSON string with trailing newline.
 */
export function generateAppHostPackageJson(options: AppHostPackageJsonOptions): string {
  return serialize({
    name: `${options.name}-apphost`,
    version: '1.0.0',
    private: true,
    type: 'module',
    dependencies: appHostRuntimeDependencies(options.dbEngines),
    devDependencies: { ...APPHOST_DEV_DEPENDENCIES },
  });
}

/**
 * Add the runtime dependencies the configured engines need to an existing AppHost
 * `package.json`. Entries the project already declares are kept as written, and nothing
 * is removed: the file is project-owned once scaffolded.
 *
 * @param existing - Current `package.json` text.
 * @param dbEngines - Configured database engines.
 * @returns The updated text, or `null` when every required dependency is already declared.
 */
export function reconcileAppHostPackageJson(
  existing: string,
  dbEngines: readonly DbEngineChoice[],
): string | null {
  const parsed: unknown = JSON.parse(existing);
  if (!isRecord(parsed)) {
    throw new TypeError('AppHost package.json must contain a JSON object');
  }
  const declared = isRecord(parsed.dependencies) ? parsed.dependencies : {};
  const missing = Object.entries(appHostRuntimeDependencies(dbEngines))
    .filter(([name]) => !(name in declared));
  if (missing.length === 0) return null;
  return serialize({
    ...parsed,
    dependencies: { ...declared, ...Object.fromEntries(missing) },
  });
}

function serialize(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
