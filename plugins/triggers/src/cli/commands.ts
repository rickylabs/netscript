import type { PluginCliArgs, PluginCliCommand, PluginCliResult } from '@netscript/plugin/cli';
import type {
  TriggersCliBackend,
  TriggersCliCategory,
  TriggersCliCommandDefinition,
} from './command-types.ts';

/** Static backend for mounted command metadata tests. */
export class StaticTriggersCliBackend implements TriggersCliBackend {
  /** Return deterministic command metadata without touching the filesystem or runtime. */
  handle(
    definition: TriggersCliCommandDefinition,
    args: PluginCliArgs,
  ): PluginCliResult {
    return {
      code: 0,
      message: `triggers ${definition.name} accepted by CLI composition`,
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

/** Base command wrapper for triggers plugin CLI commands. */
export abstract class TriggersCliCommand {
  /** Static command metadata used by help and backend dispatch. */
  readonly definition: TriggersCliCommandDefinition;
  /** Category used by grouped help and command discovery. */
  readonly category: TriggersCliCategory;
  private readonly backend: TriggersCliBackend;

  /** Create a command wrapper over the supplied command metadata. */
  protected constructor(
    definition: TriggersCliCommandDefinition,
    backend: TriggersCliBackend = new StaticTriggersCliBackend(),
  ) {
    this.definition = definition;
    this.category = definition.category;
    this.backend = backend;
  }

  /** Execute the command through the injected backend. */
  async execute(input: unknown): Promise<void> {
    const result = await this.run(toPluginCliArgs(this.definition.name, input));
    if (result.code !== 0) {
      throw new Error(result.message ?? `triggers ${this.definition.name} failed`);
    }
  }

  /** Run the command and return a host CLI result. */
  run(args: PluginCliArgs): PluginCliResult | Promise<PluginCliResult> {
    return this.backend.handle(this.definition, args);
  }

  /** Return a mounted plugin CLI command descriptor. */
  toPluginCommand(): PluginCliCommand {
    return {
      name: this.definition.name,
      description: this.definition.description,
      run: (args) => this.run(args),
    };
  }
}

/** Create a webhook trigger definition file. */
export class AddWebhookCommand extends TriggersCliCommand {
  /** Create the webhook scaffolding command. */
  constructor(backend?: TriggersCliBackend) {
    super({
      name: 'add-webhook',
      category: 'scaffolding',
      description: 'Create a webhook trigger definition.',
      usage: 'ns-triggers add webhook <id> --path=<path> [--secret-env=<name> --job=<id>]',
      flags: [
        { name: 'path', description: 'Webhook route path.', required: true },
        { name: 'verifier', description: 'Webhook verifier id.' },
        { name: 'secret-env', description: 'Environment variable containing the webhook secret.' },
        { name: 'job', description: 'Worker job id to enqueue from the trigger handler.' },
        { name: 'description', description: 'Human-readable trigger description.' },
        { name: 'tags', description: 'Comma-separated trigger tags.' },
        { name: 'force', description: 'Overwrite an existing trigger file.' },
      ],
    }, backend);
  }
}

/** Create a file-watch trigger definition file. */
export class AddFileWatchCommand extends TriggersCliCommand {
  /** Create the file-watch scaffolding command. */
  constructor(backend?: TriggersCliBackend) {
    super({
      name: 'add-file-watch',
      category: 'scaffolding',
      description: 'Create a file-watch trigger definition.',
      usage: 'ns-triggers add file-watch <id> --path=<dir> [--pattern=<glob> --ignored=<glob>]',
      flags: [
        { name: 'path', description: 'Directory path to watch.', required: true },
        { name: 'pattern', description: 'Glob pattern for files to include.' },
        { name: 'ignored', description: 'Comma-separated ignored glob patterns.' },
        { name: 'force', description: 'Overwrite an existing trigger file.' },
      ],
    }, backend);
  }
}

/** Create a scheduled trigger definition file. */
export class AddScheduledCommand extends TriggersCliCommand {
  /** Create the scheduled-trigger scaffolding command. */
  constructor(backend?: TriggersCliBackend) {
    super({
      name: 'add-scheduled',
      category: 'scaffolding',
      description: 'Create a scheduled trigger definition.',
      usage: 'ns-triggers add scheduled <id> --cron=<expr> [--timezone=<iana> --job=<id>]',
      flags: [
        { name: 'cron', description: 'Five-field cron expression.', required: true },
        { name: 'timezone', description: 'IANA timezone for schedule interpretation.' },
        { name: 'job', description: 'Worker job id to enqueue from the trigger handler.' },
        { name: 'description', description: 'Human-readable trigger description.' },
        { name: 'tags', description: 'Comma-separated trigger tags.' },
        { name: 'force', description: 'Overwrite an existing trigger file.' },
      ],
    }, backend);
  }
}

/** List trigger definitions and runtime state. */
export class ListTriggersCommand extends TriggersCliCommand {
  /** Create the trigger listing command. */
  constructor(backend?: TriggersCliBackend) {
    super({
      name: 'list',
      category: 'inspection',
      description: 'List trigger definitions discovered for the current project.',
      usage: 'ns-triggers list [--kind=<kind> --enabled-only]',
      flags: [
        { name: 'kind', description: 'Filter by trigger kind.' },
        { name: 'enabled-only', description: 'Only include enabled triggers.' },
      ],
    }, backend);
  }
}

/** Test a trigger definition without dispatching durable work. */
export class TestTriggerCommand extends TriggersCliCommand {
  /** Create the trigger test command. */
  constructor(backend?: TriggersCliBackend) {
    super({
      name: 'test',
      category: 'runtime',
      description: 'Test a trigger handler with an inline event.',
      usage: 'ns-triggers test <trigger-id> [--payload=<json>]',
      flags: [{ name: 'payload', description: 'JSON payload passed to the trigger.' }],
    }, backend);
  }
}

/** Fire a trigger through the runtime processor. */
export class FireTriggerCommand extends TriggersCliCommand {
  /** Create the trigger fire command. */
  constructor(backend?: TriggersCliBackend) {
    super({
      name: 'fire',
      category: 'runtime',
      description: 'Fire a trigger by identifier.',
      usage: 'ns-triggers fire <trigger-id> [--payload=<json> --idempotency-key=<key>]',
      flags: [
        { name: 'payload', description: 'JSON payload passed to the trigger.' },
        { name: 'idempotency-key', description: 'Caller-supplied idempotency key.' },
      ],
    }, backend);
  }
}

/** Preview scheduled trigger fire times. */
export class PreviewScheduleCommand extends TriggersCliCommand {
  /** Create the scheduled-trigger preview command. */
  constructor(backend?: TriggersCliBackend) {
    super({
      name: 'preview',
      category: 'schedule',
      description: 'Preview scheduled trigger fire times.',
      usage: 'ns-triggers preview <trigger-id> [--count=<n>]',
      flags: [{ name: 'count', description: 'Number of fire times to preview.' }],
    }, backend);
  }
}

/** Enable a trigger definition at runtime. */
export class EnableTriggerCommand extends TriggersCliCommand {
  /** Create the trigger enable command. */
  constructor(backend?: TriggersCliBackend) {
    super({
      name: 'enable',
      category: 'runtime',
      description: 'Enable a trigger by identifier.',
      usage: 'ns-triggers enable <trigger-id>',
    }, backend);
  }
}

/** Disable a trigger definition at runtime. */
export class DisableTriggerCommand extends TriggersCliCommand {
  /** Create the trigger disable command. */
  constructor(backend?: TriggersCliBackend) {
    super({
      name: 'disable',
      category: 'runtime',
      description: 'Disable a trigger by identifier.',
      usage: 'ns-triggers disable <trigger-id>',
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
