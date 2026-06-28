/**
 * Static data for the thin auth plugin scaffolder.
 *
 * This module is data-only: the published manifest spec, the dependency specifier the userland glue
 * imports, and the sample-stub manifest mapping the text-imported stub to its workspace-relative emit
 * path. It contains no file I/O and no code generation. The sample stub content is imported as text
 * via import attributes (`with { type: 'text' }`) — the repo's locked, JSR-safe asset mechanism — so
 * it ships as real, type-checked source inside `@netscript/plugin-auth` and is emitted verbatim, with
 * no scaffold-time interpolation.
 *
 * Auth is the leanest of the official plugins to scaffold: it emits a single userland barrel. Auth's
 * configuration seam is environment / appsettings (`NETSCRIPT_AUTH_BACKEND`), which the CLI owns
 * (D-CONFIG-KEEP); its database migration (`auth.prisma`) travels in the dependency tarball and is
 * aggregated by the CLI (D-PRISMA); and its service, routes, streams, and Aspire wiring all resolve
 * from the `@netscript/plugin-auth` dependency (D-NOCOPY). None of that is emitted into userland.
 *
 * @module
 */

import type { PluginScaffoldManifestSpec } from '@netscript/plugin/scaffold';
import authBarrelSource from './stubs/mod.ts' with { type: 'text' };

/**
 * Published JSR specifier of the auth runtime core the emitted userland barrel imports.
 *
 * The sample barrel references this package (never the user's instance name), which is what keeps the
 * emitted stub static and interpolation-free.
 */
export const AUTH_RUNTIME_CORE_SPECIFIER = '@netscript/plugin-auth-core';

/**
 * Workspace directory the auth userland sample is emitted under.
 *
 * Auth has no background-worker directory (it is a utility service plugin); the userland sample is
 * emitted under `auth/`, matching the plugin's `pluginDir`.
 */
export const AUTH_SAMPLE_WORKSPACE = 'auth';

/**
 * A single userland sample stub: its text content and the workspace-relative path it is written to.
 */
export interface AuthSampleStub {
  /** Workspace-relative path the stub is written to, using forward slashes. */
  readonly path: string;
  /** Full text content of the stub, imported from a real type-checked source. */
  readonly content: string;
}

/**
 * The complete set of user-owned sample stubs `plugin add auth` emits.
 *
 * Exactly one artifact: the `auth/mod.ts` barrel re-exporting the published auth v1 contract surface.
 * There is no sample "leaf" file (auth backends are env-selected, not code-authored on the common
 * path), and no plugin source (`services/`, `src/`, `streams/`, the plugin `mod.ts`/`deno.json`/
 * manifest, `database/*.prisma`) — that all resolves from the `@netscript/plugin-auth` dependency.
 * This replaces the legacy scaffolder, which copied an entire second `plugins/<name>/` plugin tree
 * (26 files) into userland.
 */
export const AUTH_SAMPLE_STUBS: readonly AuthSampleStub[] = [
  { path: `${AUTH_SAMPLE_WORKSPACE}/mod.ts`, content: authBarrelSource },
];

/**
 * Version-independent specification of the published `plugins/auth/scaffold.plugin.json`.
 *
 * Rendered to the committed manifest bytes by `buildScaffoldPluginJson(authManifestSpec, version)`;
 * the `version` and `@netscript/plugin` peer-dependency range are injected at build time. Migrated
 * verbatim from the S1 `test_fixtures/manifest-specs.ts` `authSpec` fixture as the auth thinning
 * slice (S2c) retired that central fixture.
 */
export const authManifestSpec: PluginScaffoldManifestSpec = {
  name: '@netscript/plugin-auth',
  displayName: 'Auth',
  description:
    'NetScript plugin for a unified auth API, auth database schema, and auth session streams.',
  capabilities: {
    hasDatabaseMigrations: true,
    hasRoutes: true,
    hasBackgroundWorkers: false,
  },
  scaffolder: {
    export: './scaffold',
    requiredPermissions: {
      net: [],
      read: ['<workspaceRoot>'],
      write: ['<workspaceRoot>'],
    },
  },
  provider: {
    kind: 'auth',
    displayName: 'Auth',
    category: 'plugin',
    portRangeKey: 'PLUGIN_API',
    defaultPermissions: ['--unstable-kv', '--allow-net', '--allow-env', '--allow-read'],
    watchFlag: '--watch',
    defaultEntrypoint: 'services/src/main.ts',
    defaultServiceEntrypoint: 'services/src/main.ts',
    defaultRequiresDb: true,
    defaultRequiresKv: true,
    pluginType: 'utility',
    supportsConcurrency: false,
    concurrencyEnvVar: null,
    defaultConcurrency: null,
    defaultTelemetry: true,
    infrastructureRequires: ['db', 'kv'],
    infrastructureOptionalDeps: [],
  },
  officialSource: {
    canonicalName: 'auth',
    pluginDir: 'auth',
    serviceEntrypoint: 'services/src/main.ts',
    serviceConfigKey: 'auth',
    servicePort: 8094,
    backgroundPort: 8094,
    requiresDb: true,
    requiresKv: true,
    permissions: ['--unstable-kv', '--allow-net', '--allow-env', '--allow-read'],
  },
};
