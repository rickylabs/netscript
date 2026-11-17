/**
 * @module templates/plugins/generate-plugin-service_test
 */

import { assert, assertFalse, assertStringIncludes } from 'jsr:@std/assert@^1';

import { apiKindProvider } from '../../adapters/plugin/kinds/api.kind.ts';
import type { PluginKindProvider } from '../../domain/plugin-kind.ts';
import { DEFAULT_TEMPLATE_REGISTRY } from '../../application/registries/template-registry.ts';
import { netscriptJsrSpecifier } from '../../constants/jsr-specifiers.ts';
import {
  generatePluginProcessorEntrypoint,
  generatePluginService,
} from './generate-plugin-service.ts';
import { generatePluginServiceContext } from './generate-plugin-service-context.ts';

// `generatePluginService` reads templates synchronously, which requires a
// previously-awaited registry hydration. Tests exercise the generator directly
// (outside the CLI dispatch path), so hydrate at module load.
await DEFAULT_TEMPLATE_REGISTRY.hydrate();

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
    servicePort: 9181,
  });

  assertStringIncludes(output, "import '@netscript/kv/redis';");
  assertStringIncludes(output, 'NETSCRIPT_PLUGIN_SERVICE_BOOTSTRAP_MODULE');
});

Deno.test('generatePluginService does not add Redis adapter import for API-only services', () => {
  const output = generatePluginService(apiKindProvider, {
    pluginName: 'api-sample',
    kind: 'api',
    servicePort: 9184,
  });

  assert(output.length > 0);
  assertFalse(output.includes("import '@netscript/kv/redis';"));
});

Deno.test('generatePluginProcessorEntrypoint carries the selected KV adapter', () => {
  const output = generatePluginProcessorEntrypoint(kvBackedProvider, {
    pluginName: 'background',
    kind: 'background',
    servicePort: 9181,
  });

  assertStringIncludes(output, "import '@netscript/kv/redis';");
});

Deno.test('generatePluginServiceContext emits package-resident safe imports', () => {
  const output = generatePluginServiceContext();

  assertStringIncludes(output, "from '@netscript/plugin/sdk'");
  assertStringIncludes(output, "from '@netscript/kv'");
  assertStringIncludes(
    output,
    'createPluginServiceContext as createHostPluginServiceContext',
  );
  assertFalse(output.includes(netscriptJsrSpecifier('plugin', '/loader')));
  assertFalse(output.includes('../../contracts/versions/v1/mod.ts'));
  assertStringIncludes(output, 'export function createPluginServiceContext(');
  assertStringIncludes(output, 'return createHostPluginServiceContext(pluginName, {');
  assertStringIncludes(output, 'getDatabaseClient,');
  assertStringIncludes(output, 'getKv,');
  assertFalse(output.includes("from '@netscript/plugin/loader'"));
  assertFalse(output.includes("from '@netscript/contracts'"));
  assertFalse(output.includes('return Promise.resolve({'));
  assertFalse(output.includes('export async function createPluginServiceContext('));
});

for (const acquire of [false, true]) {
  Deno.test(`generated host disposal closes acquired clients once (acquire=${acquire})`, async () => {
    const fakeDatabase = `
      export let requests = 0;
      export let disconnects = 0;
      const first = { async $disconnect() { disconnects++; } };
      const second = { async $disconnect() { disconnects++; } };
      export const db = { async getClient() { requests++; return { first, alias: first, second }; } };
    `;
    const databaseUrl = `data:application/typescript,${encodeURIComponent(fakeDatabase)}`;
    const source = generatePluginServiceContext().replace(
      "'../../database/mod.ts'",
      JSON.stringify(databaseUrl),
    ) + `
      const probe = await createPluginServiceContext('cleanup-probe');
      const state = await import(${JSON.stringify(databaseUrl)});
      if (state.requests !== 0) throw new Error('eager database resolution');
      if (${acquire}) { await probe.db.getClient(); await probe.db.getClient(); }
      if (!probe.dispose) throw new Error('missing owner disposal');
      await probe.dispose(); await probe.dispose();
      if (state.requests !== ${acquire ? 1 : 0} || state.disconnects !== ${acquire ? 2 : 0}) {
        throw new Error('client acquisition or disposal was not deduplicated');
      }
    `;
    const result = await new Deno.Command(Deno.execPath(), {
      args: ['eval', '--unstable-kv', source],
      stdout: 'piped',
      stderr: 'piped',
    }).output();
    assert(result.success, new TextDecoder().decode(result.stderr));
  });
}
