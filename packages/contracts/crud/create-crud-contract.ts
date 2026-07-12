/**
 * CRUD contract generator for standardized resource APIs.
 *
 * @example
 * ```typescript
 * import { createCrudContract } from '@netscript/contracts/crud';
 * import { UserSchema, CreateUserSchema, UpdateUserSchema } from '@database/zod';
 *
 * export const usersContract = createCrudContract({
 *   resource: 'users',
 *   entitySchema: UserSchema,
 *   createSchema: CreateUserSchema,
 *   updateSchema: UpdateUserSchema.partial(),
 * });
 *
 * // Generated contract includes:
 * // - list: GET /users (paginated)
 * // - getById: GET /users/{id}
 * // - create: POST /users
 * // - update: PATCH /users/{id}
 * // - delete: DELETE /users/{id}
 * ```
 *
 * @module
 */

import { z } from 'zod';
import type { AnySchema } from '@orpc/contract';
import { baseContract, type BaseContractRoute } from '../src/application/contract-primitives.ts';

/**
 * Widens a NetScript {@link ContractSchema}-shaped value to oRPC's
 * {@link AnySchema} so it can drive the sound {@link baseContract} builder.
 *
 * The CRUD generator composes routes from the package's minimal
 * {@link ContractSchema} abstraction rather than oRPC's `StandardSchemaV1`, yet
 * every value it passes to `.input(...)`/`.output(...)` is a real Zod schema at
 * runtime (Zod satisfies `StandardSchemaV1`). This helper is the single
 * `ContractSchema`→`AnySchema` boundary of the generator: the parameter widens
 * to `unknown` implicitly, so the assertion is a plain single `as` — it carries
 * no double-assertion erasure. 172a-2-SOUND slice 3 replaced the deprecated
 * structural builder shim (and its double-assertion boundary cast) with this
 * helper plus the real sound {@link baseContract} builder, whose composed routes
 * are the sound `BaseContractRoute` type exported by this package.
 */
const asSchema = (schema: unknown): AnySchema => schema as AnySchema;
import type {
  ContractObjectSchema,
  ContractSchema,
  ContractSchemaInput,
  ContractSchemaOutput,
} from '../src/domain/schema-types.ts';
import {
  createPaginatedOutput,
  type PaginatedResult,
  type PaginationInput,
  PaginationInputSchema,
  type PaginationOutputSchema,
} from '../schemas/pagination.ts';

// ============================================================================
// CRUD CONTRACT OPTIONS
// ============================================================================

/**
 * Options for creating a CRUD contract.
 */
export interface CrudContractOptions<
  TEntity extends ContractSchema<unknown>,
  TCreate extends ContractSchema<unknown>,
  TUpdate extends ContractSchema<unknown>,
  TId extends ContractSchema<unknown> = ContractSchema<number>,
  TFilter extends ContractObjectSchema<unknown> | undefined = undefined,
> {
  /** Resource name (used in route paths, e.g., 'users' → /users) */
  resource: string;
  /** Zod schema for the entity (used in responses) */
  entitySchema: TEntity;
  /** Zod schema for creating entities */
  createSchema: TCreate;
  /** Zod schema for updating entities (should be partial) */
  updateSchema: TUpdate;
  /** ID type schema (default: z.coerce.number().int().positive()) */
  idSchema?: TId;
  /** Additional filters for list endpoint */
  filterSchema?: TFilter;
  /** Disable specific operations */
  disable?: CrudOperationDisable;
}

/** Operation flags used when intentionally generating a partial CRUD contract. */
export type CrudOperationDisable = Readonly<{
  list?: boolean;
  getById?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
}>;

/**
 * Concrete sound route type produced by every CRUD operation builder.
 *
 * Each operation is `baseContract.route(...).input(...).output(...)`, where the
 * input/output schemas are widened to oRPC's {@link AnySchema} at the single
 * {@link asSchema} boundary. That expression's type is exactly
 * `BaseContractRoute<AnySchema, AnySchema>` — a real `@orpc/contract` procedure
 * builder whose `~orpc` marker is a genuine oRPC contract def (not `any`). It
 * replaces the removed erasing procedure alias as the base of
 * {@link CrudContractOperation}.
 */
export type CrudRoute = BaseContractRoute<AnySchema, AnySchema>;

/**
 * Generated CRUD contract type.
 *
 * Intersects the sound {@link CrudRoute} (so each operation is a real oRPC
 * contract procedure that `implement(...)` accepts) with NetScript's precise
 * schema markers. The markers re-narrow the `~orpc` metadata and the
 * `__netscriptSchemas` field back to the exact input/output schema types that
 * the {@link asSchema} `AnySchema` widening erased, so downstream SDK client
 * typing stays precise.
 */
export type CrudContractOperation<
  TInputSchema extends ContractSchema<unknown> = ContractSchema<unknown>,
  TOutputSchema extends ContractSchema<unknown> = ContractSchema<unknown>,
> =
  & CrudRoute
  & Readonly<{
    /** NetScript-owned schema marker used by downstream SDK type extraction. */
    readonly __netscriptSchemas: {
      readonly inputSchema: TInputSchema;
      readonly outputSchema: TOutputSchema;
    };
    /** Public oRPC schema metadata used by downstream client type extraction. */
    readonly '~orpc': {
      readonly inputSchema: TInputSchema;
      readonly outputSchema: TOutputSchema;
    };
  }>;

/** Input schema shape for CRUD operations addressed by identifier. */
export type CrudIdInput<TId extends ContractSchema<unknown>> = ContractObjectSchema<
  Readonly<{ id: ContractSchemaOutput<TId> }>,
  Readonly<{ id: ContractSchemaInput<TId> }>
>;

/** Input schema shape for list operations with pagination and optional filters. */
export type CrudListInput<TFilter extends ContractObjectSchema<unknown> | undefined> =
  TFilter extends ContractObjectSchema<infer TFilterOutput> ? ContractObjectSchema<
      PaginationInput & TFilterOutput,
      ContractSchemaInput<typeof PaginationInputSchema> & ContractSchemaInput<TFilter>
    >
    : typeof PaginationInputSchema;

/** Output schema shape for list operations with paginated entities. */
export type CrudListOutput<TEntity extends ContractSchema<unknown>> = ContractObjectSchema<
  PaginatedResult<ContractSchemaOutput<TEntity>>,
  Readonly<{
    data: ContractSchemaInput<TEntity>[];
    pagination: ContractSchemaInput<typeof PaginationOutputSchema>;
  }>
>;

/** Input schema shape for update operations addressed by identifier. */
export type CrudUpdateInput<
  TId extends ContractSchema<unknown>,
  TUpdate extends ContractSchema<unknown>,
> = ContractObjectSchema<
  Readonly<{ id: ContractSchemaOutput<TId>; data: ContractSchemaOutput<TUpdate> }>,
  Readonly<{ id: ContractSchemaInput<TId>; data: ContractSchemaInput<TUpdate> }>
>;

/**
 * Generated CRUD contract shape.
 */
export type CrudContract<
  TEntity extends ContractSchema<unknown> = ContractSchema<unknown>,
  TCreate extends ContractSchema<unknown> = ContractSchema<unknown>,
  TUpdate extends ContractSchema<unknown> = ContractSchema<unknown>,
  TId extends ContractSchema<unknown> = ContractSchema<number>,
  TFilter extends ContractObjectSchema<unknown> | undefined = undefined,
> = Readonly<{
  list: CrudContractOperation<CrudListInput<TFilter>, CrudListOutput<TEntity>>;
  getById: CrudContractOperation<CrudIdInput<TId>, TEntity>;
  create: CrudContractOperation<TCreate, TEntity>;
  update: CrudContractOperation<CrudUpdateInput<TId, TUpdate>, TEntity>;
  delete: CrudContractOperation<CrudIdInput<TId>, TEntity>;
}>;

/** Generated CRUD contract shape when selected operations are disabled. */
export type PartialCrudContract<
  TEntity extends ContractSchema<unknown> = ContractSchema<unknown>,
  TCreate extends ContractSchema<unknown> = ContractSchema<unknown>,
  TUpdate extends ContractSchema<unknown> = ContractSchema<unknown>,
  TId extends ContractSchema<unknown> = ContractSchema<number>,
  TFilter extends ContractObjectSchema<unknown> | undefined = undefined,
> = Readonly<Partial<CrudContract<TEntity, TCreate, TUpdate, TId, TFilter>>>;

type MutablePartialCrudContract<
  TEntity extends ContractSchema<unknown>,
  TCreate extends ContractSchema<unknown>,
  TUpdate extends ContractSchema<unknown>,
  TId extends ContractSchema<unknown>,
  TFilter extends ContractObjectSchema<unknown> | undefined,
> = {
  -readonly [K in keyof CrudContract<TEntity, TCreate, TUpdate, TId, TFilter>]?: CrudContract<
    TEntity,
    TCreate,
    TUpdate,
    TId,
    TFilter
  >[K];
};

function crudOperation<
  TInputSchema extends ContractSchema<unknown>,
  TOutputSchema extends ContractSchema<unknown>,
>(
  operation: CrudRoute,
): CrudContractOperation<TInputSchema, TOutputSchema> {
  // Single `as`: narrows the sound `CrudRoute` to itself intersected with the
  // NetScript schema markers (`CrudContractOperation` is assignable back to
  // `CrudRoute`). The markers are phantom compile-time refinements — not a
  // double assertion through `unknown`, and no runtime shape change.
  return operation as CrudContractOperation<TInputSchema, TOutputSchema>;
}

// ============================================================================
// CRUD CONTRACT GENERATOR
// ============================================================================

/**
 * Creates a standardized CRUD contract for a resource.
 *
 * Generates five standard operations:
 * - `list`: GET /{resource} - Paginated list with optional filters
 * - `getById`: GET /{resource}/{id} - Get single entity by ID
 * - `create`: POST /{resource} - Create new entity
 * - `update`: PATCH /{resource}/{id} - Update existing entity
 * - `delete`: DELETE /{resource}/{id} - Delete entity
 *
 * @example
 * ```typescript
 * import { createCrudContract } from '@netscript/contracts/crud';
 *
 * const usersContract = createCrudContract({
 *   resource: 'users',
 *   entitySchema: UserSchema,
 *   createSchema: CreateUserSchema,
 *   updateSchema: UpdateUserSchema.partial(),
 *   filterSchema: z.object({
 *     role: z.enum(['admin', 'user']).optional(),
 *     search: z.string().optional(),
 *   }),
 * });
 * ```
 *
 * @example With custom ID type
 * ```typescript
 * const postsContract = createCrudContract({
 *   resource: 'posts',
 *   entitySchema: PostSchema,
 *   createSchema: CreatePostSchema,
 *   updateSchema: UpdatePostSchema.partial(),
 *   idSchema: z.string().uuid(), // UUID instead of numeric ID
 * });
 * ```
 */
/**
 * Create a full CRUD contract with every operation enabled.
 */
export function createCrudContract<
  TEntity extends ContractSchema<unknown>,
  TCreate extends ContractSchema<unknown>,
  TUpdate extends ContractSchema<unknown>,
  TId extends ContractSchema<unknown> = ContractSchema<number>,
  TFilter extends ContractObjectSchema<unknown> | undefined = undefined,
>(
  options: CrudContractOptions<TEntity, TCreate, TUpdate, TId, TFilter> & {
    readonly disable?: undefined;
  },
): CrudContract<TEntity, TCreate, TUpdate, TId, TFilter>;
/**
 * Create a CRUD contract with selected operations disabled.
 */
export function createCrudContract<
  TEntity extends ContractSchema<unknown>,
  TCreate extends ContractSchema<unknown>,
  TUpdate extends ContractSchema<unknown>,
  TId extends ContractSchema<unknown> = ContractSchema<number>,
  TFilter extends ContractObjectSchema<unknown> | undefined = undefined,
>(
  options: CrudContractOptions<TEntity, TCreate, TUpdate, TId, TFilter> & {
    readonly disable: CrudOperationDisable;
  },
): PartialCrudContract<TEntity, TCreate, TUpdate, TId, TFilter>;
export function createCrudContract<
  TEntity extends ContractSchema<unknown>,
  TCreate extends ContractSchema<unknown>,
  TUpdate extends ContractSchema<unknown>,
  TId extends ContractSchema<unknown> = ContractSchema<number>,
  TFilter extends ContractObjectSchema<unknown> | undefined = undefined,
>(
  options: CrudContractOptions<TEntity, TCreate, TUpdate, TId, TFilter>,
):
  | CrudContract<TEntity, TCreate, TUpdate, TId, TFilter>
  | PartialCrudContract<
    TEntity,
    TCreate,
    TUpdate,
    TId,
    TFilter
  > {
  const {
    resource,
    entitySchema,
    createSchema,
    updateSchema,
    idSchema: configuredIdSchema,
    filterSchema,
    disable,
  } = options;
  const idSchema = configuredIdSchema ?? z.coerce.number().int().positive();

  // Build list input schema (pagination + optional filters)
  const listInputSchema = filterSchema
    ? z.object({ ...PaginationInputSchema.shape, ...filterSchema.shape })
    : PaginationInputSchema;

  // Build list output schema
  const listOutputSchema = createPaginatedOutput(entitySchema);

  // ID input schema
  const idInputSchema = z.object({
    id: idSchema,
  });
  const updateInputSchema = z.object({
    id: idSchema,
    data: updateSchema,
  });

  const operations: CrudContract<TEntity, TCreate, TUpdate, TId, TFilter> = {
    list: crudOperation(
      baseContract
        .route({ method: 'GET', path: `/${resource}` })
        .input(asSchema(listInputSchema))
        .output(asSchema(listOutputSchema)),
    ),
    getById: crudOperation(
      baseContract
        .route({ method: 'GET', path: `/${resource}/{id}` })
        .input(asSchema(idInputSchema))
        .output(asSchema(entitySchema)),
    ),
    create: crudOperation(
      baseContract
        .route({ method: 'POST', path: `/${resource}` })
        .input(asSchema(createSchema))
        .output(asSchema(entitySchema)),
    ),
    update: crudOperation(
      baseContract
        .route({ method: 'PATCH', path: `/${resource}/{id}` })
        .input(asSchema(updateInputSchema))
        .output(asSchema(entitySchema)),
    ),
    delete: crudOperation(
      baseContract
        .route({ method: 'DELETE', path: `/${resource}/{id}` })
        .input(asSchema(idInputSchema))
        .output(asSchema(entitySchema)),
    ),
  };

  if (!disable) {
    return operations;
  }

  const contract: MutablePartialCrudContract<TEntity, TCreate, TUpdate, TId, TFilter> = {};

  if (!disable.list) {
    contract.list = operations.list;
  }

  if (!disable.getById) {
    contract.getById = operations.getById;
  }

  if (!disable.create) {
    contract.create = operations.create;
  }

  if (!disable.update) {
    contract.update = operations.update;
  }

  if (!disable.delete) {
    contract.delete = operations.delete;
  }

  return contract;
}

// ============================================================================
// PARTIAL CRUD CONTRACTS
// ============================================================================

/**
 * Creates a read-only CRUD contract (list + getById only).
 *
 * @example
 * ```typescript
 * const auditLogsContract = createReadOnlyContract({
 *   resource: 'audit-logs',
 *   entitySchema: AuditLogSchema,
 * });
 * ```
 */
export function createReadOnlyContract<TEntity extends ContractSchema<unknown>>(options: {
  resource: string;
  entitySchema: TEntity;
  idSchema?: ContractSchema<unknown>;
  filterSchema?: ContractObjectSchema<unknown>;
}): PartialCrudContract<
  TEntity,
  ContractSchema<never>,
  ContractSchema<never>,
  ContractSchema<unknown>,
  ContractObjectSchema<unknown> | undefined
> {
  return createCrudContract<
    TEntity,
    ContractSchema<never>,
    ContractSchema<never>,
    ContractSchema<unknown>,
    ContractObjectSchema<unknown> | undefined
  >({
    resource: options.resource,
    entitySchema: options.entitySchema,
    createSchema: z.never(),
    updateSchema: z.never(),
    idSchema: options.idSchema,
    filterSchema: options.filterSchema,
    disable: {
      create: true,
      update: true,
      delete: true,
    },
  });
}

/**
 * Creates a list-only contract (no individual entity operations).
 *
 * @example
 * ```typescript
 * const statsContract = createListOnlyContract({
 *   resource: 'stats',
 *   entitySchema: StatsSchema,
 * });
 * ```
 */
export function createListOnlyContract<TEntity extends ContractSchema<unknown>>(options: {
  resource: string;
  entitySchema: TEntity;
  filterSchema?: ContractObjectSchema<unknown>;
}): PartialCrudContract<
  TEntity,
  ContractSchema<never>,
  ContractSchema<never>,
  ContractSchema<number>,
  ContractObjectSchema<unknown> | undefined
> {
  return createCrudContract<
    TEntity,
    ContractSchema<never>,
    ContractSchema<never>,
    ContractSchema<number>,
    ContractObjectSchema<unknown> | undefined
  >({
    resource: options.resource,
    entitySchema: options.entitySchema,
    createSchema: z.never(),
    updateSchema: z.never(),
    filterSchema: options.filterSchema,
    disable: {
      getById: true,
      create: true,
      update: true,
      delete: true,
    },
  });
}
