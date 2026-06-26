import type { StaticJobRegistry } from '@netscript/plugin-workers-core/runtime';
import { startCombinedProcess, type StaticJobDefinitionRegistry } from './runtime.ts';

const generated = await loadGeneratedJobs();

await startCombinedProcess(generated);

async function loadGeneratedJobs(): Promise<
  Readonly<{
    definitions?: StaticJobDefinitionRegistry;
    registry?: StaticJobRegistry;
  }>
> {
  const registryUrl = new URL(
    '../../.netscript/generated/plugin-workers/jobs.registry.ts',
    import.meta.url,
  );

  try {
    await Deno.stat(registryUrl);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return {};
    throw error;
  }

  const module = await import(registryUrl.href);
  const definitions = module.jobDefinitions instanceof Map
    ? module.jobDefinitions
    : module.definitions instanceof Map
    ? module.definitions
    : undefined;
  const registry = module.registry instanceof Map ? module.registry : undefined;

  return { definitions, registry };
}
