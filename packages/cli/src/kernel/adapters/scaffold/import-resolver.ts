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

import { JSR_SPECIFIERS } from '../../constants/jsr-specifiers.ts';
import { SCAFFOLD_PACKAGES } from '../../constants/scaffold/scaffold-packages.ts';
import type { PackageSourceMode } from '../../domain/scaffold/scaffold-options.ts';

const TANSTACK_AI_MCP_SPECIFIER = 'npm:@tanstack/ai-mcp@0.2.1';

/**
 * Maps all scaffold package specifiers to their JSR/npm specifiers.
 * Used when `importMode` is `'jsr'` for registry-based resolution.
 */
const PACKAGE_TO_JSR: Record<string, string> = {
  [SCAFFOLD_PACKAGES.NETSCRIPT_CONFIG]: JSR_SPECIFIERS.config,
  [SCAFFOLD_PACKAGES.NETSCRIPT_SERVICE]: JSR_SPECIFIERS.service,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN]: JSR_SPECIFIERS.plugin,
  [SCAFFOLD_PACKAGES.NETSCRIPT_CONTRACTS]: JSR_SPECIFIERS.contracts,
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK]: JSR_SPECIFIERS.sdk,
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_CLIENT]: `${JSR_SPECIFIERS.sdk}/client`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY]: `${JSR_SPECIFIERS.sdk}/query`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY_CLIENT]: `${JSR_SPECIFIERS.sdk}/query-client`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER]: JSR_SPECIFIERS.logger,
  // Subpaths resolve through each package's `exports` field on JSR — listing
  // them explicitly keeps `deno task check` symmetrical between modes.
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER_MIDDLEWARE]: `${JSR_SPECIFIERS.logger}/middleware`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER_ORPC]: `${JSR_SPECIFIERS.logger}/orpc`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_TELEMETRY]: JSR_SPECIFIERS.telemetry,
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE]: JSR_SPECIFIERS.database,
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_SCRIPTS]: `${JSR_SPECIFIERS.database}/scripts`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_TRACING]: `${JSR_SPECIFIERS.database}/tracing`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE]: JSR_SPECIFIERS['plugin-auth-core'],
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_CONFIG]: `${
    JSR_SPECIFIERS['plugin-auth-core']
  }/config`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_CONTRACTS_V1]: `${
    JSR_SPECIFIERS['plugin-auth-core']
  }/contracts/v1`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_DOMAIN]: `${
    JSR_SPECIFIERS['plugin-auth-core']
  }/domain`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_PORTS]: `${
    JSR_SPECIFIERS['plugin-auth-core']
  }/ports`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_STREAMS]: `${
    JSR_SPECIFIERS['plugin-auth-core']
  }/streams`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_TESTING]: `${
    JSR_SPECIFIERS['plugin-auth-core']
  }/testing`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_AUTH_WORKOS]: JSR_SPECIFIERS['auth-workos'],
  [SCAFFOLD_PACKAGES.NETSCRIPT_AUTH_BETTER_AUTH]: JSR_SPECIFIERS['auth-better-auth'],
  [SCAFFOLD_PACKAGES.NETSCRIPT_AUTH_KV_OAUTH]: JSR_SPECIFIERS['auth-kv-oauth'],
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_WORKERS_RUNTIME]: `${
    JSR_SPECIFIERS['plugin-workers']
  }/runtime`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_WORKERS_HEALTH_CHECK]: `${
    JSR_SPECIFIERS['plugin-workers']
  }/jobs/health-check.ts`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS]: JSR_SPECIFIERS.workers,
  [SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS_RUNTIME]: `${JSR_SPECIFIERS.workers}/runtime`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS_SCHEMAS]: `${JSR_SPECIFIERS.workers}/schemas`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_RUNTIME]: `${
    JSR_SPECIFIERS['plugin-sagas']
  }/runtime`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE]: JSR_SPECIFIERS['plugin-sagas-core'],
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE_DOMAIN]: `${
    JSR_SPECIFIERS['plugin-sagas-core']
  }/domain`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_RUNTIME]: `${
    JSR_SPECIFIERS['plugin-triggers']
  }/runtime`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE]: JSR_SPECIFIERS['plugin-triggers-core'],
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_ADAPTERS]: `${
    JSR_SPECIFIERS['plugin-triggers-core']
  }/adapters`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_BUILDERS]: `${
    JSR_SPECIFIERS['plugin-triggers-core']
  }/builders`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_CONFIG]: `${
    JSR_SPECIFIERS['plugin-triggers-core']
  }/config`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_CONTRACTS_V1]: `${
    JSR_SPECIFIERS['plugin-triggers-core']
  }/contracts/v1`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_DOMAIN]: `${
    JSR_SPECIFIERS['plugin-triggers-core']
  }/domain`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_PORTS]: `${
    JSR_SPECIFIERS['plugin-triggers-core']
  }/ports`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_RUNTIME]: `${
    JSR_SPECIFIERS['plugin-triggers-core']
  }/runtime`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_PRISMA_ADAPTER_MYSQL]: JSR_SPECIFIERS['prisma-adapter-mysql'],
  [SCAFFOLD_PACKAGES.NETSCRIPT_ASPIRE]: JSR_SPECIFIERS.aspire,
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH]: JSR_SPECIFIERS.fresh,
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_BUILDERS]: `${JSR_SPECIFIERS.fresh}/builders`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_QUERY]: `${JSR_SPECIFIERS.fresh}/query`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_ROUTE]: `${JSR_SPECIFIERS.fresh}/route`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_SERVER]: `${JSR_SPECIFIERS.fresh}/server`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_VITE]: `${JSR_SPECIFIERS.fresh}/vite`,
  [SCAFFOLD_PACKAGES.NETSCRIPT_KV]: JSR_SPECIFIERS.kv,
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_UI]: JSR_SPECIFIERS['fresh-ui'],
  [SCAFFOLD_PACKAGES.NETSCRIPT_FRESH_UI_INTERACTIVE]: `${JSR_SPECIFIERS['fresh-ui']}/interactive`,
  [SCAFFOLD_PACKAGES.TANSTACK_AI_MCP]: TANSTACK_AI_MCP_SPECIFIER,
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
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_CLIENT]: 'packages/sdk/src/client/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY]: 'packages/sdk/src/query/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_SDK_QUERY_CLIENT]: 'packages/sdk/src/query-client/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER]: 'packages/logger/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER_MIDDLEWARE]: 'packages/logger/middleware.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_LOGGER_ORPC]: 'packages/logger/orpc.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_TELEMETRY]: 'packages/telemetry/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE]: 'packages/database/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_SCRIPTS]: 'packages/database/scripts/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_DATABASE_TRACING]: 'packages/database/prisma-tracing.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE]: 'packages/plugin-auth-core/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_CONFIG]:
    'packages/plugin-auth-core/src/config/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_CONTRACTS_V1]:
    'packages/plugin-auth-core/src/contracts/v1/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_DOMAIN]:
    'packages/plugin-auth-core/src/domain/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_PORTS]:
    'packages/plugin-auth-core/src/ports/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_STREAMS]:
    'packages/plugin-auth-core/src/streams/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_AUTH_CORE_TESTING]:
    'packages/plugin-auth-core/src/testing/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_AUTH_WORKOS]: 'packages/auth-workos/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_AUTH_BETTER_AUTH]: 'packages/auth-better-auth/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_AUTH_KV_OAUTH]: 'packages/auth-kv-oauth/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_WORKERS_RUNTIME]: 'plugins/workers/bin/runtime.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_WORKERS_HEALTH_CHECK]:
    'plugins/workers/jobs/health-check.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS]: 'packages/plugin-workers-core/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS_RUNTIME]: 'packages/plugin-workers-core/src/runtime/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_WORKERS_SCHEMAS]:
    'packages/plugin-workers-core/src/domain/public-schema.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_RUNTIME]: 'plugins/sagas/src/runtime/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE]: 'packages/plugin-sagas-core/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_SAGAS_CORE_DOMAIN]:
    'packages/plugin-sagas-core/src/domain/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_RUNTIME]: 'plugins/triggers/src/runtime/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE]: 'packages/plugin-triggers-core/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_ADAPTERS]:
    'packages/plugin-triggers-core/src/adapters/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_BUILDERS]:
    'packages/plugin-triggers-core/src/builders/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_CONFIG]:
    'packages/plugin-triggers-core/src/config/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_CONTRACTS_V1]:
    'packages/plugin-triggers-core/src/contracts/v1/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_DOMAIN]:
    'packages/plugin-triggers-core/src/domain/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_PORTS]:
    'packages/plugin-triggers-core/src/ports/mod.ts',
  [SCAFFOLD_PACKAGES.NETSCRIPT_PLUGIN_TRIGGERS_CORE_RUNTIME]:
    'packages/plugin-triggers-core/src/runtime/mod.ts',
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
  [SCAFFOLD_PACKAGES.TANSTACK_AI_MCP]: TANSTACK_AI_MCP_SPECIFIER,
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
 * // { '@netscript/config': 'jsr:@netscript/config@<release>', ... }
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
