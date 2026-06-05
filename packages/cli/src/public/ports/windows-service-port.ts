/**
 * @module public/ports/windows-service-port
 *
 * Public Windows service lifecycle port.
 */

/** Supported Windows service lifecycle operations. */
export type WindowsServiceOperation = 'install' | 'start' | 'stop' | 'status' | 'uninstall';

/** Result returned by a Windows service operation. */
export interface WindowsServiceCommandResult {
  /** Whether the operation completed successfully. */
  readonly success: boolean;

  /** Human-readable process output. */
  readonly message: string;

  /** Native process exit code when available. */
  readonly code: number;
}

/** Service registration request. */
export interface WindowsServiceInstallRequest {
  /** Full Windows service name. */
  readonly serviceName: string;

  /** Path to the service XML file to import. */
  readonly configPath: string;

  /** Whether an existing registration may be overwritten. */
  readonly force: boolean;
}

/** Abstraction over Windows service registration and lifecycle operations. */
export interface WindowsServicePort {
  /** Install a Windows service from its Servy XML config. */
  install(request: WindowsServiceInstallRequest): Promise<WindowsServiceCommandResult>;

  /** Run a lifecycle operation against a full Windows service name. */
  run(
    operation: Exclude<WindowsServiceOperation, 'install'>,
    serviceName: string,
  ): Promise<WindowsServiceCommandResult>;
}
