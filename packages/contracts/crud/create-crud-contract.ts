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
import type { ContractObjectSchema, ContractSchema } from '../src/domain/schema-types.ts';
import { PaginationInputSchema, PaginationOutputSchema } from '../schemas/pagination.ts';

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
  idSchema?: ContractSchema<unknown>;
  /** Additional filters for list endpoint */
  filterSchema?: ContractObjectSchema<unknown>;
  /** Disable specific operations */
  disable?: {
    list?: boolean;
    getById?: boolean;
    create?: boolean;
    update?: boolean;
    delete?: boolean;
  };
}

/**
 * Generated CRUD contract type.
 */
export type CrudContractOperation = BaseContractProcedure;

/**
 * Generated CRUD contract shape.
 */
export type CrudContract = Readonly<{
  list: CrudContractOperation;
  getById: CrudContractOperation;
  create: CrudContractOperation;
  update: CrudContractOperation;
  delete: CrudContractOperation;
}>;

/** Generated CRUD contract shape when selected operations are disabled. */
export type PartialCrudContract = Readonly<Partial<CrudContract>>;

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
 * import { createCrudContract } from '@netscript/contracts';
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
>(options: CrudContractOptions<TEntity, TCreate, TUpdate>): CrudContract {
  const {
    resource,
    entitySchema,
    createSchema,
    updateSchema,
    idSchema = z.coerce.number().int().positive(),
    filterSchema,
    disable = {},
  } = options;

  // Build list input schema (pagination + optional filters)
  const listInputSchema = filterSchema
    ? PaginationInputSchema.merge(filterSchema as unknown as z.ZodObject)
    : PaginationInputSchema;

  // Build list output schema
  const listOutputSchema = z.object({
    data: z.array(entitySchema as unknown as z.ZodTypeAny),
    pagination: PaginationOutputSchema as unknown as z.ZodTypeAny,
  });

  // ID input schema
  const idInputSchema = z.object({ id: idSchema as unknown as z.ZodTypeAny });

  // Build contract object
  const contract: Record<string, CrudContractOperation> = {};

  // List operation
  if (!disable.list) {
    contract.list = baseContract
      .route({ method: 'GET', path: `/${resource}` })
      .input(listInputSchema)
      .output(listOutputSchema);
  }

  // Get by ID operation
  if (!disable.getById) {
    contract.getById = baseContract
      .route({ method: 'GET', path: `/${resource}/{id}` })
      .input(idInputSchema)
      .output(entitySchema);
  }

  // Create operation
  if (!disable.create) {
    contract.create = baseContract
      .route({ method: 'POST', path: `/${resource}` })
      .input(createSchema)
      .output(entitySchema);
  }

  // Update operation
  if (!disable.update) {
    contract.update = baseContract
      .route({ method: 'PATCH', path: `/${resource}/{id}` })
      .input(idInputSchema.merge(z.object({ data: updateSchema as unknown as z.ZodTypeAny })))
      .output(entitySchema);
  }

  // Delete operation
  if (!disable.delete) {
    contract.delete = baseContract
      .route({ method: 'DELETE', path: `/${resource}/{id}` })
      .input(idInputSchema)
      .output(entitySchema);
  }

  return contract as CrudContract;
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
}): PartialCrudContract {
  return createCrudContract({
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
}): PartialCrudContract {
  return createCrudContract({
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
