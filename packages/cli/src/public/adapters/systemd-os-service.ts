/**
 * @module public/adapters/systemd-os-service
 *
 * Linux implementation of `OsServicePort`, backed by systemctl. Argument
 * construction is centralized in
 * `kernel/adapters/linux/systemd/systemd-command.ts` so port-driven and
 * command-layer systemctl invocations stay byte-identical — the Linux analogue
 * of `ServyOsServiceAdapter`.
 *
 * Located under `public/adapters` (not `kernel/`) for hexagonal-layer symmetry
 * with the servy adapter: it implements the `public/ports` seam, so it may not
 * live in `kernel/`. The pure unit renderer and systemctl arg builders remain
 * in `kernel/adapters/linux/systemd/`.
 */

import type { ProcessPort } from '../../kernel/ports/process-port.ts';
import type {
  OsServiceCommandResult,
  OsServiceInstallRequest,
  OsServiceOperation,
  OsServicePort,
} from '../ports/os-service-port.ts';
import {
  systemctlDaemonReloadArgs,
  systemctlDisableArgs,
  systemctlEnableArgs,
  systemctlLifecycleArgs,
} from '../../kernel/adapters/linux/systemd/systemd-command.ts';

/** Options for constructing a systemd OS-service adapter. */
export interface SystemdOsServiceAdapterOptions {
  /** Path to the systemctl CLI. */
  readonly systemctlPath: string;

  /** Process execution port. */
  readonly process: ProcessPort;
}

/** Linux `OsServicePort` adapter backed by systemctl. */
export class SystemdOsServiceAdapter implements OsServicePort {
  /** Create a systemd OS-service adapter. */
  constructor(private readonly options: SystemdOsServiceAdapterOptions) {}

  /**
   * Register a unit: reload the systemd manager so it sees the freshly written
   * unit file, then enable it. Fails fast if the reload fails.
   */
  async install(
    request: OsServiceInstallRequest,
  ): Promise<OsServiceCommandResult> {
    const reload = await this.runCommand(systemctlDaemonReloadArgs());
    if (!reload.success) {
      return reload;
    }
    return await this.runCommand(systemctlEnableArgs(request));
  }

  /** Run a lifecycle operation against a full systemd unit name. */
  async run(
    operation: Exclude<OsServiceOperation, 'install'>,
    serviceName: string,
  ): Promise<OsServiceCommandResult> {
    const args = operation === 'uninstall'
      ? systemctlDisableArgs(serviceName)
      : systemctlLifecycleArgs(operation, serviceName);
    return await this.runCommand(args);
  }

  /** Execute a systemctl invocation and translate its output to a structured result. */
  private async runCommand(args: readonly string[]): Promise<OsServiceCommandResult> {
    const result = await this.options.process.exec(this.options.systemctlPath, [...args]);
    const message = result.stdout.trim() ||
      result.stderr.trim() ||
      (result.code === 0 ? 'OK' : 'systemctl exited non-zero (no output captured)');
    return {
      success: result.code === 0,
      message,
      code: result.code,
    };
  }
}
