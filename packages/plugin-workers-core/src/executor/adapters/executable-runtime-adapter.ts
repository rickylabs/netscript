import { buildExecutableCommand } from './argv-builder.ts';
import type { ProcessRunner } from './dax-process-runner.ts';
import { RuntimeAdapterBase } from './runtime-adapter-base.ts';

/** Runtime adapter for direct executable tasks. */
export class ExecutableRuntimeAdapter extends RuntimeAdapterBase {
  /** Create an executable adapter with an optional custom process runner. */
  constructor(options: { runner?: ProcessRunner } = {}) {
    super({
      id: 'executable-runtime-adapter',
      runtime: 'executable',
      runner: options.runner,
      build: (task, resolved) =>
        buildExecutableCommand({ task, options: resolved, env: Deno.env.get, os: Deno.build.os }),
    });
  }
}
