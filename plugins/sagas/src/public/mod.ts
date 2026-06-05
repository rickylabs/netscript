/**
 * @module @netscript/plugin-sagas/public
 *
 * Public manifest and constants for the sagas plugin package.
 */

import {
  type ContractVersionContribution,
  type DbSchemaContribution,
  definePlugin,
  type E2eContribution,
  type MigrationContribution,
  type PluginManifest,
  type RuntimeConfigTopicContribution,
  type ServiceContribution,
  type TelemetryContribution,
} from '@netscript/plugin';
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

/** Typed dependencies consumed by the sagas plugin manifest. */
export type SagasPluginDependencies = Readonly<
  Record<string, PluginManifest> & {
    workers: WorkersPluginManifest;
    streams: StreamsPluginManifest;
  }
>;

/** Public contribution groups exposed by the sagas plugin. */
export interface SagasPluginContributions {
  /** Sagas API service contribution. */
  readonly services?: readonly ServiceContribution[];
  /** Database schema contribution for saga state. */
  readonly databaseSchemas?: readonly DbSchemaContribution[];
  /** Runtime config topic contribution for saga overrides. */
  readonly runtimeConfigTopics?: readonly RuntimeConfigTopicContribution[];
  /** Contract versions exposed by the sagas API. */
  readonly contractVersions?: readonly ContractVersionContribution[];
  /** End-to-end test contributions. */
  readonly e2e?: readonly E2eContribution[];
  /** Telemetry contribution modules. */
  readonly telemetry?: readonly TelemetryContribution[];
  /** Migration contribution modules or assets. */
  readonly migrations?: readonly MigrationContribution[];
  /** Aspire contribution module reference. */
  readonly aspire?: string;
}

/** Public manifest shape for the sagas plugin. */
export interface SagasPluginManifest
  extends Omit<PluginManifest, 'dependencies' | 'contributions'> {
  /** Declared typed plugin dependencies. */
  readonly dependencies: SagasPluginDependencies;
  /** Declared contribution axes. */
  readonly contributions: SagasPluginContributions;
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

const sagasPluginDependencies: SagasPluginDependencies = Object.freeze({
  workers: workersPlugin,
  streams: streamsPlugin,
});

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
export const sagasPlugin: SagasPluginManifest = sagasManifest as SagasPluginManifest;

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
