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
import {
  baseContract,
  type BaseContractProcedure,
} from '../src/application/contract-primitives.ts';
import type {
  ContractObjectSchema,
  ContractSchema,
  ContractSchemaOutput,
} from '../src/domain/schema-types.ts';
import {
  createPaginatedOutput,
  type PaginatedResult,
  type PaginationInput,
  PaginationInputSchema,
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
 * Generated CRUD contract type.
 */
export type CrudContractOperation<
  TInputSchema extends ContractSchema<unknown> = ContractSchema<unknown>,
  TOutputSchema extends ContractSchema<unknown> = ContractSchema<unknown>,
> =
  & BaseContractProcedure
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

type CrudIdInput<TId extends ContractSchema<unknown>> = ContractObjectSchema<
  Readonly<{ id: ContractSchemaOutput<TId> }>
>;

type CrudListInput<TFilter extends ContractObjectSchema<unknown> | undefined> = TFilter extends
  ContractObjectSchema<infer TFilterOutput> ? ContractObjectSchema<
    PaginationInput & TFilterOutput
  >
  : ContractObjectSchema<PaginationInput>;

type CrudListOutput<TEntity extends ContractSchema<unknown>> = ContractObjectSchema<
  PaginatedResult<ContractSchemaOutput<TEntity>>
>;

type CrudUpdateInput<
  TId extends ContractSchema<unknown>,
  TUpdate extends ContractSchema<unknown>,
> = ContractObjectSchema<
  Readonly<{ id: ContractSchemaOutput<TId>; data: ContractSchemaOutput<TUpdate> }>
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
  operation: BaseContractProcedure,
): CrudContractOperation<TInputSchema, TOutputSchema> {
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
    idSchema = z.coerce.number().int().positive() as unknown as TId,
    filterSchema,
    disable,
  } = options;

  // Build list input schema (pagination + optional filters)
  const listInputSchema = (
    filterSchema
      ? PaginationInputSchema.merge(filterSchema as unknown as z.ZodObject)
      : PaginationInputSchema
  ) as CrudListInput<TFilter>;

  // Build list output schema
  const listOutputSchema = createPaginatedOutput(
    entitySchema,
  ) as CrudListOutput<TEntity>;

  // ID input schema
  const idInputSchema = z.object({
    id: idSchema as unknown as z.ZodTypeAny,
  }) as unknown as CrudIdInput<TId>;
  const updateInputSchema = idInputSchema.merge(
    z.object({ data: updateSchema as unknown as z.ZodTypeAny }),
  ) as CrudUpdateInput<TId, TUpdate>;

  const operations: CrudContract<TEntity, TCreate, TUpdate, TId, TFilter> = {
    list: crudOperation(
      baseContract
        .route({ method: 'GET', path: `/${resource}` })
        .input(listInputSchema)
        .output(listOutputSchema),
    ),
    getById: crudOperation(
      baseContract
        .route({ method: 'GET', path: `/${resource}/{id}` })
        .input(idInputSchema)
        .output(entitySchema),
    ),
    create: crudOperation(
      baseContract
        .route({ method: 'POST', path: `/${resource}` })
        .input(createSchema)
        .output(entitySchema),
    ),
    update: crudOperation(
      baseContract
        .route({ method: 'PATCH', path: `/${resource}/{id}` })
        .input(updateInputSchema)
        .output(entitySchema),
    ),
    delete: crudOperation(
      baseContract
        .route({ method: 'DELETE', path: `/${resource}/{id}` })
        .input(idInputSchema)
        .output(entitySchema),
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
