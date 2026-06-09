/** Definition supplied to worker CLI commands. */
export interface WorkersCommandDefinition {
  /** Command name. */
  readonly name: string;
  /** Optional command description. */
  readonly description?: string;
}

/** Stub-only base contract for CLI command implementations. */
export abstract class CliCommand<TDefinition extends WorkersCommandDefinition> {
  /** Static command definition. */
  abstract readonly definition: TDefinition;
  /** Execute the command with parsed input. */
  abstract execute(input: unknown): Promise<void>;
}

/** Stub-only contract for workers CLI commands. */
export abstract class WorkersCommand extends CliCommand<WorkersCommandDefinition> {
  /** Command category used for grouping. */
  abstract readonly category: string;
}
