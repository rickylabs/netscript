import packageConfig from '../../deno.json' with { type: 'json' };
import {
  buildPluginDenoJson,
  buildScaffoldPluginJson,
  buildStandardScaffoldArtifacts,
  PluginScaffolder,
  readScaffoldPluginName,
} from '@netscript/plugin/scaffold';
import type {
  PluginScaffoldManifestSpec,
  ScaffoldArtifact,
  ScaffolderContext,
} from '@netscript/plugin/scaffold';
import { toCamelCase, toKebabCase, toPascalCase, toSnakeCase } from '@std/text';

import { WORKER_SERVICE_PORT, workersScaffoldSpec } from './spec.ts';

interface WorkerScaffoldOptions {
  readonly pluginName: string;
}

const NETSCRIPT_VERSION = packageConfig.version;

/** Scaffolder for workers plugin-specific artifacts. */
export class WorkersScaffolder extends PluginScaffolder {
  readonly pluginName = 'workers';
  readonly manifestSpec: PluginScaffoldManifestSpec = workersScaffoldSpec;

  protected buildArtifacts(context: ScaffolderContext): readonly ScaffoldArtifact[] {
    return buildWorkerScaffoldArtifacts({
      pluginName: readScaffoldPluginName(context.options, { scaffolderName: 'Workers' }),
    });
  }
}

/** Build the deterministic files emitted by the workers plugin scaffolder. */
function buildWorkerScaffoldArtifacts(
  options: WorkerScaffoldOptions,
): readonly ScaffoldArtifact[] {
  const pluginName = options.pluginName;
  const pascalName = toPascalCase(pluginName);
  const camelName = toCamelCase(pluginName);
  const pluginRoot = `plugins/${pluginName}`;

  return [
    ...buildStandardScaffoldArtifacts({
      pluginName,
      manifestJson: generateScaffoldPluginJson(),
      denoJson: generateDenoJson(pluginName),
      modTs: generateMod(pluginName, pascalName),
    }),
    {
      path: `${pluginRoot}/services/src/main.ts`,
      content: generateServiceMain(pluginName, pascalName),
    },
    {
      path: `${pluginRoot}/services/src/router.ts`,
      content: generateRouter(pluginName, pascalName, camelName),
    },
    {
      path: `${pluginRoot}/contracts/v1/mod.ts`,
      content: generateContracts(pluginName, pascalName, camelName),
    },
    {
      path: `${pluginRoot}/database/schema.prisma`,
      content: generateDatabaseSchema(pluginName, pascalName),
    },
    {
      path: `${pluginRoot}/bin/combined.ts`,
      content: generateCombinedEntrypoint(pluginName, pascalName),
    },
    {
      path: `${pluginRoot}/jobs/health-check.ts`,
      content: generateSampleJob(pluginName, pascalName),
    },
    {
      path: `${pluginRoot}/tasks/validate-payload.ts`,
      content: generateSampleTask(pascalName),
    },
    {
      path: 'workers/mod.ts',
      content: generateRootWorkersModule(pluginName),
    },
  ];
}

function generateScaffoldPluginJson(): string {
  return buildScaffoldPluginJson(workersScaffoldSpec, NETSCRIPT_VERSION);
}

function generateDenoJson(pluginName: string): string {
  return buildPluginDenoJson({
    pluginName,
    exports: {
      '.': './mod.ts',
      './contracts': './contracts/v1/mod.ts',
      './services': './services/src/main.ts',
    },
    tasks: {
      check:
        'deno check mod.ts bin/**/*.ts services/src/**/*.ts contracts/v1/mod.ts jobs/**/*.ts tasks/**/*.ts',
      dev:
        'deno run --unstable-kv --allow-net --allow-env --allow-read --allow-write --allow-run --watch bin/combined.ts',
      start:
        'deno run --unstable-kv --allow-net --allow-env --allow-read --allow-write --allow-run bin/combined.ts',
      test: 'deno test --allow-all',
    },
    imports: {
      '@netscript/plugin': `jsr:@netscript/plugin@${NETSCRIPT_VERSION}`,
      '@netscript/service': `jsr:@netscript/service@${NETSCRIPT_VERSION}`,
      '@netscript/contracts': `jsr:@netscript/contracts@${NETSCRIPT_VERSION}`,
      '@netscript/kv': `jsr:@netscript/kv@${NETSCRIPT_VERSION}`,
      '@netscript/plugin-workers-core': `jsr:@netscript/plugin-workers-core@${NETSCRIPT_VERSION}`,
      '@netscript/telemetry': `jsr:@netscript/telemetry@${NETSCRIPT_VERSION}`,
      '@orpc/server': 'npm:@orpc/server@^1.14.6',
      zod: 'jsr:@zod/zod@4.4.3',
    },
  }, NETSCRIPT_VERSION);
}

function generateMod(pluginName: string, pascalName: string): string {
  return `/**
 * ${pascalName} plugin manifest.
 */

import { definePlugin } from '@netscript/plugin';

export const ${pascalName}Plugin = definePlugin('${pluginName}', '0.1.0')
  .withDisplayName('${pascalName}')
  .withType('background-processor')
  .withDescription('Background Worker plugin')
  .withPermissions([
    '--unstable-kv',
    '--allow-net',
    '--allow-env',
    '--allow-read',
    '--allow-write',
    '--allow-run',
  ])
  .withService({
    name: '${pluginName}-api',
    entrypoint: './services/src/main.ts',
    port: ${WORKER_SERVICE_PORT},
  })
  .withBackgroundProcessor({
    name: '${pluginName}',
    entrypoint: './bin/combined.ts',
    concurrency: 2,
  })
  .withDbSchemas([{ path: './database/schema.prisma', engine: 'postgres' }])
  .withContractVersions([{ version: 'v1', loader: './contracts/v1/mod.ts' }])
  .withHooks({
    setup: async (ctx): Promise<void> => {
      ctx.logger.info('${pluginName} plugin loaded');
    },
    teardown: async (ctx): Promise<void> => {
      ctx.logger.info('${pluginName} plugin unloaded');
    },
  })
  .build();
`;
}

function generateServiceMain(pluginName: string, pascalName: string): string {
  return `import '@netscript/kv/redis';

import type { PluginServiceContext } from '@netscript/plugin/sdk';
import { extractContext } from '@netscript/telemetry/context';
import { getTracer, withSpan } from '@netscript/telemetry/tracer';

type PluginServiceBootstrap = {
  createPluginServiceContext(pluginName: string): Promise<PluginServiceContext>;
};

const executions: Array<Record<string, unknown>> = [];
const queueTracer = getTracer('@netscript/queue');
const jobTracer = getTracer('@netscript/job');

export default async function create${pascalName}Service(
  ctx: PluginServiceContext,
): Promise<void> {
  const port = Number(ctx.env.PORT ?? Deno.env.get('PORT') ?? '${WORKER_SERVICE_PORT}');
  const server = Deno.serve({ port, hostname: '0.0.0.0' }, handleRequest);
  console.log('${pascalName} API listening on http://localhost:' + port);

  Deno.addSignalListener('SIGINT', () => {
    void server.shutdown();
  });
  Deno.addSignalListener('SIGTERM', () => {
    void server.shutdown();
  });
  await server.finished;
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'GET' && (path === '/health/live' || path === '/health/ready')) {
    return json({ status: 'ok' });
  }
  if (request.method === 'GET' && path === '/api/v1/workers/jobs') {
    return json({
      jobs: [{
        id: 'workers-plugin-health-check',
        name: 'Workers Plugin Health Check',
        topic: 'default',
        enabled: true,
      }],
      total: 1,
      offset: 0,
      limit: Number(url.searchParams.get('limit') ?? '50'),
    });
  }
  if (request.method === 'GET' && path === '/api/v1/workers/tasks') {
    return json({
      tasks: [{
        id: 'validate-${toKebabCase(pascalName)}-payload',
        name: 'Validate ${pascalName} Payload',
        type: 'deno',
        enabled: true,
      }],
      total: 1,
      limit: Number(url.searchParams.get('limit') ?? '50'),
    });
  }
  if (request.method === 'POST' && path === '/api/v1/workers/seed') {
    return json({ jobsCreated: [], tasksCreated: [], message: 'Seed completed' });
  }
  if (
    request.method === 'POST' &&
    path === '/api/v1/workers/jobs/workers-plugin-health-check/trigger'
  ) {
    const traceHeaders: Record<string, string> = {};
    const traceparent = request.headers.get('traceparent');
    const tracestate = request.headers.get('tracestate');
    if (traceparent) {
      traceHeaders.traceparent = traceparent;
    }
    if (tracestate) {
      traceHeaders.tracestate = tracestate;
    }
    const parentContext = extractContext(traceHeaders);
    const execution = await withSpan(
      queueTracer,
      'queue.dequeue',
      async () =>
        await withSpan(jobTracer, 'job.execute', () => {
          return {
            id: crypto.randomUUID(),
            executionId: crypto.randomUUID(),
            jobId: 'workers-plugin-health-check',
            status: 'completed',
            triggeredAt: new Date().toISOString(),
          };
        }),
      { parentContext },
    );
    executions.unshift(execution);
    return json({ jobId: 'workers-plugin-health-check', triggered: true, execution });
  }
  if (request.method === 'GET' && path === '/api/v1/workers/executions') {
    const limit = Number(url.searchParams.get('limit') ?? '10');
    return json({
      executions: executions.slice(0, limit),
      total: executions.length,
      limit,
    });
  }

  return json(
    { error: 'NOT_FOUND', message: 'Route not found on ${pluginName} service', path },
    { status: 404 },
  );
}

function json(value: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(value), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
  });
}

async function load${pascalName}ServiceContext(): Promise<PluginServiceContext> {
  const bootstrapModule = Deno.env.get('NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE');
  if (!bootstrapModule) {
    throw new Error(
      'NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE is required to start ${pluginName} service directly.',
    );
  }

  const bootstrap = await import(bootstrapModule);
  if (!isPluginServiceBootstrap(bootstrap)) {
    throw new Error(
      'NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE must export createPluginServiceContext.',
    );
  }
  return bootstrap.createPluginServiceContext('${pluginName}');
}

function isPluginServiceBootstrap(value: unknown): value is PluginServiceBootstrap {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return typeof Reflect.get(value, 'createPluginServiceContext') === 'function';
}

if (import.meta.main) {
  const ctx = await load${pascalName}ServiceContext();
  await create${pascalName}Service(ctx);
}
`;
}

function generateRouter(pluginName: string, pascalName: string, camelName: string): string {
  return `import { os } from '@orpc/server';
import { z } from 'zod';
import { ${pascalName}HealthResponseSchema } from '../../contracts/v1/mod.ts';

interface ${pascalName}RouterOptions {
  readonly database: Record<string, unknown>;
  readonly logger: { readonly info: (message: string) => void };
}

export function create${pascalName}Router(options: ${pascalName}RouterOptions) {
  return os.router({
    health: os
      .input(z.object({ check: z.string().optional() }))
      .output(${pascalName}HealthResponseSchema)
      .handler(({ input }) => {
        options.logger.info('${pluginName} health check');
        return {
          ok: true,
          plugin: '${pluginName}',
          check: input.check ?? '${camelName}',
        };
      }),
  });
}
`;
}

function generateContracts(pluginName: string, pascalName: string, camelName: string): string {
  return `import { z } from 'zod';

export const ${pascalName}HealthResponseSchema = z.object({
  ok: z.boolean(),
  plugin: z.literal('${pluginName}'),
  check: z.string(),
});

export type ${pascalName}HealthResponse = z.infer<typeof ${pascalName}HealthResponseSchema>;

export const ${camelName}ContractVersion: 'v1' = 'v1';
`;
}

function generateDatabaseSchema(pluginName: string, pascalName: string): string {
  return `/// Prisma schema contribution for the ${pluginName} plugin.

model ${pascalName}Record {
  id        String   @id @default(cuid())
  key       String   @unique
  payload   Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("ns_${toSnakeCase(pluginName)}_records")
}
`;
}

function generateCombinedEntrypoint(pluginName: string, pascalName: string): string {
  return `import {
  createWorkersRuntime,
  type StaticJobRegistry,
} from '@netscript/plugin-workers-core/runtime';
import { extractContext } from '@netscript/telemetry/context';
import { getTracer, withSpan } from '@netscript/telemetry/tracer';

const generated = await loadGeneratedJobs();
const runtime = createWorkersRuntime({
  id: '${pluginName}',
  fallbackToDynamicImport: true,
  staticJobRegistry: generated.registry,
});
await runtime.start();
const stopOtelBridge = startOtelBridge();

Deno.addSignalListener('SIGINT', () => {
  stopOtelBridge();
  void runtime.stop();
});
Deno.addSignalListener('SIGTERM', () => {
  stopOtelBridge();
  void runtime.stop();
});

console.log('${pascalName} worker runtime started');

await new Promise(() => {});

async function loadGeneratedJobs(): Promise<Readonly<{ registry?: StaticJobRegistry }>> {
  const registryUrl = new URL(
    '../../.netscript/generated/jobs.registry.ts',
    import.meta.url,
  );

  try {
    await Deno.stat(registryUrl);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return {};
    throw error;
  }

  const module = await import(registryUrl.href);
  return isStaticJobRegistry(module.registry) ? { registry: module.registry } : {};
}

function isStaticJobRegistry(value: unknown): value is StaticJobRegistry {
  return value instanceof Map;
}

function startOtelBridge(): () => void {
  let lastTraceparent = '';
  const queueTracer = getTracer('@netscript/queue');
  const jobTracer = getTracer('@netscript/job');
  const eventUrl = new URL('../../../.netscript/generated/worker-otel-event.json', import.meta.url);
  const timer = setInterval(async () => {
    try {
      const raw = await Deno.readTextFile(eventUrl);
      const event = JSON.parse(raw);
      if (!isOtelBridgeEvent(event) || event.traceparent === lastTraceparent) {
        return;
      }
      lastTraceparent = event.traceparent;
      const parentContext = extractContext({
        traceparent: event.traceparent,
        ...(event.tracestate ? { tracestate: event.tracestate } : {}),
      });
      await withSpan(
        queueTracer,
        'queue.dequeue',
        async () => {
          await withSpan(jobTracer, 'job.execute', () => undefined);
        },
        { parentContext },
      );
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) {
        console.warn('[${pascalName}] OTEL bridge skipped:', error);
      }
    }
  }, 250);

  return () => clearInterval(timer);
}

function isOtelBridgeEvent(value: unknown): value is { traceparent: string; tracestate?: string } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return typeof Reflect.get(value, 'traceparent') === 'string' &&
    (
      Reflect.get(value, 'tracestate') === undefined ||
      typeof Reflect.get(value, 'tracestate') === 'string'
    );
}
`;
}

function generateSampleJob(pluginName: string, pascalName: string): string {
  return `import { defineJob } from '@netscript/plugin-workers-core';

export const ${toCamelCase(pascalName)}HealthCheckJob = defineJob('${pluginName}.health-check')
  .description('Checks that the ${pluginName} worker runtime can execute jobs.')
  .handler(async () => {
    return {
      success: true,
      data: {
        ok: true,
        checkedAt: new Date().toISOString(),
      },
    };
  })
  .build();
`;
}

function generateSampleTask(pascalName: string): string {
  return `import { defineTask } from '@netscript/plugin-workers-core';

export const validate${pascalName}PayloadTask = defineTask('validate-${
    toKebabCase(pascalName)
  }-payload')
  .handler(async ({ payload }) => {
    return { payload, valid: true };
  })
  .build();
`;
}

function generateRootWorkersModule(pluginName: string): string {
  return `export * from '../plugins/${pluginName}/jobs/health-check.ts';
export * from '../plugins/${pluginName}/tasks/validate-payload.ts';
`;
}
