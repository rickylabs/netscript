import { z } from 'zod';
import type {
  PaginationSearchSchemaOptions,
  PaginationSearchState,
  SchemaLike,
  SearchParamValue,
} from './types.ts';

type PaginationSearchBaseShape = {
  page: z.ZodType<number>;
  limit: z.ZodType<number>;
  sortBy: z.ZodType<string>;
  sortOrder: z.ZodType<'asc' | 'desc'>;
};

type PaginationSearchShape = z.ZodRawShape & PaginationSearchBaseShape;
type PaginationSearchComputedInput<TShape extends PaginationSearchShape> =
  & z.output<z.ZodObject<TShape>>
  & {
    page: number;
    limit: number;
  };
type PaginationSearchOutput<TShape extends PaginationSearchShape> =
  & z.output<z.ZodObject<TShape>>
  & PaginationSearchState;

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

export class PaginationSearchSchema<TShape extends PaginationSearchShape> implements
  SchemaLike<
    Record<string, SearchParamValue>,
    PaginationSearchOutput<TShape>
  > {
  declare readonly _input: Record<string, SearchParamValue>;
  declare readonly _output: PaginationSearchOutput<TShape>;

  constructor(private readonly schema: z.ZodObject<TShape>) {}

  extend<TAugmentation extends z.ZodRawShape>(
    shape: TAugmentation,
  ): PaginationSearchSchema<TShape & TAugmentation> {
    return new PaginationSearchSchema(
      this.schema.extend(shape) as z.ZodObject<TShape & TAugmentation>,
    );
  }

  safeExtend<TAugmentation extends z.ZodRawShape>(
    shape: TAugmentation,
  ): PaginationSearchSchema<TShape & TAugmentation> {
    return this.extend(shape);
  }

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

  parse(input: Record<string, SearchParamValue>): PaginationSearchOutput<TShape> {
    return addPaginationOffset(
      this.schema.parse(input) as PaginationSearchComputedInput<TShape>,
    ) as PaginationSearchOutput<TShape>;
  }

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

  async parseAsync(
    input: Record<string, SearchParamValue>,
  ): Promise<PaginationSearchOutput<TShape>> {
    return addPaginationOffset(
      await this.schema.parseAsync(input) as PaginationSearchComputedInput<TShape>,
    ) as PaginationSearchOutput<TShape>;
  }
}

export function fallback<TSchema extends z.ZodType>(
  schema: TSchema,
  defaultValue: z.output<TSchema>,
): z.ZodCatch<TSchema> {
  return schema.catch(defaultValue);
}

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
