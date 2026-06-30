/**
 * Manifest verification for `@netscript/plugin-sagas`.
 *
 * @module
 */

import {
  type PluginVerificationResult,
  runPluginVerificationCli,
  verifyPlugin,
} from '@netscript/plugin';
import { sagasPlugin } from './mod.ts';
import denoJson from './deno.json' with { type: 'json' };

export type { InspectionReport } from '@netscript/plugin';

/** Verify that the sagas plugin manifest exposes the expected contribution axes. */
export function verifySagasPlugin(): PluginVerificationResult {
  return verifyPlugin(sagasPlugin, {
    name: '@netscript/plugin-sagas',
    version: denoJson.version,
    dependencies: [
      { alias: 'workers', message: 'expected workers plugin dependency' },
      { alias: 'streams', message: 'expected streams plugin dependency' },
    ],
    services: [{ name: 'sagas-api', message: 'expected a sagas-api service contribution' }],
    databaseSchemas: [{
      path: './database/sagas.prisma',
      engine: 'postgres',
      message: 'expected the sagas Prisma database schema contribution',
    }],
    contractVersions: [{
      version: 'v1',
      loader: './contracts/v1/mod.ts',
      message: 'expected the sagas v1 contract contribution',
    }],
    runtimeConfigTopics: [{
      name: 'sagas',
      message: 'expected the sagas runtime config topic contribution',
    }],
    aspire: {
      module: './src/aspire/mod.ts',
      message: 'expected the sagas Aspire contribution module',
    },
  });
}

if (import.meta.main) {
  runPluginVerificationCli(verifySagasPlugin());
}
