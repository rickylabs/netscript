import { join, resolve } from '@std/path';
import { loadDeployConfig } from '../../config/deploy-config.ts';
import { extractCompileTargets } from './compile-targets.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

let configPromise: ReturnType<typeof loadDeployConfig> | undefined;
let projectRootPromise: Promise<string> | undefined;

function getProjectRoot(): Promise<string> {
  projectRootPromise ??= createCompileProject();
  return projectRootPromise;
}

async function getConfig() {
  configPromise ??= loadDeployConfig({ projectRoot: await getProjectRoot(), quiet: true });
  return configPromise;
}

async function getConfiguredTriggerWatchDirs(): Promise<string[]> {
  const projectRoot = await getProjectRoot();
  const appsettings = JSON.parse(
    await Deno.readTextFile(join(projectRoot, 'dotnet', 'AppHost', 'appsettings.json')),
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

async function createCompileProject(): Promise<string> {
  const projectRoot = await Deno.makeTempDir();
  await Deno.mkdir(resolve(projectRoot, 'dotnet', 'AppHost'), { recursive: true });
  await Deno.writeTextFile(
    resolve(projectRoot, 'netscript.config.ts'),
    `export default {
  name: 'fixture-app',
  databases: { config: [] },
  plugins: [
    '@netscript/plugin-workers',
    '@netscript/plugin-sagas',
    '@netscript/plugin-triggers',
  ],
};
`,
  );
  await Deno.writeTextFile(
    resolve(projectRoot, 'dotnet', 'AppHost', 'appsettings.json'),
    JSON.stringify({
      NetScript: {
        Services: {
          users: {
            Runtime: 'deno',
            Port: 3001,
            Entrypoint: 'src/main.ts',
            Workdir: 'services/users',
          },
          orders: {
            Runtime: 'deno',
            Port: 3002,
            Entrypoint: 'src/main.ts',
            Workdir: 'services/orders',
            ServiceReferences: ['users'],
          },
        },
        Plugins: {
          'workers-api': {
            Enabled: true,
            Workdir: 'plugins/workers',
            Entrypoint: 'services/src/main.ts',
          },
        },
        BackgroundProcessors: {
          workers: {
            Enabled: true,
            Workdir: 'workers',
            Entrypoint: 'bin/combined.ts',
            Concurrency: 2,
            ConcurrencyEnvVar: 'WORKER_CONCURRENCY',
          },
          sagas: {
            Enabled: true,
            Workdir: 'sagas',
            Entrypoint: 'bin/combined.ts',
            ConcurrencyEnvVar: 'SAGA_CONCURRENCY',
          },
          triggers: {
            Enabled: true,
            Workdir: 'plugins/triggers',
            Entrypoint: 'src/runtime/trigger-processor.ts',
            Concurrency: 10,
            ConcurrencyEnvVar: 'TRIGGER_CONCURRENCY',
            WatchDirs: ['plugins/triggers/events'],
          },
        },
      },
    }, null, 2),
  );
  return projectRoot;
}

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
  const sagasCombined = byName.get('sagas-combined');
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
    sagasCombined?.concurrencyEnvVar === 'SAGA_CONCURRENCY',
    'sagas-combined should carry saga concurrency env var',
  );
  assert(
    sagasCombined?.workdir === 'sagas',
    'sagas-combined should resolve from the sagas background workdir',
  );
  assert(
    sagasCombined?.entrypoint === 'sagas/bin/combined.ts',
    'sagas-combined should resolve the sagas combined runtime entrypoint',
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
  assert(
    triggerProcessor?.concurrencyEnvVar === 'TRIGGER_CONCURRENCY',
    'trigger target should carry trigger concurrency env var',
  );
  assert(
    triggerProcessor?.workdir === 'plugins/triggers',
    'trigger target should resolve from the triggers plugin workdir',
  );
  assert(
    triggerProcessor?.entrypoint === 'plugins/triggers/src/runtime/trigger-processor.ts',
    'trigger target should resolve the trigger processor entrypoint',
  );
});

Deno.test('loadDeployConfig maps service references to compile target dependencies', async () => {
  const config = await getConfig();
  const targets = extractCompileTargets(config);
  const byName = new Map(targets.map((target) => [target.name, target]));

  const orders = byName.get('orders');
  assert(orders, 'orders service compile target should exist');
  assert(
    JSON.stringify(orders.dependsOn) === JSON.stringify(['users']),
    'orders service should carry canonical ServiceReferences as dependsOn',
  );
});
