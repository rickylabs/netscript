/**
 * @module infra/service/port-allocator
 *
 * Port allocation for service resources.
 */

import { join } from '@std/path';
import { USER_PORT_RANGE } from '../../constants/port-ranges.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { PortAllocation } from '../../domain/service-shape.ts';
import { allocateScaffoldDefaultPort } from '../../domain/scaffold/default-port-allocation.ts';

/** Allocates deterministic standalone service fallbacks and validates explicit pins. */
export class PortAllocator {
  /** Create a service port allocator. */
  constructor(private readonly fs: FileSystemPort) {}

  /**
   * Allocate a port for a service.
   *
   * @param projectRoot - Absolute project root path
   * @param requestedPort - Optional user-requested port
   * @returns Allocated port and source
   */
  async allocate(
    projectRoot: string,
    projectName: string,
    serviceName: string,
    requestedPort?: number,
  ): Promise<PortAllocation> {
    const usedPorts = await this.discoverUsedPorts(projectRoot);

    if (requestedPort !== undefined) {
      this.validateInRange(requestedPort);
      this.validateAvailable(requestedPort, usedPorts);
      return { port: requestedPort, source: 'user' };
    }

    return {
      port: allocateScaffoldDefaultPort(projectName, `service:${serviceName}`, usedPorts),
      source: 'auto',
    };
  }

  /**
   * Discover currently configured service ports from `appsettings.json`.
   *
   * @param projectRoot - Absolute project root path
   * @returns Set of allocated service ports
   */
  async discoverUsedPorts(projectRoot: string): Promise<Set<number>> {
    const configPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
    if (!await this.fs.exists(configPath)) return new Set();

    const raw = JSON.parse(await this.fs.readFile(configPath)) as {
      NetScript?: {
        Services?: Record<string, { HostPort?: unknown; Port?: unknown }>;
        Plugins?: Record<string, { HostPort?: unknown; Port?: unknown }>;
        BackgroundProcessors?: Record<string, { HostPort?: unknown; Port?: unknown }>;
        Apps?: Record<string, { HostPort?: unknown; Port?: unknown }>;
      };
    };
    const ports = new Set<number>();

    for (const section of [
      raw.NetScript?.Services,
      raw.NetScript?.Plugins,
      raw.NetScript?.BackgroundProcessors,
      raw.NetScript?.Apps,
    ]) {
      for (const entry of Object.values(section ?? {})) {
        for (const value of [entry.HostPort, entry.Port]) {
          if (typeof value === 'number') ports.add(value);
        }
      }
    }

    return ports;
  }

  private validateInRange(port: number): void {
    const { start, end } = USER_PORT_RANGE;
    if (port < start || port > end) {
      throw new ScaffoldValidationError(
        `Port ${port} is outside the user port range (${start}-${end}).`,
        { port, start, end },
      );
    }
  }

  private validateAvailable(port: number, usedPorts: Set<number>): void {
    if (usedPorts.has(port)) {
      throw new ScaffoldValidationError(
        `Port ${port} is already allocated to another service.`,
        { port },
      );
    }
  }
}
