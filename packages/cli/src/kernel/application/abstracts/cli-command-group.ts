import { CliCommand } from './cli-command.ts';

/** Stub-only contract for a command that owns child commands. */
export abstract class CliCommandGroup<TDefinition = unknown> extends CliCommand<TDefinition> {
  /** Child commands exposed below this group. */
  abstract children(): readonly CliCommand<TDefinition>[];
}
