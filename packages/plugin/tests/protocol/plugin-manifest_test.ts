import { assertEquals, assertStringIncludes } from '@std/assert';
import { generatePluginManifestSchemaText } from '../../../../.llm/tools/plugin/manifest-schema.ts';
import {
  parsePluginManifest,
  PLUGIN_MANIFEST_SCHEMA_VERSION,
  stripPluginManifestSchemaKey,
} from '../../src/protocol/mod.ts';

const committedSchemaPath = '../../schema/scaffold.plugin.schema.json';

const shippedManifestPaths = [
  '../../../../plugins/auth/scaffold.plugin.json',
  '../../../../plugins/sagas/scaffold.plugin.json',
  '../../../../plugins/streams/scaffold.plugin.json',
  '../../../../plugins/triggers/scaffold.plugin.json',
  '../../../../plugins/workers/scaffold.plugin.json',
];

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

Deno.test('parsePluginManifest accepts all shipped plugin manifests', async () => {
  for (const path of shippedManifestPaths) {
    const manifest = JSON.parse(await Deno.readTextFile(new URL(path, import.meta.url)));
    const result = parsePluginManifest(stripPluginManifestSchemaKey(manifest));

    assertEquals(result.ok, true, path);
  }
});

Deno.test('plugin manifest JSON Schema is byte-stable', async () => {
  const committed = await Deno.readTextFile(new URL(committedSchemaPath, import.meta.url));

  assertEquals(generatePluginManifestSchemaText(), committed);
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

Deno.test('stripPluginManifestSchemaKey allows editor schema hints before strict parsing', () => {
  const result = parsePluginManifest(stripPluginManifestSchemaKey({
    $schema: 'jsr:@netscript/plugin/schema',
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
  }));

  assertEquals(result.ok, true);
});

Deno.test('parsePluginManifest still rejects non-schema unknown keys', () => {
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
    unexpected: true,
  });

  assertEquals(result.ok, false);
  if (result.ok) return;

  assertEquals(result.error.issues.some((issue) => issue.path === '<root>'), true);
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
