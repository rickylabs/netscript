/** Stub-only contract for generated sagas plugin items. */
export abstract class SagasItemScaffolder<TInput> {
  /** Stable scaffolder id. */
  abstract readonly id: string;
  /** Generated item kind. */
  abstract readonly kind: string;
  /** Template path shown to scaffold orchestration tools. */
  abstract readonly templatePath: string;
  /** Generate source for a validated scaffold input. */
  abstract generate(input: TInput): Promise<string>;
  /** Validate untyped scaffold input. */
  abstract validateInput(input: unknown): input is TInput;
}
