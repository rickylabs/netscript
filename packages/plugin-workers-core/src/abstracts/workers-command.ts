/** Definition supplied to worker CLI commands. */
export interface WorkersCommandDefinition {
  readonly name: string;
  readonly description?: string;
}

/** Stub-only base contract for CLI command implementations. */
export abstract class CliCommand<TDefinition extends WorkersCommandDefinition> {
  abstract readonly definition: TDefinition;
  abstract execute(input: unknown): Promise<void>;
}

/** Stub-only contract for workers CLI commands. */
export abstract class WorkersCommand extends CliCommand<WorkersCommandDefinition> {
  abstract readonly category: string;
}
