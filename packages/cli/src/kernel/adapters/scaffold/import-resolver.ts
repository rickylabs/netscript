import { normalize as normalizePosix } from '@std/path/posix';

/**
 * @module infra/scaffold/import-resolver
 *
 * Compatibility import resolution for scaffolded projects.
 *
 * Registry-backed resolution stays here for legacy templates. Maintainer-only
 * local resolution delegates to `src/maintainer/adapters/local-import-resolver`.
 *
 * Also resolves NuGet references for the optional Aspire orchestration layer.
 */

import { SCAFFOLD_PACKAGES } from '../../constants/scaffold/scaffold-packages.ts';
import type { PackageSourceMode } from '../../domain/scaffold/scaffold-options.ts';

/**
 * Maps all scaffold package specifiers to their JSR/npm specifiers.
 * Used when `importMode` is `'jsr'` for registry-based resolution.
 */
const PACKAGE_TO_JSR: Record<string, string> = {
  [SCAFFOLD_PACKAGES.NETSCRIPT_CONFIG]: 'jsr:@netscript/config@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SERVICE]: 'jsr:@netscript/service@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN]: 'jsr:@netscript/plugin@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_CONTRACTS]: 'jsr:@netscript/contracts@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK]: 'jsr:@netscript/sdk@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_CLIENT]: 'jsr:@netscript/sdk@^1.0.0/client',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY]: 'jsr:@netscript/sdk@^1.0.0/query',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY_CLIENT]: 'jsr:@netscript/sdk@^1.0.0/query-client',
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER]: 'jsr:@netscript/logger@^1.0.0',
  // Subpaths resolve through each package's `exports` field on JSR — listing
  // them explicitly keeps `deno task check` symmetrical between modes.
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER_MIDDLEWARE]: 'jsr:@netscript/logger@^1.0.0/middleware',
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER_ORPC]: 'jsr:@netscript/logger@^1.0.0/orpc',
  [SCAFFOLD_PACKAGES.NETSCRIPT_TELEMETRY]: 'jsr:@netscript/telemetry@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE]: 'jsr:@netscript/database@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_SCRIPTS]: 'jsr:@netscript/database@^1.0.0/scripts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_TRACING]: 'jsr:@netscript/database@^1.0.0/tracing',
  [SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS]: 'jsr:@netscript/plugin-workers-core@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE]: 'jsr:@netscript/plugin-sagas-core@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE_DOMAIN]:
    'jsr:@netscript/plugin-sagas-core@^1.0.0/domain',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PRISMA_ADAPTER_MYSQL]: 'jsr:@netscript/prisma-adapter-mysql@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_ASPIRE]: 'jsr:@netscript/aspire@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH]: 'jsr:@netscript/fresh@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_BUILDERS]: 'jsr:@netscript/fresh@^1.0.0/builders',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_QUERY]: 'jsr:@netscript/fresh@^1.0.0/query',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_ROUTE]: 'jsr:@netscript/fresh@^1.0.0/route',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_SERVER]: 'jsr:@netscript/fresh@^1.0.0/server',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_VITE]: 'jsr:@netscript/fresh@^1.0.0/vite',
  [SCAFFOLD_PACKAGES.NETSCRIPT_KV]: 'jsr:@netscript/kv@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_UI]: 'jsr:@netscript/fresh-ui@^1.0.0',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_UI_INTERACTIVE]: 'jsr:@netscript/fresh-ui@^1.0.0/interactive',
  [SCAFFOLD_PACKAGES.STD_PATH]: 'jsr:@std/path@^1.0.0',
  [SCAFFOLD_PACKAGES.STD_FS]: 'jsr:@std/fs@^1.0.0',
  [SCAFFOLD_PACKAGES.STD_ASSERT]: 'jsr:@std/assert@^1.0.0',
  [SCAFFOLD_PACKAGES.ZOD]: 'npm:zod@^4.3.6',
};

const PACKAGE_TO_LOCAL_PATH: Readonly<Record<string, string>> = {
  [SCAFFOLD_PACKAGES.NETSCRIPT_CONFIG]: 'packages/config/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SERVICE]: 'packages/service/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN]: 'packages/plugin/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_CONTRACTS]: 'packages/contracts/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK]: 'packages/sdk/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_CLIENT]: 'packages/sdk/client/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY]: 'packages/sdk/query/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY_CLIENT]: 'packages/sdk/query-client/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER]: 'packages/logger/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER_MIDDLEWARE]: 'packages/logger/middleware.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER_ORPC]: 'packages/logger/orpc.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_TELEMETRY]: 'packages/telemetry/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE]: 'packages/database/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_SCRIPTS]: 'packages/database/scripts/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_TRACING]: 'packages/database/prisma-tracing.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS]: 'packages/plugin-workers-core/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE]: 'packages/plugin-sagas-core/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE_DOMAIN]:
    'packages/plugin-sagas-core/src/domain/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PRISMA_ADAPTER_MYSQL]: 'packages/prisma-adapter-mysql/src/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_ASPIRE]: 'packages/aspire/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH]: 'packages/fresh/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_BUILDERS]: 'packages/fresh/src/application/builders/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_QUERY]: 'packages/fresh/src/application/query/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_ROUTE]: 'packages/fresh/src/application/route/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_SERVER]: 'packages/fresh/src/runtime/server/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_VITE]: 'packages/fresh/src/application/vite/vite.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_KV]: 'packages/kv/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_UI]: 'packages/fresh-ui/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_UI_INTERACTIVE]: 'packages/fresh-ui/interactive.ts',
};

const EXTERNAL_DEPS: Readonly<Record<string, string>> = {
  [SCAFFOLD_PACKAGES.STD_PATH]: 'jsr:@std/path@^1.0.0',
  [SCAFFOLD_PACKAGES.STD_FS]: 'jsr:@std/fs@^1.0.0',
  [SCAFFOLD_PACKAGES.STD_ASSERT]: 'jsr:@std/assert@^1.0.0',
  [SCAFFOLD_PACKAGES.ZOD]: 'npm:zod@^4.3.6',
};

// ============================================================================
// IMPORT RESOLUTION
// ============================================================================

/**
 * Resolve a Deno import map for all NetScript packages plus external deps.
 *
 * In **JSR mode** every package resolves to a `jsr:` or `npm:` specifier
 * suitable for projects that consume NetScript from a package registry.
 *
 * In **local mode** NetScript packages resolve to relative file paths
 * rooted at `localBase` (default `'../..'`), while standard-library and
 * third-party packages still use their registry specifiers.
 *
 * @param mode - Resolution strategy: `'jsr'` for registry, `'local'` for monorepo.
 * @param localBase - Relative path from the scaffold output root to the monorepo
 *   root. Only used when `mode` is `'local'`. Defaults to `'../..'`.
 * @returns A flat `Record<string, string>` suitable for the `"imports"` field
 *   of a `deno.json` configuration file.
 *
 * @example
 * ```typescript
 * // JSR mode — all registry specifiers
 * const imports = resolveNetScriptImports('jsr');
 * // { '@netscript/config': 'jsr:@netscript/config@^1.0.0', ... }
 *
 * // Local mode — relative paths for NetScript, registry for externals
 * const imports = resolveNetScriptImports('local', '../..');
 * // { '@netscript/config': '../../packages/config/mod.ts', ... }
 * ```
 */
export function resolveNetScriptImports(
  mode: PackageSourceMode,
  localBase: string = '../..',
): Record<string, string> {
  if (mode === 'jsr') {
    return { ...PACKAGE_TO_JSR };
  }

  const imports: Record<string, string> = {};
  for (const specifier of Object.keys(PACKAGE_TO_LOCAL_PATH)) {
    imports[specifier] = resolveLocalImportSpecifier(localBase, PACKAGE_TO_LOCAL_PATH[specifier]);
  }
  for (const specifier of Object.keys(EXTERNAL_DEPS)) {
    imports[specifier] = EXTERNAL_DEPS[specifier];
  }
  return imports;
}

/** Resolve a local import target while preserving import-map-safe URL syntax. */
export function resolveLocalImportSpecifier(localBase: string, localPath: string): string {
  const combined = normalizePosix(`${localBase}/${localPath}`);
  return combined.startsWith('./') || combined.startsWith('../') || combined.startsWith('/')
    ? combined
    : `./${combined}`;
}

// ============================================================================
// NUGET RESOLUTION
// ============================================================================

/** Discriminated union for NuGet reference types. */
export interface NuGetProjectReference {
  readonly type: 'project';
  readonly value: string;
}

/** Discriminated union for NuGet package references. */
export interface NuGetPackageReference {
  readonly type: 'package';
  readonly value: string;
}

/** Result of resolving a NuGet reference. */
export type NuGetReference = NuGetProjectReference | NuGetPackageReference;

/**
 * Resolve the NuGet reference for the NetScript Aspire hosting package.
 *
 * In **JSR mode** the reference is a NuGet *package* reference suitable for
 * projects that consume the published package from a NuGet feed.
 *
 * In **local mode** the reference is a *project* reference pointing to the
 * local `.csproj` file, suitable for monorepo development.
 *
 * @param mode - Resolution strategy: `'jsr'` for package, `'local'` for project.
 * @param localPath - Relative path to the local `.csproj`. Only used when
 *   `mode` is `'local'`. Defaults to `'../NetScript.Aspire.Hosting'`.
 * @returns A discriminated union with `type` and `value` fields.
 *
 * @example
 * ```typescript
 * const ref = resolveNuGetReference('jsr');
 * // { type: 'package', value: 'NetScript.Aspire.Hosting' }
 *
 * const ref = resolveNuGetReference('local');
 * // { type: 'project', value: '../NetScript.Aspire.Hosting' }
 * ```
 */
export function resolveNuGetReference(
  mode: PackageSourceMode,
  localPath?: string,
): NuGetReference {
  if (mode === 'jsr') {
    return { type: 'package', value: 'NetScript.Aspire.Hosting' };
  }

  return { type: 'project', value: localPath ?? '../NetScript.Aspire.Hosting' };
}
