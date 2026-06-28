import {
  FileWatchTriggerScaffolder,
  ScheduledTriggerScaffolder,
  WebhookTriggerScaffolder,
} from '../scaffolding/trigger-scaffolders.ts';

interface TriggersScaffoldArtifact {
  readonly path: string;
  readonly content: string;
}

interface TriggersScaffoldOptions {
  readonly pluginName: string;
}

const NETSCRIPT_VERSION = '0.0.1-alpha.12';
const TRIGGERS_SERVICE_PORT = 8093;
const TRIGGERS_PROCESSOR_CONCURRENCY_ENV = 'TRIGGERS_PROCESSOR_CONCURRENCY';

/** Build the deterministic files emitted by the triggers plugin scaffolder. */
export async function buildTriggersScaffoldArtifacts(
  options: TriggersScaffoldOptions,
): Promise<readonly TriggersScaffoldArtifact[]> {
  const pluginName = options.pluginName;
  const pascalName = toPascalCase(pluginName);
  const camelName = toCamelCase(pluginName);
  const pluginRoot = `plugins/${pluginName}`;
  const sampleWebhook = await new WebhookTriggerScaffolder().generate({
    id: 'generic-inbound-webhook',
    kind: 'webhook',
    path: 'inbound/generic',
  });
  const sampleSchedule = await new ScheduledTriggerScaffolder().generate({
    id: 'daily-maintenance',
    kind: 'scheduled',
    cron: '0 3 * * *',
  });
  const sampleFileWatch = await new FileWatchTriggerScaffolder().generate({
    id: 'incoming-file-watch',
    kind: 'file-watch',
    paths: ['./shared/incoming'],
    patterns: ['*.json', '*.csv'],
  });

  return [
    {
      path: `${pluginRoot}/scaffold.plugin.json`,
      content: generateScaffoldPluginJson(),
    },
    {
      path: `${pluginRoot}/deno.json`,
      content: generateDenoJson(pluginName),
    },
    {
      path: `${pluginRoot}/mod.ts`,
      content: generateMod(pluginName, pascalName),
    },
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
      path: `${pluginRoot}/database/triggers.prisma`,
      content: generateDatabaseSchema(pluginName),
    },
    {
      path: `${pluginRoot}/src/runtime/trigger-processor.ts`,
      content: generateTriggerProcessor(pluginName, pascalName),
    },
    {
      path: `${pluginRoot}/src/runtime/project-trigger-registry.ts`,
      content: generateProjectTriggerRegistry(pluginName),
    },
    {
      path: `${pluginRoot}/src/aspire/mod.ts`,
      content: generateAspireContribution(pluginName),
    },
    {
      path: `${pluginRoot}/triggers/generic-inbound-webhook.ts`,
      content: sampleWebhook,
    },
    {
      path: `${pluginRoot}/triggers/daily-maintenance.ts`,
      content: sampleSchedule,
    },
    {
      path: `${pluginRoot}/triggers/incoming-file-watch.ts`,
      content: sampleFileWatch,
    },
    {
      path: 'triggers/mod.ts',
      content: generateRootTriggersModule(pluginName),
    },
  ];
}

function generateScaffoldPluginJson(): string {
  const manifest = {
    $schema: 'jsr:@netscript/plugin/schema',
    schemaVersion: 1,
    name: '@netscript/plugin-triggers',
    version: NETSCRIPT_VERSION,
    displayName: 'Trigger Processor',
    description:
      'NetScript plugin for trigger ingress, scheduling, file watching, and trigger runtime APIs.',
    peerDependencies: {
      '@netscript/plugin': NETSCRIPT_VERSION,
    },
    capabilities: {
      hasDatabaseMigrations: true,
      hasRoutes: true,
      hasBackgroundWorkers: true,
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
      kind: 'trigger',
      displayName: 'Trigger Processor',
      category: 'background-processor',
      portRangeKey: 'INFRA_PLUGIN',
      defaultPermissions: ['--unstable-kv', '--allow-all'],
      watchFlag: '--watch',
      defaultEntrypoint: 'src/runtime/trigger-processor.ts',
      defaultServiceEntrypoint: 'services/src/main.ts',
      defaultRequiresDb: true,
      defaultRequiresKv: true,
      pluginType: 'background-processor',
      supportsConcurrency: true,
      concurrencyEnvVar: TRIGGERS_PROCESSOR_CONCURRENCY_ENV,
      defaultConcurrency: 10,
      defaultTelemetry: true,
      infrastructureRequires: ['kv'],
      infrastructureOptionalDeps: ['db'],
    },
    officialSource: {
      canonicalName: 'triggers',
      pluginDir: 'triggers',
      backgroundDir: 'triggers',
      serviceEntrypoint: 'services/src/main.ts',
      backgroundEntrypoint: 'src/runtime/trigger-processor.ts',
      serviceConfigKey: 'triggers-api',
      servicePort: TRIGGERS_SERVICE_PORT,
      backgroundPort: TRIGGERS_SERVICE_PORT,
      dependencies: ['streams'],
      pluginReferences: ['workers-api'],
    },
  };

  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function generateDenoJson(pluginName: string): string {
  const config = {
    name: `@netscript-app/plugin-${pluginName}`,
    version: '0.1.0',
    exports: {
      '.': './mod.ts',
      './contracts': './contracts/v1/mod.ts',
      './services': './services/src/main.ts',
      './runtime': './src/runtime/trigger-processor.ts',
      './aspire': './src/aspire/mod.ts',
    },
    tasks: {
      check:
        'deno check --unstable-kv mod.ts services/src/main.ts contracts/v1/mod.ts src/runtime/trigger-processor.ts src/runtime/project-trigger-registry.ts src/aspire/mod.ts triggers/**/*.ts',
      dev:
        'deno run --unstable-kv --allow-net --allow-env --allow-read --allow-write --watch services/src/main.ts',
      start:
        'deno run --unstable-kv --allow-net --allow-env --allow-read --allow-write services/src/main.ts',
      'run:triggers':
        'deno run --unstable-kv --allow-net --allow-env --allow-read --allow-write src/runtime/trigger-processor.ts',
      test: 'deno test --allow-all',
    },
    imports: {
      '@netscript/plugin': `jsr:@netscript/plugin@${NETSCRIPT_VERSION}`,
      '@netscript/service': `jsr:@netscript/service@${NETSCRIPT_VERSION}`,
      '@netscript/contracts': `jsr:@netscript/contracts@${NETSCRIPT_VERSION}`,
      '@netscript/kv': `jsr:@netscript/kv@${NETSCRIPT_VERSION}`,
      '@netscript/plugin-triggers-core': `jsr:@netscript/plugin-triggers-core@${NETSCRIPT_VERSION}`,
      '@netscript/plugin-triggers-core/builders':
        `jsr:@netscript/plugin-triggers-core@${NETSCRIPT_VERSION}/builders`,
      '@netscript/plugin-triggers-core/domain':
        `jsr:@netscript/plugin-triggers-core@${NETSCRIPT_VERSION}/domain`,
      '@netscript/plugin-triggers-core/ports':
        `jsr:@netscript/plugin-triggers-core@${NETSCRIPT_VERSION}/ports`,
      '@netscript/plugin-triggers-core/runtime':
        `jsr:@netscript/plugin-triggers-core@${NETSCRIPT_VERSION}/runtime`,
      '@netscript/telemetry': `jsr:@netscript/telemetry@${NETSCRIPT_VERSION}`,
      '@orpc/server': 'npm:@orpc/server@^1.14.6',
      hono: 'jsr:@hono/hono@4.12.24',
      zod: 'jsr:@zod/zod@4.4.3',
    },
    compilerOptions: {
      lib: ['deno.ns', 'deno.unstable', 'dom', 'dom.iterable'],
      strict: true,
    },
  };

  return `${JSON.stringify(config, null, 2)}\n`;
}

function generateMod(pluginName: string, pascalName: string): string {
  return `/**
 * ${pascalName} plugin manifest.
 */

import { definePlugin } from '@netscript/plugin';

export const ${pascalName}Plugin = definePlugin('${pluginName}', '0.1.0')
  .withDisplayName('${pascalName}')
  .withType('background-processor')
  .withDescription('Trigger ingress, scheduling, file watching, and trigger runtime APIs.')
  .withPermissions([
    '--unstable-kv',
    '--allow-net',
    '--allow-env',
    '--allow-read',
    '--allow-write',
  ])
  .withService({
    name: '${pluginName}-api',
    entrypoint: './services/src/main.ts',
    port: ${TRIGGERS_SERVICE_PORT},
  })
  .withBackgroundProcessor({
    name: '${pluginName}',
    entrypoint: './src/runtime/trigger-processor.ts',
    concurrency: 2,
  })
  .withDbSchemas([{ path: './database/triggers.prisma', engine: 'postgres' }])
  .withContractVersions([{ version: 'v1', loader: './contracts/v1/mod.ts' }])
  .withRuntimeConfigTopics([{ name: '${pluginName}', schemaPath: './runtime/triggers.schema.json' }])
  .withAspire('./src/aspire/mod.ts')
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
import { resolveTraceContextFromSpan } from '@netscript/telemetry/context';
import { getTracer, withSpan } from '@netscript/telemetry/tracer';

type PluginServiceBootstrap = {
  createPluginServiceContext(pluginName: string): Promise<PluginServiceContext>;
};

const events: Array<Record<string, unknown>> = [];
const triggerTracer = getTracer('@netscript/triggers');
const queueTracer = getTracer('@netscript/queue');

export default async function create${pascalName}Service(
  ctx: PluginServiceContext,
): Promise<void> {
  const port = Number(ctx.env.PORT ?? Deno.env.get('PORT') ?? '${TRIGGERS_SERVICE_PORT}');
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

  if (request.method === 'GET' && (path === '/health' || path === '/health/live')) {
    return json({ status: 'ok' });
  }
  if (request.method === 'POST' && path === '/api/v1/webhooks/inbound/generic') {
    return await withSpan(triggerTracer, 'trigger.detect', async () => {
      const payload = await readJson(request);
      const event = {
        id: crypto.randomUUID(),
        triggerId: 'generic-inbound-webhook',
        kind: 'webhook',
        status: 'completed',
        payload,
        receivedAt: new Date().toISOString(),
      };
      events.unshift(event);
      await withSpan(queueTracer, 'queue.enqueue', async (span) => {
        const traceContext = resolveTraceContextFromSpan(span);
        const bridgeUrl = new URL(
          '../../../../.netscript/generated/worker-otel-event.json',
          import.meta.url,
        );
        await Deno.mkdir(new URL('.', bridgeUrl), { recursive: true });
        await Deno.writeTextFile(
          bridgeUrl,
          JSON.stringify({
            traceparent: traceContext.traceparent,
            tracestate: traceContext.tracestate,
            eventId: event.id,
            writtenAt: new Date().toISOString(),
          }),
        );
        const workersUrl = Deno.env.get('services__workers-api__http__0') ??
          Deno.env.get('WORKERS_API_URL') ??
          'http://127.0.0.1:8091';
        await fetch(workersUrl + '/api/v1/workers/jobs/workers-plugin-health-check/trigger', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            traceparent: traceContext.traceparent,
            ...(traceContext.tracestate ? { tracestate: traceContext.tracestate } : {}),
          },
          body: JSON.stringify({ source: '${pluginName}', eventId: event.id }),
        });
      });
      return json({ accepted: true, event });
    });
  }
  if (request.method === 'GET' && path === '/api/v1/events') {
    const limit = Number(url.searchParams.get('limit') ?? '10');
    return json({
      events: events.slice(0, limit),
      total: events.length,
      limit,
    });
  }

  return json(
    { error: 'NOT_FOUND', message: 'Route not found on ${pluginName} service', path },
    { status: 404 },
  );
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
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

function generateDatabaseSchema(pluginName: string): string {
  return `/// Trigger event persistence for the ${pluginName} plugin.
model TriggerEvent {
  id            String   @id @default(uuid()) @db.Uuid
  triggerId     String   @map("trigger_id") @db.VarChar(100)
  triggerType   String   @map("trigger_type") @db.VarChar(50)
  status        String   @db.VarChar(20)
  payload       Json?
  contentHash   String?  @map("content_hash") @db.VarChar(64)
  actionResults Json?    @map("action_results")
  error         String?  @db.Text
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([triggerId])
  @@index([status])
  @@index([triggerType])
  @@map("${toSnakeCase(pluginName)}_trigger_events")
}

/// Trigger definition metadata for runtime-created triggers.
model TriggerDefinition {
  id          String   @id @db.VarChar(100)
  name        String   @db.VarChar(255)
  description String?  @db.Text
  type        String   @db.VarChar(50)
  enabled     Boolean  @default(true)
  topic       String   @default("default") @db.VarChar(100)
  tags        String[] @default([])
  source      String   @default("code") @db.VarChar(20)
  config      Json?
  metadata    Json?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([type])
  @@index([enabled])
  @@index([topic])
  @@map("${toSnakeCase(pluginName)}_trigger_definitions")
}
`;
}

function generateTriggerProcessor(pluginName: string, pascalName: string): string {
  return `import type {
  FileWatchDefinition,
  ScheduledTriggerDefinition,
} from '@netscript/plugin-triggers-core/domain';
import type {
  FileWatcherPort,
  ProcessableTriggerDefinition,
  TriggerProcessorPort,
  TriggerSchedulerPort,
} from '@netscript/plugin-triggers-core/ports';
import { load${pascalName}TriggerDefinitions } from './project-trigger-registry.ts';

export type ${pascalName}TriggerProcessorRuntimeOptions = Readonly<{
  signal?: AbortSignal;
  definitions?: readonly ProcessableTriggerDefinition[];
  processor?: TriggerProcessorPort;
  scheduler?: TriggerSchedulerPort;
  fileWatcher?: FileWatcherPort;
  drainTimeoutMs?: number;
}>;

/** Start the ${pluginName} background trigger processor runtime. */
export async function start${pascalName}TriggerProcessorRuntime(
  options: ${pascalName}TriggerProcessorRuntimeOptions = {},
): Promise<void> {
  if (options.signal?.aborted) {
    return;
  }

  const definitions = options.definitions ?? await load${pascalName}TriggerDefinitions();
  const processor = options.processor ?? createNoopTriggerProcessor();
  const scheduler = options.scheduler;
  const fileWatcher = options.fileWatcher;

  for (const definition of definitions) {
    if (scheduler && isScheduledTriggerDefinition(definition)) {
      await scheduler.schedule(definition.id, definition, async (event) => {
        await processor.process(event, definition);
      });
    } else if (fileWatcher && isFileWatchDefinition(definition)) {
      await fileWatcher.watch(definition, async (event) => {
        await processor.process(event, definition);
      });
    }
  }

  await waitForAbort(options.signal);
  await Promise.all([
    scheduler?.stop({ drainTimeoutMs: options.drainTimeoutMs }),
    fileWatcher?.stop(),
    processor.stop({ drainTimeoutMs: options.drainTimeoutMs }),
  ]);
}

if (import.meta.main) {
  const controller = new AbortController();
  Deno.addSignalListener('SIGINT', () => controller.abort());
  Deno.addSignalListener('SIGTERM', () => controller.abort());
  await start${pascalName}TriggerProcessorRuntime({ signal: controller.signal });
}

function createNoopTriggerProcessor(): TriggerProcessorPort {
  return {
    process: (event) =>
      Promise.resolve({
        event,
        status: 'completed',
        actionsDispatched: 0,
      }),
    stop: () => Promise.resolve(),
  };
}

function waitForAbort(signal: AbortSignal | undefined): Promise<void> {
  if (signal?.aborted) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    signal?.addEventListener('abort', () => resolve(), { once: true });
  });
}

function isScheduledTriggerDefinition(
  definition: ProcessableTriggerDefinition,
): definition is ScheduledTriggerDefinition<string, never, never> {
  return definition.kind === 'scheduled';
}

function isFileWatchDefinition(
  definition: ProcessableTriggerDefinition,
): definition is FileWatchDefinition<string, never, never> {
  return definition.kind === 'file-watch';
}
`;
}

function generateProjectTriggerRegistry(pluginName: string): string {
  return `import type { ProcessableTriggerDefinition } from '@netscript/plugin-triggers-core/ports';

const ${toCamelCase(pluginName)}TriggerModules = [
  new URL('../../triggers/generic-inbound-webhook.ts', import.meta.url).href,
  new URL('../../triggers/daily-maintenance.ts', import.meta.url).href,
  new URL('../../triggers/incoming-file-watch.ts', import.meta.url).href,
];

/** Load trigger definitions emitted by the ${pluginName} scaffolder. */
export async function load${toPascalCase(pluginName)}TriggerDefinitions(): Promise<
  readonly ProcessableTriggerDefinition[]
> {
  const definitions: ProcessableTriggerDefinition[] = [];
  for (const specifier of ${toCamelCase(pluginName)}TriggerModules) {
    const module = await import(specifier);
    const definition = module.default;
    if (isProcessableTriggerDefinition(definition)) {
      definitions.push(definition);
    }
  }
  return Object.freeze(definitions);
}

function isProcessableTriggerDefinition(value: unknown): value is ProcessableTriggerDefinition {
  return typeof value === 'object' && value !== null && 'kind' in value && 'id' in value;
}
`;
}

function generateRootTriggersModule(pluginName: string): string {
  return `export * from '../plugins/${pluginName}/triggers/generic-inbound-webhook.ts';
export * from '../plugins/${pluginName}/triggers/daily-maintenance.ts';
export * from '../plugins/${pluginName}/triggers/incoming-file-watch.ts';
`;
}

function generateAspireContribution(pluginName: string): string {
  return `export const ${toCamelCase(pluginName)}AspireContribution = {
  pluginName: '@netscript-app/plugin-${pluginName}',
  resources: [
    {
      name: '${pluginName}-api',
      kind: 'deno-service',
      entrypoint: 'plugins/${pluginName}/services/src/main.ts',
      port: ${TRIGGERS_SERVICE_PORT},
    },
    {
      name: '${pluginName}-processor',
      kind: 'deno-background',
      entrypoint: 'plugins/${pluginName}/src/runtime/trigger-processor.ts',
      concurrencyEnvVar: '${TRIGGERS_PROCESSOR_CONCURRENCY_ENV}',
    },
  ],
};
`;
}

function toPascalCase(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join('');
}

function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return pascal.slice(0, 1).toLowerCase() + pascal.slice(1);
}

function toSnakeCase(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}
