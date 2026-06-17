import type { PluginCliArgs, PluginCliCommand, PluginCliResult } from '@netscript/plugin/cli';
import type {
  SagasCliBackend,
  SagasCliCategory,
  SagasCliCommandDefinition,
} from './command-types.ts';
import { LocalSagasCliBackend } from './sagas-cli-backend.ts';

/** Static backend for mounted command metadata tests. */
export class StaticSagasCliBackend implements SagasCliBackend {
  /** Return deterministic command metadata without touching the filesystem or runtime. */
  handle(
    definition: SagasCliCommandDefinition,
    args: PluginCliArgs,
  ): PluginCliResult {
    return {
      code: 0,
      message: `sagas ${definition.name} accepted by CLI composition`,
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

/** Base command wrapper for sagas plugin CLI commands. */
export abstract class SagasCliCommand {
  /** Static command metadata used by the host CLI. */
  readonly definition: SagasCliCommandDefinition;
  /** Grouping category used by help and discovery output. */
  readonly category: SagasCliCategory;
  private readonly backend: SagasCliBackend;

  /** Create a sagas CLI command with optional backend injection. */
  protected constructor(
    definition: SagasCliCommandDefinition,
    backend: SagasCliBackend = new LocalSagasCliBackend(),
  ) {
    this.definition = definition;
    this.category = definition.category;
    this.backend = backend;
  }

  /** Execute the command through the injected backend. */
  async execute(input: unknown): Promise<void> {
    const result = await this.run(toPluginCliArgs(this.definition.name, input));
    if (result.code !== 0) {
      throw new Error(result.message ?? `sagas ${this.definition.name} failed`);
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

/** Generate the static saga registry. */
export class GenerateRegistryCommand extends SagasCliCommand {
  /** Create the registry-generation command wrapper. */
  constructor(backend?: SagasCliBackend) {
    super({
      name: 'generate-registry',
      category: 'registry',
      description: 'Generate the static saga registry for compiled runtimes.',
      usage:
        'ns-sagas generate registry [--root=sagas --out=.netscript/generated/plugin-sagas/sagas.registry.ts]',
      flags: [
        { name: 'root', description: 'Comma-separated project roots to scan.' },
        { name: 'out', description: 'Project-relative registry output path.' },
      ],
    }, backend);
  }
}

/** Inspect saga definitions discovered in project source. */
export class InspectCommand extends SagasCliCommand {
  /** Create the saga-inspection command wrapper. */
  constructor(backend?: SagasCliBackend) {
    super({
      name: 'inspect',
      category: 'inspection',
      description: 'Inspect fluent saga definitions in project source.',
      usage: 'ns-sagas inspect [--root=sagas]',
      flags: [{ name: 'root', description: 'Comma-separated project roots to scan.' }],
    }, backend);
  }
}

/** Rewrite legacy `@netscript/sagas` imports. */
export class CodemodCommand extends SagasCliCommand {
  /** Create the sagas import-codemod command wrapper. */
  constructor(backend?: SagasCliBackend) {
    super({
      name: 'codemod',
      category: 'migration',
      description: 'Rewrite legacy sagas imports to plugin package specifiers.',
      usage: 'ns-sagas codemod [--root=sagas,services,workers --write]',
      flags: [
        { name: 'root', description: 'Comma-separated project roots to scan.' },
        { name: 'write', description: 'Apply changes instead of returning a dry-run plan.' },
      ],
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
