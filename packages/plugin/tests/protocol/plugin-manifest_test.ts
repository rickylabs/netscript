import { assertEquals, assertStringIncludes } from '@std/assert';
import { parsePluginManifest, PLUGIN_MANIFEST_SCHEMA_VERSION } from '../../src/protocol/mod.ts';

const shippedManifestPaths = [
  '../../../../plugins/ai/scaffold.plugin.json',
  '../../../../plugins/auth/scaffold.plugin.json',
  '../../../../plugins/sagas/scaffold.plugin.json',
  '../../../../plugins/streams/scaffold.plugin.json',
  '../../../../plugins/triggers/scaffold.plugin.json',
  '../../../../plugins/workers/scaffold.plugin.json',
];

const ATOMIC_SERVICE_SHAPE_ERROR = 'PLUGIN_OFFICIAL_SOURCE_SERVICE_SHAPE_INCOMPLETE';

function serviceShapeManifest(fields: {
  readonly providerEntrypoint: boolean;
  readonly sourceEntrypoint: boolean;
  readonly sourceConfigKey: boolean;
  readonly sourcePort: boolean;
  readonly includeOfficialSource?: boolean;
}) {
  return {
    schemaVersion: PLUGIN_MANIFEST_SCHEMA_VERSION,
    name: '@acme/service-shape',
    version: '1.0.0',
    displayName: 'Service shape',
    description: 'Fixture manifest for the atomic service shape.',
    peerDependencies: {},
    capabilities: {
      hasDatabaseMigrations: false,
      hasRoutes: false,
      hasBackgroundWorkers: false,
    },
    scaffolder: {
      export: './scaffold',
      requiredPermissions: { net: [], read: [], write: [] },
    },
    provider: {
      kind: 'shape',
      displayName: 'Service shape',
      category: 'plugin',
      portRangeKey: 'PLUGIN_API',
      defaultPermissions: [],
      defaultEntrypoint: 'runtime.ts',
      ...(fields.providerEntrypoint ? { defaultServiceEntrypoint: 'services/main.ts' } : {}),
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
    ...(fields.includeOfficialSource === false ? {} : {
      officialSource: {
        canonicalName: 'shape',
        ...(fields.sourceEntrypoint ? { serviceEntrypoint: 'services/main.ts' } : {}),
        ...(fields.sourceConfigKey ? { serviceConfigKey: 'shape' } : {}),
        ...(fields.sourcePort ? { servicePort: 8123 } : {}),
        backgroundPort: 8124,
      },
    }),
  };
}

Deno.test('parsePluginManifest accepts a known-good installer manifest', () => {
  const result = parsePluginManifest({
    schemaVersion: PLUGIN_MANIFEST_SCHEMA_VERSION,
    name: '@netscript/plugin-workers',
    version: '0.0.1-alpha.12',
    displayName: 'Background Worker',
    description: 'NetScript plugin for background job scheduling.',
    peerDependencies: {
      '@netscript/plugin': '0.0.1-alpha.12',
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
  });

  assertEquals(result.ok, true);
  if (!result.ok) return;

  assertEquals(result.manifest.name, '@netscript/plugin-workers');
  assertEquals(result.manifest.scaffolder.export, './scaffold');
});

Deno.test('parsePluginManifest accepts third-party linking without officialSource', () => {
  const result = parsePluginManifest({
    schemaVersion: PLUGIN_MANIFEST_SCHEMA_VERSION,
    name: '@acme/deploy-events',
    version: '1.0.0',
    displayName: 'Deploy events',
    description: 'Fixture third-party plugin for declared host linking.',
    peerDependencies: {},
    capabilities: {
      hasDatabaseMigrations: false,
      hasRoutes: true,
      hasBackgroundWorkers: false,
    },
    scaffolder: {
      export: './scaffold',
      requiredPermissions: { net: [], read: ['<workspaceRoot>'], write: ['<workspaceRoot>'] },
    },
    linking: {
      canonicalName: 'deploy-events',
      resourceConfigKey: 'event-relay',
      consumers: {
        services: ['catalog'],
        apps: ['dashboard'],
      },
    },
  });

  assertEquals(result.ok, true);
  if (!result.ok) return;
  assertEquals(result.manifest.linking?.resourceConfigKey, 'event-relay');
  assertEquals(result.manifest.linking?.consumers.services, ['catalog']);
  assertEquals(result.manifest.officialSource, undefined);
});

Deno.test('parsePluginManifest accepts all shipped plugin manifests', async () => {
  for (const path of shippedManifestPaths) {
    const manifest: unknown = JSON.parse(await Deno.readTextFile(new URL(path, import.meta.url)));
    const result = parsePluginManifest(manifest);

    assertEquals(result.ok, true, path);
    if (!result.ok) continue;
    const rawProvider = typeof manifest === 'object' && manifest !== null
      ? Reflect.get(manifest, 'provider')
      : undefined;
    assertEquals(result.manifest.provider, rawProvider, `${path} provider changed during parsing`);
  }
});

Deno.test('parsePluginManifest preserves the complete service quadruple', () => {
  const result = parsePluginManifest(serviceShapeManifest({
    providerEntrypoint: true,
    sourceEntrypoint: true,
    sourceConfigKey: true,
    sourcePort: true,
  }));

  assertEquals(result.ok, true);
  if (!result.ok) return;
  assertEquals(result.manifest.provider?.defaultServiceEntrypoint, 'services/main.ts');
  assertEquals(result.manifest.officialSource?.serviceEntrypoint, 'services/main.ts');
  assertEquals(result.manifest.officialSource?.serviceConfigKey, 'shape');
  assertEquals(result.manifest.officialSource?.servicePort, 8123);
});

Deno.test('parsePluginManifest preserves an absent service quadruple', () => {
  const result = parsePluginManifest(serviceShapeManifest({
    providerEntrypoint: false,
    sourceEntrypoint: false,
    sourceConfigKey: false,
    sourcePort: false,
  }));

  assertEquals(result.ok, true);
  if (!result.ok) return;
  assertEquals(result.manifest.provider?.defaultServiceEntrypoint, undefined);
  assertEquals(result.manifest.officialSource?.serviceEntrypoint, undefined);
  assertEquals(result.manifest.officialSource?.serviceConfigKey, undefined);
  assertEquals(result.manifest.officialSource?.servicePort, undefined);
});

Deno.test('parsePluginManifest accepts a provider service without officialSource', () => {
  const result = parsePluginManifest(serviceShapeManifest({
    providerEntrypoint: true,
    sourceEntrypoint: false,
    sourceConfigKey: false,
    sourcePort: false,
    includeOfficialSource: false,
  }));

  assertEquals(result.ok, true);
  if (!result.ok) return;
  assertEquals(result.manifest.provider?.defaultServiceEntrypoint, 'services/main.ts');
  assertEquals(result.manifest.officialSource, undefined);
});

Deno.test('parsePluginManifest rejects every partial officialSource service triple', () => {
  for (let mask = 1; mask < 7; mask += 1) {
    const result = parsePluginManifest(serviceShapeManifest({
      providerEntrypoint: true,
      sourceEntrypoint: (mask & 1) !== 0,
      sourceConfigKey: (mask & 2) !== 0,
      sourcePort: (mask & 4) !== 0,
    }));

    assertEquals(
      result.ok,
      false,
      `partial officialSource service mask ${mask} unexpectedly parsed`,
    );
    if (result.ok) continue;
    assertEquals(
      result.error.issues.some((issue) => issue.message.includes(ATOMIC_SERVICE_SHAPE_ERROR)),
      true,
      `partial officialSource service mask ${mask} did not report the named atomicity error`,
    );
  }
});

Deno.test('parsePluginManifest rejects malformed manifests with useful issues', () => {
  const result = parsePluginManifest({
    schemaVersion: PLUGIN_MANIFEST_SCHEMA_VERSION,
    name: '@netscript/plugin-workers',
    capabilities: {
      hasDatabaseMigrations: true,
    },
  });

  assertEquals(result.ok, false);
  if (result.ok) return;

  assertStringIncludes(result.error.message, 'validation failed');
  assertEquals(result.error.issues.some((issue) => issue.path === 'version'), true);
  assertEquals(result.error.issues.some((issue) => issue.path === 'scaffolder'), true);
});

Deno.test('parsePluginManifest rejects unsupported schemaVersion values', () => {
  const result = parsePluginManifest({
    schemaVersion: 999,
    name: '@netscript/plugin-workers',
  });

  assertEquals(result.ok, false);
  if (result.ok) return;

  assertStringIncludes(result.error.message, 'schemaVersion 999');
  assertEquals(result.error.issues[0]?.path, 'schemaVersion');
});

Deno.test('parsePluginManifest rejects unsafe scaffolder and post-script exports', () => {
  const result = parsePluginManifest({
    schemaVersion: PLUGIN_MANIFEST_SCHEMA_VERSION,
    name: '@netscript/plugin-workers',
    version: '0.0.1-alpha.12',
    displayName: 'Background Worker',
    description: 'NetScript plugin for background job scheduling.',
    peerDependencies: {},
    capabilities: {
      hasDatabaseMigrations: true,
      hasRoutes: true,
      hasBackgroundWorkers: true,
    },
    scaffolder: {
      export: '../escape',
      requiredPermissions: {
        net: [],
        read: ['<workspaceRoot>'],
        write: ['<workspaceRoot>'],
      },
    },
    postScripts: [
      { export: './scripts/../escape' },
    ],
  });

  assertEquals(result.ok, false);
  if (result.ok) return;

  assertEquals(result.error.issues.some((issue) => issue.path === 'scaffolder.export'), true);
  assertEquals(result.error.issues.some((issue) => issue.path === 'postScripts.0.export'), true);
});
