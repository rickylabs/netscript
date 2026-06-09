import type { PluginCliArgs, PluginCliResult } from '@netscript/plugin/cli';
import { WorkersCommand } from '@netscript/plugin-workers-core/abstracts';
import type {
  WorkersCliBackend,
  WorkersCliCategory,
  WorkersCliCommandDefinition,
} from './command-types.ts';
import { LocalWorkersCliBackend } from './workers-cli-backend.ts';

/** Default backend for mounted worker commands before host runtime wiring. */
export class StaticWorkersCliBackend implements WorkersCliBackend {
  /** Return deterministic command metadata without touching the filesystem or runtime. */
  handle(
    definition: WorkersCliCommandDefinition,
    args: PluginCliArgs,
  ): PluginCliResult {
    return {
      code: 0,
      message: `workers ${definition.name} accepted by CLI composition`,
      data: {
        command: definition.name,
        category: definition.category,
        usage: definition.usage,
        flags: args.flags ?? {},
        values: args.values ?? [],
      },
    };
  }
}

const defaultBackend: WorkersCliBackend = new LocalWorkersCliBackend();

/** Base class for concrete workers CLI commands. */
export abstract class WorkersCliCommand extends WorkersCommand {
  /** Static command metadata consumed by help and backend adapters. */
  readonly definition: WorkersCliCommandDefinition;
  /** Group used by host CLI help renderers. */
  readonly category: WorkersCliCategory;
  private readonly backend: WorkersCliBackend;

  /** Create a workers CLI command with an optional backend override. */
  protected constructor(
    definition: WorkersCliCommandDefinition,
    backend: WorkersCliBackend = defaultBackend,
  ) {
    super();
    this.definition = definition;
    this.category = definition.category;
    this.backend = backend;
  }

  /** Execute the command through the injected backend. */
  async execute(input: unknown): Promise<void> {
    const result = await this.run(toPluginCliArgs(this.definition.name, input));
    if (result.code !== 0) {
      throw new Error(result.message ?? `workers ${this.definition.name} failed`);
    }
  }

  /** Run the command and return a host CLI result. */
  run(args: PluginCliArgs): PluginCliResult | Promise<PluginCliResult> {
    return this.backend.handle(this.definition, args);
  }
}

/** Create a worker job definition file. */
export class AddJobCommand extends WorkersCliCommand {
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'add-job',
      category: 'jobs',
      description: 'Create a worker job definition.',
      usage: 'ns-workers add job <id> [--topic --schedule --timeout --max-retries --tags]',
      flags: [
        { name: 'topic', description: 'Stream topic emitted by the job.' },
        { name: 'schedule', description: 'Cron schedule for the job.' },
        { name: 'timeout', description: 'Job timeout in milliseconds.' },
        { name: 'max-retries', description: 'Maximum retry count.' },
        { name: 'tags', description: 'Comma-separated job tags.' },
      ],
    }, backend);
  }
}

/** Create a worker task definition file. */
export class AddTaskCommand extends WorkersCliCommand {
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'add-task',
      category: 'tasks',
      description: 'Create a worker task definition.',
      usage: 'ns-workers add task <id> --runtime=<runtime> [--entrypoint --timeout]',
      flags: [
        { name: 'runtime', description: 'Task runtime kind.', required: true },
        { name: 'entrypoint', description: 'Task entrypoint path.' },
        { name: 'timeout', description: 'Task timeout in milliseconds.' },
      ],
    }, backend);
  }
}

/** List configured worker jobs. */
export class ListJobsCommand extends WorkersCliCommand {
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'list-jobs',
      category: 'jobs',
      description: 'List worker jobs discovered for the current project.',
      usage: 'ns-workers list-jobs [--topic --enabled-only]',
      flags: [
        { name: 'topic', description: 'Filter jobs by stream topic.' },
        { name: 'enabled-only', description: 'Only include enabled jobs.' },
      ],
    }, backend);
  }
}

/** List configured worker tasks. */
export class ListTasksCommand extends WorkersCliCommand {
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'list-tasks',
      category: 'tasks',
      description: 'List worker tasks discovered for the current project.',
      usage: 'ns-workers list-tasks [--type]',
      flags: [{ name: 'type', description: 'Filter tasks by runtime type.' }],
    }, backend);
  }
}

/** Run a configured worker job. */
export class RunJobCommand extends WorkersCliCommand {
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'run',
      category: 'runtime',
      description: 'Run a worker job by identifier.',
      usage: 'ns-workers run <job-id> [--payload=<json>]',
      flags: [{ name: 'payload', description: 'JSON payload passed to the job.' }],
    }, backend);
  }
}

/** Show logs for a worker execution. */
export class LogsCommand extends WorkersCliCommand {
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'logs',
      category: 'runtime',
      description: 'Show logs for a worker execution.',
      usage: 'ns-workers logs <execution-id>',
    }, backend);
  }
}

/** Edit a worker runtime configuration topic. */
export class ConfigEditCommand extends WorkersCliCommand {
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'config-edit',
      category: 'config',
      description: 'Edit a worker runtime configuration topic.',
      usage: 'ns-workers config edit <topic>',
    }, backend);
  }
}

/** Publish a worker runtime configuration topic. */
export class ConfigPublishCommand extends WorkersCliCommand {
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'config-publish',
      category: 'config',
      description: 'Publish a worker runtime configuration topic.',
      usage: 'ns-workers config publish <topic>',
    }, backend);
  }
}

/** Enable a worker job. */
export class EnableCommand extends WorkersCliCommand {
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'enable',
      category: 'jobs',
      description: 'Enable a worker job.',
      usage: 'ns-workers enable <job-id>',
    }, backend);
  }
}

/** Disable a worker job. */
export class DisableCommand extends WorkersCliCommand {
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'disable',
      category: 'jobs',
      description: 'Disable a worker job.',
      usage: 'ns-workers disable <job-id>',
    }, backend);
  }
}

/** Compile the static worker registry used by compiled runtimes. */
export class CompileRegistryCommand extends WorkersCliCommand {
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'compile-registry',
      category: 'registry',
      description: 'Compile the static worker registry.',
      usage: 'ns-workers compile-registry',
    }, backend);
  }
}

function toPluginCliArgs(command: string, input: unknown): PluginCliArgs {
  if (isPluginCliArgs(input)) {
    return input;
  }

  return { command, values: [] };
}

function isPluginCliArgs(input: unknown): input is PluginCliArgs {
  if (typeof input !== 'object' || input === null) {
    return false;
  }
  return typeof (input as { readonly command?: unknown }).command === 'string';
}
