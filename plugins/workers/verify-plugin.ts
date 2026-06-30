/**
 * Manifest verification for `@netscript/plugin-workers`.
 *
 * @module
 */

import {
  type PluginVerificationResult,
  runPluginVerificationCli,
  verifyPlugin,
} from '@netscript/plugin';
import { workersPlugin } from './mod.ts';
import denoJson from './deno.json' with { type: 'json' };

/** Verify that the workers plugin manifest exposes the expected contribution axes. */
export function verifyWorkersPlugin(): PluginVerificationResult {
  return verifyPlugin(workersPlugin, {
    name: '@netscript/plugin-workers',
    version: denoJson.version,
    dependencies: [{ alias: 'streams', message: 'expected streams plugin dependency' }],
    services: [{
      name: 'workers-api',
      message: 'expected a workers-api service contribution',
    }],
    backgroundProcessors: [
      {
        name: 'workers-combined',
        message: 'expected workers-combined background processor contribution',
      },
      {
        name: 'workers-worker',
        message: 'expected workers-worker background processor contribution',
      },
      {
        name: 'workers-scheduler',
        message: 'expected workers-scheduler background processor contribution',
      },
    ],
    streamTopics: [
      { name: 'workers.jobs', message: 'expected workers.jobs stream topic contribution' },
      { name: 'workers.tasks', message: 'expected workers.tasks stream topic contribution' },
      {
        name: 'workers.workflows',
        message: 'expected workers.workflows stream topic contribution',
      },
    ],
    databaseSchemas: [{
      path: './database/workers.prisma',
      engine: 'postgres',
      message: 'expected the workers Prisma database schema contribution',
    }],
    contractVersions: [{
      version: 'v1',
      loader: './contracts/v1/mod.ts',
      message: 'expected the workers v1 contract contribution',
    }],
    runtimeConfigTopics: [{
      name: 'workers',
      message: 'expected the workers runtime config topic contribution',
    }],
    e2e: [{
      name: 'workers-health',
      command: 'deno task workers:e2e',
      message: 'expected the workers-health E2E contribution',
    }],
    aspire: {
      module: './src/aspire/mod.ts',
      message: 'expected the workers Aspire contribution module',
    },
  });
}

if (import.meta.main) {
  runPluginVerificationCli(verifyWorkersPlugin());
}
