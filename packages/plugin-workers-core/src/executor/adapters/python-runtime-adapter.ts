import { buildPythonCommand } from './argv-builder.ts';
import type { ProcessRunner } from './dax-process-runner.ts';
import { RuntimeAdapterBase } from './runtime-adapter-base.ts';

/** Runtime adapter for Python task scripts. */
export class PythonRuntimeAdapter extends RuntimeAdapterBase {
  constructor(options: { runner?: ProcessRunner } = {}) {
    super({
      id: 'python-runtime-adapter',
      runtime: 'python',
      runner: options.runner,
      build: (task, resolved) =>
        buildPythonCommand({ task, options: resolved, env: Deno.env.get, os: Deno.build.os }),
    });
  }
}
