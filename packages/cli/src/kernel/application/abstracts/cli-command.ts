/** Stub-only contract for a concrete CLI command. */
export abstract class CliCommand<TDefinition = unknown> {
  /** Stable command identifier used by registries and composition manifests. */
  abstract readonly id: string;

  /** Build the command definition consumed by the CLI runner. */
  abstract define(): TDefinition;
}
