/**
 * Explicit route-contract surface for `@netscript/fresh`.
 *
 * @module
 */

import {
  bindRoutePattern as bindRoutePatternImpl,
  createRouteReference as createRouteReferenceImpl,
  defineRouteContract as defineRouteContractImpl,
  enumPathParamSchema as enumPathParamSchemaImpl,
} from './_internal/contract-runtime.ts';
import {
  fallback as fallbackImpl,
  paginationSearchSchema as paginationSearchSchemaImpl,
} from '../builders/define-page/search-params.ts';

export type * from './types.ts';
import type {
  BoundRouteContract,
  DefineRouteContract,
  DefineRouteContractOptions,
  EmptyRecord,
  EnumPathParamDefinition,
  InferRoutePatternPath,
  PaginationSearchBaseShape,
  PaginationSearchSchema,
  PaginationSearchSchemaOptions,
  PathParamSchema,
  RouteReference,
  RouteReferenceOptions,
  SchemaField,
  SchemaFieldOutput,
  SchemaOutput,
  SearchParamInput,
  SearchParamSchema,
} from './types.ts';

/**
 * Build a route reference directly from a Fresh route pattern.
 *
 * @param routePattern - Fresh route pattern such as `"/orders/[id]"`.
 * @param metadata - Optional generated manifest metadata.
 * @returns A typed route reference inferred from the route pattern.
 *
 * @example
 * ```ts
 * const route = createRouteReference("/orders/[id]");
 * route.href({ path: { id: "42" } });
 * ```
 */
export function createRouteReference<const TRoutePattern extends string>(
  routePattern: TRoutePattern,
  metadata?: RouteReferenceOptions,
): RouteReference<InferRoutePatternPath<TRoutePattern>, SearchParamInput> {
  return createRouteReferenceImpl(routePattern, metadata) as unknown as RouteReference<
    InferRoutePatternPath<TRoutePattern>,
    SearchParamInput
  >;
}

/**
 * Bind a route contract to a concrete Fresh route pattern.
 *
 * @param contract - Typed route contract.
 * @param routePattern - Fresh route pattern such as `"/orders/[id]"`.
 * @param metadata - Optional generated manifest metadata.
 * @returns A bound route reference with typed parsing and href helpers.
 */
export function bindRoutePattern<
  TPath extends object = EmptyRecord,
  TSearch extends object = EmptyRecord,
>(
  contract: DefineRouteContract<TPath, TSearch>,
  routePattern: string,
  metadata?: RouteReferenceOptions,
): BoundRouteContract<TPath, TSearch> {
  return bindRoutePatternImpl(
    contract as unknown as Parameters<typeof bindRoutePatternImpl>[0],
    routePattern,
    metadata,
  ) as unknown as BoundRouteContract<TPath, TSearch>;
}

/**
 * Define a typed route contract around optional path and search schemas.
 *
 * @returns A route contract that can be bound to one or more Fresh route patterns.
 *
 * @example
 * ```ts
 * import { defineRouteContract, paginationSearchSchema } from "@netscript/fresh/route";
 *
 * const contract = defineRouteContract({
 *   searchSchema: paginationSearchSchema(),
 * });
 * ```
 */
export function defineRouteContract<
  TPathSchema extends PathParamSchema<object> | undefined = undefined,
  TSearchSchema extends SearchParamSchema<object> | undefined = undefined,
>(
  options: DefineRouteContractOptions<TPathSchema, TSearchSchema> = {},
): DefineRouteContract<SchemaOutput<TPathSchema>, SchemaOutput<TSearchSchema>> {
  return defineRouteContractImpl(
    options as unknown as Parameters<typeof defineRouteContractImpl>[0],
  ) as unknown as DefineRouteContract<SchemaOutput<TPathSchema>, SchemaOutput<TSearchSchema>>;
}

/**
 * Create an enum-backed path schema for a single dynamic route segment.
 *
 * @param paramName - Dynamic route param name.
 * @param values - Allowed string values for the route segment.
 * @returns A path schema accepted by `defineRouteContract()`.
 */
export function enumPathParamSchema<
  const TParamName extends string,
  const TValues extends readonly [string, ...string[]],
>(
  paramName: TParamName,
  values: TValues,
): PathParamSchema<Record<TParamName, TValues[number]>> {
  return enumPathParamSchemaImpl(paramName, values) as PathParamSchema<
    Record<TParamName, TValues[number]>
  >;
}

/**
 * Create a reusable enum-backed path param helper.
 *
 * @param paramName - Dynamic route param name.
 * @param values - Allowed string values for the route segment.
 * @returns A definition that exposes both the schema and a direct parser.
 */
export function defineEnumPathParam<
  const TParamName extends string,
  const TValues extends readonly [string, ...string[]],
>(
  paramName: TParamName,
  values: TValues,
): EnumPathParamDefinition<TParamName, TValues> {
  const schema = enumPathParamSchema(paramName, values);

  return {
    paramName,
    values,
    schema,
    parse(value: string | undefined): TValues[number] | null {
      const result = schema.safeParse({ [paramName]: value });
      return result.success ? result.data[paramName] : null;
    },
  };
}

/**
 * Apply a fallback value to a Zod search-param field.
 *
 * @param schema - Zod schema for the field.
 * @param defaultValue - Value returned when parsing fails or the field is missing.
 * @returns A `z.catch()` wrapper suitable for `paginationSearchSchema().extend(...)`.
 */
export function fallback<TSchema extends SchemaField<unknown>>(
  schema: TSchema,
  defaultValue: SchemaFieldOutput<TSchema>,
): TSchema {
  return fallbackImpl(
    schema as unknown as Parameters<typeof fallbackImpl>[0],
    defaultValue,
  ) as unknown as TSchema;
}

/**
 * Create a pagination-aware search schema with typed defaults.
 *
 * @param options - Optional pagination defaults.
 * @returns A schema that parses pagination state and computes `offset`.
 */
export function paginationSearchSchema(
  options: PaginationSearchSchemaOptions = {},
): PaginationSearchSchema<PaginationSearchBaseShape> {
  return paginationSearchSchemaImpl(options) as unknown as PaginationSearchSchema<
    PaginationSearchBaseShape
  >;
}
