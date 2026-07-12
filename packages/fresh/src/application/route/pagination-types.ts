/**
 * Public pagination search types for `@netscript/fresh` routes.
 *
 * @module
 */

import type { SchemaParseResult, SearchParamValue } from './types.ts';
import type { z } from 'zod';
export type {
  SchemaParseFailure,
  SchemaParseResult,
  SchemaParseSuccess,
  SearchParamValue,
} from './types.ts';

/** Typed output produced by pagination search schemas. */
export interface PaginationSearchState {
  /** One-based page index. */
  readonly page: number;
  /** Page size applied to the list query. */
  readonly limit: number;
  /** Zero-based offset derived from `page` and `limit`. */
  readonly offset: number;
  /** Sort key currently applied to the list query. */
  readonly sortBy: string;
  /** Sort direction currently applied to the list query. */
  readonly sortOrder: 'asc' | 'desc';
}

/** Options for the default pagination search schema. */
export interface PaginationSearchSchemaOptions {
  /** Default page size used when `limit` is missing or invalid. */
  readonly defaultLimit?: number;
  /** Default sort key used when `sortBy` is missing or invalid. */
  readonly defaultSort?: string;
  /** Default sort order used when `sortOrder` is missing or invalid. */
  readonly defaultOrder?: 'asc' | 'desc';
}

/** Structural schema contract accepted by pagination search helpers. */
export interface SchemaField<TOutput = unknown> {
  /** Safely parse a raw search-param value into typed output. */
  safeParse(input: unknown): SchemaParseResult<TOutput>;
}

/** Infer the output carried by a schema-like field. */
export type SchemaFieldOutput<TSchema> = TSchema extends {
  safeParse(input: unknown): SchemaParseResult<infer TOutput>;
} ? TOutput
  : unknown;

/** Base schema shape returned by `paginationSearchSchema()`. */
export type PaginationSearchBaseShape = {
  /** Page field schema. */
  readonly page: z.ZodType<number>;
  /** Limit field schema. */
  readonly limit: z.ZodType<number>;
  /** Sort key field schema. */
  readonly sortBy: z.ZodType<string>;
  /** Sort direction field schema. */
  readonly sortOrder: z.ZodType<'asc' | 'desc'>;
};

/** Public facade for pagination-aware query string parsing. */
export interface PaginationSearchSchema<
  TShape extends z.ZodRawShape & PaginationSearchBaseShape,
> {
  /** Typed input accepted by the schema. */
  readonly _input: Record<string, SearchParamValue>;
  /** Typed output returned by the schema. */
  readonly _output: z.output<z.ZodObject<TShape>> & PaginationSearchState;

  /**
   * Extend the schema with additional search fields.
   *
   * @param shape - Additional Zod shape entries.
   * @returns A new pagination schema with the extra fields.
   */
  extend<TAugmentation extends z.ZodRawShape>(
    shape: TAugmentation,
  ): PaginationSearchSchema<TShape & TAugmentation>;

  /**
   * Safely parse raw query params into typed pagination state.
   *
   * @param input - Raw search input.
   * @returns Success or failure parse result.
   */
  safeParse(
    input: Record<string, SearchParamValue>,
  ): SchemaParseResult<z.output<z.ZodObject<TShape>> & PaginationSearchState>;

  /**
   * Parse raw query params into typed pagination state.
   *
   * @param input - Raw search input.
   * @returns Parsed pagination state.
   */
  parse(
    input: Record<string, SearchParamValue>,
  ): z.output<z.ZodObject<TShape>> & PaginationSearchState;

  /**
   * Async variant of `safeParse()`.
   *
   * @param input - Raw search input.
   * @returns Async success or failure parse result.
   */
  safeParseAsync(
    input: Record<string, SearchParamValue>,
  ): Promise<SchemaParseResult<z.output<z.ZodObject<TShape>> & PaginationSearchState>>;

  /**
   * Async variant of `parse()`.
   *
   * @param input - Raw search input.
   * @returns Async parsed pagination state.
   */
  parseAsync(
    input: Record<string, SearchParamValue>,
  ): Promise<z.output<z.ZodObject<TShape>> & PaginationSearchState>;
}

/** Infer the resolved object output carried by a pagination schema shape. */
export type ShapeOutput<TShape extends Record<string, SchemaField>> = {
  readonly [K in keyof TShape]: SchemaFieldOutput<TShape[K]>;
};
