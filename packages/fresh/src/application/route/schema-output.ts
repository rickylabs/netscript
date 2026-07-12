/**
 * Shared route-schema inference used by both the public facade and its runtime adapter.
 *
 * @module
 */

/** Infer the output object carried by a route schema. */
export type SchemaOutput<TSchema> = TSchema extends { _output: infer TOutput } ? TOutput
  : TSchema extends { safeParse: (...args: never[]) => infer TResult }
    ? Extract<TResult, { success: true; data: unknown }> extends
      { success: true; data: infer TOutput } ? TOutput
    : Record<string, never>
  : Record<string, never>;

/** Infer an object output from a route schema, falling back to an empty route state. */
export type SchemaObjectOutput<TSchema> = SchemaOutput<TSchema> extends object
  ? SchemaOutput<TSchema>
  : Record<string, never>;
