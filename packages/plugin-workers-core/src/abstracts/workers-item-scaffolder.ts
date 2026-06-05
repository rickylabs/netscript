/** Stub-only contract for generated workers items. */
export abstract class WorkersItemScaffolder<TInput> {
  abstract readonly id: string;
  abstract readonly kind: string;
  abstract readonly templatePath: string;
  abstract generate(input: TInput): Promise<string>;
  abstract validateInput(input: unknown): input is TInput;
}
