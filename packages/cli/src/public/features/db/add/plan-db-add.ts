import { join } from '@std/path';

import { DbEngineRegistry } from '../../../../kernel/application/registries/db-engine-registry.ts';
import type { DbEngine } from '../../../../kernel/domain/db-engine.ts';
import { SCAFFOLD_FILES } from '../../../../kernel/constants/scaffold/scaffold-files.ts';
import { ScaffoldValidationError } from '../../../../kernel/domain/errors.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { DbAddPlan, DbAddRequest } from '../../../domain/db-add-plan.ts';

/** Dependencies used while planning a database-add flow. */
export interface PlanDbAddDependencies {
  /** Filesystem used to read project metadata. */
  readonly fs: FileSystemPort;

  /** Engine provider registry. */
  readonly registry?: DbEngineRegistry;
}

/** Resolve and validate the database-add request before writing files. */
export async function planDbAdd(
  request: DbAddRequest,
  dependencies: PlanDbAddDependencies,
): Promise<DbAddPlan> {
  const registry = dependencies.registry ?? new DbEngineRegistry();
  const engine = parseDbEngine(request.engine, registry);
  const provider = registry.get(engine);
  const configKey = request.configKey ?? provider.engine;
  const projectName = await readProjectName(dependencies.fs, request.projectRoot);

  return {
    engine,
    configKey,
    projectName,
    projectRoot: request.projectRoot,
    overwrite: request.overwrite,
  };
}

function parseDbEngine(engineRaw: string, registry: DbEngineRegistry): DbEngine {
  const engine = engineRaw.toLowerCase() as DbEngine;
  if (!registry.has(engine)) {
    throw new ScaffoldValidationError(`Unsupported database engine: ${engineRaw}`, {
      supportedEngines: registry.engines(),
    });
  }
  return engine;
}

async function readProjectName(fs: FileSystemPort, projectRoot: string): Promise<string> {
  const appsettingsPath = join(projectRoot, SCAFFOLD_FILES.APPSETTINGS);
  if (await fs.exists(appsettingsPath)) {
    const parsed = JSON.parse(await fs.readFile(appsettingsPath)) as unknown;
    const name = asRecord(asRecord(parsed).NetScript).Name;
    if (typeof name === 'string') {
      return name;
    }
  }
  return projectRoot.split(/[\\/]/).pop() ?? 'app';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
