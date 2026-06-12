import { z } from 'zod';
import type {
  PaginationSearchSchemaOptions,
  PaginationSearchState,
  SchemaLike,
  SearchParamValue,
} from './types.ts';

/** Base shape required for pagination search parameters. */
export type PaginationSearchBaseShape = {
  page: z.ZodType<number>;
  limit: z.ZodType<number>;
  sortBy: z.ZodType<string>;
  sortOrder: z.ZodType<'asc' | 'desc'>;
};

/** Shape accepted by {@link PaginationSearchSchema}. */
export type PaginationSearchShape = z.ZodRawShape & PaginationSearchBaseShape;
type PaginationSearchComputedInput<TShape extends PaginationSearchShape> =
  & z.output<z.ZodObject<TShape>>
  & {
    page: number;
    limit: number;
  };
/** Output type produced by {@link PaginationSearchSchema}. */
export type PaginationSearchOutput<TShape extends PaginationSearchShape> =
  & z.output<z.ZodObject<TShape>>
  & PaginationSearchState;

/** search Params To Input. */
export function searchParamsToInput(searchParams: URLSearchParams): Record<string, SearchParamValue> {
  const input: Record<string, SearchParamValue> = {};

  for (const key of searchParams.keys()) {
    const values = searchParams.getAll(key);
    input[key] = values.length <= 1 ? (values[0] ?? undefined) : values;
  }

  return input;
}

function firstSearchParamValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

function addPaginationOffset<TData extends { page: number; limit: number }>(
  data: TData,
): TData & { offset: number } {
  return {
    ...data,
    offset: Math.max(data.page - 1, 0) * data.limit,
  };
}

/** Pagination Search Schema implementation. */
export class PaginationSearchSchema<TShape extends PaginationSearchShape> implements
  SchemaLike<
    Record<string, SearchParamValue>,
    PaginationSearchOutput<TShape>
  > {
  /** The _input. */
  declare readonly _input: Record<string, SearchParamValue>;
  /** The _output. */
  declare readonly _output: PaginationSearchOutput<TShape>;

  /** constructor. */
  constructor(private readonly schema: z.ZodObject<TShape>) {}

  /** extend. */
  extend<TAugmentation extends z.ZodRawShape>(
    shape: TAugmentation,
  ): PaginationSearchSchema<TShape & TAugmentation> {
    return new PaginationSearchSchema(
      this.schema.extend(shape) as z.ZodObject<TShape & TAugmentation>,
    );
  }

  /** safe Extend. */
  safeExtend<TAugmentation extends z.ZodRawShape>(
    shape: TAugmentation,
  ): PaginationSearchSchema<TShape & TAugmentation> {
    return this.extend(shape);
  }

  /** safe Parse. */
  safeParse(input: Record<string, SearchParamValue>):
    | { success: true; data: PaginationSearchOutput<TShape> }
    | { success: false; error?: unknown } {
    const result = this.schema.safeParse(input);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true as const,
      data: addPaginationOffset(
        result.data as PaginationSearchComputedInput<TShape>,
      ) as PaginationSearchOutput<TShape>,
    };
  }

  /** parse. */
  parse(input: Record<string, SearchParamValue>): PaginationSearchOutput<TShape> {
    return addPaginationOffset(
      this.schema.parse(input) as PaginationSearchComputedInput<TShape>,
    ) as PaginationSearchOutput<TShape>;
  }

  /** Asynchronously parses search parameters and returns either the parsed pagination output or a failure result. */
  async safeParseAsync(input: Record<string, SearchParamValue>): Promise<
    | { success: true; data: PaginationSearchOutput<TShape> }
    | { success: false; error?: unknown }
  > {
    const result = await this.schema.safeParseAsync(input);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true as const,
      data: addPaginationOffset(
        result.data as PaginationSearchComputedInput<TShape>,
      ) as PaginationSearchOutput<TShape>,
    };
  }

  /** Asynchronously parses search parameters into the pagination output shape. */
  async parseAsync(
    input: Record<string, SearchParamValue>,
  ): Promise<PaginationSearchOutput<TShape>> {
    return addPaginationOffset(
      await this.schema.parseAsync(input) as PaginationSearchComputedInput<TShape>,
    ) as PaginationSearchOutput<TShape>;
  }
}

/** fallback. */
export function fallback<TSchema extends z.ZodType>(
  schema: TSchema,
  defaultValue: z.output<TSchema>,
): z.ZodCatch<TSchema> {
  return schema.catch(defaultValue);
}

/** pagination Search Schema. */
export function paginationSearchSchema(
  options: PaginationSearchSchemaOptions = {},
): PaginationSearchSchema<PaginationSearchBaseShape> {
  const defaultLimit = options.defaultLimit ?? 10;
  const defaultSort = options.defaultSort ?? '';
  const defaultOrder = options.defaultOrder ?? 'desc';

  return new PaginationSearchSchema(
    z.object({
      page: z.preprocess(firstSearchParamValue, z.coerce.number().int().min(1)).catch(1),
      limit: z.preprocess(firstSearchParamValue, z.coerce.number().int().min(1)).catch(
        defaultLimit,
      ),
      sortBy: z.preprocess(firstSearchParamValue, z.string().min(1)).catch(defaultSort),
      sortOrder: z.preprocess(firstSearchParamValue, z.enum(['asc', 'desc'])).catch(defaultOrder),
    }),
  );
}
