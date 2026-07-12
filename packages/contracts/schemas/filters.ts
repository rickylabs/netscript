/**
 * Filter schemas for dynamic query building.
 *
 * @example
 * ```typescript
 * import { FilterConditionSchema, buildPrismaWhere } from '@netscript/contracts';
 *
 * const filters = [
 *   { field: 'status', operator: 'equals', value: 'active' },
 *   { field: 'name', operator: 'contains', value: 'john' },
 * ];
 *
 * const where = buildPrismaWhere(filters);
 * // { status: 'active', name: { contains: 'john' } }
 * ```
 *
 * @module
 */

import { z } from 'zod';
import type { ContractObjectSchema, ContractSchema } from '../src/domain/schema-types.ts';

// ============================================================================
// FILTER SCHEMAS
// ============================================================================

/**
 * Available filter operators.
 */
export const FilterOperatorSchema: ContractSchema<FilterOperator, FilterOperator> = z.enum([
  'equals',
  'not',
  'contains',
  'startsWith',
  'endsWith',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'notIn',
  'isNull',
  'isNotNull',
]);

/**
 * Single filter condition schema.
 */
const filterConditionSchema = z.object({
  /** Field name to filter on */
  field: z.string(),
  /** Filter operator */
  operator: FilterOperatorSchema,
  /** Value to compare against (not needed for isNull/isNotNull) */
  value: z.unknown().optional(),
});

/**
 * Single filter condition schema.
 */
export const FilterConditionSchema: ContractObjectSchema<FilterCondition, FilterCondition> =
  filterConditionSchema;

/**
 * Array of filter conditions.
 */
const filtersSchema = z.array(filterConditionSchema);

/**
 * Array of filter conditions.
 */
export const FiltersSchema: ContractSchema<Filters, Filters> = filtersSchema;

/**
 * Search input schema with filters.
 */
export const SearchInputSchema: ContractObjectSchema<SearchInput, SearchInput> = z.object({
  /** Search query string */
  search: z.string().optional(),
  /** Fields to search in */
  searchFields: z.array(z.string()).optional(),
  /** Filter conditions */
  filters: filtersSchema.optional(),
});

// ============================================================================
// FILTER HELPERS
// ============================================================================

/** Available filter operator values. */
export type FilterOperator =
  | 'equals'
  | 'not'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull';

/** Single filter condition. */
export type FilterCondition = Readonly<{
  /** Field name to filter on. */
  field: string;
  /** Operator used to compare the field. */
  operator: FilterOperator;
  /** Value to compare against. */
  value?: unknown;
}>;

/**
 * Builds a Prisma where clause from filter conditions.
 *
 * @example
 * ```typescript
 * const where = buildPrismaWhere([
 *   { field: 'status', operator: 'equals', value: 'active' },
 *   { field: 'name', operator: 'contains', value: 'john' },
 *   { field: 'age', operator: 'gte', value: 18 },
 * ]);
 * // Result:
 * // {
 * //   status: 'active',
 * //   name: { contains: 'john', mode: 'insensitive' },
 * //   age: { gte: 18 }
 * // }
 * ```
 */
export function buildPrismaWhere(filters: FilterCondition[]): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  for (const { field, operator, value } of filters) {
    switch (operator) {
      case 'equals':
        where[field] = value;
        break;
      case 'not':
        where[field] = { not: value };
        break;
      case 'contains':
        where[field] = { contains: value };
        break;
      case 'startsWith':
        where[field] = { startsWith: value };
        break;
      case 'endsWith':
        where[field] = { endsWith: value };
        break;
      case 'gt':
      case 'gte':
      case 'lt':
      case 'lte':
        where[field] = { [operator]: value };
        break;
      case 'in':
        where[field] = { in: Array.isArray(value) ? value : [value] };
        break;
      case 'notIn':
        where[field] = { notIn: Array.isArray(value) ? value : [value] };
        break;
      case 'isNull':
        where[field] = null;
        break;
      case 'isNotNull':
        where[field] = { not: null };
        break;
    }
  }

  return where;
}

/**
 * Builds a Prisma search condition for multiple fields.
 *
 * @example
 * ```typescript
 * const search = buildSearchCondition('john', ['name', 'email']);
 * // Result:
 * // {
 * //   OR: [
 * //     { name: { contains: 'john' } },
 * //     { email: { contains: 'john' } }
 * //   ]
 * // }
 * ```
 */
export function buildSearchCondition(
  query: string,
  fields: string[],
): Record<string, unknown> | null {
  if (!query || !fields.length) return null;

  return {
    OR: fields.map((field) => ({
      [field]: { contains: query },
    })),
  };
}

/**
 * Combines filter and search conditions into a single where clause.
 *
 * @example
 * ```typescript
 * const where = combineConditions({
 *   filters: [{ field: 'status', operator: 'equals', value: 'active' }],
 *   search: 'john',
 *   searchFields: ['name', 'email'],
 * });
 * ```
 */
export function combineConditions(options: {
  filters?: FilterCondition[];
  search?: string;
  searchFields?: string[];
}): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];

  // Add filter conditions
  if (options.filters?.length) {
    conditions.push(buildPrismaWhere(options.filters));
  }

  // Add search condition
  if (options.search && options.searchFields?.length) {
    const searchCondition = buildSearchCondition(options.search, options.searchFields);
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  // Combine with AND if multiple conditions
  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { AND: conditions };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/** List of filter conditions. */
export type Filters = readonly FilterCondition[];

/** Search input with optional query text, search fields, and filters. */
export type SearchInput = Readonly<{
  /** Search query string. */
  search?: string;
  /** Fields to search in. */
  searchFields?: readonly string[];
  /** Filter conditions. */
  filters?: Filters;
}>;
