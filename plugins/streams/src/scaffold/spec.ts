/**
 * Static data for the thin streams plugin scaffolder.
 *
 * This module is data-only: the published manifest spec, the dependency specifier the userland glue
 * imports, and the sample-stub manifest mapping each text-imported stub to its workspace-relative
 * emit path. It contains no file I/O and no code generation. The sample stub contents are imported
 * as text via import attributes (`with { type: 'text' }`) — the repo's locked, JSR-safe asset
 * mechanism — so they ship as real, type-checked source inside `@netscript/plugin-streams` and are
 * emitted verbatim, with no scaffold-time interpolation.
 *
 * @module
 */

import type { PluginScaffoldManifestSpec } from '@netscript/plugin/scaffold';
import sampleStreamSource from './stubs/notifications-stream.ts' with { type: 'text' };
import streamsBarrelSource from './stubs/mod.ts' with { type: 'text' };

/**
 * Published JSR specifier of the streams runtime core the emitted userland stubs import.
 *
 * The sample stream references this package (never the user's instance name), which is what keeps
 * the emitted stubs static and interpolation-free.
 */
export const STREAMS_RUNTIME_CORE_SPECIFIER = '@netscript/plugin-streams-core';

/**
 * Workspace directory the streams userland samples are emitted under.
 *
 * Streams has no background-worker directory (it is a utility service plugin); the userland samples
 * are emitted under `streams/`, matching the plugin's `pluginDir`.
 */
export const STREAMS_SAMPLE_WORKSPACE = 'streams';

/**
 * A single userland sample stub: its text content and the workspace-relative path it is written to.
 */
export interface StreamsSampleStub {
  /** Workspace-relative path the stub is written to, using forward slashes. */
  readonly path: string;
  /** Full text content of the stub, imported from a real type-checked source. */
  readonly content: string;
}

/**
 * The complete set of user-owned sample stubs `plugin add streams` emits.
 *
 * Order is the emission order: the leaf stream sample first, then the barrel that re-exports it.
 * Every path lives under {@linkcode STREAMS_SAMPLE_WORKSPACE} and contains no plugin source
 * (`services/`, `src/streams/`, `src/aspire/`, `src/e2e/`, the plugin `mod.ts`/`deno.json`/manifest)
 * — that all resolves from the `@netscript/plugin-streams` dependency. This replaces the legacy
 * scaffolder, which copied an entire second `plugins/<name>/` plugin tree into userland.
 */
export const STREAMS_SAMPLE_STUBS: readonly StreamsSampleStub[] = [
  {
    path: `${STREAMS_SAMPLE_WORKSPACE}/notifications-stream.ts`,
    content: sampleStreamSource,
  },
  { path: `${STREAMS_SAMPLE_WORKSPACE}/mod.ts`, content: streamsBarrelSource },
];

/**
 * Version-independent specification of the published `plugins/streams/scaffold.plugin.json`.
 *
 * Rendered to the committed manifest bytes by `buildScaffoldPluginJson(streamsManifestSpec,
 * version)`; the `version` and `@netscript/plugin` peer-dependency range are injected at build time.
 */
export const streamsManifestSpec: PluginScaffoldManifestSpec = {
  name: '@netscript/plugin-streams',
  displayName: 'Durable Streams',
  description: 'Durable Streams service, CLI, Aspire, E2E, and scaffolding plugin for NetScript.',
  capabilities: {
    hasDatabaseMigrations: false,
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
    kind: 'stream',
    displayName: 'Durable Streams',
    category: 'plugin',
    portRangeKey: 'PLUGIN_API',
    defaultPermissions: [
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
      '--allow-sys',
      '--allow-ffi',
    ],
    watchFlag: '--watch',
    defaultEntrypoint: 'services/src/main.ts',
    defaultServiceEntrypoint: 'services/src/main.ts',
    defaultRequiresDb: false,
    defaultRequiresKv: false,
    pluginType: 'utility',
    supportsConcurrency: false,
    concurrencyEnvVar: null,
    defaultConcurrency: null,
    defaultTelemetry: true,
    infrastructureRequires: [],
    infrastructureOptionalDeps: [],
  },
  officialSource: {
    canonicalName: 'streams',
    pluginDir: 'streams',
    serviceEntrypoint: 'services/src/main.ts',
    serviceConfigKey: 'streams',
    servicePort: 4437,
    backgroundPort: 4437,
    requiresDb: false,
    requiresKv: false,
    permissions: [
      '--allow-net',
      '--allow-env',
      '--allow-read',
      '--allow-write',
      '--allow-sys',
      '--allow-ffi',
    ],
  },
};
