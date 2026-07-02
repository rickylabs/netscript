import type { StaticJobRegistry } from '@netscript/plugin-workers-core/runtime';
import {
  loadGeneratedJobRegistry,
  startCombinedProcess,
  type StaticJobDefinitionRegistry,
  WORKERS_JOB_REGISTRY_PATH,
} from './runtime.ts';

const generated = await loadGeneratedJobs();

await startCombinedProcess(generated);

async function loadGeneratedJobs(): Promise<
  Readonly<{
    definitions?: StaticJobDefinitionRegistry;
    registry?: StaticJobRegistry;
  }>
> {
  const registryUrl = new URL(`../../${WORKERS_JOB_REGISTRY_PATH}`, import.meta.url);
  return await loadGeneratedJobRegistry(registryUrl);
}
