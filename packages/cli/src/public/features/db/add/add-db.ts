import { DbEngineRegistry } from '../../../../kernel/application/registries/db-engine-registry.ts';
import { UseCase } from '../../../../kernel/application/abstracts/use-case.ts';
import { DatabaseWorkspaceMutator } from '../../../../kernel/adapters/database/workspace-mutator.ts';
import type { FileSystemPort } from '../../../../kernel/ports/file-system-port.ts';
import type { AddDbResult } from '../../../domain/db-add-plan.ts';
import type { AddDbInput } from './add-db-input.ts';
import { planDbAdd } from './plan-db-add.ts';
import { type RenderDbDependencies, renderDbWorkspace } from './render-db.ts';

/** Dependencies used by the public database-add flow. */
export interface AddDbDependencies extends RenderDbDependencies {
  /** Filesystem used to read project metadata. */
  readonly fs: FileSystemPort;

  /** Engine provider registry. */
  readonly registry?: DbEngineRegistry;

  /** Workspace config mutator for root project updates. */
  readonly workspaceMutator: DatabaseWorkspaceMutator;
}

/** Public add-db use case. */
export class AddDbUseCase extends UseCase<AddDbInput, AddDbResult> {
  readonly id = 'public.db.add';

  constructor(private readonly dependencies: AddDbDependencies) {
    super();
  }

  execute(request: AddDbInput): Promise<AddDbResult> {
    return executeAddDb(request, this.dependencies);
  }
}

/** Add a database workspace to an existing NetScript project. */
export async function addDb(
  request: AddDbInput,
  dependencies: AddDbDependencies,
): Promise<AddDbResult> {
  return await new AddDbUseCase(dependencies).execute(request);
}

async function executeAddDb(
  request: AddDbInput,
  dependencies: AddDbDependencies,
): Promise<AddDbResult> {
  const registry = dependencies.registry ?? new DbEngineRegistry();
  const plan = await planDbAdd(request, { fs: dependencies.fs, registry });
  const provider = registry.get(plan.engine);
  const scaffold = await renderDbWorkspace(plan, dependencies);

  await dependencies.workspaceMutator.addDatabaseToAppsettings(plan.projectRoot, {
    configKey: plan.configKey,
    engine: plan.engine,
    databaseName: scaffold.databaseName,
  });
  await dependencies.workspaceMutator.addDatabaseWorkspaceMember(
    plan.projectRoot,
    provider.dirName,
  );
  await dependencies.workspaceMutator.regenerateAspireConfig(plan.projectRoot);
  const appHostHelpers = await dependencies.workspaceMutator.regenerateAppHostHelpers(
    plan.projectRoot,
  );

  return { scaffold, appHostHelpers };
}
