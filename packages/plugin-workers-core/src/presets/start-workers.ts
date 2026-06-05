import { createWorkersRuntime } from '../runtime/mod.ts';
import type { WorkersRuntime, WorkersRuntimeOptions } from '../runtime/mod.ts';

/** Options for the default workers startup preset. */
export type StartWorkersOptions =
  & WorkersRuntimeOptions
  & Readonly<{
    autoStart?: boolean;
  }>;

/**
 * Create and start a workers runtime using default composition.
 *
 * @param options - Runtime overrides plus optional startup behavior.
 * @returns Started workers runtime handle.
 */
export async function startWorkers(options: StartWorkersOptions = {}): Promise<WorkersRuntime> {
  const runtime = createWorkersRuntime(options);
  if (options.autoStart ?? true) {
    await runtime.start();
  }
  return runtime;
}
