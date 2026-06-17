/** Parse result returned by contract schema values. */
export type ContractParseResult<TOutput> = Readonly<{
  success: boolean;
  data?: TOutput;
  error?: unknown;
}>;

/** Minimal documented schema contract exposed by `@netscript/contracts`. */
export type ContractSchema<TOutput = unknown> = Readonly<{
  parse(value: unknown): TOutput;
  safeParse(value: unknown): ContractParseResult<TOutput>;
  optional(): ContractSchema<TOutput | undefined>;
  describe(description: string): ContractSchema<TOutput>;
}>;

/** Contract schema value that supports a default output. */
export type ContractDefaultableSchema<TOutput> =
  & ContractSchema<TOutput>
  & Readonly<{
    default(value: TOutput): ContractSchema<TOutput>;
  }>;

/** Minimal documented object-schema contract exposed by `@netscript/contracts`. */
export type ContractObjectSchema<TOutput = unknown> =
  & ContractSchema<TOutput>
  & Readonly<{
    extend(shape: Readonly<Record<string, unknown>>): ContractObjectSchema<unknown>;
    merge(schema: unknown): ContractObjectSchema<unknown>;
  }>;

/** Contract number schema contract. */
export type ContractNumberSchema = ContractDefaultableSchema<number>;

/** Contract string schema contract. */
export type ContractStringSchema = ContractDefaultableSchema<string>;
