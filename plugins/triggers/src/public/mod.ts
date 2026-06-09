/**
 * @module @netscript/plugin-triggers/public
 *
 * Public manifest constants for the triggers plugin package.
 */

import { definePlugin, type PluginManifest } from '@netscript/plugin';
import {
  TRIGGERS_API_DEFAULT_PORT,
  TRIGGERS_API_SERVICE_NAME,
  TRIGGERS_PLUGIN_ID,
  TRIGGERS_PLUGIN_VERSION,
} from '../constants.ts';

/** Worker job shape consumed by trigger actions. */
export type TriggersWorkerJobDefinition = Readonly<{
  id: string;
  entrypoint?: string;
  name?: string;
  topic?: string;
}>;

/** Stream producer capability consumed by trigger actions. */
export interface TriggersStreamProducerPort {
  /** Upsert an entity into a stream collection. */
  upsert(entityType: string, value: Record<string, unknown>): void;
  /** Delete an entity from a stream collection by primary key. */
  delete(entityType: string, key: string): void;
  /** Flush pending writes. */
  flush(): Promise<void>;
  /** Flush and close the producer. */
  close(): Promise<void>;
}

/** Saga definition factory accepted by trigger plugin integrations. */
export type TriggersDefineSaga = (id: string) => unknown;

/** Runtime-safe metadata attached to trigger plugin manifests. */
export type TriggersPluginMetadata = Readonly<Record<string, unknown>>;

/** Plugin manifest shape needed by trigger dependency declarations. */
export interface TriggersPluginDependencyManifest {
  /** Plugin package name. */
  readonly name: string;
  /** Plugin semantic version. */
  readonly version: string;
  /** Human-readable plugin description. */
  readonly description?: string;
  /** Display name used by hosts. */
  readonly displayName?: string;
  /** Plugin category. */
  readonly type?: string;
  /** Plugin author. */
  readonly author?: string;
  /** Plugin license identifier. */
  readonly license?: string;
  /** Plugin discovery tags. */
  readonly tags?: readonly string[];
  /** Runtime permissions requested by the plugin. */
  readonly permissions?: readonly string[];
  /** Runtime-safe plugin metadata. */
  readonly metadata?: TriggersPluginMetadata;
  /** Contribution groups registered by the plugin. */
  readonly contributions?: Readonly<Record<string, unknown>>;
  /** Typed plugin dependencies. */
  readonly dependencies?: Readonly<Record<string, TriggersPluginDependencyManifest>>;
}

/** Service contribution shape exposed by the triggers manifest. */
export interface TriggersPluginServiceContribution {
  /** Logical service name. */
  readonly name: string;
  /** Service entrypoint path. */
  readonly entrypoint: string;
  /** Optional service port. */
  readonly port?: number;
}

const TRIGGERS_SERVICE_PERMISSIONS = [
  '--unstable-kv',
  '--allow-net',
  '--allow-env',
  '--allow-read',
] as const;

/** Type-only sibling-core capabilities consumed by trigger actions and adapters. */
export type TriggersPluginCoreDependencies = Readonly<{
  workersCore: Readonly<{ job: TriggersWorkerJobDefinition }>;
  streamsCore: Readonly<{ producer: TriggersStreamProducerPort }>;
  sagasCore: Readonly<{ defineSaga: TriggersDefineSaga }>;
}>;

/** Typed plugin dependency manifests for sibling core packages. */
export type TriggersPluginDependencies = Readonly<
  Record<string, TriggersPluginDependencyManifest> & {
    workersCore: TriggersPluginDependencyManifest;
    streamsCore: TriggersPluginDependencyManifest;
    sagasCore: TriggersPluginDependencyManifest;
  }
>;

/** Public contribution groups exposed by the triggers plugin. */
export interface TriggersPluginContributions {
  /** Trigger HTTP API and ingress service contribution. */
  readonly services?: readonly TriggersPluginServiceContribution[];
  /** Contract versions exposed by the triggers API. */
  readonly contractVersions?: readonly { version: string; loader: string }[];
  /** Runtime config topic contribution for trigger registry ownership. */
  readonly runtimeConfigTopics?: readonly { name: string; schemaPath: string }[];
  /** Aspire contribution module reference. */
  readonly aspire?: string;
}

/** Public manifest shape for the triggers plugin. */
export interface TriggersPluginManifest
  extends Omit<TriggersPluginDependencyManifest, 'dependencies' | 'contributions'> {
  /** Declared typed plugin dependencies. */
  readonly dependencies: TriggersPluginDependencies;
  /** Declared contribution axes. */
  readonly contributions: TriggersPluginContributions;
}

/** Inspection summary for the triggers plugin manifest. */
export interface TriggersPluginInspection {
  /** Plugin package name. */
  readonly name: string;
  /** Plugin semantic version. */
  readonly version: string;
  /** Names of declared dependency aliases. */
  readonly dependencies: readonly string[];
  /** Names of declared contribution axes. */
  readonly axes: readonly string[];
}

const triggersPluginDependencies = Object.freeze({
  workersCore: definePlugin('@netscript/plugin-workers-core', '0.0.1-alpha.0').build(),
  streamsCore: definePlugin('@netscript/plugin-streams-core', '0.0.1-alpha.0').build(),
  sagasCore: definePlugin('@netscript/plugin-sagas-core', '0.0.1-alpha.0').build(),
});

const triggersManifest: PluginManifest = definePlugin(
  '@netscript/plugin-triggers',
  TRIGGERS_PLUGIN_VERSION,
)
  .withDisplayName('Triggers')
  .withType('background-processor')
  .withDescription('Trigger ingress, scheduling, file watching, and trigger runtime APIs.')
  .withAuthor('NetScript Team')
  .withLicense('MIT')
  .withTags(['triggers', 'webhooks', 'schedules', 'file-watchers'])
  .withPermissions(TRIGGERS_SERVICE_PERMISSIONS)
  .withDependencies(triggersPluginDependencies)
  .withService({
    name: TRIGGERS_API_SERVICE_NAME,
    entrypoint: './services/src/main.ts',
    port: TRIGGERS_API_DEFAULT_PORT,
  })
  .withContractVersions([{ version: 'v1', loader: './contracts/v1/mod.ts' }])
  .withRuntimeConfigTopics([
    { name: TRIGGERS_PLUGIN_ID, schemaPath: './runtime/triggers.schema.json' },
  ])
  .withAspire('./src/aspire/mod.ts')
  .withHooks({
    setup: (ctx): void => {
      ctx.logger.info('Triggers plugin loaded', {
        pluginRoot: ctx.pluginRoot ?? '',
        projectRoot: ctx.projectRoot,
        isDev: ctx.isDev ?? false,
      });
    },
    beforeGenerate: (ctx): void => {
      ctx.logger.info('Triggers plugin beforeGenerate hook');
    },
    afterGenerate: (ctx): void => {
      ctx.logger.info('Triggers plugin afterGenerate hook');
    },
    teardown: (ctx): void => {
      ctx.logger.info('Triggers plugin unloaded');
    },
  })
  .withMetadata({
    repository: 'https://github.com/rickylabs/netscript-start',
    documentation: 'https://netscript.dev/plugins/triggers',
    features: [
      'Ack-then-process webhook ingress',
      'Cron-backed scheduled triggers',
      'File-watch trigger adapters',
      'Typed worker, stream, and saga cross-axis integration',
      'Trigger runtime management API',
    ],
    requirements: {
      deno: '>=2.0.0',
      netscript: '>=1.0.0',
    },
  })
  .build();

/** Plugin manifest for NetScript triggers. */
export const triggersPlugin: TriggersPluginManifest = triggersManifest as TriggersPluginManifest;

/** Inspect the triggers plugin manifest without invoking lifecycle hooks. */
export function inspectTriggers(
  manifest: TriggersPluginManifest = triggersPlugin,
): TriggersPluginInspection {
  return Object.freeze({
    name: manifest.name,
    version: manifest.version,
    dependencies: Object.freeze(Object.keys(manifest.dependencies)),
    axes: Object.freeze(Object.keys(manifest.contributions)),
  });
}

export {
  TRIGGERS_API_DEFAULT_PORT,
  TRIGGERS_API_SERVICE_NAME,
  TRIGGERS_PLUGIN_ID,
  TRIGGERS_PLUGIN_VERSION,
} from '../constants.ts';
export type {
  TriggersApiServiceName,
  TriggersPluginId,
  TriggersPluginVersion,
} from '../constants.ts';
