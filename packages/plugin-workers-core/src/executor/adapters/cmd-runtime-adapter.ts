import type { TaskDefinition } from '../../domain/mod.ts';
import { buildCmdCommand } from './argv-builder.ts';
import type { ProcessRunner } from './dax-process-runner.ts';
import { RuntimeAdapterBase } from './runtime-adapter-base.ts';

/** Runtime adapter for Windows cmd tasks. */
export class CmdRuntimeAdapter extends RuntimeAdapterBase {
  constructor(options: { runner?: ProcessRunner } = {}) {
    super({
      id: 'cmd-runtime-adapter',
      runtime: 'cmd',
      runner: options.runner,
      build: (task, resolved) =>
        buildCmdCommand({ task, options: resolved, env: Deno.env.get, os: Deno.build.os }),
    });
  }

  override supports(task: TaskDefinition): boolean {
    return Deno.build.os === 'windows' && super.supports(task);
  }
}
