import type { PluginCliArgs, PluginCliResult } from '@netscript/plugin/cli';
import { WorkersCommand } from '@netscript/plugin-workers-core/abstracts';
import type {
  WorkersCliBackend,
  WorkersCliCategory,
  WorkersCliCommandDefinition,
} from './command-types.ts';
import { LocalWorkersRuntimeBackend } from './local-runtime-backend.ts';

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

const defaultBackend: WorkersCliBackend = new LocalWorkersRuntimeBackend();

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
  /** Create an add-job command with an optional backend override. */
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
  /** Create an add-task command with an optional backend override. */
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

/** Create a worker workflow definition file. */
export class AddWorkflowCommand extends WorkersCliCommand {
  /** Create an add-workflow command with an optional backend override. */
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'add-workflow',
      category: 'runtime',
      description: 'Create a worker workflow definition.',
      usage: 'ns-workers add workflow <id>',
    }, backend);
  }
}

/** List configured worker jobs. */
export class ListJobsCommand extends WorkersCliCommand {
  /** Create a list-jobs command with an optional backend override. */
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'list-jobs',
      category: 'jobs',
      description: 'List worker jobs discovered for the current project.',
      usage: 'ns-workers list-jobs [--topic --enabled-only]',
      flags: [
        { name: 'topic', description: 'Filter jobs by stream topic.' },
        { name: 'enabled-only', description: 'Only include enabled jobs.' },
        { name: 'json', description: 'Render structured JSON output.' },
      ],
    }, backend);
  }
}

/** List configured worker tasks. */
export class ListTasksCommand extends WorkersCliCommand {
  /** Create a list-tasks command with an optional backend override. */
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'list-tasks',
      category: 'tasks',
      description: 'List worker tasks discovered for the current project.',
      usage: 'ns-workers list-tasks [--type --json]',
      flags: [
        { name: 'type', description: 'Filter tasks by runtime type.' },
        { name: 'json', description: 'Render structured JSON output.' },
      ],
    }, backend);
  }
}

/** Show metadata for one configured worker job. */
export class ShowJobCommand extends WorkersCliCommand {
  /** Create a show-job command with an optional backend override. */
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'show-job',
      category: 'jobs',
      description: 'Show worker job metadata.',
      usage: 'ns-workers show-job <id> [--json]',
      flags: [{ name: 'json', description: 'Render structured JSON output.' }],
    }, backend);
  }
}

/** Show metadata for one configured worker task. */
export class ShowTaskCommand extends WorkersCliCommand {
  /** Create a show-task command with an optional backend override. */
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'show-task',
      category: 'tasks',
      description: 'Show worker task metadata.',
      usage: 'ns-workers show-task <id> [--json]',
      flags: [{ name: 'json', description: 'Render structured JSON output.' }],
    }, backend);
  }
}

/** List durable worker executions from the running API. */
export class ExecutionsCommand extends WorkersCliCommand {
  /** Create an executions command with an optional backend override. */
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'executions',
      category: 'runtime',
      description: 'List durable worker executions.',
      usage: 'ns-workers executions [--limit --status --json]',
      flags: [{ name: 'limit', description: 'Maximum execution count.' }, {
        name: 'status',
        description: 'Filter by execution status.',
      }, { name: 'json', description: 'Render structured JSON output.' }],
    }, backend);
  }
}

/** Enqueue a configured job through the durable workers API. */
export class TriggerJobCommand extends WorkersCliCommand {
  /** Create a trigger command with an optional backend override. */
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'trigger',
      category: 'runtime',
      description: 'Enqueue a worker job through the durable runtime.',
      usage: 'ns-workers trigger <job-id> [--payload=<json>]',
      flags: [{ name: 'payload', description: 'JSON payload passed to the job.' }],
    }, backend);
  }
}

/** Run a configured worker job. */
export class RunJobCommand extends WorkersCliCommand {
  /** Create a run command with an optional backend override. */
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'run',
      category: 'runtime',
      description: 'Enqueue a worker job by identifier (compatibility alias for trigger).',
      usage: 'ns-workers run <job-id> [--payload=<json>]',
      flags: [{ name: 'payload', description: 'JSON payload passed to the job.' }],
    }, backend);
  }
}

/** Execute a configured polyglot task through MultiRuntimeTaskExecutor. */
export class RunTaskCommand extends WorkersCliCommand {
  /** Create a run-task command with an optional backend override. */
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'run-task',
      category: 'runtime',
      description: 'Execute a polyglot worker task.',
      usage: 'ns-workers run-task <id> [--args=<json> --env=<json> --timeout=<ms>]',
      flags: [
        { name: 'args', description: 'JSON array of argv values.' },
        { name: 'env', description: 'JSON object of environment values.' },
        { name: 'timeout', description: 'Execution timeout in milliseconds.' },
        { name: 'json', description: 'Render the TaskResult as JSON.' },
      ],
    }, backend);
  }
}

/** Update metadata for a worker job and regenerate its registry. */
export class UpdateJobCommand extends WorkersCliCommand {
  /** Create an update-job command with an optional backend override. */
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'update-job',
      category: 'jobs',
      description: 'Update worker job metadata.',
      usage:
        'ns-workers update-job <id> [--topic --schedule --timeout --max-retries --tags --enabled]',
      flags: resourceUpdateFlags(false),
    }, backend);
  }
}

/** Update metadata for a worker task and regenerate its registry. */
export class UpdateTaskCommand extends WorkersCliCommand {
  /** Create an update-task command with an optional backend override. */
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'update-task',
      category: 'tasks',
      description: 'Update worker task metadata.',
      usage: 'ns-workers update-task <id> [--runtime --entrypoint --timeout --enabled]',
      flags: resourceUpdateFlags(true),
    }, backend);
  }
}

/** Remove a worker job file and regenerate its registry. */
export class RemoveJobCommand extends WorkersCliCommand {
  /** Create a remove-job command with an optional backend override. */
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'remove-job',
      category: 'jobs',
      description: 'Remove a worker job.',
      usage: 'ns-workers remove-job <id>',
    }, backend);
  }
}

/** Remove a worker task file and regenerate its registry. */
export class RemoveTaskCommand extends WorkersCliCommand {
  /** Create a remove-task command with an optional backend override. */
  constructor(backend?: WorkersCliBackend) {
    super({
      name: 'remove-task',
      category: 'tasks',
      description: 'Remove a worker task.',
      usage: 'ns-workers remove-task <id>',
    }, backend);
  }
}

/** Show logs for a worker execution. */
export class LogsCommand extends WorkersCliCommand {
  /** Create a logs command with an optional backend override. */
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
  /** Create a config-edit command with an optional backend override. */
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
  /** Create a config-publish command with an optional backend override. */
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
  /** Create an enable command with an optional backend override. */
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
  /** Create a disable command with an optional backend override. */
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
  /** Create a compile-registry command with an optional backend override. */
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

function resourceUpdateFlags(task: boolean): readonly { name: string; description: string }[] {
  return [
    ...(task
      ? [{ name: 'runtime', description: 'Task runtime kind.' }, {
        name: 'entrypoint',
        description: 'Task entrypoint path.',
      }]
      : [{ name: 'topic', description: 'Job stream topic.' }, {
        name: 'schedule',
        description: 'Job cron schedule.',
      }, { name: 'tags', description: 'Comma-separated job tags.' }]),
    { name: 'timeout', description: 'Timeout in milliseconds.' },
    { name: 'max-retries', description: 'Maximum retry count.' },
    { name: 'enabled', description: 'Whether the resource is enabled.' },
  ];
}
