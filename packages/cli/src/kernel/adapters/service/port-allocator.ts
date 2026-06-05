/**
 * @module infra/service/port-allocator
 *
 * Port allocation for service resources.
 */

import { join } from '@std/path';
import { PORT_RANGES } from '../../constants/port-ranges.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { PortAllocation } from '../../domain/service-shape.ts';

/** Allocates ports inside `PORT_RANGES.SERVICE`. */
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
    requestedPort?: number,
  ): Promise<PortAllocation> {
    const usedPorts = await this.discoverUsedPorts(projectRoot);

    if (requestedPort !== undefined) {
      this.validateInRange(requestedPort);
      this.validateAvailable(requestedPort, usedPorts);
      return { port: requestedPort, source: 'user' };
    }

    return { port: this.findNextAvailable(usedPorts), source: 'auto' };
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
        Services?: Record<string, { Port?: unknown }>;
      };
    };
    const services = raw.NetScript?.Services ?? {};
    const ports = new Set<number>();

    for (const entry of Object.values(services)) {
      if (typeof entry.Port === 'number') {
        ports.add(entry.Port);
      }
    }

    return ports;
  }

  private findNextAvailable(usedPorts: Set<number>): number {
    const { start, end } = PORT_RANGES.SERVICE;
    for (let port = start; port <= end; port++) {
      if (!usedPorts.has(port)) return port;
    }
    throw new ScaffoldValidationError(
      `Service port range exhausted (${start}-${end}).`,
      { start, end },
    );
  }

  private validateInRange(port: number): void {
    const { start, end } = PORT_RANGES.SERVICE;
    if (port < start || port > end) {
      throw new ScaffoldValidationError(
        `Port ${port} is outside SERVICE range (${start}-${end}).`,
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
