import { normalize, resolve } from '@std/path';
import { loadDeployConfig } from '../../config/deploy-config.ts';
import { extractCompileTargets } from './compile-targets.ts';

const projectRoot = resolve(import.meta.dirname ?? '.', '..', '..', '..', '..', '..', '..', '..');

Deno.test('extractCompileTargets enriches targets from plugin registry metadata', async () => {
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
