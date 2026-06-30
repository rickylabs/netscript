/**
 * @module @netscript/plugin-workers
 *
 * Plugin manifest for NetScript background workers.
 *
 * @example Load the plugin manifest
 * ```ts
 * import { workersPlugin } from "@netscript/plugin-workers";
 *
 * console.log(workersPlugin.name);
 * ```
 */

import { definePlugin, type PluginManifest } from '@netscript/plugin';
import type { StreamTopicContribution } from '@netscript/plugin';
import denoJson from '../../deno.json' with { type: 'json' };
import {
  PublicJobDefinitionSchema,
  PublicTaskDefinitionSchema,
  PublicWorkflowDefinitionSchema,
} from '@netscript/plugin-workers-core/schemas';
import { streamsPlugin } from '@netscript/plugin-streams';
import type { StreamTopicDefinition } from '@netscript/plugin-streams';
import type { StandardSchemaV1 } from '@standard-schema/spec';

const WORKERS_SERVICE_PERMISSIONS = [
  '--unstable-kv',
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-write',
  '--allow-run',
] as const;

type WorkerTopicPayload =
  | NonNullable<typeof PublicJobDefinitionSchema['~standard']['types']>['output']
  | NonNullable<typeof PublicTaskDefinitionSchema['~standard']['types']>['output']
  | NonNullable<typeof PublicWorkflowDefinitionSchema['~standard']['types']>['output'];

type WorkerTopicSchema = StandardSchemaV1<WorkerTopicPayload, WorkerTopicPayload>;

function toTopicContribution(
  topic: StreamTopicDefinition<WorkerTopicPayload>,
): StreamTopicContribution {
  return {
    name: topic.name,
    subject: topic.name,
  };
}

/** Plugin package version, single-sourced from the package `deno.json`. */
const VERSION: string = denoJson.version;

const workersManifest = definePlugin('@netscript/plugin-workers', VERSION)
  .withDisplayName('Background Workers')
  .withType('background-processor')
  .withDescription('Background job scheduling and execution for NetScript applications.')
  .withAuthor('NetScript Team')
  .withLicense('MIT')
  .withTags(['jobs', 'scheduler', 'worker', 'background', 'cron', 'tasks'])
  .withPermissions(WORKERS_SERVICE_PERMISSIONS)
  .withDependencies({ streams: streamsPlugin })
  .withService({
    name: 'workers-api',
    entrypoint: './services/src/main.ts',
    port: 8091,
  })
  .withBackgroundProcessor({
    name: 'workers-combined',
    entrypoint: './bin/combined.ts',
    concurrency: 2,
  })
  .withBackgroundProcessor({
    name: 'workers-worker',
    entrypoint: './bin/worker.ts',
    concurrency: 2,
  })
  .withBackgroundProcessor({
    name: 'workers-scheduler',
    entrypoint: './bin/scheduler.ts',
  })
  .withStreamTopics(({ deps }) => [
    toTopicContribution(
      deps.streams.defineTopic<WorkerTopicPayload>(
        'workers.jobs',
        PublicJobDefinitionSchema as WorkerTopicSchema,
      ),
    ),
    toTopicContribution(
      deps.streams.defineTopic<WorkerTopicPayload>(
        'workers.tasks',
        PublicTaskDefinitionSchema as WorkerTopicSchema,
      ),
    ),
    toTopicContribution(
      deps.streams.defineTopic<WorkerTopicPayload>(
        'workers.workflows',
        PublicWorkflowDefinitionSchema as WorkerTopicSchema,
      ),
    ),
  ])
  .withDbSchemas([{ path: './database/workers.prisma', engine: 'postgres' }])
  .withContractVersions([{ version: 'v1', loader: './contracts/v1/mod.ts' }])
  .withRuntimeConfigTopics([{ name: 'workers', schemaPath: './runtime/workers.schema.json' }])
  .withE2e([{
    name: 'workers-health',
    command: 'deno task workers:e2e',
  }])
  .withAspire('./src/aspire/mod.ts')
  .withHooks({
    setup: (ctx): void => {
      ctx.logger.info('Workers plugin loaded', {
        pluginRoot: ctx.pluginRoot ?? '',
        projectRoot: ctx.projectRoot,
        isDev: ctx.isDev ?? false,
      });
    },
    beforeGenerate: (ctx): void => {
      ctx.logger.info('Workers plugin beforeGenerate hook');
    },
    afterGenerate: (ctx): void => {
      ctx.logger.info('Workers plugin afterGenerate hook');
    },
    teardown: (ctx): void => {
      ctx.logger.info('Workers plugin unloaded');
    },
  })
  .withMetadata({
    repository: 'https://github.com/rickylabs/netscript-start',
    documentation: 'https://netscript.dev/plugins/workers',
    features: [
      'Cron-based job scheduling',
      'Multi-runtime task execution',
      'Real-time stream updates',
      'Extensible workflow support',
      'REST API for job management',
      'Distributed tracing support',
      'Plugin job registration',
    ],
    requirements: {
      deno: '>=2.0.0',
      netscript: '>=1.0.0',
    },
  })
  .build();

/** Plugin manifest for NetScript background workers. */
export const workersPlugin: PluginManifest = workersManifest;
