/**
 * @module @netscript/plugin-sagas/public
 *
 * Public manifest and constants for the sagas plugin package.
 */

import { definePlugin, type PluginManifest } from '@netscript/plugin';
import { streamsPlugin } from '@netscript/plugin-streams';
import { workersPlugin } from '@netscript/plugin-workers';
import { SAGAS_API_DEFAULT_PORT, SAGAS_API_SERVICE_NAME, SAGAS_PLUGIN_ID } from '../constants.ts';
import { PLUGIN_PACKAGE_VERSION } from '../package-metadata.generated.ts';

/** Plugin package version, single-sourced from the package `deno.json`. */
const VERSION: string = PLUGIN_PACKAGE_VERSION;

const SAGAS_SERVICE_PERMISSIONS = [
  '--unstable-kv',
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-write',
] as const;

const sagasPluginDependencies = Object.freeze(
  {
    workers: workersPlugin,
    streams: streamsPlugin,
  } satisfies Readonly<{ workers: PluginManifest; streams: PluginManifest }>,
);

const sagasManifest: PluginManifest = definePlugin(
  '@netscript/plugin-sagas',
  VERSION,
)
  .withDisplayName('Saga Orchestration')
  .withType('background-processor')
  .withDescription('Durable saga orchestration and workflow state for NetScript applications.')
  .withAuthor('NetScript Team')
  .withLicense('Apache-2.0')
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
export const sagasPlugin: PluginManifest = sagasManifest;

export {
  SAGAS_API_DEFAULT_PORT,
  SAGAS_API_SERVICE_NAME,
  SAGAS_PLUGIN_ID,
  SAGAS_PLUGIN_VERSION,
} from '../constants.ts';
export type { SagasApiServiceName, SagasPluginId, SagasPluginVersion } from '../constants.ts';
