/**
 * @module public/ports/os-service-port
 *
 * OS-agnostic service lifecycle port. One narrow seam satisfied by both the
 * Windows (servy) and Linux (systemd) service-manager adapters.
 */

/** Supported OS service lifecycle operations. */
export type OsServiceOperation = 'install' | 'start' | 'stop' | 'status' | 'uninstall';

/** Result returned by an OS service operation. */
export interface OsServiceCommandResult {
  /** Whether the operation completed successfully. */
  readonly success: boolean;

  /** Human-readable process output. */
  readonly message: string;

  /** Native process exit code when available. */
  readonly code: number;
}

/** Service registration request. */
export interface OsServiceInstallRequest {
  /** Full OS service/unit name. */
  readonly serviceName: string;

  /** Path to the service config file to import (servy XML / systemd unit). */
  readonly configPath: string;

  /** Whether an existing registration may be overwritten. */
  readonly force: boolean;
}

/** Abstraction over OS service registration and lifecycle operations. */
export interface OsServicePort {
  /** Install a service from its service-manager config. */
  install(request: OsServiceInstallRequest): Promise<OsServiceCommandResult>;

  /** Run a lifecycle operation against a full service name. */
  run(
    operation: Exclude<OsServiceOperation, 'install'>,
    serviceName: string,
  ): Promise<OsServiceCommandResult>;
}
