interface WorkerScaffoldArtifact {
  readonly path: string;
  readonly content: string;
}

interface WorkerScaffoldOptions {
  readonly pluginName: string;
}

const NETSCRIPT_VERSION = '0.0.1-alpha.12';
const WORKER_SERVICE_PORT = 8091;

/** Build the deterministic files emitted by the workers plugin scaffolder. */
export function buildWorkerScaffoldArtifacts(
  options: WorkerScaffoldOptions,
): readonly WorkerScaffoldArtifact[] {
  const pluginName = options.pluginName;
  const pascalName = toPascalCase(pluginName);
  const camelName = toCamelCase(pluginName);
  const pluginRoot = `plugins/${pluginName}`;

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
      '@netscript/workers': `jsr:@netscript/workers@${NETSCRIPT_VERSION}`,
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

import { createPluginService } from '@netscript/service';
import { create${pascalName}Router } from './router.ts';

type ServiceDatabaseClient = Record<string, unknown>;

const service = createPluginService({
  name: '${pluginName}-api',
  port: Number(Deno.env.get('PORT') ?? '${WORKER_SERVICE_PORT}'),
  async configure(ctx): Promise<void> {
    const dbClient: ServiceDatabaseClient = await ctx.db.getClient();
    const router = create${pascalName}Router({
      database: dbClient,
      logger: ctx.logger,
    });

    ctx.router.use('/${pluginName}', router);
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
  return `import { startWorkerRuntime } from '@netscript/workers/runtime';

const runtime = await startWorkerRuntime({
  name: '${pluginName}',
  concurrency: Number(Deno.env.get('WORKER_CONCURRENCY') ?? '2'),
  jobs: [
    new URL('../jobs/health-check.ts', import.meta.url).href,
  ],
  tasks: [
    new URL('../tasks/validate-payload.ts', import.meta.url).href,
  ],
});

Deno.addSignalListener('SIGINT', () => {
  void runtime.stop();
});

console.log('${pascalName} worker runtime started');
`;
}

function generateSampleJob(pluginName: string, pascalName: string): string {
  return `import { defineJob } from '@netscript/workers';

export const ${toCamelCase(pascalName)}HealthCheckJob = defineJob('${pluginName}.health-check')
  .withDescription('Checks that the ${pluginName} worker runtime can execute jobs.')
  .handle(async () => {
    return {
      ok: true,
      checkedAt: new Date().toISOString(),
    };
  })
  .build();
`;
}

function generateSampleTask(pascalName: string): string {
  return `import { defineTask } from '@netscript/workers';
import { z } from 'zod';

export const validate${pascalName}PayloadTask = defineTask('validate-${
    toKebabCase(pascalName)
  }-payload')
  .input(z.object({ id: z.string().min(1) }))
  .handle(async ({ input }) => {
    return { id: input.id, valid: true };
  })
  .build();
`;
}

function toPascalCase(value: string): string {
  return value
    .split(/[^A-Za-z0-9]+/)
    .filter((part) => part.length > 0)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join('') || 'Workers';
}

function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return `${pascal.charAt(0).toLowerCase()}${pascal.slice(1)}`;
}

function toKebabCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function toSnakeCase(value: string): string {
  return toKebabCase(value).replaceAll('-', '_');
}
