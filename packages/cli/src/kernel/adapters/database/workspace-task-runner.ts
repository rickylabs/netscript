/**
 * @module infra/database/workspace-task-runner
 *
 * Runs database operations directly through the generated database workspace
 * tasks, for projects scaffolded without an Aspire AppHost (`init --no-aspire`).
 * The connection comes from the caller's environment (`<KEY>_URI` or
 * `DATABASE_URL`), exactly as the workspace's `prisma.config.ts` resolves it.
 */

import { join } from '@std/path';

import { SCAFFOLD_FILES } from '../../constants/scaffold/scaffold-files.ts';
import { ScaffoldValidationError } from '../../domain/errors.ts';
import type {
  DbOperation,
  DbOperationExecutor,
  DbOperationRequest,
  DiscoveredDatabase,
} from '../../domain/db-engine.ts';
import type { FileSystemPort } from '../../ports/file-system-port.ts';
import { outputText } from '../../presentation/output/default-output.ts';
import { databaseUrlEnvKey } from '../../templates/database/generate-prisma-config.ts';
import { buildDbTaskEnv } from './operation-runner-helpers.ts';

/** Spawns `deno task <name>` with inherited stdio and returns its exit code. */
export type DenoTaskSpawner = (
  task: string,
  options: { readonly cwd: string; readonly env: Record<string, string> },
) => Promise<number>;

/**
 * Select the task operation the AppHost would run for the same request, so a
 * project behaves identically with and without Aspire: `migrate` without a
 * migration name applies pending migrations (`deploy`).
 */
export function resolveDbTaskOperation(
  operation: DbOperation,
  migrationName?: string,
): DbOperation {
  return operation === 'migrate' && !migrationName ? 'deploy' : operation;
}

/** Executes database operations as `deno task db:<operation>:<engine>` in each database workspace. */
export class DbWorkspaceTaskRunner implements DbOperationExecutor {
  constructor(
    private readonly fs: FileSystemPort,
    private readonly spawnTask: DenoTaskSpawner = spawnDenoTask,
  ) {}

  /** Execute a database operation and return its process exit code. */
  async execute(request: DbOperationRequest): Promise<number> {
    const databases = request.target.kind === 'all'
      ? request.target.databases
      : [request.target.database];
    const selected = request.operation === 'studio' ? databases.slice(0, 1) : databases;

    for (const database of selected) {
      const code = await this.executeOne(request, database);
      if (code !== 0) return code;
    }
    return 0;
  }

  private async executeOne(
    request: DbOperationRequest,
    database: DiscoveredDatabase,
  ): Promise<number> {
    const operation = resolveDbTaskOperation(request.operation, request.migrationName);
    const task = `db:${operation}:${database.engine}`;
    const workdir = join(request.projectRoot, database.workspaceDir);
    await this.assertTaskExists(workdir, database, task);

    outputText(
      `No Aspire AppHost in this project; running db ${request.operation} for ` +
        `${database.configKey} with 'deno task --cwd ${database.workspaceDir} ${task}'.`,
    );
    const code = await this.spawnTask(task, {
      cwd: workdir,
      env: buildDbTaskEnv(
        request.operation,
        database.configKey,
        request.migrationName,
        request.interactive,
      ),
    });
    if (code === 0) outputText(`db ${request.operation} completed successfully.`);
    return code;
  }

  private async assertTaskExists(
    workdir: string,
    database: DiscoveredDatabase,
    task: string,
  ): Promise<void> {
    const { workspaceDir } = database;
    const denoJsonPath = join(workdir, SCAFFOLD_FILES.DENO_JSON);
    const tasks = await this.fs.exists(denoJsonPath)
      ? readTasks(await this.fs.readFile(denoJsonPath))
      : undefined;
    if (tasks && task in tasks) return;

    throw new ScaffoldValidationError(
      `Cannot run '${task}': this project has no Aspire AppHost (aspire/${SCAFFOLD_FILES.APPHOST_MTS}) ` +
        `and ${workspaceDir}/${SCAFFOLD_FILES.DENO_JSON} does not define that task. ` +
        `Restore the generated database workspace tasks, then run ` +
        `'deno task --cwd ${workspaceDir} ${task}' with ${databaseUrlEnvKey(database.configKey)} or DATABASE_URL set.`,
      { workspaceDir, task },
    );
  }
}

function readTasks(denoJson: string): Record<string, unknown> | undefined {
  const parsed: unknown = JSON.parse(denoJson);
  if (typeof parsed !== 'object' || parsed === null) return undefined;
  const tasks = Reflect.get(parsed, 'tasks');
  return typeof tasks === 'object' && tasks !== null
    ? tasks as Record<string, unknown>
    : undefined;
}

async function spawnDenoTask(
  task: string,
  options: { readonly cwd: string; readonly env: Record<string, string> },
): Promise<number> {
  const child = new Deno.Command('deno', {
    args: ['task', task],
    cwd: options.cwd,
    env: options.env,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  }).spawn();
  return (await child.status).code;
}
