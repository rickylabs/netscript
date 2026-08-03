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
  serviceConfigKey: string,
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
