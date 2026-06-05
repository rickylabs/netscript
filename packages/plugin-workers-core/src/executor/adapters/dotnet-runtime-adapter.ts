import { buildDotNetCommand } from './argv-builder.ts';
import type { ProcessRunner } from './dax-process-runner.ts';
import { RuntimeAdapterBase } from './runtime-adapter-base.ts';

/** Runtime adapter for .NET task programs. */
export class DotNetRuntimeAdapter extends RuntimeAdapterBase {
  constructor(options: { runner?: ProcessRunner } = {}) {
    super({
      id: 'dotnet-runtime-adapter',
      runtime: 'dotnet',
      runner: options.runner,
      build: (task, resolved) =>
        buildDotNetCommand({ task, options: resolved, env: Deno.env.get, os: Deno.build.os }),
    });
  }
}
