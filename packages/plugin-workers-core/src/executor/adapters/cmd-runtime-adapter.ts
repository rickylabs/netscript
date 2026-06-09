import type { TaskDefinition } from '../executor-types.ts';
import { buildCmdCommand } from './argv-builder.ts';
import type { ProcessRunner } from './dax-process-runner.ts';
import { RuntimeAdapterBase } from './runtime-adapter-base.ts';

/** Runtime adapter for Windows cmd tasks. */
export class CmdRuntimeAdapter extends RuntimeAdapterBase {
  /** Create a cmd adapter with an optional custom process runner. */
  constructor(options: { runner?: ProcessRunner } = {}) {
    super({
      id: 'cmd-runtime-adapter',
      runtime: 'cmd',
      runner: options.runner,
      build: (task, resolved) =>
        buildCmdCommand({ task, options: resolved, env: Deno.env.get, os: Deno.build.os }),
    });
  }

  /** Return whether the current host can execute this cmd task. */
  override supports(task: TaskDefinition): boolean {
    return Deno.build.os === 'windows' && super.supports(task);
  }
}
