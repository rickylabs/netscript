/**
 * @module public/adapters/servy-os-service
 *
 * Windows implementation of `OsServicePort`, backed by servy-cli.exe. Service
 * argument construction is centralized in
 * `kernel/adapters/deploy/commands/servy-command.ts` so port-driven and
 * command-layer servy invocations stay byte-identical.
 */

import type { ProcessPort } from '../../kernel/ports/process-port.ts';
import type {
  OsServiceCommandResult,
  OsServiceInstallRequest,
  OsServiceOperation,
  OsServicePort,
} from '../ports/os-service-port.ts';
import {
  servyInstallArgs,
  servyLifecycleArgs,
} from '../../kernel/adapters/deploy/commands/servy-command.ts';

/** Options for constructing a Servy OS-service adapter. */
export interface ServyOsServiceAdapterOptions {
  /** Path to servy-cli.exe. */
  readonly servyCliPath: string;

  /** Process execution port. */
  readonly process: ProcessPort;
}

/** Windows `OsServicePort` adapter backed by servy-cli.exe. */
export class ServyOsServiceAdapter implements OsServicePort {
  /** Create a Servy OS-service adapter. */
  constructor(private readonly options: ServyOsServiceAdapterOptions) {}

  /** Install a service from its Servy XML config. */
  async install(
    request: OsServiceInstallRequest,
  ): Promise<OsServiceCommandResult> {
    return await this.runCommand(servyInstallArgs(request));
  }

  /** Run a lifecycle operation against a full Windows service name. */
  async run(
    operation: Exclude<OsServiceOperation, 'install'>,
    serviceName: string,
  ): Promise<OsServiceCommandResult> {
    return await this.runCommand(servyLifecycleArgs(operation, serviceName));
  }

  /** Execute a Servy CLI invocation and translate its output to a structured result. */
  private async runCommand(args: readonly string[]): Promise<OsServiceCommandResult> {
    const result = await this.options.process.exec(this.options.servyCliPath, [...args]);
    const message = result.stdout.trim() ||
      result.stderr.trim() ||
      (result.code === 0 ? 'OK' : 'servy-cli exited non-zero (no output captured)');
    return {
      success: result.code === 0,
      message,
      code: result.code,
    };
  }
}
