import { CliCommand } from './cli-command.ts';

/** Stub-only contract for a top-level CLI root. */
export abstract class CliRoot<TDefinition = unknown> {
  /** Stable root identifier used by binary edges. */
  abstract readonly id: string;

  /** Commands attached directly below the root. */
  abstract commands(): readonly CliCommand<TDefinition>[];

  /** Build the root definition consumed by the CLI runner. */
  abstract define(commands: readonly CliCommand<TDefinition>[]): TDefinition;
}
