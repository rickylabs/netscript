import { normalize, resolve } from '@std/path';
import { loadDeployConfig } from '../../config/deploy-config.ts';
import { extractCompileTargets } from './compile-targets.ts';

Deno.test('extractCompileTargets enriches targets from plugin registry metadata', async () => {
  const projectRoot = await createCompileProject();
  const config = await loadDeployConfig({ projectRoot, quiet: true });
  const targets = extractCompileTargets(config);

  const workersApi = targets.find((target) => target.name === 'workers-api');
  const workersCombined = targets.find((target) => target.name === 'workers-combined');
  const sagasCombined = targets.find((target) => target.name === 'sagas-combined');
  const triggerProcessor = targets.find((target) => target.name === 'trigger-processor');

  if (
    !workersApi ||
    workersApi.workdir !== 'plugins/workers' ||
    normalize(workersApi.entrypoint) !== normalize('plugins/workers/services/src/main.ts')
  ) {
    throw new Error('Expected workers-api target to resolve from plugin appsettings metadata');
  }

  if (
    !workersCombined || workersCombined.concurrencyEnvVar !== 'WORKER_CONCURRENCY' ||
    workersCombined.defaultConcurrency !== 2
  ) {
    throw new Error(
      'Expected workers-combined target concurrency metadata to come from appsettings',
    );
  }

  if (
    workersCombined.workdir !== 'workers' ||
    normalize(workersCombined.entrypoint) !== normalize('workers/bin/combined.ts')
  ) {
    throw new Error(
      `Expected workers-combined target to resolve from workers/, got ${workersCombined.workdir} :: ${workersCombined.entrypoint}`,
    );
  }

  if (!sagasCombined || sagasCombined.concurrencyEnvVar !== 'SAGA_CONCURRENCY') {
    throw new Error('Expected sagas-combined target to inherit saga concurrency metadata');
  }

  if (
    sagasCombined.workdir !== 'sagas' ||
    normalize(sagasCombined.entrypoint) !== normalize('sagas/bin/combined.ts')
  ) {
    throw new Error(
      `Expected sagas-combined target to resolve from sagas/, got ${sagasCombined.workdir} :: ${sagasCombined.entrypoint}`,
    );
  }

  if (!triggerProcessor || triggerProcessor.concurrencyEnvVar !== 'TRIGGER_CONCURRENCY') {
    throw new Error(
      'Expected trigger-processor target to inherit trigger concurrency metadata',
    );
  }

  if (
    triggerProcessor.workdir !== 'plugins/triggers' ||
    normalize(triggerProcessor.entrypoint) !==
      normalize('plugins/triggers/src/runtime/trigger-processor.ts')
  ) {
    throw new Error(
      `Expected trigger-processor target to resolve from plugins/triggers, got ${triggerProcessor.workdir} :: ${triggerProcessor.entrypoint}`,
    );
  }
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
          },
        },
      },
    }, null, 2),
  );
  return projectRoot;
}
