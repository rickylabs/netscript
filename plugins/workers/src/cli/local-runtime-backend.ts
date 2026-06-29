import {
  artifactText,
  type PluginCliArgs,
  type PluginCliResult,
  type ScaffoldArtifact,
} from '@netscript/plugin/adapter';
import {
  jobScaffolder,
  parseJobInput,
  parseTaskInput,
  parseWorkflowInput,
  taskScaffolder,
  workflowScaffolder,
} from '../adapter/resources/mod.ts';
import { LocalProjectFiles, type ProjectFiles } from './adapters/local-project-files.ts';
import type { WorkersCliBackend, WorkersCliCommandDefinition } from './command-types.ts';
import { compileWorkersRegistry } from './registry-compiler.ts';

/** Options for local workers CLI command execution. */
export interface LocalWorkersRuntimeBackendOptions {
  /** Project file adapter. */
  readonly files?: ProjectFiles;
}

/** Local backend that implements workers runtime CLI verbs against project files. */
export class LocalWorkersRuntimeBackend implements WorkersCliBackend {
  private readonly files: ProjectFiles;

  /** Create a local workers runtime backend. */
  constructor(options: LocalWorkersRuntimeBackendOptions = {}) {
    this.files = options.files ?? new LocalProjectFiles();
  }

  /** Run a workers CLI command against the local project. */
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
        return await this.writeArtifacts(
          'Worker job created.',
          jobScaffolder.emit(parseJobInput(args)),
        );
      case 'add-task': {
        const input = parseTaskInput(args);
        return await this.writeArtifacts('Worker task created.', taskScaffolder.emit(input), {
          runtime: input.runtime,
        });
      }
      case 'add-workflow':
        return await this.writeArtifacts(
          'Worker workflow created.',
          workflowScaffolder.emit(parseWorkflowInput(args)),
        );
      case 'list-jobs':
        return await this.listFiles('workers/jobs', ['.ts'], 'jobs');
      case 'list-tasks':
        return await this.listFiles('workers/tasks', ['.ts', '.py', '.sh', '.ps1'], 'tasks');
      case 'compile-registry':
        return await this.compileRegistry();
      case 'run':
        return await this.runJob(args);
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

  private async writeArtifacts(
    message: string,
    artifacts: readonly ScaffoldArtifact[],
    extra: Readonly<Record<string, unknown>> = {},
  ): Promise<PluginCliResult> {
    for (const artifact of artifacts) {
      await this.files.writeTextFile(artifact.path, artifactText(artifact));
    }
    return ok(message, { files: artifacts.map((artifact) => artifact.path), ...extra });
  }

  private async listFiles(
    path: string,
    extensions: readonly string[],
    key: string,
  ): Promise<PluginCliResult> {
    const files = await this.files.listFiles(path, extensions);
    return ok(`Found ${files.length} worker ${key}.`, {
      [key]: files.map((file) => file.relativePath),
    });
  }

  private async compileRegistry(): Promise<PluginCliResult> {
    const result = await compileWorkersRegistry(this.files);
    return ok('Worker job registry compiled.', result);
  }

  private async runJob(args: PluginCliArgs): Promise<PluginCliResult> {
    const id = requiredValue(args, 'job id');
    const path = `workers/jobs/${fileStem(id)}.ts`;
    const module = await import(this.files.toImportUrl(path));
    const handler = resolveRunnable(module);
    if (!handler) {
      return fail(`Worker job ${id} does not export a function handler.`);
    }

    const payload = parseJsonFlag(args, 'payload');
    const result = await handler({
      id,
      job: { id, entrypoint: path, enabled: true },
      payload,
    });
    return ok('Worker job completed.', { result });
  }

  private async logs(args: PluginCliArgs): Promise<PluginCliResult> {
    const executionId = requiredValue(args, 'execution id');
    const path = `.netscript/logs/workers/${executionId}.log`;
    const content = await this.files.readTextFile(path);
    if (content === undefined) {
      return fail(`No worker log found for execution ${executionId}.`);
    }
    return ok('Worker execution log loaded.', { executionId, log: content });
  }

  private async configEdit(args: PluginCliArgs): Promise<PluginCliResult> {
    const topic = requiredValue(args, 'config topic');
    const path = `.netscript/runtime/${topic}.json`;
    const current = await this.files.readTextFile(path);
    if (current === undefined) {
      await this.files.writeTextFile(path, `${JSON.stringify({ jobs: {} }, null, 2)}\n`);
    }
    return ok('Worker runtime config ready.', { topic, path });
  }

  private async configPublish(args: PluginCliArgs): Promise<PluginCliResult> {
    const topic = requiredValue(args, 'config topic');
    const path = `.netscript/runtime/${topic}.json`;
    const content = await this.files.readTextFile(path);
    if (content === undefined) {
      return fail(`Worker runtime config ${topic} does not exist.`);
    }
    return ok('Worker runtime config published.', { topic, path, config: JSON.parse(content) });
  }

  private async setJobEnabled(args: PluginCliArgs, enabled: boolean): Promise<PluginCliResult> {
    const id = requiredValue(args, 'job id');
    const path = '.netscript/runtime/workers.json';
    const content = await this.files.readTextFile(path);
    const config = parseWorkerRuntimeConfig(content);
    const jobs = { ...config.jobs, [id]: { ...config.jobs[id], enabled } };
    await this.files.writeTextFile(path, `${JSON.stringify({ ...config, jobs }, null, 2)}\n`);
    return ok(enabled ? 'Worker job enabled.' : 'Worker job disabled.', { id, enabled, path });
  }
}

interface WorkerRuntimeConfig {
  readonly jobs: Record<string, { readonly enabled?: boolean }>;
}

type RunnableJob = (context: unknown) => unknown | Promise<unknown>;

function ok(message: string, data: unknown): PluginCliResult {
  return { code: 0, message, data };
}

function fail(message: string): PluginCliResult {
  return { code: 1, message };
}

function requiredValue(args: PluginCliArgs, label: string): string {
  const value = args.values?.[0];
  if (!value) {
    throw new Error(`Missing ${label}.`);
  }
  return value;
}

function flag(args: PluginCliArgs, name: string): string | undefined {
  const value = args.flags?.[name];
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
}

function parseJsonFlag(args: PluginCliArgs, name: string): unknown {
  const value = flag(args, name);
  return value === undefined ? undefined : JSON.parse(value);
}

function parseWorkerRuntimeConfig(content: string | undefined): WorkerRuntimeConfig {
  if (content === undefined) {
    return { jobs: {} };
  }
  const parsed: unknown = JSON.parse(content);
  if (typeof parsed !== 'object' || parsed === null || !('jobs' in parsed)) {
    return { jobs: {} };
  }
  const jobs = (parsed as { readonly jobs?: unknown }).jobs;
  return typeof jobs === 'object' && jobs !== null ? { jobs: normalizeJobs(jobs) } : { jobs: {} };
}

function normalizeJobs(input: object): Record<string, { readonly enabled?: boolean }> {
  const jobs: Record<string, { readonly enabled?: boolean }> = {};
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'object' && value !== null) {
      const enabled = (value as { readonly enabled?: unknown }).enabled;
      jobs[key] = typeof enabled === 'boolean' ? { enabled } : {};
    }
  }
  return jobs;
}

function fileStem(id: string): string {
  return id.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function resolveRunnable(module: Record<string, unknown>): RunnableJob | undefined {
  const candidate = module.default ?? module.handler ??
    Object.values(module).find((value) => typeof value === 'function');
  return isRunnableJob(candidate) ? candidate : undefined;
}

function isRunnableJob(value: unknown): value is RunnableJob {
  return typeof value === 'function';
}
