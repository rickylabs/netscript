/**
 * @module infra/windows/manifest
 *
 * Service discovery manifest generator.
 * Writes .deploy/windows/config/services.json — a human and machine-readable
 * summary of all deployed services, their URLs, and infrastructure details.
 */

import { join } from '@std/path';
import type { CompileTarget } from '../../../domain/deploy/compile-target.ts';
import type { InfrastructureConfig } from '../../../domain/infrastructure-config.ts';
import type { ManifestServiceEntry, ServiceManifest } from '../../../domain/service-manifest.ts';

/**
 * Mask a password inside a connection string URI.
 * Replaces the password segment with `****` for safe display.
 */
function maskPassword(connectionString: string): string {
  // URI format: scheme://user:password@host:port/db
  return connectionString.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3');
}

/**
 * Generate the service discovery manifest for all compile targets.
 *
 * @param name - Application name
 * @param version - Application version
 * @param targets - All compile targets
 * @param infra - Resolved infrastructure configuration
 */
export function generateServiceManifest(
  name: string,
  version: string,
  targets: CompileTarget[],
  infra: InfrastructureConfig,
): ServiceManifest {
  const services: Record<string, ManifestServiceEntry> = {};

  for (const target of targets) {
    if (target.port) {
      // Services/plugins/apps with HTTP ports get URL and health endpoint
      services[target.name] = {
        url: `http://localhost:${target.port}`,
        health: `http://localhost:${target.port}/health`,
        type: target.type,
      };
    } else {
      // Background workers/processors without HTTP ports (workers-combined,
      // workers-scheduler, workers-worker, sagas-combined, trigger-processor)
      // still need to be in the manifest so install/start/stop/status find them.
      services[target.name] = {
        type: target.type,
      };
    }
  }

  const additionalDatabases: Record<string, string> | undefined =
    Object.keys(infra.additionalDatabases).length > 0
      ? Object.fromEntries(
        Object.entries(infra.additionalDatabases).map(([k, v]) => [
          k,
          maskPassword(v.connectionString),
        ]),
      )
      : undefined;

  return {
    name,
    version,
    generatedAt: new Date().toISOString(),
    services,
    infrastructure: {
      database: maskPassword(infra.database.connectionString),
      ...(additionalDatabases ? { additionalDatabases } : {}),
      cache: maskPassword(infra.cache.connectionString),
      otlp: infra.otlpEndpoint,
    },
    dashboard: {
      url: `http://localhost:18888`,
    },
  };
}

/**
 * Write the service manifest to disk as services.json.
 *
 * @param manifest - Generated manifest object
 * @param configDir - Output directory (.deploy/windows/config/)
 * @returns Absolute path of the written file
 */
export async function writeServiceManifest(
  manifest: ServiceManifest,
  configDir: string,
): Promise<string> {
  await Deno.mkdir(configDir, { recursive: true });
  const outputPath = join(configDir, 'services.json');
  await Deno.writeTextFile(outputPath, JSON.stringify(manifest, null, 2));
  return outputPath;
}

/**
 * Topological sort of targets by their `dependsOn` graph.
 * Used to determine the correct startup and shutdown order.
 *
 * Returns targets in the order they should be started:
 * dependencies first, dependents last.
 */
export function topologicalSort(targets: CompileTarget[]): CompileTarget[] {
  const nameToTarget = new Map(targets.map((t) => [t.name, t]));
  const visited = new Set<string>();
  const sorted: CompileTarget[] = [];

  function visit(name: string): void {
    if (visited.has(name)) return;
    visited.add(name);

    const target = nameToTarget.get(name);
    if (!target) return;

    for (const dep of target.dependsOn ?? []) {
      visit(dep);
    }

    sorted.push(target);
  }

  for (const target of targets) {
    visit(target.name);
  }

  return sorted;
}
