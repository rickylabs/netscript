/**
 * @module infra/database/workspace-resolver
 */

import { join } from '@std/path';

import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import { DbEngineRegistry } from '../../application/registries/db-engine-registry.ts';
import type { DbEngine, DiscoveredDatabase, ResolvedTarget } from '../../domain/db-engine.ts';

/** Resolves database workspaces from project configuration. */
export class DbWorkspaceResolver {
  /**
   * Create a workspace resolver.
   *
   * @param fs - Filesystem adapter.
   * @param registry - Engine provider registry.
   */
  constructor(
    private readonly fs: FileSystemPort,
    private readonly registry: DbEngineRegistry = new DbEngineRegistry(),
  ) {}

  /**
   * Discover configured databases from `appsettings.json`.
   *
   * @param projectRoot - Absolute project root.
   * @returns Enabled and disabled database entries.
   */
  async discoverDatabases(projectRoot: string): Promise<readonly DiscoveredDatabase[]> {
    const appsettingsPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
    if (!(await this.fs.exists(appsettingsPath))) {
      throw new ScaffoldValidationError('appsettings.json not found.', { projectRoot });
    }

    const raw = JSON.parse(await this.fs.readFile(appsettingsPath)) as unknown;
    const netScript = asRecord(asRecord(raw).NetScript);
    const databases = asRecord(netScript.Databases);
    const discovered: DiscoveredDatabase[] = [];

    for (const [configKey, value] of Object.entries(databases)) {
      const entry = asRecord(value);
      const engine = mapEngine(entry.Engine);
      const provider = this.registry.get(engine);
      discovered.push({
        configKey,
        engine,
        databaseName: typeof entry.DatabaseName === 'string' ? entry.DatabaseName : configKey,
        workspaceDir: join('database', provider.dirName),
        enabled: entry.Enabled !== false,
      });
    }

    return discovered;
  }

  /**
   * Resolve a CLI `--db` target.
   *
   * @param databases - Discovered databases.
   * @param dbFlag - Optional target flag.
   * @returns Concrete target.
   */
  resolveTarget(
    databases: readonly DiscoveredDatabase[],
    dbFlag?: string,
  ): ResolvedTarget {
    const enabled = databases.filter((database) => database.enabled);
    if (enabled.length === 0) {
      throw new ScaffoldValidationError('No enabled databases are configured.');
    }

    if (dbFlag === 'all') {
      return { kind: 'all', databases: enabled };
    }

    if (!dbFlag && enabled.length === 1) {
      return { kind: 'single', database: enabled[0] };
    }

    const match = enabled.find((database) => database.configKey === dbFlag) ??
      enabled.find((database) => database.databaseName === dbFlag);
    if (!match) {
      throw new ScaffoldValidationError(`Unknown database target: ${dbFlag ?? '(default)'}`, {
        target: dbFlag,
        configuredDatabases: enabled.map((database) => database.configKey),
      });
    }

    return { kind: 'single', database: match };
  }
}

/** Map config-schema engine names to CLI engine identifiers. */
export function mapEngine(engine: unknown): DbEngine {
  switch (engine) {
    case 'Postgres':
    case 'postgres':
      return 'postgres';
    case 'Mysql':
    case 'mysql':
      return 'mysql';
    case 'Mssql':
    case 'mssql':
      return 'mssql';
    case 'Sqlite':
    case 'sqlite':
      return 'sqlite';
    default:
      throw new ScaffoldValidationError(`Unsupported database engine: ${String(engine)}`, {
        engine,
      });
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
