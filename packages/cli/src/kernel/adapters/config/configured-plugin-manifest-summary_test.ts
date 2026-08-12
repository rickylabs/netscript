import { assertEquals } from '@std/assert';
import {
  CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION,
  parseResolvedConfiguredPluginManifestPayload,
} from './configured-plugin-manifest-summary.ts';

Deno.test('configured manifest payload parser accepts the versioned JSON-safe contract', () => {
  assertEquals(
    parseResolvedConfiguredPluginManifestPayload({
      schemaVersion: CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION,
      status: 'resolved',
      resolvedSpecifier: 'jsr:@example/plugin-workers@1.2.3',
      manifest: {
        name: '@example/plugin-workers',
        version: '1.2.3',
        permissions: ['--allow-read'],
        service: { entrypoint: './services/src/main.ts', port: 8091 },
        doctor: './src/adapter/plugin.ts',
      },
    }),
    {
      schemaVersion: CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION,
      status: 'resolved',
      resolvedSpecifier: 'jsr:@example/plugin-workers@1.2.3',
      manifest: {
        name: '@example/plugin-workers',
        version: '1.2.3',
        permissions: ['--allow-read'],
        service: { entrypoint: './services/src/main.ts', port: 8091 },
        doctor: './src/adapter/plugin.ts',
        displayName: undefined,
        type: undefined,
        cli: undefined,
      },
    },
  );
});

Deno.test('configured manifest payload parser rejects invalid envelope fields', () => {
  assertEquals(
    parseResolvedConfiguredPluginManifestPayload({
      schemaVersion: CONFIGURED_PLUGIN_PROBE_SCHEMA_VERSION,
      status: 'resolved',
      resolvedSpecifier: 'jsr:@example/plugin@1.0.0',
      manifest: { name: '@example/plugin', version: '1.0.0', permissions: '--allow-read' },
    }),
    undefined,
  );
  assertEquals(
    parseResolvedConfiguredPluginManifestPayload({
      schemaVersion: 2,
      status: 'resolved',
      resolvedSpecifier: 'jsr:@example/plugin@1.0.0',
      manifest: { name: '@example/plugin', version: '1.0.0' },
    }),
    undefined,
  );
});
