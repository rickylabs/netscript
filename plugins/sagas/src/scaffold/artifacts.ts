import { SagaConfigScaffolder, SagaDefinitionScaffolder } from '../scaffolding/saga-scaffolders.ts';

interface SagasScaffoldArtifact {
  readonly path: string;
  readonly content: string;
}

interface SagasScaffoldOptions {
  readonly pluginName: string;
}

const NETSCRIPT_VERSION = '0.0.1-alpha.12';
const SAGAS_SERVICE_PORT = 8092;
const SAMPLE_SAGA_ID = 'user-registration';

/** Build the deterministic files emitted by the sagas plugin scaffolder. */
export async function buildSagasScaffoldArtifacts(
  options: SagasScaffoldOptions,
): Promise<readonly SagasScaffoldArtifact[]> {
  const pluginName = options.pluginName;
  const pascalName = toPascalCase(pluginName);
  const camelName = toCamelCase(pluginName);
  const pluginRoot = `plugins/${pluginName}`;
  const sagaDefinition = await new SagaDefinitionScaffolder().generate({
    id: SAMPLE_SAGA_ID,
    directory: 'sagas',
    messageType: 'user.registered',
    description: 'Registers a user through the default saga workflow.',
    topic: 'users',
    tags: ['sample', 'users'],
  });
  const sagaConfig = await new SagaConfigScaffolder().generate({
    id: SAMPLE_SAGA_ID,
    directory: 'sagas',
    messageType: 'user.registered',
    description: 'Registers a user through the default saga workflow.',
    topic: 'users',
    tags: ['sample', 'users'],
  });

  return [
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
      path: `${pluginRoot}/services/src/init.ts`,
      content: generateServiceInit(),
    },
    {
      path: `${pluginRoot}/contracts/v1/mod.ts`,
      content: generateContracts(pluginName, pascalName, camelName),
    },
    {
      path: `${pluginRoot}/database/sagas.prisma`,
      content: generateDatabaseSchema(),
    },
    {
      path: `${pluginRoot}/src/runtime/saga-runner.ts`,
      content: generateSagaRunner(),
    },
    {
      path: `${pluginRoot}/src/aspire/mod.ts`,
      content: generateAspireContribution(pluginName),
    },
    {
      path: `${pluginRoot}/sagas/user-registration-saga.ts`,
      content: sagaDefinition,
    },
    {
      path: `${pluginRoot}/sagas/user-registration.config.ts`,
      content: sagaConfig,
    },
  ];
}

function generateDenoJson(pluginName: string): string {
  const config = {
    name: `@netscript-app/plugin-${pluginName}`,
    version: '0.1.0',
    exports: {
      '.': './mod.ts',
      './contracts': './contracts/v1/mod.ts',
      './services': './services/src/main.ts',
      './runtime': './src/runtime/saga-runner.ts',
      './aspire': './src/aspire/mod.ts',
    },
    tasks: {
      check:
        'deno check --unstable-kv mod.ts services/src/main.ts contracts/v1/mod.ts src/runtime/saga-runner.ts src/aspire/mod.ts sagas/**/*.ts',
      dev:
        'deno run --unstable-kv --allow-net --allow-env --allow-read --allow-write --watch services/src/main.ts',
      start:
        'deno run --unstable-kv --allow-net --allow-env --allow-read --allow-write services/src/main.ts',
      'run:sagas': 'deno run --unstable-kv --allow-env --allow-read src/runtime/saga-runner.ts',
      test: 'deno test --allow-all',
    },
    imports: {
      '@netscript/plugin': `jsr:@netscript/plugin@${NETSCRIPT_VERSION}`,
      '@netscript/service': `jsr:@netscript/service@${NETSCRIPT_VERSION}`,
      '@netscript/contracts': `jsr:@netscript/contracts@${NETSCRIPT_VERSION}`,
      '@netscript/kv': `jsr:@netscript/kv@${NETSCRIPT_VERSION}`,
      '@netscript/plugin-sagas-core': `jsr:@netscript/plugin-sagas-core@${NETSCRIPT_VERSION}`,
      '@netscript/plugin-sagas-core/domain':
        `jsr:@netscript/plugin-sagas-core@${NETSCRIPT_VERSION}/domain`,
      '@netscript/plugin-sagas-core/runtime':
        `jsr:@netscript/plugin-sagas-core@${NETSCRIPT_VERSION}/runtime`,
      '@netscript/plugin-sagas-core/config':
        `jsr:@netscript/plugin-sagas-core@${NETSCRIPT_VERSION}/config`,
      '@orpc/server': 'npm:@orpc/server@^1.14.6',
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
  .withDescription('Durable saga orchestration plugin')
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
    port: ${SAGAS_SERVICE_PORT},
  })
  .withBackgroundProcessor({
    name: '${pluginName}',
    entrypoint: './src/runtime/saga-runner.ts',
    concurrency: 2,
  })
  .withDbSchemas([{ path: './database/sagas.prisma', engine: 'postgres' }])
  .withContractVersions([{ version: 'v1', loader: './contracts/v1/mod.ts' }])
  .withRuntimeConfigTopics([{ name: '${pluginName}', schemaPath: './runtime/sagas.schema.json' }])
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

import { createPluginService } from '@netscript/service';
import { create${pascalName}Router } from './router.ts';
import { registerSagas } from './init.ts';

type ServiceDatabaseClient = Record<string, unknown>;

const service = createPluginService({
  name: '${pluginName}-api',
  port: Number(Deno.env.get('PORT') ?? '${SAGAS_SERVICE_PORT}'),
  async configure(ctx): Promise<void> {
    const database: ServiceDatabaseClient = await ctx.db.getClient();
    await registerSagas();
    ctx.router.use('/${pluginName}', create${pascalName}Router({
      database,
      logger: ctx.logger,
    }));
  },
});

await service.start();
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

function generateServiceInit(): string {
  return `import type { SagaDefinition } from '@netscript/plugin-sagas-core/domain';

const SAMPLE_SAGA_MODULES = [
  new URL('../../sagas/user-registration-saga.ts', import.meta.url).href,
] as const;

/** Load and register saga definitions for the API service. */
export async function registerSagas(): Promise<readonly SagaDefinition[]> {
  const definitions: SagaDefinition[] = [];
  for (const specifier of SAMPLE_SAGA_MODULES) {
    const module = await import(specifier);
    const definition = module.default ?? module.userRegistrationSaga;
    if (isSagaDefinition(definition)) {
      definitions.push(definition);
    }
  }
  return Object.freeze(definitions);
}

function isSagaDefinition(value: unknown): value is SagaDefinition {
  return typeof value === 'object' && value !== null && 'id' in value;
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

function generateDatabaseSchema(): string {
  return `/// Durable saga runtime state keyed by saga instance id.
model SagaRuntimeState {
  instanceId String   @id @map("instance_id") @db.VarChar(200)
  sagaId     String   @map("saga_id") @db.VarChar(100)
  version    Int
  envelope   Json
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@index([sagaId])
  @@index([updatedAt])
  @@map("saga_runtime_state")
}

/// Durable saga transition history keyed by instance id and version.
model SagaRuntimeTransition {
  instanceId String   @map("instance_id") @db.VarChar(200)
  version    Int
  record     Json
  createdAt  DateTime @default(now()) @map("created_at")

  @@id([instanceId, version], name: "saga_runtime_transition_instance_version")
  @@index([instanceId])
  @@map("saga_runtime_transition")
}

/// Durable saga correlation index for O(1) instance lookup.
model SagaRuntimeCorrelation {
  id             String   @id @default(uuid()) @db.Uuid
  sagaId         String   @map("saga_id") @db.VarChar(100)
  correlationKey String   @map("correlation_key") @db.VarChar(200)
  instanceId     String   @map("instance_id") @db.VarChar(200)
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@unique([sagaId, correlationKey], name: "saga_runtime_correlation_saga_key")
  @@index([instanceId])
  @@map("saga_runtime_correlation")
}

/// Saga instance read model projected for API queries.
model SagaInstance {
  id            String   @db.VarChar(100)
  sagaName      String   @map("saga_name") @db.VarChar(100)
  correlationId String   @map("correlation_id") @db.VarChar(100)
  version       Int      @default(1)
  isCompleted   Boolean  @default(false) @map("is_completed")
  state         Json
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@id([sagaName, id], name: "sagaName_id")
  @@index([sagaName, correlationId])
  @@index([sagaName, isCompleted])
  @@index([updatedAt])
  @@map("saga_instances")
}

/// Saga definition metadata for registered code-defined sagas.
model SagaDefinition {
  name         String   @id @db.VarChar(100)
  displayName  String   @map("display_name") @db.VarChar(255)
  description  String?  @db.Text
  groupName    String?  @map("group_name") @db.VarChar(100)
  source       String   @default("code") @db.VarChar(20)
  pluginId     String?  @map("plugin_id") @db.VarChar(100)
  handledTypes Json?    @map("handled_types")
  initialState Json?    @map("initial_state")
  enabled      Boolean  @default(true)
  tags         String[] @default([])
  metadata     Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([source])
  @@index([groupName])
  @@index([enabled])
  @@index([tags])
  @@map("saga_definitions")
}

/// Saga execution history archived for diagnostics.
model SagaExecutionHistory {
  id             String   @id @default(uuid()) @db.Uuid
  sagaName       String   @map("saga_name") @db.VarChar(100)
  sagaId         String   @map("saga_id") @db.VarChar(100)
  correlationId  String   @map("correlation_id") @db.VarChar(100)
  messageType    String   @map("message_type") @db.VarChar(100)
  messageId      String?  @map("message_id") @db.VarChar(100)
  previousState  Json?    @map("previous_state")
  newState       Json     @map("new_state")
  outcome        String   @db.VarChar(20)
  error          String?  @db.Text
  duration       Int?
  transitionAt   DateTime @default(now()) @map("transition_at")

  @@index([sagaName, sagaId])
  @@index([sagaName, correlationId])
  @@index([transitionAt])
  @@index([outcome])
  @@map("saga_execution_history")
}
`;
}

function generateSagaRunner(): string {
  return `import type { SagaDefinition } from '@netscript/plugin-sagas-core/domain';
import { createSagaRuntime } from '@netscript/plugin-sagas-core/runtime';

const SAGA_MODULES = [
  new URL('../../sagas/user-registration-saga.ts', import.meta.url).href,
] as const;

const runtime = createSagaRuntime({
  name: 'sagas',
  concurrency: Number(Deno.env.get('SAGA_CONCURRENCY') ?? '2'),
});

for (const definition of await loadSagaDefinitions()) {
  await runtime.register(definition);
}

await runtime.start();

Deno.addSignalListener('SIGINT', () => {
  void runtime.stop('signal:SIGINT');
});

async function loadSagaDefinitions(): Promise<readonly SagaDefinition[]> {
  const definitions: SagaDefinition[] = [];
  for (const specifier of SAGA_MODULES) {
    const module = await import(specifier);
    const definition = module.default ?? module.userRegistrationSaga;
    if (isSagaDefinition(definition)) {
      definitions.push(definition);
    }
  }
  return Object.freeze(definitions);
}

function isSagaDefinition(value: unknown): value is SagaDefinition {
  return typeof value === 'object' && value !== null && 'id' in value;
}
`;
}

function generateAspireContribution(pluginName: string): string {
  return `const SAGAS_API_SERVICE_NAME = '${pluginName}-api';
const SAGAS_API_DEFAULT_PORT = ${SAGAS_SERVICE_PORT};

interface SagasAspireBuilder {
  addDenoService(name: string, spec: Record<string, unknown>): unknown;
  addDenoBackground(name: string, spec: Record<string, unknown>): unknown;
}

interface SagasContributionContext {
  readonly projectRoot: string;
  readonly port: (key: string, fallback?: number) => number;
}

/** Aspire contribution for the ${pluginName} plugin. */
export class SagasAspireContribution {
  readonly pluginName = '@netscript-app/plugin-${pluginName}';

  contribute(builder: SagasAspireBuilder, ctx: SagasContributionContext): readonly unknown[] {
    const api = builder.addDenoService(SAGAS_API_SERVICE_NAME, {
      workdir: ctx.projectRoot,
      entrypoint: 'plugins/${pluginName}/services/src/main.ts',
      port: ctx.port(SAGAS_API_SERVICE_NAME, SAGAS_API_DEFAULT_PORT),
      permissions: ['--unstable-kv', '--allow-net', '--allow-env', '--allow-read', '--allow-write'],
    });
    const runner = builder.addDenoBackground('${pluginName}-runner', {
      workdir: ctx.projectRoot,
      entrypoint: 'plugins/${pluginName}/src/runtime/saga-runner.ts',
      permissions: ['--unstable-kv', '--allow-env', '--allow-read'],
      concurrencyEnvVar: 'SAGA_CONCURRENCY',
      watchMode: true,
    });
    return [api, runner];
  }
}
`;
}

function toPascalCase(value: string): string {
  return value
    .split(/[^A-Za-z0-9]+/)
    .filter((part) => part.length > 0)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join('') || 'Sagas';
}

function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}`;
}
