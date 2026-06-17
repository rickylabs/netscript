/** Result returned by a package-owned schema parse attempt. */
export type ConfigSchemaResult<TOutput> =
  | { readonly success: true; readonly data: TOutput }
  | { readonly success: false; readonly error: unknown };

/** Package-owned structural schema type for worker config validation. */
export interface ConfigSchema<TOutput, TInput = unknown> {
  /** Parse an input value or throw a validation error. */
  parse(input: TInput): TOutput;
  /** Parse an input value and return a result object instead of throwing. */
  safeParse(input: TInput): ConfigSchemaResult<TOutput>;
}
