/** Parse result returned by contract schema values. */
export type ContractParseResult<TOutput> =
  | { readonly success: true; readonly data: TOutput }
  | { readonly success: false; readonly error: unknown };

/** Infer the accepted input value type from a Zod-compatible schema. */
export type ContractSchemaInput<TSchema> = TSchema extends { readonly _input: infer TInput }
  ? TInput
  : unknown;

/** Infer the parsed output value type from a Zod-compatible schema. */
export type ContractSchemaOutput<TSchema> = TSchema extends { readonly _output: infer TOutput }
  ? TOutput
  : unknown;

/** Package-owned structural validator used by public contract schemas. */
export interface ContractSchema<TOutput = unknown, TInput = unknown> {
  /** Standard Schema metadata consumed by oRPC and other validator-neutral callers. */
  readonly '~standard': {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (
      value: unknown,
      options?: { readonly libraryOptions?: Record<string, unknown> | undefined },
    ) =>
      | { readonly value: TOutput; readonly issues?: undefined }
      | {
        readonly issues: ReadonlyArray<{
          readonly message: string;
          readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
        }>;
      }
      | Promise<
        | { readonly value: TOutput; readonly issues?: undefined }
        | {
          readonly issues: ReadonlyArray<{
            readonly message: string;
            readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
          }>;
        }
      >;
    readonly types?: { readonly input: TInput; readonly output: TOutput } | undefined;
  };
  /** Compile-time marker for the accepted input type. */
  readonly _input: TInput;
  /** Compile-time marker for the parsed output type. */
  readonly _output: TOutput;
  /** Parse an input value or throw a validation error. */
  parse(input: TInput): TOutput;
  /** Parse an input value without throwing. */
  safeParse(input: TInput): ContractParseResult<TOutput>;
}

/**
 * Cross-resolution schema constraint used at consumer-supplied boundaries.
 *
 * Generated workspaces can resolve the same Zod version through npm while
 * this package resolves it through JSR. The `_input`/`_output` markers are the
 * stable structural contract shared by both copies; Zod implementation members
 * such as `toJSONSchema` are intentionally excluded.
 */
export type ContractSchemaLike<TOutput = unknown, TInput = unknown> = Readonly<{
  _output: TOutput;
  _input: TInput;
  parse(value: unknown): TOutput;
}>;

/** Cross-resolution object-schema constraint for consumer-supplied shapes. */
export type ContractObjectSchemaLike<TOutput = unknown, TInput = unknown> =
  & ContractSchemaLike<TOutput, TInput>
  & Readonly<{ shape: Readonly<Record<string, unknown>> }>;

/** Contract schema value that supports a default output. */
export type ContractDefaultableSchema<TOutput, TInput = unknown> = ContractSchema<
  TOutput,
  TInput
>;

/**
 * Zod-backed object schema retaining parsed output and accepted input.
 *
 * Generic factories that need exact validator implementation details retain
 * their concrete schema privately and publish this portable object surface.
 */
export type ContractObjectSchema<TOutput = unknown, TInput = unknown> =
  & ContractSchema<TOutput, TInput>
  & Readonly<{ shape: Readonly<Record<string, unknown>> }>;

/** Contract number schema returned by the numeric helper factories. */
export type ContractNumberSchema = ContractSchema<number, unknown>;

/** Contract string schema returned by the string helper factories. */
export type ContractStringSchema = ContractSchema<string, unknown>;
