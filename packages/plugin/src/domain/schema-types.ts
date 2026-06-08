/** Minimal parser shape for manifest validators exposed by this package. */
export interface PluginManifestParser<TOutput = unknown> {
  /** Parse an unknown manifest candidate into the validator output type. */
  readonly parse: (input: unknown) => TOutput;
}

/** Validation issue reported by package-owned schema contracts. */
export interface PluginSchemaIssue {
  /** Human-readable validation failure message. */
  readonly message: string;
  /** Optional issue path supplied by the schema implementation. */
  readonly path?: readonly unknown[];
}

/** Validation result returned by package-owned schema contracts. */
export type PluginSchemaResult<TOutput> =
  | { readonly value: TOutput }
  | { readonly issues: readonly PluginSchemaIssue[] };

/** Minimal Standard Schema-compatible shape accepted by plugin contribution contracts. */
export interface PluginPayloadSchema<TInput = unknown, TOutput = TInput> {
  /** Standard Schema v1 compatibility metadata and validator. */
  readonly '~standard': {
    /** Standard Schema version marker. */
    readonly version: 1;
    /** Schema library vendor name. */
    readonly vendor: string;
    /** Validate a payload candidate. */
    readonly validate: (
      value: TInput,
    ) => PluginSchemaResult<TOutput> | Promise<PluginSchemaResult<TOutput>>;
    /** Optional type carrier used by Standard Schema-compatible libraries. */
    readonly types?: {
      /** Input type accepted by the schema. */
      readonly input: TInput;
      /** Output type produced by the schema. */
      readonly output: TOutput;
    };
  };
}
