import { assert, assertEquals } from '@std/assert';

import { buildScaffoldPluginJson } from '../../src/scaffold/mod.ts';
import type {
  PluginManifestOfficialSource,
  PluginScaffoldManifestSpec,
} from '../../src/scaffold/mod.ts';
import { parsePluginManifest, stripPluginManifestSchemaKey } from '../../src/protocol/mod.ts';

const committedManifestPaths = [
  'plugins/auth/scaffold.plugin.json',
  'plugins/sagas/scaffold.plugin.json',
  'plugins/streams/scaffold.plugin.json',
  'plugins/triggers/scaffold.plugin.json',
  'plugins/workers/scaffold.plugin.json',
];

Deno.test('buildScaffoldPluginJson preserves committed first-party scaffold manifests', async () => {
  for (const path of committedManifestPaths) {
    const committed = await Deno.readTextFile(path);
    const parsedJson: unknown = JSON.parse(committed);
    const result = parsePluginManifest(stripPluginManifestSchemaKey(parsedJson));

    assert(result.ok, `${path} should parse as a scaffold plugin manifest`);

    const manifest = result.manifest;
    const spec: PluginScaffoldManifestSpec = {
      schemaUrl: readSchemaUrl(parsedJson),
      name: manifest.name,
      displayName: manifest.displayName,
      description: manifest.description,
      capabilities: manifest.capabilities,
      scaffolder: manifest.scaffolder,
      provider: manifest.provider,
      officialSource: committedOfficialSourceOrder(manifest.officialSource),
    };

    assertEquals(buildScaffoldPluginJson(spec, manifest.version), committed, path);
  }
});

function committedOfficialSourceOrder(
  officialSource: PluginManifestOfficialSource | undefined,
): PluginManifestOfficialSource | undefined {
  if (officialSource === undefined) {
    return undefined;
  }
  if (officialSource.canonicalName === 'workers' || officialSource.canonicalName === 'sagas') {
    return {
      canonicalName: officialSource.canonicalName,
      pluginDir: officialSource.pluginDir,
      backgroundDir: officialSource.backgroundDir,
      serviceEntrypoint: officialSource.serviceEntrypoint,
      backgroundEntrypoint: officialSource.backgroundEntrypoint,
      serviceConfigKey: officialSource.serviceConfigKey,
      servicePort: officialSource.servicePort,
      backgroundPort: officialSource.backgroundPort,
      dependencies: officialSource.dependencies,
      requiresDb: officialSource.requiresDb,
      requiresKv: officialSource.requiresKv,
      permissions: officialSource.permissions,
      pluginReferences: officialSource.pluginReferences,
    };
  }
  if (officialSource.canonicalName === 'triggers') {
    return {
      canonicalName: officialSource.canonicalName,
      pluginDir: officialSource.pluginDir,
      backgroundDir: officialSource.backgroundDir,
      serviceEntrypoint: officialSource.serviceEntrypoint,
      backgroundEntrypoint: officialSource.backgroundEntrypoint,
      serviceConfigKey: officialSource.serviceConfigKey,
      servicePort: officialSource.servicePort,
      backgroundPort: officialSource.backgroundPort,
      dependencies: officialSource.dependencies,
      pluginReferences: officialSource.pluginReferences,
    };
  }
  return {
    canonicalName: officialSource.canonicalName,
    pluginDir: officialSource.pluginDir,
    serviceEntrypoint: officialSource.serviceEntrypoint,
    serviceConfigKey: officialSource.serviceConfigKey,
    servicePort: officialSource.servicePort,
    backgroundPort: officialSource.backgroundPort,
    requiresDb: officialSource.requiresDb,
    requiresKv: officialSource.requiresKv,
    permissions: officialSource.permissions,
  };
}

function readSchemaUrl(value: unknown): string {
  if (typeof value === 'object' && value !== null && '$schema' in value) {
    const schema = value.$schema;
    if (typeof schema === 'string') {
      return schema;
    }
  }
  throw new TypeError('Expected committed manifest to declare a string $schema.');
}
