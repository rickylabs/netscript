/**
 * @module public/adapters/servy-cli
 *
 * Servy CLI adapter for Windows service lifecycle operations.
 */

import type { ProcessPort } from '../../kernel/ports/process-port.ts';
import type {
  OsServiceCommandResult,
  OsServiceInstallRequest,
  OsServiceOperation,
  OsServicePort,
} from '../ports/os-service-port.ts';

/** Options for constructing a Servy CLI adapter. */
export interface ServyCliAdapterOptions {
  /** Path to servy-cli.exe. */
  readonly servyCliPath: string;

  /** Process execution port. */
  readonly process: ProcessPort;
}

/** Windows service adapter backed by servy-cli.exe. */
export class ServyCliAdapter implements OsServicePort {
  /** Create a Servy CLI adapter. */
  constructor(private readonly options: ServyCliAdapterOptions) {}

  /** Install a service from its Servy XML config. */
  async install(
    request: OsServiceInstallRequest,
  ): Promise<OsServiceCommandResult> {
    const args = ['install', '-n', request.serviceName, '-c', request.configPath, '-q'];
    if (request.force) {
      args.push('--force');
    }
    return await this.runCommand(args);
  }

  /** Run a lifecycle operation against a full Windows service name. */
  async run(
    operation: Exclude<OsServiceOperation, 'install'>,
    serviceName: string,
  ): Promise<OsServiceCommandResult> {
    return await this.runCommand([operation, '-n', serviceName, '-q']);
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
