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

import { definePlugin } from '@netscript/plugin';
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

/** Typed dependencies consumed by the workers plugin manifest. */
export type WorkersPluginDependencies = Readonly<Record<string, WorkersPluginDependencyManifest>>;

/** Public dependency-manifest shape exposed by the workers plugin manifest. */
export interface WorkersPluginDependencyManifest {
  /** Plugin package name. */
  readonly name: string;
  /** Plugin semantic version. */
  readonly version: string;
  /** Declared plugin dependencies. */
  readonly dependencies?: WorkersPluginDependencies;
  /** Declared contribution axes. */
  readonly contributions: WorkersPluginContributions;
  /** Additional manifest fields owned by the base plugin package. */
  readonly [key: string]: unknown;
}

/** Public contribution groups exposed by the workers plugin. */
export interface WorkersPluginContributions {
  /** Worker API service contribution. */
  readonly services?: readonly {
    readonly name: string;
    readonly entrypoint: string;
    readonly port?: number;
  }[];
  /** Background processor contribution for executing worker workloads. */
  readonly backgroundProcessors?: readonly {
    readonly name: string;
    readonly entrypoint: string;
    readonly concurrency?: number;
  }[];
  /** Stream topics emitted by worker runtimes. */
  readonly streamTopics?: readonly {
    readonly name: string;
    readonly subject: string;
  }[];
  /** Database schema contribution for worker state. */
  readonly databaseSchemas?: readonly {
    readonly path: string;
    readonly engine?: 'postgres' | 'mysql' | 'mssql' | 'sqlite';
  }[];
  /** Runtime config topic contribution for worker overrides. */
  readonly runtimeConfigTopics?: readonly {
    readonly name: string;
    readonly schemaPath?: string;
  }[];
  /** Contract versions exposed by the worker API. */
  readonly contractVersions?: readonly {
    readonly version: string;
    readonly loader: string;
  }[];
  /** End-to-end test contributions. */
  readonly e2e?: readonly {
    readonly name: string;
    readonly command: string;
  }[];
  /** Telemetry contribution modules. */
  readonly telemetry?: readonly {
    readonly name: string;
    readonly module: string;
  }[];
  /** Migration contribution modules or assets. */
  readonly migrations?: readonly {
    readonly name: string;
    readonly path: string;
  }[];
  /** Aspire contribution module reference. */
  readonly aspire?: string;
}

/** Public manifest shape for the workers plugin. */
export interface WorkersPluginManifest {
  /** Plugin package name. */
  readonly name: string;
  /** Plugin semantic version. */
  readonly version: string;
  /** Declared plugin dependencies. */
  readonly dependencies?: WorkersPluginDependencies;
  /** Declared contribution axes. */
  readonly contributions: WorkersPluginContributions;
  /** Additional manifest fields owned by the base plugin package. */
  readonly [key: string]: unknown;
}

/** Inspection summary for the workers plugin manifest. */
export interface WorkersPluginInspection {
  /** Plugin package name. */
  readonly name: string;
  /** Plugin semantic version. */
  readonly version: string;
  /** Names of declared dependency aliases. */
  readonly dependencies: readonly string[];
  /** Names of declared contribution axes. */
  readonly axes: readonly string[];
}

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
export const workersPlugin: WorkersPluginManifest =
  workersManifest as unknown as WorkersPluginManifest;

/** Inspect the workers plugin manifest without invoking lifecycle hooks. */
export function inspectWorkers(
  manifest: WorkersPluginManifest = workersPlugin,
): WorkersPluginInspection {
  return Object.freeze({
    name: manifest.name,
    version: manifest.version,
    dependencies: Object.freeze(Object.keys(manifest.dependencies ?? {})),
    axes: Object.freeze(Object.keys(manifest.contributions)),
  });
}
