import type { ResolvedTaskExecutionOptions } from '../../abstracts/mod.ts';
import type { TaskDefinition, TaskResult } from '../../domain/mod.ts';
import { buildDenoCommand } from './argv-builder.ts';
import type { ProcessRunner } from './dax-process-runner.ts';
import { RuntimeAdapterBase } from './runtime-adapter-base.ts';

/** Runtime adapter for Deno task scripts. */
export class DenoRuntimeAdapter extends RuntimeAdapterBase {
  constructor(options: { runner?: ProcessRunner } = {}) {
    super({
      id: 'deno-runtime-adapter',
      runtime: 'deno',
      runner: options.runner,
      build: (task, resolved) =>
        buildDenoCommand({ task, options: resolved, env: Deno.env.get, os: Deno.build.os }),
    });
  }

  override execute(
    task: TaskDefinition,
    options: ResolvedTaskExecutionOptions,
  ): Promise<TaskResult> {
    return super.execute(task, options);
  }
}
