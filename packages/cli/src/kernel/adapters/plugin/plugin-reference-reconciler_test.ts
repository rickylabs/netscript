import { assertEquals } from '@std/assert';
import { MemoryFileSystemAdapter } from '../scaffold/memory-fs.ts';
import { reconcilePluginReferences } from './plugin-reference-reconciler.ts';

Deno.test('reconcilePluginReferences omits dangling dependencies and adds every producer edge', async () => {
  const fs = new MemoryFileSystemAdapter();
  await writeAppsettings(fs, false);
  await writeDeclaration(fs, 'workers', 'workers-api', ['streams'], []);
  await writeDeclaration(fs, 'sagas', 'sagas-api', ['streams'], ['workers-api']);
  await writeDeclaration(fs, 'triggers', 'triggers-api', ['streams'], ['workers-api']);

  await reconcilePluginReferences('/project', fs);
  const withoutStreams = await readEntries(fs);
  assertEquals(withoutStreams.Plugins['workers-api'].PluginReferences, undefined);
  assertEquals(withoutStreams.Plugins['sagas-api'].PluginReferences, ['workers-api']);
  assertEquals(withoutStreams.Plugins['triggers-api'].PluginReferences, ['workers-api']);

  await writeAppsettings(fs, true, withoutStreams);
  await writeDeclaration(fs, 'streams', 'streams', [], []);
  await reconcilePluginReferences('/project', fs);
  const withStreams = await readEntries(fs);

  assertEquals(withStreams.Plugins['workers-api'].PluginReferences, ['streams']);
  assertEquals(withStreams.Plugins['sagas-api'].PluginReferences, ['streams', 'workers-api']);
  assertEquals(withStreams.Plugins['triggers-api'].PluginReferences, ['streams', 'workers-api']);
  assertEquals(withStreams.BackgroundProcessors.workers.PluginReferences, [
    'streams',
    'workers-api',
  ]);
  assertEquals(withStreams.BackgroundProcessors.sagas.PluginReferences, [
    'sagas-api',
    'streams',
    'workers-api',
  ]);
  assertEquals(withStreams.BackgroundProcessors.triggers.PluginReferences, [
    'streams',
    'triggers-api',
    'workers-api',
  ]);
});

Deno.test('reconcilePluginReferences maps canonical dependencies to renamed installed instances', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/appsettings.json',
    `${JSON.stringify({
      NetScript: {
        Plugins: {
          'workers-api': { Enabled: true },
          'durable-state': { Enabled: true },
        },
        BackgroundProcessors: { jobs: { Enabled: true } },
      },
    }, null, 2)}\n`,
  );
  await writeDeclaration(fs, 'jobs', 'workers-api', ['streams'], [], 'workers');
  await writeDeclaration(fs, 'durable-state', 'streams', [], [], 'streams');

  await reconcilePluginReferences('/project', fs);
  const entries = await readEntries(fs);
  assertEquals(entries.Plugins['workers-api'].PluginReferences, ['durable-state']);
  assertEquals(entries.BackgroundProcessors.jobs.PluginReferences, [
    'durable-state',
    'workers-api',
  ]);
});

Deno.test('reconcilePluginReferences uses configured modules and accepts service-less declarations', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/appsettings.json',
    `${JSON.stringify({
      NetScript: {
        Plugins: {
          'workers-api': { Enabled: true },
          'triggers-api': { Enabled: true },
        },
        BackgroundProcessors: {
          workers: { Enabled: true },
          triggers: { Enabled: true },
        },
      },
    }, null, 2)}\n`,
  );
  await fs.writeFile(
    '/project/netscript.config.ts',
    `export default {
  plugins: ['./ai/mod.ts', './streams/mod.ts', './triggers/mod.ts', './workers/mod.ts'],
};
`,
  );
  await writeDeclaration(fs, 'ai', undefined, [], []);
  await writeDeclaration(fs, 'streams', 'streams', [], []);
  await writeDeclaration(fs, 'triggers', 'triggers-api', ['streams'], []);
  await writeDeclaration(fs, 'workers', 'workers-api', ['streams'], []);

  await reconcilePluginReferences('/project', fs);
  const entries = await readEntries(fs);
  assertEquals(entries.Plugins['workers-api'].PluginReferences, ['streams']);
  assertEquals(entries.Plugins['triggers-api'].PluginReferences, ['streams']);
  assertEquals(entries.BackgroundProcessors.workers.PluginReferences, [
    'streams',
    'workers-api',
  ]);
  assertEquals(entries.BackgroundProcessors.triggers.PluginReferences, [
    'streams',
    'triggers-api',
  ]);
});

Deno.test('reconcilePluginReferences wires a fixture third-party plugin to declared services and apps', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/appsettings.json',
    `${JSON.stringify({
      NetScript: {
        Plugins: { 'event-relay': { Enabled: true } },
        BackgroundProcessors: {},
        Services: { catalog: { Enabled: true }, inventory: { Enabled: true } },
        Apps: { dashboard: { Type: 'app' }, admin: { Type: 'app' } },
      },
    }, null, 2)}\n`,
  );
  await fs.writeFile(
    '/project/plugins/acme-deploy-events/scaffold.plugin.json',
    `${JSON.stringify({
      schemaVersion: 1,
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
        requiredPermissions: { net: [], read: [], write: [] },
      },
      linking: {
        canonicalName: 'deploy-events',
        resourceConfigKey: 'event-relay',
        consumers: { services: ['catalog'], apps: ['dashboard'] },
      },
    }, null, 2)}\n`,
  );

  await reconcilePluginReferences('/project', fs);
  const appsettings = JSON.parse(await fs.readFile('/project/appsettings.json')).NetScript;
  assertEquals(appsettings.Services.catalog.PluginReferences, ['event-relay']);
  assertEquals(appsettings.Services.inventory.PluginReferences, undefined);
  assertEquals(appsettings.Apps.dashboard.PluginReferences, ['event-relay']);
  assertEquals(appsettings.Apps.admin.PluginReferences, undefined);
});

Deno.test('third-party linking converges when consumers arrive later and cleans up after uninstall', async () => {
  const fs = new MemoryFileSystemAdapter();
  await fs.writeFile(
    '/project/appsettings.json',
    `${JSON.stringify({
      NetScript: {
        Plugins: { 'event-relay': { Enabled: true } },
        BackgroundProcessors: {},
        Services: {},
        Apps: {},
      },
    }, null, 2)}\n`,
  );
  await writeThirdPartyDeclaration(fs);

  await reconcilePluginReferences('/project', fs);
  const beforeConsumers = JSON.parse(await fs.readFile('/project/appsettings.json'));
  beforeConsumers.NetScript.Services.catalog = { Enabled: true };
  beforeConsumers.NetScript.Apps.dashboard = { Type: 'app' };
  await fs.writeFile('/project/appsettings.json', `${JSON.stringify(beforeConsumers, null, 2)}\n`);

  await reconcilePluginReferences('/project', fs);
  const linked = JSON.parse(await fs.readFile('/project/appsettings.json')).NetScript;
  assertEquals(linked.Services.catalog.PluginReferences, ['event-relay']);
  assertEquals(linked.Apps.dashboard.PluginReferences, ['event-relay']);

  delete linked.Plugins['event-relay'];
  await fs.writeFile('/project/appsettings.json', `${JSON.stringify({ NetScript: linked }, null, 2)}\n`);
  await fs.remove('/project/plugins/acme-deploy-events');
  await reconcilePluginReferences('/project', fs);
  const removed = JSON.parse(await fs.readFile('/project/appsettings.json')).NetScript;
  assertEquals(removed.Services.catalog.PluginReferences, undefined);
  assertEquals(removed.Apps.dashboard.PluginReferences, undefined);
});

async function writeThirdPartyDeclaration(fs: MemoryFileSystemAdapter): Promise<void> {
  await fs.writeFile(
    '/project/plugins/acme-deploy-events/scaffold.plugin.json',
    `${JSON.stringify({
      schemaVersion: 1,
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
        requiredPermissions: { net: [], read: [], write: [] },
      },
      linking: {
        canonicalName: 'deploy-events',
        resourceConfigKey: 'event-relay',
        consumers: { services: ['catalog'], apps: ['dashboard'] },
      },
    }, null, 2)}\n`,
  );
}

interface Entry {
  PluginReferences?: string[];
  [key: string]: unknown;
}

interface Entries {
  Plugins: Record<string, Entry>;
  BackgroundProcessors: Record<string, Entry>;
}

async function writeAppsettings(
  fs: MemoryFileSystemAdapter,
  includeStreams: boolean,
  existing?: Entries,
): Promise<void> {
  const plugins = existing?.Plugins ?? {
    'workers-api': { Enabled: true },
    'sagas-api': { Enabled: true },
    'triggers-api': { Enabled: true },
  };
  if (includeStreams) plugins.streams = { Enabled: true };
  await fs.writeFile(
    '/project/appsettings.json',
    `${JSON.stringify({
      NetScript: {
        Plugins: plugins,
        BackgroundProcessors: existing?.BackgroundProcessors ?? {
          workers: { Enabled: true },
          sagas: { Enabled: true },
          triggers: { Enabled: true },
        },
      },
    }, null, 2)}\n`,
  );
}

async function writeDeclaration(
  fs: MemoryFileSystemAdapter,
  canonicalName: string,
  serviceConfigKey: string | undefined,
  dependencies: readonly string[],
  pluginReferences: readonly string[],
  manifestCanonicalName = canonicalName,
): Promise<void> {
  await fs.writeFile(
    `/project/${canonicalName}/scaffold.plugin.json`,
    `${JSON.stringify({
      officialSource: {
        canonicalName: manifestCanonicalName,
        serviceConfigKey,
        dependencies,
        pluginReferences,
      },
    }, null, 2)}\n`,
  );
}

async function readEntries(fs: MemoryFileSystemAdapter): Promise<Entries> {
  const appsettings = JSON.parse(await fs.readFile('/project/appsettings.json')) as {
    NetScript: Entries;
  };
  return appsettings.NetScript;
}
