import {
  type GeneratedWorkersJobRegistry,
  loadGeneratedJobRegistry,
  registerGeneratedJobRegistry,
  resolveGeneratedJobRegistryUrl,
} from '../../src/runtime/generated-jobs.ts';
import type { WorkersServiceRuntime } from './routers/router-context.ts';

/**
 * Loads generated user job definitions into the workers API service runtime.
 *
 * @throws {GeneratedJobRegistryError} when a generated registry exists but did not
 * reach the runtime registry.
 * @returns The load outcome, so the caller can report the resolved path.
 */
export async function registerGeneratedJobDefinitions(
  runtime: WorkersServiceRuntime,
  registryUrl: URL = resolveGeneratedJobRegistryUrl(),
): Promise<GeneratedWorkersJobRegistry> {
  const generated = await loadGeneratedJobRegistry(registryUrl);
  return await registerGeneratedJobRegistry(runtime.jobRegistry, generated);
}
