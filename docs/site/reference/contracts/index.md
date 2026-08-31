---
layout: layouts/base.vto
title: "@netscript/contracts"
---

# `@netscript/contracts`

Contract vocabulary shared across NetScript package and plugin boundaries: the oRPC base
contract, common error data, pagination schemas, result types, and schema helper factories.
Because a contract's input schema is enforced at the transport boundary, a service handler never
hand-parses or validates `req.json()` — a request that doesn't match the schema is rejected before
your code runs, and the same contract types the client that calls it. This page is written against
the package's public surface reported by `deno doc`. For the full index of packages and plugins
return to the [reference overview](/reference/).

The root entrypoint (`@netscript/contracts`) carries the core contract primitives. Three
sub-path exports add higher-level builders:

- [`@netscript/contracts/crud`](#sub-path-exports) — CRUD contract generators.
- [`@netscript/contracts/query`](#sub-path-exports) — query, filter, and pagination helpers.
- [`@netscript/contracts/transform`](#sub-path-exports) — typed transformer factories.

## Base contract

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `baseContract` | const | `const baseContract: BaseContract` | Common oRPC contract primitive with NetScript's standard error map applied. |
| `BaseContract` | type alias | `type BaseContract = typeof baseContract` | Common oRPC contract primitive with NetScript's standard error map applied. |
| `BaseContractErrors` | type alias | `type BaseContractErrors = MergedErrorMap<Record<never, never>, CommonErrorMap>` | NetScript-owned name for the exact standard error map carried by every base route. Its error codes, HTTP statuses, message literals, and data schemas are the stable compatibility contract. |
| `BaseContractMeta` | type alias | `type BaseContractMeta = NetScriptProcedureMeta & Record<never, never>` | NetScript-owned exact metadata slot carried by the base builder. Compatibility evolves through additive optional readonly fields on `NetScriptProcedureMeta`. |
| `BaseContractRoute` | type alias | `type BaseContractRoute<TIn, TOut> = ContractProcedureBuilderWithInputOutput<...>` | Sound type of a route built via baseContract.route(...).input(TIn).output(TOut). |
| `BaseContractOutputRoute` | type alias | `type BaseContractOutputRoute<TOut> = ContractProcedureBuilderWithOutput<...>` | Sound type of an output-only route built via baseContract.route(...).output(TOut) (no .input(...)). |
| `NetScriptAuthenticationRequirement` | type alias | `type NetScriptAuthenticationRequirement = "none" \| "optional" \| "required"` | NetScript-owned authentication vocabulary used by procedure metadata. Existing literals remain stable; metadata capabilities evolve through additive optional readonly fields. |
| `NetScriptProcedureMeta` | interface | `interface NetScriptProcedureMeta` | NetScript-owned semantic procedure metadata, independent of the upstream contract-library representation. Consumers treat absent fields as unspecified; compatibility evolves through additive optional readonly fields. |

## Schema helper factories

| Symbol | Signature | Description |
| --- | --- | --- |
| `boundedString` | `function boundedString(options: BoundedStringSchemaOptions): ContractStringSchema` | Creates a bounded string schema. |
| `positiveInt` | `function positiveInt(options: IntegerSchemaOptions): ContractNumberSchema` | Creates a positive integer schema with NetScript's default integer cap. |
| `nonNegativeInt` | `function nonNegativeInt(options: IntegerSchemaOptions): ContractNumberSchema` | Creates a non-negative integer schema with NetScript's default integer cap. |
| `positiveNumber` | `function positiveNumber(options: StringSchemaOptions): ContractNumberSchema` | Creates a positive decimal-number schema. |
| `nonNegativeNumber` | `function nonNegativeNumber(options: StringSchemaOptions): ContractNumberSchema` | Creates a non-negative decimal-number schema. |
| `paginationLimit` | `function paginationLimit(options: DefaultedIntegerSchemaOptions): ContractNumberSchema` | Creates a defaulted pagination-limit schema. |
| `paginationOffset` | `function paginationOffset(options: DefaultedIntegerSchemaOptions): ContractNumberSchema` | Creates a defaulted pagination-offset schema. |
| `stringToInt` | `function stringToInt(outputSchema: ContractDefaultableSchema<number>): ContractSchema<number>` | Coerces an integer string into a number and validates it with `outputSchema`. |
| `stringToNumber` | `function stringToNumber(outputSchema: ContractDefaultableSchema<number>): ContractSchema<number>` | Coerces a numeric string into a number and validates it with `outputSchema`. |

## Errors

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `notFound` | function | `function notFound(options: NotFoundOptions): never` | Throws the contract `NOT_FOUND` oRPC error with inferred resource context. |
| `validationFailed` | function | `function validationFailed(options: ValidationFailedOptions): never` | Throws the contract `VALIDATION_ERROR` oRPC error. |
| `getResourceType` | function | `function getResourceType(options: { path?: readonly string[]; }): string` | Resolves a singular resource name from an oRPC handler path. |
| `COMMON_ERROR_CODES` | const | `const COMMON_ERROR_CODES: Readonly<{ notFound; validationError; unauthorized; forbidden; rateLimited; serviceUnavailable; }>` | Common oRPC error codes shared by NetScript service contracts. |
| `CommonErrorMap` | type alias | `type CommonErrorMap = Readonly<{ ... }>` | The standard NetScript error map carried by every base route. Its error codes, HTTP statuses, message literals, and data schemas are stable compatibility commitments. |
| `NotFoundErrorSchema` | const | `const NotFoundErrorSchema: ContractSchema<NotFoundError>` | Common not-found error schema. |
| `ValidationErrorSchema` | const | `const ValidationErrorSchema: ContractSchema<ValidationError>` | Common validation error schema. |
| `UnauthorizedErrorSchema` | const | `const UnauthorizedErrorSchema: ContractSchema<UnauthorizedError>` | Common unauthorized error schema. |
| `ForbiddenErrorSchema` | const | `const ForbiddenErrorSchema: ContractSchema<ForbiddenError>` | Common forbidden error schema. |
| `RateLimitErrorSchema` | const | `const RateLimitErrorSchema: ContractSchema<RateLimitError>` | Common rate-limit error schema. |
| `ServiceUnavailableErrorSchema` | const | `const ServiceUnavailableErrorSchema: ContractSchema<ServiceUnavailableError>` | Common service-unavailable error schema. |
| `SuccessSchema` | const | `const SuccessSchema: ContractSchema<SuccessResponse>` | Common success response schema. |
| `ValidationFailedOptions` | type alias | `type ValidationFailedOptions = Readonly<{ errors: unknown; message: string; fieldErrors?: Record<string, string[]>; formErrors?: string[]; }>` | Options for throwing a contract `VALIDATION_ERROR` oRPC error. |

## Pagination schemas

| Symbol | Signature | Description |
| --- | --- | --- |
| `OffsetPaginationQuerySchema` | `const OffsetPaginationQuerySchema: ContractObjectSchema<OffsetPaginationQuery>` | Offset pagination schema for URL query parameters. |
| `OffsetPaginationInputSchema` | `const OffsetPaginationInputSchema: ContractObjectSchema<OffsetPaginationInput>` | Offset pagination schema for request bodies. |
| `OffsetPaginationMetaSchema` | `const OffsetPaginationMetaSchema: ContractObjectSchema<OffsetPaginationMeta>` | Offset pagination metadata schema for responses. |
| `CursorPaginationQuerySchema` | `const CursorPaginationQuerySchema: ContractObjectSchema<CursorPaginationQuery>` | Cursor pagination schema for URL query parameters. |
| `CursorPaginationInputSchema` | `const CursorPaginationInputSchema: ContractObjectSchema<CursorPaginationInput>` | Cursor pagination schema for request bodies. |
| `CursorPaginationMetaSchema` | `const CursorPaginationMetaSchema: ContractObjectSchema<CursorPaginationMeta>` | Cursor pagination metadata schema for responses. |

## Constants

| Symbol | Value | Description |
| --- | --- | --- |
| `DEFAULT_INTEGER_MAX` | `2147483647` | Maximum integer used by contract numeric schemas. |
| `DEFAULT_PAGINATION_LIMIT` | `10` | Default page size for contract pagination schemas. |
| `DEFAULT_PAGINATION_LIMIT_MAX` | `1000` | Maximum page size accepted by contract pagination schemas. |
| `DEFAULT_PAGINATION_OFFSET` | `0` | Default offset for contract offset-pagination schemas. |

## Diagnostics

| Symbol | Signature | Description |
| --- | --- | --- |
| `inspectContracts` | `function inspectContracts(target: ContractsInspectionTarget): InspectionReport` | Builds a JSON-stable inspection report for a contract primitive. |

## Result and error types

| Symbol | Signature | Description |
| --- | --- | --- |
| `Result` | `type Result<TValue, TError> = OkResult<TValue> \| ErrorResult<TError>` | Discriminated success/error result union. |
| `OkResult` | `type OkResult<TValue> = Readonly<{ ok: true; value: TValue; }>` | Success arm of `Result`. |
| `ErrorResult` | `type ErrorResult<TError> = Readonly<{ ok: false; error: TError; }>` | Error arm of `Result`. |
| `SuccessResponse` | `type SuccessResponse = Readonly<{ success: boolean; message?: string; }>` | Common success response payload. |
| `NotFoundError` | `type NotFoundError = Readonly<{ resourceType: string; resourceId: string \| number; }>` | Not-found error data. |
| `ValidationError` | `type ValidationError = Readonly<{ formErrors: string[]; fieldErrors: Record<string, string[] \| undefined>; }>` | Validation error data. |
| `UnauthorizedError` | `type UnauthorizedError = Readonly<{ reason?: "missing_token" \| "invalid_token" \| "expired_token"; }>` | Unauthorized error data. |
| `ForbiddenError` | `type ForbiddenError = Readonly<{ requiredRole?: string; userRole?: string; }>` | Forbidden error data. |
| `RateLimitError` | `type RateLimitError = Readonly<{ retryAfter: number; limit: number; }>` | Rate-limit error data. |
| `ServiceUnavailableError` | `type ServiceUnavailableError = Readonly<{ retryAfter?: number; reason?: string; }>` | Service-unavailable error data. |

## Schema and pagination types

| Symbol | Signature | Description |
| --- | --- | --- |
| `ContractSchema` | `type ContractSchema<TOutput = unknown>` | Minimal schema contract (`parse`, `safeParse`, `optional`, `describe`). |
| `ContractObjectSchema` | `type ContractObjectSchema<TOutput = unknown>` | Object schema contract with `extend`/`merge`. |
| `ContractDefaultableSchema` | `type ContractDefaultableSchema<TOutput>` | Schema contract with a `default(value)` helper. |
| `ContractNumberSchema` | `type ContractNumberSchema = ContractDefaultableSchema<number>` | Numeric schema contract. |
| `ContractStringSchema` | `type ContractStringSchema = ContractDefaultableSchema<string>` | String schema contract. |
| `ContractParseResult` | `type ContractParseResult<TOutput>` | Result returned by `safeParse`. |
| `ContractSchemaInput` | `type ContractSchemaInput<T>` | Infer the accepted input value type from a Zod-compatible schema. |
| `ContractSchemaOutput` | `type ContractSchemaOutput<T>` | Infer the parsed output value type from a Zod-compatible schema. |
| `ContractSchemaLike` | `type ContractSchemaLike` | Cross-resolution schema constraint used at consumer-supplied boundaries. |
| `ContractObjectSchemaLike` | `type ContractObjectSchemaLike` | Cross-resolution object-schema constraint for consumer-supplied shapes. |
| `OffsetPaginationQuery` | `type OffsetPaginationQuery = Readonly<{ limit: number; offset: number; }>` | Offset pagination query shape. |
| `OffsetPaginationInput` | `type OffsetPaginationInput = Readonly<{ limit: number; offset: number; }>` | Offset pagination input shape. |
| `OffsetPaginationMeta` | `type OffsetPaginationMeta = Readonly<{ total: number; limit: number; offset: number; hasMore: boolean; }>` | Offset pagination response metadata. |
| `CursorPaginationQuery` | `type CursorPaginationQuery = Readonly<{ limit: number; cursor?: string; }>` | Cursor pagination query shape. |
| `CursorPaginationInput` | `type CursorPaginationInput = Readonly<{ limit: number; cursor?: string; }>` | Cursor pagination input shape. |
| `CursorPaginationMeta` | `type CursorPaginationMeta = Readonly<{ limit: number; nextCursor: string \| null; hasMore: boolean; }>` | Cursor pagination response metadata. |

## Schema option types

| Symbol | Signature | Description |
| --- | --- | --- |
| `StringSchemaOptions` | `type StringSchemaOptions = Readonly<{ description?: string; }>` | Options for string-derived schema factories. |
| `BoundedStringSchemaOptions` | `type BoundedStringSchemaOptions = StringSchemaOptions & Readonly<{ min?: number; max: number; }>` | Options for `boundedString`. |
| `IntegerSchemaOptions` | `type IntegerSchemaOptions = Readonly<{ min?: number; max?: number; description?: string; }>` | Options for integer schema factories. |
| `DefaultedIntegerSchemaOptions` | `type DefaultedIntegerSchemaOptions = IntegerSchemaOptions & Readonly<{ default?: number; }>` | Options for defaulted integer factories. |
| `NotFoundOptions` | `type NotFoundOptions = Readonly<{ errors: unknown; path?: readonly string[]; resourceId?: string \| number; message?: string; }>` | Options accepted by `notFound`. |
| `ContractsInspectionTarget` | `type ContractsInspectionTarget = unknown` | Target accepted by `inspectContracts`. |
| `InspectionReport` | `type InspectionReport` | JSON-stable report returned by `inspectContracts`. |
| `InspectionStatus` | `type InspectionStatus = "ok" \| "warning" \| "error"` | Status field of `InspectionReport`. |

## Sub-path exports

The following entrypoints are published alongside the root export. Their symbols are generated
from their own `deno doc` surface.

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/contracts` | `./mod.ts` | Core contract surface (documented above). |
| `@netscript/contracts/crud` | `./crud.ts` | CRUD contract generators. |
| `@netscript/contracts/query` | `./query.ts` | Query, filter, and pagination helpers. |
| `@netscript/contracts/transform` | `./transform.ts` | Typed transformer factories. |

### `@netscript/contracts/crud`

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createCrudContract` | function | `function createCrudContract<TEntity, TCreate, TUpdate>(options: CrudContractOptions<...>): CrudContract` | Generates a full list/get/create/update/delete oRPC CRUD contract. |
| `createReadOnlyContract` | function | `function createReadOnlyContract<TEntity>(options: { resource; entitySchema; idSchema?; filterSchema?; }): CrudContract` | Generates a read-only (list + get) CRUD contract. |
| `createListOnlyContract` | function | `function createListOnlyContract<TEntity>(options: { resource; entitySchema; filterSchema?; }): CrudContract` | Generates a list-only CRUD contract. |
| `CrudContract` | type alias | `type CrudContract = Readonly<{ list?; getById?; create?; update?; delete?; }>` | The generated CRUD contract map of operations. |
| `CrudContractOperation` | type alias | `type CrudContractOperation = BaseContractProcedure` | A single generated CRUD operation procedure. |
| `CrudContractOptions` | interface | `interface CrudContractOptions<TEntity, TCreate, TUpdate>` | Options accepted by `createCrudContract`. |
| `CrudRoute` | type alias | `type CrudRoute` | Concrete sound route type produced by every CRUD operation builder. |
| `CrudOperationDisable` | type alias | `type CrudOperationDisable` | Operation flags used when generating partial CRUD contracts. |
| `CrudIdInput` | type alias | `type CrudIdInput` | Input schema shape for CRUD operations addressed by identifier. |
| `CrudListInput` | type alias | `type CrudListInput` | Input schema shape for list operations with pagination and filters. |
| `CrudListOutput` | type alias | `type CrudListOutput` | Output schema shape for list operations with paginated entities. |
| `CrudUpdateInput` | type alias | `type CrudUpdateInput` | Input schema shape for update operations addressed by identifier. |
| `PartialCrudContract` | type alias | `type PartialCrudContract` | Generated CRUD contract shape when selected operations are disabled. |

### `@netscript/contracts/query`

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `paginatedQuery` | function | `function paginatedQuery<T>(model: PrismaModelDelegate, options?: PaginatedQueryOptions): Promise<PaginatedResult<T>>` | Executes a page-based paginated query on a Prisma model. |
| `offsetPaginatedQuery` | function | `function offsetPaginatedQuery<T>(model: PrismaModelDelegate, options?: OffsetPaginatedQueryOptions): Promise<{ data: T[]; total: number; hasMore: boolean; }>` | Executes an offset-based paginated query on a Prisma model. |
| `cursorPaginatedQuery` | function | `function cursorPaginatedQuery<T extends { id: string \| number }>(model: PrismaModelDelegate, options?: CursorPaginatedQueryOptions): Promise<{ data: T[]; nextCursor: string \| null; hasMore: boolean; }>` | Executes a cursor-based paginated query on a Prisma model. |
| `buildPrismaWhere` | function | `function buildPrismaWhere(filters: FilterCondition[]): Record<string, unknown>` | Builds a Prisma `where` clause from filter conditions. |
| `buildSearchCondition` | function | `function buildSearchCondition(query: string, fields: string[]): Record<string, unknown> \| null` | Builds a Prisma search condition across the given fields. |
| `combineConditions` | function | `function combineConditions(options: { filters?; search?; searchFields?; }): Record<string, unknown>` | Combines filter and search conditions into one Prisma clause. |
| `createPaginatedOutput` | function | `function createPaginatedOutput<T>(itemSchema: ContractSchema<T>): ContractObjectSchema<PaginatedResult<T>>` | Wraps an item schema in an offset-paginated output schema. |
| `createCursorPaginatedOutput` | function | `function createCursorPaginatedOutput<T>(itemSchema: ContractSchema<T>): ContractObjectSchema<CursorPaginatedResult<T>>` | Wraps an item schema in a cursor-paginated output schema. |
| `PaginationInputSchema` | const | `const PaginationInputSchema: ContractObjectSchema<PaginationInput>` | Page/limit pagination input schema. |
| `PaginationOutputSchema` | const | `const PaginationOutputSchema: ContractObjectSchema<PaginationOutput>` | Page pagination output metadata schema. |
| `OffsetPaginationInputSchema` | const | `const OffsetPaginationInputSchema: ContractObjectSchema<OffsetPaginationInput>` | Offset/limit pagination input schema. |
| `CursorPaginationInputSchema` | const | `const CursorPaginationInputSchema: ContractObjectSchema<CursorPaginationInput>` | Cursor pagination input schema. |
| `CursorPaginationOutputSchema` | const | `const CursorPaginationOutputSchema: ContractObjectSchema<CursorPaginationOutput>` | Cursor pagination output metadata schema. |
| `SearchInputSchema` | const | `const SearchInputSchema: ContractObjectSchema<SearchInput>` | Search/filter input schema. |
| `FilterConditionSchema` | const | `const FilterConditionSchema: ContractObjectSchema<FilterCondition>` | Single filter condition schema. |
| `FiltersSchema` | const | `const FiltersSchema: ContractSchema<Filters>` | Array-of-filters schema. |
| `FilterOperatorSchema` | const | `const FilterOperatorSchema: ContractSchema<FilterOperator>` | Filter operator enum schema. |
| `PaginationInput` | type alias | `type PaginationInput = Readonly<{ page; limit; sortBy?; sortOrder; }>` | Page/limit pagination input. |
| `PaginationOutput` | type alias | `type PaginationOutput = Readonly<{ page; limit; total; totalPages; hasNext; hasPrev; }>` | Page pagination output metadata. |
| `OffsetPaginationInput` | type alias | `type OffsetPaginationInput = Readonly<{ offset; limit; sortBy?; sortOrder; }>` | Offset/limit pagination input. |
| `CursorPaginationInput` | type alias | `type CursorPaginationInput = Readonly<{ cursor?; limit; direction; }>` | Cursor pagination input. |
| `CursorPaginationOutput` | type alias | `type CursorPaginationOutput = Readonly<{ nextCursor; prevCursor; hasMore; }>` | Cursor pagination output metadata. |
| `FilterCondition` | type alias | `type FilterCondition = Readonly<{ field; operator; value?; }>` | Single filter condition. |
| `Filters` | type alias | `type Filters = readonly FilterCondition[]` | Ordered list of filter conditions. |
| `FilterOperator` | type alias | `type FilterOperator` | Supported filter operators (equals, contains, gt, in, isNull, and so on). |
| `SearchInput` | type alias | `type SearchInput = Readonly<{ search?; searchFields?; filters?; }>` | Search + filter input. |
| `PaginatedResult` | interface | `interface PaginatedResult<T>` | Offset-paginated result shape. |
| `CursorPaginatedResult` | interface | `interface CursorPaginatedResult<T>` | Cursor-paginated result shape. |
| `PaginatedQueryOptions` | interface | `interface PaginatedQueryOptions extends Partial<PaginationInput>` | Options for an offset-paginated query. |
| `OffsetPaginatedQueryOptions` | interface | `interface OffsetPaginatedQueryOptions` | Options for an offset-paginated query. |
| `CursorPaginatedQueryOptions` | interface | `interface CursorPaginatedQueryOptions` | Options for a cursor-paginated query. |
| `PrismaModelDelegate` | interface | `interface PrismaModelDelegate` | Minimal Prisma delegate contract used by query helpers. |

#### Pagination Executors

The `@netscript/contracts/query` subpath exports three typed executors to apply validated pagination parameters to a Prisma query:

- `paginatedQuery`: Page-based pagination (page, limit) returning total count and pages.
- `offsetPaginatedQuery`: Offset-based pagination (offset, limit) returning total count and a boolean indicating if more items exist.
- `cursorPaginatedQuery`: Cursor-based pagination (cursor, limit, direction) returning the next cursor.

##### Page Pagination (page + limit)
Shows schema, contract, validated input, typed Prisma execution, and response metadata.

```typescript
import { z } from 'zod';
import { baseContract, type BaseContractRoute } from '@netscript/contracts';
import {
  paginatedQuery,
  PaginationInputSchema,
  createPaginatedOutput,
} from '@netscript/contracts/query';

const UserSchema = z.object({ id: z.number(), name: z.string() });

export const listUsersContract = baseContract
  .route({ method: 'GET', path: '/users' })
  .input(PaginationInputSchema)
  .output(createPaginatedOutput(UserSchema));

export async function handleListUsers(input: z.infer<typeof PaginationInputSchema>) {
  const result = await paginatedQuery(db.user, input);
  return result;
}
```

##### Offset Pagination (offset + limit)
Useful for infinite scrolls or simple pagination that doesn't need total pages.

```typescript
import { z } from 'zod';
import { baseContract } from '@netscript/contracts';
import {
  offsetPaginatedQuery,
  OffsetPaginationInputSchema,
} from '@netscript/contracts/query';

const UserSchema = z.object({ id: z.number(), name: z.string() });

export const listUsersOffsetContract = baseContract
  .route({ method: 'GET', path: '/users/offset' })
  .input(OffsetPaginationInputSchema)
  .output(z.object({
    data: z.array(UserSchema),
    total: z.number(),
    hasMore: z.boolean(),
  }));

export async function handleListUsersOffset(input: z.infer<typeof OffsetPaginationInputSchema>) {
  const result = await offsetPaginatedQuery(db.user, input);
  return result;
}
```

##### Cursor Pagination
Ideal for large datasets and active feeds.

```typescript
import { z } from 'zod';
import { baseContract } from '@netscript/contracts';
import {
  cursorPaginatedQuery,
  CursorPaginationInputSchema,
} from '@netscript/contracts/query';

const UserSchema = z.object({ id: z.number(), name: z.string() });

export const listUsersCursorContract = baseContract
  .route({ method: 'GET', path: '/users/cursor' })
  .input(CursorPaginationInputSchema)
  .output(z.object({
    data: z.array(UserSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }));

export async function handleListUsersCursor(input: z.infer<typeof CursorPaginationInputSchema>) {
  const { data, nextCursor, hasMore } = await cursorPaginatedQuery<{ id: number; name: string }>(db.user, {
    cursor: input.cursor,
    limit: input.limit,
    direction: input.direction,
    cursorField: 'id',
  });
  return { data, nextCursor, hasMore };
}
```

### `@netscript/contracts/transform`

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `createTransformer` | function | `function createTransformer<TInput, TOutput>(transform: TransformFn<TInput, TOutput>): Transformer<TInput, TOutput>` | Wraps a transform function into a composable `Transformer`. |
| `composeTransformers` | function | `function composeTransformers(...transformers): Transformer` | Composes 2-4 transformers left-to-right into one transformer. |
| `createPickTransformer` | function | `function createPickTransformer<T>(): PickTransformerFactory<T>` | Creates a factory producing transformers that pick keys. |
| `createOmitTransformer` | function | `function createOmitTransformer<T>(): OmitTransformerFactory<T>` | Creates a factory producing transformers that omit keys. |
| `Transformer` | interface | `interface Transformer<TInput, TOutput>` | A composable input-to-output transformer. |
| `TransformFn` | type alias | `type TransformFn<TInput, TOutput> = (input: TInput) => TOutput` | The underlying transform function signature. |
| `PickTransformerFactory` | type alias | `type PickTransformerFactory<T> = (...keys) => Transformer<T, Pick<T, K>>` | Factory returned by `createPickTransformer`. |
| `OmitTransformerFactory` | type alias | `type OmitTransformerFactory<T> = (...keys) => Transformer<T, Omit<T, K>>` | Factory returned by `createOmitTransformer`. |

---

Back to the [reference overview](/reference/).
