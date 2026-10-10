/**
 * @module infra/database/select-operation-executor
 */

import { join } from '@std/path';

import { SCAFFOLD_DIRS } from '../../../constants/scaffold/scaffold-dirs.ts';
import { SCAFFOLD_FILES } from '../../../constants/scaffold/scaffold-files.ts';
import type { DbOperationExecutor } from '../../../domain/db-engine.ts';
import type { FileSystemPort } from '../../../ports/file-system-port.ts';
import { DbOperationRunner } from './operation-runner.ts';
import { DbWorkspaceTaskRunner } from './workspace-task-runner.ts';

/**
 * Choose how database operations reach the database: through the project's
 * Aspire AppHost when it was scaffolded, otherwise directly through the
 * generated database workspace tasks. A project without `aspire/apphost.mts`
 * never tries to start an AppHost that does not exist.
 *
 * @param projectRoot - Absolute project root.
 * @param fs - Filesystem adapter.
 * @returns The executor for this project's layout.
 */
export async function selectDbOperationExecutor(
  projectRoot: string,
  fs: FileSystemPort,
): Promise<DbOperationExecutor> {
  const apphostPath = join(projectRoot, SCAFFOLD_DIRS.ASPIRE_TS, SCAFFOLD_FILES.APPHOST_MTS);
  return await fs.exists(apphostPath) ? new DbOperationRunner() : new DbWorkspaceTaskRunner(fs);
}
