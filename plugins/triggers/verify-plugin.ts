/**
 * Manifest verification for `@netscript/plugin-triggers`.
 *
 * @module
 */

import {
  type PluginVerificationResult,
  runPluginVerificationCli,
  verifyPlugin,
} from '@netscript/plugin';
import {
  TRIGGERS_API_DEFAULT_PORT,
  TRIGGERS_API_SERVICE_NAME,
  TRIGGERS_PLUGIN_ID,
  triggersPlugin,
} from './mod.ts';
import denoJson from './deno.json' with { type: 'json' };

export type { InspectionReport } from '@netscript/plugin';

/** Verify that the triggers plugin manifest exposes the expected contribution axes. */
export function verifyTriggersPlugin(): PluginVerificationResult {
  return verifyPlugin(triggersPlugin, {
    name: '@netscript/plugin-triggers',
    version: denoJson.version,
    dependencies: [
      { alias: 'workersCore', message: 'expected workersCore plugin dependency' },
      { alias: 'streamsCore', message: 'expected streamsCore plugin dependency' },
      { alias: 'sagasCore', message: 'expected sagasCore plugin dependency' },
    ],
    services: [{
      name: TRIGGERS_API_SERVICE_NAME,
      entrypoint: './services/src/main.ts',
      port: TRIGGERS_API_DEFAULT_PORT,
      message: 'expected the triggers-api service contribution',
    }],
    contractVersions: [{
      version: 'v1',
      loader: './contracts/v1/mod.ts',
      message: 'expected the triggers v1 contract contribution',
    }],
    runtimeConfigTopics: [{
      name: TRIGGERS_PLUGIN_ID,
      schemaPath: './runtime/triggers.schema.json',
      message: 'expected the triggers runtime config topic contribution',
    }],
    e2e: [{
      name: 'triggers-health',
      command: 'deno task triggers:e2e',
      message: 'expected the triggers-health E2E contribution',
    }],
    aspire: {
      module: './src/aspire/mod.ts',
      message: 'expected the triggers Aspire contribution module',
    },
  });
}

if (import.meta.main) {
  runPluginVerificationCli(verifyTriggersPlugin());
}
