/**
 * @module templates/aspire/generate-apphost-deno-json
 *
 * Tier 1 generator for the native Deno TypeScript AppHost `aspire/deno.json`.
 *
 * Replaces the legacy Node.js `aspire/package.json` + `tsconfig.apphost.json` island:
 * `aspire/` is a root workspace member that shares the root `nodeModulesDir: "auto"`,
 * `"catalog"`, and `"unstable"` (`sloppy-imports`). Its import map declares only the
 * runtime packages the generated AppHost and Aspire 17 SDK modules load directly.
 */

import { resolveLocalImportSpecifier } from '../../adapters/scaffold/import-resolver.ts';
import { JSR_SPECIFIERS } from '../../constants/jsr-specifiers.ts';
import { SCAFFOLD_PACKAGES } from '../../constants/scaffold/scaffold-packages.ts';
import { SCAFFOLD_VERSIONS } from '../../constants/scaffold/scaffold-versions.ts';
import type { DbEngineChoice } from '../../domain/db-engine.ts';
import type { PackageSourceMode } from '../../domain/scaffold/scaffold-options.ts';

/** Options for generating the AppHost `aspire/deno.json`. */
export interface AppHostDenoJsonOptions {
  /** Configured database engines. */
  readonly dbEngines: readonly DbEngineChoice[];
  /** Import mode for resolving `@netscript/aspire` packages. */
  readonly importMode: PackageSourceMode;
  /** Relative or absolute path from the project root to the NetScript monorepo root. */
  readonly localBase?: string;
  /** Whether copied `@netscript/*` packages are enrolled as root workspace members. */
  readonly packagesAsWorkspaceMembers?: boolean;
}

const APPHOST_VSCODE_JSONRPC_SPECIFIER = 'npm:vscode-jsonrpc@8.2.0/node.js';

const ASPIRE_LOCAL_SUBPATHS: ReadonlyArray<readonly [string, string]> = [
  [SCAFFOLD_PACKAGES.NETSCRIPT_ASPIRE, 'packages/aspire/mod.ts'],
  [SCAFFOLD_PACKAGES.NETSCRIPT_ASPIRE_CONFIG, 'packages/aspire/config.ts'],
  [SCAFFOLD_PACKAGES.NETSCRIPT_ASPIRE_CONSTANTS, 'packages/aspire/constants.ts'],
  [SCAFFOLD_PACKAGES.NETSCRIPT_ASPIRE_TYPES, 'packages/aspire/types.ts'],
  [SCAFFOLD_PACKAGES.NETSCRIPT_ASPIRE_APPLICATION, 'packages/aspire/src/application/mod.ts'],
];

/**
 * Runtime imports the generated AppHost helpers and Aspire SDK load for the given engines.
 *
 * @param dbEngines - Configured database engines.
 * @returns Import map entries for runtime dependencies.
 */
export function appHostDenoRuntimeImports(
  dbEngines: readonly DbEngineChoice[],
): Record<string, string> {
  return {
    net: 'node:net',
    'vscode-jsonrpc/node.js': APPHOST_VSCODE_JSONRPC_SPECIFIER,
    zod: 'catalog:',
    ...(dbEngines.includes('postgres') ? { pg: `npm:pg@${SCAFFOLD_VERSIONS.APPHOST_PG}` } : {}),
  };
}

/**
 * Generate the contents of a fresh native Deno AppHost `aspire/deno.json`.
 *
 * Emits `"imports"` only (no `"unstable"` and no nested `nodeModulesDir`): root `deno.json`
 * owns workspace membership (`"./aspire"`), `nodeModulesDir: "auto"`, `"catalog"`, and
 * `"unstable": ["raw-imports", "kv", "sloppy-imports"]`.
 *
 * @param options - Configured database engines and package resolution mode.
 * @returns Serialized JSON string with trailing newline.
 */
export function generateAppHostDenoJson(options: AppHostDenoJsonOptions): string {
  const imports: Record<string, string> = {
    ...appHostDenoRuntimeImports(options.dbEngines),
  };

  if (options.importMode === 'jsr') {
    imports[SCAFFOLD_PACKAGES.NETSCRIPT_ASPIRE] = JSR_SPECIFIERS.aspire;
  } else if (options.packagesAsWorkspaceMembers !== true) {
    const base = options.localBase ?? '../..';
    const aspireLocalBase = base.startsWith('/') ? base : `../${base}`;
    for (const [specifier, relPath] of ASPIRE_LOCAL_SUBPATHS) {
      imports[specifier] = resolveLocalImportSpecifier(aspireLocalBase, relPath);
    }
  }

  return serialize({ imports });
}

/**
 * Add required runtime imports for configured database engines to an existing `aspire/deno.json`.
 * Project-owned entries are preserved verbatim and nothing is removed.
 *
 * @param existing - Current `aspire/deno.json` text.
 * @param dbEngines - Configured database engines.
 * @returns Updated text, or `null` when every required dependency is already declared.
 */
export function reconcileAppHostDenoJson(
  existing: string,
  dbEngines: readonly DbEngineChoice[],
): string | null {
  const parsed: unknown = JSON.parse(existing);
  if (!isRecord(parsed)) {
    throw new TypeError('AppHost deno.json must contain a JSON object');
  }
  const declared = isRecord(parsed.imports) ? parsed.imports : {};
  const required: Record<string, string> = {
    'vscode-jsonrpc/node.js': APPHOST_VSCODE_JSONRPC_SPECIFIER,
    ...(dbEngines.includes('postgres') ? { pg: `npm:pg@${SCAFFOLD_VERSIONS.APPHOST_PG}` } : {}),
  };
  const missing = Object.entries(required).filter(([name]) => !(name in declared));
  if (missing.length === 0) return null;
  return serialize({
    ...parsed,
    imports: { ...declared, ...Object.fromEntries(missing) },
  });
}

function serialize(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
