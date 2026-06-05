import { dirname, fromFileUrl, join, resolve } from '@std/path';
import { loadDeployConfig } from '../../config/deploy-config.ts';
import { extractCompileTargets } from './compile-targets.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const REPO_ROOT = resolve(dirname(fromFileUrl(import.meta.url)), '../../../../../../..');
let configPromise: ReturnType<typeof loadDeployConfig> | undefined;

function getConfig() {
  configPromise ??= loadDeployConfig({ projectRoot: REPO_ROOT, quiet: true });
  return configPromise;
}

async function getConfiguredTriggerWatchDirs(): Promise<string[]> {
  const appsettings = JSON.parse(
    await Deno.readTextFile(join(REPO_ROOT, 'dotnet', 'AppHost', 'appsettings.json')),
  ) as {
    NetScript?: {
      BackgroundProcessors?: {
        triggers?: {
          WatchDirs?: string[];
        };
      };
    };
  };

  return appsettings.NetScript?.BackgroundProcessors?.triggers?.WatchDirs ?? [];
}

Deno.test('loadDeployConfig resolves unified background processors from appsettings and registry', async () => {
  const config = await getConfig();
  const configuredTriggerWatchDirs = await getConfiguredTriggerWatchDirs();
  const legacyKeys = config as unknown as Record<string, unknown>;

  assert(!('workers' in legacyKeys), 'legacy workers config should not exist on ResolvedConfig');
  assert(!('sagas' in legacyKeys), 'legacy sagas config should not exist on ResolvedConfig');
  assert(!('triggers' in legacyKeys), 'legacy triggers config should not exist on ResolvedConfig');

  const workers = config.backgroundProcessors.workers;
  const sagas = config.backgroundProcessors.sagas;
  const triggers = config.backgroundProcessors.triggers;

  assert(workers?.enabled, 'workers background processor should be enabled');
  assert(sagas?.enabled, 'sagas background processor should be enabled');
  assert(triggers?.enabled, 'triggers background processor should be enabled');

  const workerEntrypoints = Object.keys(workers.entrypoints).sort().join(',');
  assert(
    workerEntrypoints === 'combined',
    `unexpected worker entrypoints: ${workerEntrypoints}`,
  );
  assert(
    JSON.stringify(triggers.watchDirs ?? []) === JSON.stringify(configuredTriggerWatchDirs),
    'triggers watchDirs should match BackgroundProcessors.triggers.WatchDirs from appsettings',
  );
});

Deno.test('extractCompileTargets emits metadata-driven background processor targets', async () => {
  const config = await getConfig();
  config.backgroundProcessors.workers.concurrency = 7;

  const targets = extractCompileTargets(config);
  const byName = new Map(targets.map((target) => [target.name, target]));

  for (
    const targetName of [
      'workers-combined',
      'sagas-combined',
      'trigger-processor',
    ]
  ) {
    assert(byName.has(targetName), `missing compile target: ${targetName}`);
  }

  const workersCombined = byName.get('workers-combined');
  const workersApi = byName.get('workers-api');
  assert(
    workersCombined?.concurrencyEnvVar === 'WORKER_CONCURRENCY',
    'workers-combined should carry concurrency env var',
  );
  assert(
    workersCombined?.defaultConcurrency === 7,
    'workers-combined should use resolved background processor concurrency',
  );
  assert(
    workersApi?.workdir === 'plugins/workers',
    'workers-api should resolve from the plugin service appsettings entry',
  );

  assert(
    !byName.has('workers-worker'),
    'workers-worker should not be emitted when appsettings only enables the combined runtime',
  );
  assert(
    !byName.has('workers-scheduler'),
    'workers-scheduler should not be emitted when appsettings only enables the combined runtime',
  );

  const triggerProcessor = byName.get('trigger-processor');
  assert(
    triggerProcessor?.pluginName === 'triggers',
    'trigger target should retain source plugin metadata',
  );
  assert(
    triggerProcessor?.defaultConcurrency === 10,
    'trigger target should preserve plugin default concurrency',
  );
});
