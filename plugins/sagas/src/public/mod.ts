/**
 * @module @netscript/plugin-sagas/public
 *
 * Public manifest and constants for the sagas plugin package.
 */

import { definePlugin, type PluginManifest } from '@netscript/plugin';
import { streamsPlugin, type StreamsPluginManifest } from '@netscript/plugin-streams';
import { workersPlugin, type WorkersPluginManifest } from '@netscript/plugin-workers';
import {
  SAGAS_API_DEFAULT_PORT,
  SAGAS_API_SERVICE_NAME,
  SAGAS_PLUGIN_ID,
  SAGAS_PLUGIN_VERSION,
} from '../constants.ts';

const SAGAS_SERVICE_PERMISSIONS = [
  '--unstable-kv',
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-write',
] as const;

/** Structural plugin manifest dependency reference. */
export type SagasPluginDependencyManifest = Readonly<{
  name?: string;
  version?: string;
  [key: string]: unknown;
}>;

/** Typed dependencies consumed by the sagas plugin manifest. */
export type SagasPluginDependencies = Readonly<
  Record<string, SagasPluginDependencyManifest> & {
    workers: SagasPluginDependencyManifest;
    streams: SagasPluginDependencyManifest;
  }
>;

/** Structural service contribution in the sagas plugin manifest. */
export type SagasServiceContribution = Readonly<{
  name: string;
  entrypoint: string;
  port?: number;
}>;

/** Structural database schema contribution in the sagas plugin manifest. */
export type SagasDbSchemaContribution = Readonly<{
  path: string;
  engine?: string;
}>;

/** Structural runtime config topic contribution in the sagas plugin manifest. */
export type SagasRuntimeConfigTopicContribution = Readonly<{
  name: string;
  schemaPath?: string;
}>;

/** Structural contract version contribution in the sagas plugin manifest. */
export type SagasContractVersionContribution = Readonly<{
  version: string;
  loader: string;
}>;

/** Structural E2E contribution in the sagas plugin manifest. */
export type SagasE2eContribution = Readonly<Record<string, unknown>>;

/** Structural telemetry contribution in the sagas plugin manifest. */
export type SagasTelemetryContribution = Readonly<Record<string, unknown>>;

/** Structural migration contribution in the sagas plugin manifest. */
export type SagasMigrationContribution = Readonly<Record<string, unknown>>;

/** Public contribution groups exposed by the sagas plugin. */
export interface SagasPluginContributions {
  /** Sagas API service contribution. */
  readonly services?: readonly SagasServiceContribution[];
  /** Database schema contribution for saga state. */
  readonly databaseSchemas?: readonly SagasDbSchemaContribution[];
  /** Runtime config topic contribution for saga overrides. */
  readonly runtimeConfigTopics?: readonly SagasRuntimeConfigTopicContribution[];
  /** Contract versions exposed by the sagas API. */
  readonly contractVersions?: readonly SagasContractVersionContribution[];
  /** End-to-end test contributions. */
  readonly e2e?: readonly SagasE2eContribution[];
  /** Telemetry contribution modules. */
  readonly telemetry?: readonly SagasTelemetryContribution[];
  /** Migration contribution modules or assets. */
  readonly migrations?: readonly SagasMigrationContribution[];
  /** Aspire contribution module reference. */
  readonly aspire?: string;
}

/** Public manifest shape for the sagas plugin. */
export interface SagasPluginManifest {
  /** Plugin package name. */
  readonly name: string;
  /** Plugin semantic version. */
  readonly version: string;
  /** Declared typed plugin dependencies. */
  readonly dependencies: SagasPluginDependencies;
  /** Declared contribution axes. */
  readonly contributions: SagasPluginContributions;
  /** Additional manifest metadata carried by the plugin host. */
  readonly [key: string]: unknown;
}

/** Inspection summary for the sagas plugin manifest. */
export interface SagasPluginInspection {
  /** Plugin package name. */
  readonly name: string;
  /** Plugin semantic version. */
  readonly version: string;
  /** Names of declared dependency aliases. */
  readonly dependencies: readonly string[];
  /** Names of declared contribution axes. */
  readonly axes: readonly string[];
}

const sagasPluginDependencies = Object.freeze(
  {
    workers: workersPlugin,
    streams: streamsPlugin,
  } satisfies Readonly<{ workers: WorkersPluginManifest; streams: StreamsPluginManifest }>,
);

const sagasManifest: PluginManifest = definePlugin(
  '@netscript/plugin-sagas',
  '0.1.0',
)
  .withDisplayName('Saga Orchestration')
  .withType('background-processor')
  .withDescription('Durable saga orchestration and workflow state for NetScript applications.')
  .withAuthor('NetScript Team')
  .withLicense('MIT')
  .withTags(['sagas', 'workflows', 'orchestration', 'distributed', 'compensation'])
  .withPermissions(SAGAS_SERVICE_PERMISSIONS)
  .withDependencies(sagasPluginDependencies)
  .withService({
    name: SAGAS_API_SERVICE_NAME,
    entrypoint: './services/src/main.ts',
    port: SAGAS_API_DEFAULT_PORT,
  })
  .withDbSchemas([{ path: './database/sagas.prisma', engine: 'postgres' }])
  .withContractVersions([{ version: 'v1', loader: './contracts/v1/mod.ts' }])
  .withRuntimeConfigTopics([{ name: SAGAS_PLUGIN_ID, schemaPath: './runtime/sagas.schema.json' }])
  .withAspire('./src/aspire/mod.ts')
  .withHooks({
    setup: (ctx): void => {
      ctx.logger.info('Sagas plugin loaded', {
        pluginRoot: ctx.pluginRoot ?? '',
        projectRoot: ctx.projectRoot,
        isDev: ctx.isDev ?? false,
      });
    },
    beforeGenerate: (ctx): void => {
      ctx.logger.info('Sagas plugin beforeGenerate hook');
    },
    afterGenerate: (ctx): void => {
      ctx.logger.info('Sagas plugin afterGenerate hook');
    },
    teardown: (ctx): void => {
      ctx.logger.info('Sagas plugin unloaded');
    },
  })
  .withMetadata({
    repository: 'https://github.com/rickylabs/netscript-start',
    documentation: 'https://netscript.dev/plugins/sagas',
    features: [
      'Durable saga state management',
      'Message-driven workflow execution',
      'Compensation hooks',
      'Workers and streams plugin integration',
      'REST API for saga management',
      'Real-time saga updates',
      'Distributed tracing support',
    ],
    requirements: {
      deno: '>=2.0.0',
      netscript: '>=1.0.0',
    },
  })
  .build();

/** Plugin manifest for NetScript sagas. */
export const sagasPlugin: SagasPluginManifest = sagasManifest as unknown as SagasPluginManifest;

/** Inspect the sagas plugin manifest without invoking lifecycle hooks. */
export function inspectSagas(
  manifest: SagasPluginManifest = sagasPlugin,
): SagasPluginInspection {
  return Object.freeze({
    name: manifest.name,
    version: manifest.version,
    dependencies: Object.freeze(Object.keys(manifest.dependencies)),
    axes: Object.freeze(Object.keys(manifest.contributions)),
  });
}

export {
  SAGAS_API_DEFAULT_PORT,
  SAGAS_API_SERVICE_NAME,
  SAGAS_PLUGIN_ID,
  SAGAS_PLUGIN_VERSION,
} from '../constants.ts';
export type { SagasApiServiceName, SagasPluginId, SagasPluginVersion } from '../constants.ts';
