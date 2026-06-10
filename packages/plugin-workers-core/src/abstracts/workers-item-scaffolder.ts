/** Stub-only contract for generated workers items. */
export abstract class WorkersItemScaffolder<TInput> {
  /** Stable scaffolder identifier. */
  abstract readonly id: string;
  /** Item kind produced by this scaffolder. */
  abstract readonly kind: string;
  /** Template path used by the scaffolder. */
  abstract readonly templatePath: string;
  /** Generate item source from validated input. */
  abstract generate(input: TInput): Promise<string>;
  /** Validate unknown input before generation. */
  abstract validateInput(input: unknown): input is TInput;
}
