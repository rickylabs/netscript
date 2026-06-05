import { buildShellCommand } from './argv-builder.ts';
import type { ProcessRunner } from './dax-process-runner.ts';
import { RuntimeAdapterBase } from './runtime-adapter-base.ts';

/** Runtime adapter for POSIX or Git Bash shell scripts. */
export class ShellRuntimeAdapter extends RuntimeAdapterBase {
  constructor(options: { runner?: ProcessRunner } = {}) {
    super({
      id: 'shell-runtime-adapter',
      runtime: 'shell',
      runner: options.runner,
      build: (task, resolved) =>
        buildShellCommand({ task, options: resolved, env: Deno.env.get, os: Deno.build.os }),
    });
  }
}
