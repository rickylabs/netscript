/**
 * @module infra/service/workspace-resolver
 *
 * Service discovery from scaffolded workspace config.
 */

import { join } from '@std/path';
import { SCAFFOLD_DIRS } from '../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import type { DiscoveredService, ServiceConfigEntry } from '../../domain/service-shape.ts';

/** Discovers service entries from `appsettings.json`. */
export class ServiceWorkspaceResolver {
  /** Create a service workspace resolver. */
  constructor(private readonly fs: FileSystemPort) {}

  /**
   * Discover configured services.
   *
   * @param projectRoot - Absolute project root path
   * @returns Service entries sorted by name
   */
  async discoverServices(projectRoot: string): Promise<readonly DiscoveredService[]> {
    const services = await this.readServices(projectRoot);
    return Object.entries(services)
      .map(([name, entry]) => ({
        name,
        enabled: entry.Enabled ?? true,
        runtime: 'deno' as const,
        port: entry.Port,
        entrypoint: entry.Entrypoint ?? 'src/main.ts',
        workdir: entry.Workdir ?? `${SCAFFOLD_DIRS.SERVICES}/${name}`,
        serviceReferences: entry.ServiceReferences ?? [],
      }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  /**
   * Check whether a service is already configured.
   *
   * @param projectRoot - Absolute project root path
   * @param serviceName - Service name to look up
   * @returns Whether the service exists in config
   */
  async serviceExists(projectRoot: string, serviceName: string): Promise<boolean> {
    const services = await this.readServices(projectRoot);
    return serviceName in services;
  }

  private async readServices(
    projectRoot: string,
  ): Promise<Record<string, ServiceConfigEntry>> {
    const configPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
    if (!await this.fs.exists(configPath)) return {};

    const raw = JSON.parse(await this.fs.readFile(configPath)) as {
      NetScript?: { Services?: Record<string, ServiceConfigEntry> };
    };
    return raw.NetScript?.Services ?? {};
  }
}
