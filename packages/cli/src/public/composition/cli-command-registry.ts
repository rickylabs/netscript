import type { CliffyCommand } from "../../kernel/presentation/command-types.ts";
import { Command } from '@cliffy/command';

import { Registry } from '../../kernel/application/abstracts/registry.ts';
import { ScaffoldValidationError } from '../../kernel/domain/errors.ts';


/** Factory registered for one top-level CLI command. */
export interface CliCommandFactory<TContext> {
  /** Stable command identifier. */
  readonly id: string;
  /** Create the command from the composition context. */
  readonly create: (context: TContext) => CliffyCommand;
}

/** Options used to materialize a root Cliffy program from registered commands. */
export interface CliCommandProgramOptions<TContext> {
  /** Program binary name. */
  readonly name: string;
  /** Program version. */
  readonly version: string;
  /** Program description. */
  readonly description: string;
  /** Composition context passed into command factories. */
  readonly context: TContext;
}

/** Registry-backed command tree composer for the public CLI boundary. */
export class CliCommandRegistry<TContext> extends Registry<string, CliCommandFactory<TContext>> {
  override readonly id = 'cli-commands';

  readonly #commands = new Map<string, CliCommandFactory<TContext>>();

  /** Register a command factory. */
  override register(id: string, factory: CliCommandFactory<TContext>): void {
    if (this.#commands.has(id)) {
      throw new ScaffoldValidationError(`Duplicate CLI command "${id}"`, {
        command: id,
        registeredCommands: this.commandNames(),
      });
    }
    this.#commands.set(id, factory);
  }

  /** Resolve a command factory. */
  override get(id: string): CliCommandFactory<TContext> | undefined {
    return this.#commands.get(id);
  }

  /** List command factories in registration order. */
  override entries(): readonly (readonly [string, CliCommandFactory<TContext>])[] {
    return [...this.#commands.entries()];
  }

  /** List command names in registration order. */
  commandNames(): readonly string[] {
    return [...this.#commands.keys()];
  }

  /** Build a Cliffy root command from the registered factories. */
  program(options: CliCommandProgramOptions<TContext>): CliffyCommand {
    const program = new Command()
      .name(options.name)
      .version(options.version)
      .description(options.description)
      .action(function () {
        this.showHelp();
      });

    for (const [id, factory] of this.#commands) {
      program.command(id, factory.create(options.context));
    }

    return program;
  }
}
