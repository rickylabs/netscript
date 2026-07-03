/**
 * @module public/adapters/os-service-factory
 *
 * Resolve the `OsServicePort` implementation for a target OS: the servy adapter
 * for Windows, the systemd adapter for Linux. Lives in `public/adapters`
 * because it constructs the public adapters (hexagonal-layer symmetry).
 */

import type { ProcessPort } from '../../kernel/ports/process-port.ts';
import type { OsServicePort } from '../ports/os-service-port.ts';
import type { ServiceOs } from '../../kernel/adapters/deploy/runtime-detect.ts';
import { DEFAULT_SERVY_CLI_PATH } from '../../kernel/constants/windows.ts';
import { DEFAULT_SYSTEMCTL_PATH } from '../../kernel/constants/linux.ts';
import { ServyOsServiceAdapter } from './servy-os-service.ts';
import { SystemdOsServiceAdapter } from './systemd-os-service.ts';

/** Inputs for building an OS service adapter. */
export interface OsServiceFactoryOptions {
  /** Process execution port. */
  readonly process: ProcessPort;

  /** Path to servy-cli.exe (Windows). Defaults to the servy default. */
  readonly servyCliPath?: string;

  /** Path to the systemctl CLI (Linux). Defaults to `systemctl`. */
  readonly systemctlPath?: string;
}

/** Build the `OsServicePort` for the given OS. */
export function createOsServicePort(
  os: ServiceOs,
  options: OsServiceFactoryOptions,
): OsServicePort {
  if (os === 'windows') {
    return new ServyOsServiceAdapter({
      servyCliPath: options.servyCliPath ?? DEFAULT_SERVY_CLI_PATH,
      process: options.process,
    });
  }
  return new SystemdOsServiceAdapter({
    systemctlPath: options.systemctlPath ?? DEFAULT_SYSTEMCTL_PATH,
    process: options.process,
  });
}
