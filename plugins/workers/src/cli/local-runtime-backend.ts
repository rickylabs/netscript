import {
  artifactText,
  type PluginCliArgs,
  type PluginCliResult,
  type ScaffoldArtifact,
} from '@netscript/plugin/adapter';
import { LocalProjectFiles, type ProjectFiles } from '@netscript/plugin/cli';
import {
  createDefaultTaskExecutor,
  type TaskDefinition,
  type TaskExecutionOptions,
  type TaskResult,
} from '@netscript/plugin-workers-core/executor';
import {
  jobScaffolder,
  parseJobInput,
  parseTaskInput,
  parseWorkerResourceMetadata,
  parseWorkflowInput,
  taskScaffolder,
  updateWorkerResourceMetadata,
  type WorkerResourceMetadata,
  workflowScaffolder,
} from '../adapter/resources/mod.ts';
import {
  FetchWorkersRuntimeApiClient,
  type WorkersRuntimeApiClient,
} from './adapters/runtime-api-client.ts';
import type { WorkersCliBackend, WorkersCliCommandDefinition } from './command-types.ts';
import { compileWorkersRegistry } from './registry-compiler.ts';

/** Task executor surface consumed by `run-task`. */
export type TaskExecutorLike = Readonly<{
  execute(task: TaskDefinition, options?: TaskExecutionOptions): Promise<TaskResult>;
}>;

/** Options for local workers runtime CLI command execution. */
export interface LocalWorkersRuntimeBackendOptions {
  /** Project file adapter. */
  readonly files?: ProjectFiles;
  /** Durable workers API client. */
  readonly runtime?: WorkersRuntimeApiClient;
  /** Multi-runtime task executor override. */
  readonly taskExecutor?: TaskExecutorLike;
  /** Streaming task output sink. */
  readonly output?: (line: string, stream: 'stdout' | 'stderr') => void;
}

/** Local backend for worker project management and durable runtime commands. */
export class LocalWorkersRuntimeBackend implements WorkersCliBackend {
  readonly #files: ProjectFiles;
  readonly #runtime: WorkersRuntimeApiClient;
  readonly #taskExecutor: TaskExecutorLike;
  readonly #output?: (line: string, stream: 'stdout' | 'stderr') => void;

  /** Create a local workers runtime backend. */
  constructor(options: LocalWorkersRuntimeBackendOptions = {}) {
    this.#files = options.files ?? new LocalProjectFiles();
    this.#runtime = options.runtime ?? new FetchWorkersRuntimeApiClient();
    this.#taskExecutor = options.taskExecutor ?? createDefaultTaskExecutor();
    this.#output = options.output;
  }

  /** Run a workers CLI command against project files or the durable runtime. */
  async handle(
    definition: WorkersCliCommandDefinition,
    args: PluginCliArgs,
  ): Promise<PluginCliResult> {
    try {
      return await this.handleChecked(definition, args);
    } catch (error) {
      return { code: 1, message: error instanceof Error ? error.message : String(error) };
    }
  }

  private async handleChecked(
    definition: WorkersCliCommandDefinition,
    args: PluginCliArgs,
  ): Promise<PluginCliResult> {
    switch (definition.name) {
      case 'add-job':
        return await this.writeArtifactsAndCompile(
          'Worker job created.',
          jobScaffolder.emit(parseJobInput(args)),
        );
      case 'add-task': {
        const input = parseTaskInput(args);
        return await this.writeArtifactsAndCompile(
          'Worker task created.',
          taskScaffolder.emit(input),
          { runtime: input.runtime },
        );
      }
      case 'add-workflow':
        return await this.writeArtifactsAndCompile(
          'Worker workflow created.',
          workflowScaffolder.emit(parseWorkflowInput(args)),
        );
      case 'list-jobs':
        return await this.listResources('job', args);
      case 'list-tasks':
        return await this.listResources('task', args);
      case 'show-job':
        return await this.showResource('job', args);
      case 'show-task':
        return await this.showResource('task', args);
      case 'executions':
        return await this.executions(args);
      case 'trigger':
      case 'run':
        return await this.triggerJob(args);
      case 'run-task':
        return await this.runTask(args);
      case 'update-job':
        return await this.updateResource('job', args);
      case 'update-task':
        return await this.updateResource('task', args);
      case 'remove-job':
        return await this.removeResource('job', args);
      case 'remove-task':
        return await this.removeResource('task', args);
      case 'compile-registry':
        return await this.compileRegistry();
      case 'logs':
        return await this.logs(args);
      case 'config-edit':
        return await this.configEdit(args);
      case 'config-publish':
        return await this.configPublish(args);
      case 'enable':
        return await this.setJobEnabled(args, true);
      case 'disable':
        return await this.setJobEnabled(args, false);
    }
  }

  private async writeArtifactsAndCompile(
    message: string,
    artifacts: readonly ScaffoldArtifact[],
    extra: Readonly<Record<string, unknown>> = {},
  ): Promise<PluginCliResult> {
    for (const artifact of artifacts) {
      await this.#files.writeTextFile(artifact.path, artifactText(artifact));
    }
    const registry = await compileWorkersRegistry(this.#files);
    return ok(message, {
      files: artifacts.map((artifact) => artifact.path),
      ...extra,
      registry,
    });
  }

  private async listResources(
    kind: 'job' | 'task',
    args: PluginCliArgs,
  ): Promise<PluginCliResult> {
    let resources = await this.readResources(kind);
    const topic = flag(args, 'topic');
    const type = flag(args, 'type');
    if (topic !== undefined) resources = resources.filter((item) => item.topic === topic);
    if (type !== undefined) resources = resources.filter((item) => item.runtime === type);
    if (booleanFlag(args, 'enabled-only')) resources = resources.filter((item) => item.enabled);
    const key = kind === 'job' ? 'jobs' : 'tasks';
    return ok(`Found ${resources.length} worker ${key}.`, { [key]: resources });
  }

  private async showResource(
    kind: 'job' | 'task',
    args: PluginCliArgs,
  ): Promise<PluginCliResult> {
    const id = requiredValue(args, `${kind} id`);
    const resource = await this.findResource(kind, id);
    return resource
      ? ok(`Worker ${kind} metadata loaded.`, { [kind]: resource })
      : fail(`Worker ${kind} ${id} was not found.`);
  }

  private async executions(args: PluginCliArgs): Promise<PluginCliResult> {
    const data = await this.#runtime.request('executions', {
      query: { limit: numberFlag(args, 'limit'), status: flag(args, 'status') },
    });
    return ok('Worker executions loaded.', data);
  }

  private async triggerJob(args: PluginCliArgs): Promise<PluginCliResult> {
    const id = requiredValue(args, 'job id');
    const payload = parseJsonFlag(args, 'payload');
    const data = await this.#runtime.request(`jobs/${encodeURIComponent(id)}/trigger`, {
      method: 'POST',
      body: payload === undefined ? {} : { payload: requireJsonObject(payload, '--payload') },
    });
    return ok('Worker job enqueued.', data);
  }

  private async runTask(args: PluginCliArgs): Promise<PluginCliResult> {
    const id = requiredValue(args, 'task id');
    const resource = await this.findResource('task', id);
    if (!resource) return fail(`Worker task ${id} was not found.`);
    const task = await this.resolveTaskDefinition(resource);
    const result = await this.#taskExecutor.execute(task, {
      args: parseStringArrayFlag(args, 'args'),
      env: parseStringRecordFlag(args, 'env'),
      timeout: numberFlag(args, 'timeout'),
      cwd: this.#files.projectRoot,
      streamLogs: true,
      onStdout: (line) => this.#output?.(line, 'stdout'),
      onStderr: (line) => this.#output?.(line, 'stderr'),
    });
    return result.success
      ? ok('Worker task completed.', { result })
      : { code: 1, message: result.error ?? 'Worker task failed.', data: { result } };
  }

  private async updateResource(
    kind: 'job' | 'task',
    args: PluginCliArgs,
  ): Promise<PluginCliResult> {
    const id = requiredValue(args, `${kind} id`);
    const resource = await this.findResource(kind, id);
    if (!resource) return fail(`Worker ${kind} ${id} was not found.`);
    const sourceEntrypoint = projectPath(resource.entrypoint);
    const source = await this.#files.readTextFile(sourceEntrypoint);
    if (source === undefined) {
      return fail(`Worker ${kind} source ${resource.entrypoint} was not found.`);
    }

    const targetEntrypoint = kind === 'task' && hasFlag(args, 'entrypoint')
      ? projectPath(requiredFlag(args, 'entrypoint'))
      : sourceEntrypoint;
    const updated: WorkerResourceMetadata = Object.freeze({
      ...resource,
      entrypoint: targetEntrypoint,
      ...(hasFlag(args, 'enabled') ? { enabled: booleanFlag(args, 'enabled') } : {}),
      ...(hasFlag(args, 'timeout') ? { timeout: numberFlag(args, 'timeout') } : {}),
      ...(hasFlag(args, 'max-retries') ? { maxRetries: numberFlag(args, 'max-retries') } : {}),
      ...(kind === 'job' && hasFlag(args, 'topic') ? { topic: flag(args, 'topic') } : {}),
      ...(kind === 'job' && hasFlag(args, 'schedule') ? { schedule: flag(args, 'schedule') } : {}),
      ...(kind === 'job' && hasFlag(args, 'tags') ? { tags: commaListFlag(args, 'tags') } : {}),
      ...(kind === 'task' && hasFlag(args, 'runtime')
        ? { runtime: requiredFlag(args, 'runtime') }
        : {}),
    });
    await this.#files.writeTextFile(
      targetEntrypoint,
      updateWorkerResourceMetadata(source, updated),
    );
    if (targetEntrypoint !== sourceEntrypoint) await this.#files.removeFile(sourceEntrypoint);
    const registry = await compileWorkersRegistry(this.#files);
    return ok(`Worker ${kind} updated.`, { [kind]: updated, registry });
  }

  private async removeResource(
    kind: 'job' | 'task',
    args: PluginCliArgs,
  ): Promise<PluginCliResult> {
    const id = requiredValue(args, `${kind} id`);
    const resource = await this.findResource(kind, id);
    if (!resource) return fail(`Worker ${kind} ${id} was not found.`);
    await this.#files.removeFile(projectPath(resource.entrypoint));
    const registry = await compileWorkersRegistry(this.#files);
    return ok(`Worker ${kind} removed.`, { id, file: resource.entrypoint, registry });
  }

  private async readResources(
    kind: 'job' | 'task',
  ): Promise<readonly WorkerResourceMetadata[]> {
    const path = kind === 'job' ? 'workers/jobs' : 'workers/tasks';
    const extensions = kind === 'job' ? ['.ts'] : ['.ts', '.tsx', '.py', '.sh', '.ps1', '.cmd'];
    const primary = await this.#files.listFiles(path, extensions);
    const external = kind === 'task'
      ? (await this.#files.listFiles('', extensions)).filter((file) =>
        !file.relativePath.startsWith('workers/tasks/')
      )
      : [];
    const files = [...primary, ...external];
    const resources = await Promise.all(files.map(async (file) => {
      const source = await this.#files.readTextFile(file.relativePath) ?? '';
      if (
        kind === 'task' && !file.relativePath.startsWith('workers/tasks/') &&
        !source.includes('netscript-workers-resource: ')
      ) return undefined;
      return parseWorkerResourceMetadata(source, file.relativePath, kind);
    }));
    return resources.filter(isWorkerResourceMetadata);
  }

  private async findResource(
    kind: 'job' | 'task',
    id: string,
  ): Promise<WorkerResourceMetadata | undefined> {
    return (await this.readResources(kind)).find((resource) => resource.id === id);
  }

  private async resolveTaskDefinition(resource: WorkerResourceMetadata): Promise<TaskDefinition> {
    const entrypoint = projectPath(resource.entrypoint);
    if (resource.runtime === 'deno') {
      const module = await import(this.#files.toImportUrl(entrypoint));
      const definition = Object.values(module).find(isTaskDefinition);
      if (definition) return definition;
    }
    return {
      id: resource.id,
      type: resource.runtime ?? 'deno',
      entrypoint,
      timeout: resource.timeout,
    };
  }

  private async compileRegistry(): Promise<PluginCliResult> {
    const result = await compileWorkersRegistry(this.#files);
    return ok('Worker job registry compiled.', result);
  }

  private async logs(args: PluginCliArgs): Promise<PluginCliResult> {
    const executionId = requiredValue(args, 'execution id');
    const path = `.netscript/logs/workers/${executionId}.log`;
    const content = await this.#files.readTextFile(path);
    return content === undefined
      ? fail(`No worker log found for execution ${executionId}.`)
      : ok('Worker execution log loaded.', { executionId, log: content });
  }

  private async configEdit(args: PluginCliArgs): Promise<PluginCliResult> {
    const topic = requiredValue(args, 'config topic');
    const path = `.netscript/runtime/${topic}.json`;
    if (await this.#files.readTextFile(path) === undefined) {
      await this.#files.writeTextFile(path, `${JSON.stringify({ jobs: {} }, null, 2)}\n`);
    }
    return ok('Worker runtime config ready.', { topic, path });
  }

  private async configPublish(args: PluginCliArgs): Promise<PluginCliResult> {
    const topic = requiredValue(args, 'config topic');
    const path = `.netscript/runtime/${topic}.json`;
    const content = await this.#files.readTextFile(path);
    return content === undefined
      ? fail(`Worker runtime config ${topic} does not exist.`)
      : ok('Worker runtime config published.', { topic, path, config: JSON.parse(content) });
  }

  private async setJobEnabled(args: PluginCliArgs, enabled: boolean): Promise<PluginCliResult> {
    return await this.updateResource('job', {
      ...args,
      flags: { ...args.flags, enabled },
    });
  }
}

function ok(message: string, data: unknown): PluginCliResult {
  return { code: 0, message, data };
}

function fail(message: string): PluginCliResult {
  return { code: 1, message };
}

function requiredValue(args: PluginCliArgs, label: string): string {
  const value = args.values?.[0];
  if (!value) throw new Error(`Missing ${label}.`);
  return value;
}

function flag(args: PluginCliArgs, name: string): string | undefined {
  const value = args.flags?.[name];
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : undefined;
}

function requiredFlag(args: PluginCliArgs, name: string): string {
  const value = flag(args, name);
  if (!value) throw new Error(`Flag --${name} requires a value.`);
  return value;
}

function hasFlag(args: PluginCliArgs, name: string): boolean {
  return Object.prototype.hasOwnProperty.call(args.flags ?? {}, name);
}

function booleanFlag(args: PluginCliArgs, name: string): boolean {
  const value = args.flags?.[name];
  return value === true || value === 1 || value === '1' || value === 'true';
}

function numberFlag(args: PluginCliArgs, name: string): number | undefined {
  const value = flag(args, name);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Flag --${name} must be a number.`);
  return parsed;
}

function parseJsonFlag(args: PluginCliArgs, name: string): unknown {
  const value = flag(args, name);
  return value === undefined ? undefined : JSON.parse(value);
}

function commaListFlag(args: PluginCliArgs, name: string): readonly string[] {
  return (flag(args, name) ?? '').split(',').map((item) => item.trim()).filter(Boolean);
}

function parseStringArrayFlag(args: PluginCliArgs, name: string): readonly string[] | undefined {
  const parsed = parseJsonFlag(args, name);
  if (parsed === undefined) return undefined;
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === 'string')) {
    throw new Error(`Flag --${name} must be a JSON string array.`);
  }
  return parsed;
}

function parseStringRecordFlag(
  args: PluginCliArgs,
  name: string,
): Readonly<Record<string, string>> | undefined {
  const parsed = parseJsonFlag(args, name);
  if (parsed === undefined) return undefined;
  if (
    typeof parsed !== 'object' || parsed === null || Array.isArray(parsed) ||
    !Object.values(parsed).every((value) => typeof value === 'string')
  ) {
    throw new Error(`Flag --${name} must be a JSON object with string values.`);
  }
  return parsed as Record<string, string>;
}

function requireJsonObject(value: unknown, flagName: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${flagName} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function isTaskDefinition(value: unknown): value is TaskDefinition {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' && typeof record.type === 'string';
}

function isWorkerResourceMetadata(
  value: WorkerResourceMetadata | undefined,
): value is WorkerResourceMetadata {
  return value !== undefined;
}

function projectPath(path: string): string {
  const normalized = path.trim().replaceAll('\\', '/').replace(/^\.\//, '');
  if (!normalized || normalized.startsWith('/') || normalized.split('/').includes('..')) {
    throw new Error('Worker resource paths must stay inside the project root.');
  }
  return normalized;
}
