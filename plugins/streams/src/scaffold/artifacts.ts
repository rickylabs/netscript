interface StreamsScaffoldArtifact {
  readonly path: string;
  readonly content: string;
}

interface StreamsScaffoldOptions {
  readonly pluginName: string;
}

const NETSCRIPT_VERSION = '0.0.1-alpha.12';
const STREAMS_SERVICE_PORT = 4437;

/** Build the deterministic files emitted by the streams plugin scaffolder. */
export function buildStreamsScaffoldArtifacts(
  options: StreamsScaffoldOptions,
): readonly StreamsScaffoldArtifact[] {
  const pluginName = options.pluginName;
  const pascalName = toPascalCase(pluginName);
  const camelName = toCamelCase(pluginName);
  const pluginRoot = `plugins/${pluginName}`;

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
      content: generateServiceMain(),
    },
    {
      path: `${pluginRoot}/services/src/routes.ts`,
      content: generateServiceRoutes(pluginName, pascalName),
    },
    {
      path: `${pluginRoot}/src/streams/mod.ts`,
      content: generateStreamsModule(pluginName, pascalName, camelName),
    },
    {
      path: `${pluginRoot}/src/aspire/mod.ts`,
      content: generateAspireContribution(pluginName),
    },
    {
      path: `${pluginRoot}/src/e2e/mod.ts`,
      content: generateE2eModule(pluginName),
    },
  ];
}

function generateScaffoldPluginJson(): string {
  const manifest = {
    schemaVersion: 1,
    name: '@netscript/plugin-streams',
    version: NETSCRIPT_VERSION,
    displayName: 'Durable Streams',
    description: 'Durable Streams service, CLI, Aspire, E2E, and scaffolding plugin for NetScript.',
    peerDependencies: {
      '@netscript/plugin': NETSCRIPT_VERSION,
    },
    capabilities: {
      hasDatabaseMigrations: false,
      hasRoutes: true,
      hasBackgroundWorkers: false,
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
      kind: 'stream',
      displayName: 'Durable Streams',
      category: 'plugin',
      portRangeKey: 'PLUGIN_API',
      defaultPermissions: [
        '--allow-net',
        '--allow-env',
        '--allow-read',
        '--allow-write',
        '--allow-sys',
        '--allow-ffi',
      ],
      watchFlag: '--watch',
      defaultEntrypoint: 'services/src/main.ts',
      defaultServiceEntrypoint: 'services/src/main.ts',
      defaultRequiresDb: false,
      defaultRequiresKv: false,
      pluginType: 'utility',
      supportsConcurrency: false,
      concurrencyEnvVar: null,
      defaultConcurrency: null,
      defaultTelemetry: true,
      infrastructureRequires: [],
      infrastructureOptionalDeps: [],
    },
    officialSource: {
      canonicalName: 'streams',
      pluginDir: 'streams',
      serviceEntrypoint: 'services/src/main.ts',
      serviceConfigKey: 'streams',
      servicePort: STREAMS_SERVICE_PORT,
      backgroundPort: STREAMS_SERVICE_PORT,
      requiresDb: false,
      requiresKv: false,
      permissions: [
        '--allow-net',
        '--allow-env',
        '--allow-read',
        '--allow-write',
        '--allow-sys',
        '--allow-ffi',
      ],
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
      './services': './services/src/main.ts',
      './streams': './src/streams/mod.ts',
      './aspire': './src/aspire/mod.ts',
      './e2e': './src/e2e/mod.ts',
    },
    tasks: {
      check:
        'deno check --unstable-kv mod.ts services/src/main.ts services/src/routes.ts src/streams/mod.ts src/aspire/mod.ts src/e2e/mod.ts',
      dev:
        'deno run --allow-net --allow-env --allow-read --allow-write --allow-sys --allow-ffi --watch services/src/main.ts',
      start:
        'deno run --allow-net --allow-env --allow-read --allow-write --allow-sys --allow-ffi services/src/main.ts',
      'streams:e2e': 'deno run --allow-net --allow-env src/e2e/mod.ts',
      test: 'deno test --allow-all',
    },
    imports: {
      '@durable-streams/client': 'npm:@durable-streams/client@^0.2.6',
      '@durable-streams/server': 'npm:@durable-streams/server@^0.3.7',
      '@netscript/aspire': `jsr:@netscript/aspire@${NETSCRIPT_VERSION}`,
      '@netscript/plugin': `jsr:@netscript/plugin@${NETSCRIPT_VERSION}`,
      '@netscript/plugin-streams-core': `jsr:@netscript/plugin-streams-core@${NETSCRIPT_VERSION}`,
      '@netscript/service': `jsr:@netscript/service@${NETSCRIPT_VERSION}`,
      '@std/net': 'jsr:@std/net@^1',
      hono: 'jsr:@hono/hono@4.12.24',
      'hono/cors': 'jsr:@hono/hono@4.12.24/cors',
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
 * ${pascalName} durable streams plugin manifest.
 */

import { definePlugin } from '@netscript/plugin';
import { define${pascalName}Stream } from './src/streams/mod.ts';

const STREAMS_SERVICE_PERMISSIONS = [
  '--allow-net',
  '--allow-env',
  '--allow-read',
  '--allow-write',
  '--allow-sys',
  '--allow-ffi',
];

export const ${pascalName}Plugin = definePlugin('${pluginName}', '0.1.0')
  .withDisplayName('${pascalName}')
  .withType('utility')
  .withDescription('Durable Streams service and stream topic wiring.')
  .withPermissions(STREAMS_SERVICE_PERMISSIONS)
  .withService({
    name: '${pluginName}',
    entrypoint: './services/src/main.ts',
    port: ${STREAMS_SERVICE_PORT},
  })
  .withTelemetry([{
    name: '${pluginName}',
    module: '@netscript/plugin-streams-core/telemetry',
  }])
  .withE2e([{
    name: '${pluginName}-health',
    command: 'deno task streams:e2e',
  }])
  .withAspire('./src/aspire/mod.ts')
  .withHooks({
    setup: (ctx): void => {
      ctx.logger.info('${pluginName} plugin loaded');
    },
    teardown: (ctx): void => {
      ctx.logger.info('${pluginName} plugin unloaded');
    },
  })
  .build();

export { define${pascalName}Stream };
`;
}

function generateServiceMain(): string {
  return `import { createStreamsApp } from './routes.ts';

const app = await createStreamsApp();
const port = Number.parseInt(
  Deno.env.get('PORT') ?? Deno.env.get('STREAMS_PORT') ?? '${STREAMS_SERVICE_PORT}',
  10,
);
const server = Deno.serve({ port, hostname: '0.0.0.0' }, app.fetch);

Deno.addSignalListener('SIGINT', () => {
  void server.shutdown();
});
Deno.addSignalListener('SIGTERM', () => {
  void server.shutdown();
});
`;
}

function generateServiceRoutes(pluginName: string, pascalName: string): string {
  return `import { type Context, Hono } from 'hono';
import { cors } from 'hono/cors';
import { getAvailablePort } from '@std/net';
import {
  createHealthHandler,
  createLivenessHandler,
  createReadinessHandler,
  healthChecks,
} from '@netscript/service';
import { DurableStreamTestServer } from '@durable-streams/server';

/** Create the ${pascalName} Durable Streams HTTP app. */
export async function createStreamsApp(): Promise<Hono> {
  const dataDir = Deno.env.get('STREAMS_DATA_DIR');
  const internalPortOverride = Deno.env.get('STREAMS_INTERNAL_PORT');
  const preferredPort = internalPortOverride ? Number.parseInt(internalPortOverride, 10) : undefined;
  const internalPort = await getAvailablePort({ preferredPort });
  const durableServer = new DurableStreamTestServer({
    port: internalPort,
    host: '127.0.0.1',
    dataDir,
  });
  await durableServer.start();

  const upstreamCheck = healthChecks.custom('durable-streams-server', async () => {
    const response = await fetch(\`http://127.0.0.1:\${internalPort}/\`);
    return response.status < 500;
  });

  const app = new Hono();
  app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'Stream-Seq',
      'Stream-TTL',
      'Stream-Expires-At',
      'Stream-Closed',
      'Producer-Id',
      'Producer-Epoch',
      'Producer-Seq',
    ],
    exposeHeaders: [
      'Stream-Next-Offset',
      'Stream-Cursor',
      'Stream-Up-To-Date',
      'Stream-Closed',
      'Producer-Epoch',
      'Producer-Seq',
      'Producer-Expected-Seq',
      'Producer-Received-Seq',
      'etag',
      'content-type',
      'content-encoding',
      'vary',
    ],
  }));

  app.get('/health', createHealthHandler({
    version: '0.1.0',
    checks: [upstreamCheck],
  }));
  app.get('/health/live', createLivenessHandler());
  app.get('/health/ready', createReadinessHandler([async () => {
    try {
      const response = await fetch(\`http://127.0.0.1:\${internalPort}/\`);
      return response.status < 500;
    } catch {
      return false;
    }
  }]));
  app.all('/*', async (ctx: Context) => {
    const url = new URL(ctx.req.url);
    const target = \`http://127.0.0.1:\${internalPort}\${url.pathname}\${url.search}\`;
    try {
      const request = new Request(target, {
        method: ctx.req.method,
        headers: ctx.req.raw.headers,
        body: ctx.req.raw.body,
      });
      return await fetch(request);
    } catch {
      return ctx.json({ error: '${pluginName} upstream unavailable' }, 502);
    }
  });

  return app;
}
`;
}

function generateStreamsModule(pluginName: string, pascalName: string, camelName: string): string {
  return `import { createDurableStream, defineStreamSchema } from '@netscript/plugin-streams-core';
import { z } from 'zod';

export const ${camelName}EventSchema = defineStreamSchema({
  event: {
    type: '${pluginName}.event',
    primaryKey: 'id',
    schema: z.object({
      id: z.string(),
      type: z.string(),
      payload: z.record(z.string(), z.unknown()),
    }),
  },
});

/** Create the default ${pascalName} durable event stream wiring. */
export function define${pascalName}Stream() {
  return createDurableStream({
    streamPath: '/v1/streams/${pluginName}/events',
    schema: ${camelName}EventSchema,
    producerId: '${pluginName}-producer',
  });
}
`;
}

function generateAspireContribution(pluginName: string): string {
  return `import { AspireNSPluginContribution } from '@netscript/aspire/public';
import type {
  AspireBuilder,
  AspireResource,
  ContributionContext,
  EnvSource,
  HealthCheckSpec,
} from '@netscript/aspire/public';

/** Aspire contribution for the ${pluginName} Durable Streams service. */
export class StreamsAspireContribution extends AspireNSPluginContribution {
  readonly pluginName = '@netscript-app/plugin-${pluginName}';

  contribute(builder: AspireBuilder, ctx: ContributionContext): readonly AspireResource[] {
    const service = builder.addDenoService('${pluginName}', {
      workdir: ctx.projectRoot,
      entrypoint: 'plugins/${pluginName}/services/src/main.ts',
      port: ctx.port('${pluginName}', ${STREAMS_SERVICE_PORT}),
      permissions: [
        '--allow-net',
        '--allow-env',
        '--allow-read',
        '--allow-write',
        '--allow-sys',
        '--allow-ffi',
      ],
      env: {
        STREAMS_PLUGIN_VERSION: '0.1.0',
      },
    });
    return [service];
  }

  override declareEnv(_ctx: ContributionContext): Record<string, EnvSource | string> {
    return {
      DURABLE_STREAMS_URL: 'http://localhost:${STREAMS_SERVICE_PORT}',
    };
  }

  override declareHealthChecks(_ctx: ContributionContext): readonly HealthCheckSpec[] {
    return [{
      resource: '${pluginName}',
      url: 'http://localhost:${STREAMS_SERVICE_PORT}/health',
      expect: 200,
      timeoutMs: 3000,
    }];
  }
}
`;
}

function generateE2eModule(pluginName: string): string {
  return `const baseUrl = Deno.env.get('DURABLE_STREAMS_URL') ?? 'http://localhost:${STREAMS_SERVICE_PORT}';
const response = await fetch(\`\${baseUrl}/health\`);

if (!response.ok) {
  throw new Error('${pluginName} streams health check failed.');
}
`;
}

function toPascalCase(value: string): string {
  return value
    .split(/[-_]/)
    .filter((part) => part.length > 0)
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join('');
}

function toCamelCase(value: string): string {
  const pascal = toPascalCase(value);
  return `${pascal[0]?.toLowerCase() ?? ''}${pascal.slice(1)}`;
}
