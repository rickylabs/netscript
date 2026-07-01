import {
  loadGeneratedJobRegistry,
  registerStaticJobDefinitions,
} from '../../src/runtime/generated-jobs.ts';
import type { WorkersServiceRuntime } from './routers/router-context.ts';

/** Loads generated user job definitions into the workers API service runtime. */
export async function registerGeneratedJobDefinitions(
  runtime: WorkersServiceRuntime,
  registryUrl: URL,
): Promise<void> {
  const generated = await loadGeneratedJobRegistry(registryUrl);
  await registerStaticJobDefinitions(runtime.jobRegistry, generated.definitions);
}
