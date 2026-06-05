/** Stub-only contract for an application use case. */
export abstract class UseCase<TInput, TResult> {
  /** Stable use-case identifier used by manifests and diagnostics. */
  abstract readonly id: string;

  /** Execute the use case for one input object. */
  abstract execute(input: TInput): Promise<TResult> | TResult;
}
