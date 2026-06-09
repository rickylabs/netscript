import type {
  ResolvedTaskExecutionOptions,
  TaskDefinition,
  TaskResult,
} from '../executor-types.ts';
import { buildDenoCommand } from './argv-builder.ts';
import type { ProcessRunner } from './dax-process-runner.ts';
import { RuntimeAdapterBase } from './runtime-adapter-base.ts';

/** Runtime adapter for Deno task scripts. */
export class DenoRuntimeAdapter extends RuntimeAdapterBase {
  /** Create a Deno adapter with an optional custom process runner. */
  constructor(options: { runner?: ProcessRunner } = {}) {
    super({
      id: 'deno-runtime-adapter',
      runtime: 'deno',
      runner: options.runner,
      build: (task, resolved) =>
        buildDenoCommand({ task, options: resolved, env: Deno.env.get, os: Deno.build.os }),
    });
  }

  /** Execute a Deno task through the shared process runner. */
  override execute(
    task: TaskDefinition,
    options: ResolvedTaskExecutionOptions,
  ): Promise<TaskResult> {
    return super.execute(task, options);
  }
}
