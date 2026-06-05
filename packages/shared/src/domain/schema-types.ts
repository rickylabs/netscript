/** Parse result returned by shared schema values. */
export type SharedParseResult<TOutput> = Readonly<{
  success: boolean;
  data?: TOutput;
  error?: unknown;
}>;

/** Minimal documented schema contract exposed by `@netscript/shared`. */
export type SharedSchema<TOutput = unknown> = Readonly<{
  parse(value: unknown): TOutput;
  safeParse(value: unknown): SharedParseResult<TOutput>;
  optional(): SharedSchema<TOutput | undefined>;
  describe(description: string): SharedSchema<TOutput>;
}>;

/** Shared schema value that supports a default output. */
export type SharedDefaultableSchema<TOutput> =
  & SharedSchema<TOutput>
  & Readonly<{
    default(value: TOutput): SharedSchema<TOutput>;
  }>;

/** Minimal documented object-schema contract exposed by `@netscript/shared`. */
export type SharedObjectSchema<TOutput = unknown> =
  & SharedSchema<TOutput>
  & Readonly<{
    extend(shape: Readonly<Record<string, SharedSchema<unknown>>>): SharedObjectSchema<unknown>;
  }>;

/** Shared number schema contract. */
export type SharedNumberSchema = SharedDefaultableSchema<number>;

/** Shared string schema contract. */
export type SharedStringSchema = SharedDefaultableSchema<string>;
