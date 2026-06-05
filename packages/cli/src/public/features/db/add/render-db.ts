import type { DatabaseScaffoldResult } from '../../../../kernel/domain/db-engine.ts';
import { DatabaseScaffolder } from '../../../../kernel/adapters/database/scaffolder.ts';
import type { DbAddPlan } from '../../../domain/db-add-plan.ts';

/** Dependencies used to render a database workspace. */
export interface RenderDbDependencies {
  /** Database workspace scaffolder. */
  readonly databaseScaffolder: DatabaseScaffolder;
}

/** Render the database workspace files for a validated plan. */
export async function renderDbWorkspace(
  plan: DbAddPlan,
  dependencies: RenderDbDependencies,
): Promise<DatabaseScaffoldResult> {
  return await dependencies.databaseScaffolder.scaffold({
    projectName: plan.projectName,
    targetPath: plan.projectRoot,
    engine: plan.engine,
    configKey: plan.configKey,
    importMode: 'jsr',
    overwrite: plan.overwrite,
  });
}
