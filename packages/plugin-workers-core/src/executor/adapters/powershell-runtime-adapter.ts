import { buildPowerShellCommand } from './argv-builder.ts';
import type { ProcessRunner } from './dax-process-runner.ts';
import { RuntimeAdapterBase } from './runtime-adapter-base.ts';

/** Runtime adapter for PowerShell task scripts. */
export class PowerShellRuntimeAdapter extends RuntimeAdapterBase {
  /** Create a PowerShell adapter with an optional custom process runner. */
  constructor(options: { runner?: ProcessRunner } = {}) {
    super({
      id: 'powershell-runtime-adapter',
      runtime: 'powershell',
      runner: options.runner,
      build: (task, resolved) =>
        buildPowerShellCommand({ task, options: resolved, env: Deno.env.get, os: Deno.build.os }),
    });
  }
}
