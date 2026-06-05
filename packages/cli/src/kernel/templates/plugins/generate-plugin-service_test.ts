/**
 * @module templates/plugins/generate-plugin-service_test
 */

import { assert, assertFalse, assertStringIncludes } from 'jsr:@std/assert@^1';

import { apiKindProvider } from '../../adapters/plugin/kinds/api.kind.ts';
import type { PluginKindProvider } from '../../domain/plugin-kind.ts';
import { generatePluginService } from './generate-plugin-service.ts';

const kvBackedProvider: PluginKindProvider = {
  kind: 'background',
  displayName: 'Background Processor',
  category: 'background-processor',
  portRangeKey: 'INFRA_PLUGIN',
  defaultPermissions: ['--allow-all'],
  watchFlag: '--watch',
  defaultEntrypoint: 'bin/combined.ts',
  defaultServiceEntrypoint: 'services/src/main.ts',
  defaultRequiresDb: false,
  defaultRequiresKv: true,
  pluginType: 'background-processor',
  supportsConcurrency: true,
  concurrencyEnvVar: 'BACKGROUND_CONCURRENCY',
  defaultConcurrency: 2,
  defaultTelemetry: true,
  infrastructureRequires: ['kv'],
  infrastructureOptionalDeps: [],
};

Deno.test('generatePluginService opts KV-backed plugin services into Redis adapter', () => {
  const output = generatePluginService(kvBackedProvider, {
    pluginName: 'background',
    kind: 'background',
    servicePort: 8091,
  });

  assertStringIncludes(output, "import '@netscript/kv/redis';");
  assertStringIncludes(output, 'NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE');
});

Deno.test('generatePluginService does not add Redis adapter import for API-only services', () => {
  const output = generatePluginService(apiKindProvider, {
    pluginName: 'api-sample',
    kind: 'api',
    servicePort: 8094,
  });

  assert(output.length > 0);
  assertFalse(output.includes("import '@netscript/kv/redis';"));
});
