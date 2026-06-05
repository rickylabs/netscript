/**
 * CRUD contract generator for standardized resource APIs.
 *
 * @example
 * ```typescript
 * import { createCrudContract } from '@netscript/contracts';
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

import { z, type ZodTypeAny, type ZodObject } from 'zod';
import { baseContract } from '../base-contract.ts';
import { PaginationInputSchema, PaginationOutputSchema } from '../schemas/pagination.ts';

// ============================================================================
// CRUD CONTRACT OPTIONS
// ============================================================================

/**
 * Options for creating a CRUD contract.
 */
export interface CrudContractOptions<
  TEntity extends ZodTypeAny,
  TCreate extends ZodTypeAny,
  TUpdate extends ZodTypeAny,
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
  idSchema?: ZodTypeAny;
  /** Additional filters for list endpoint */
  // deno-lint-ignore no-explicit-any
  filterSchema?: ZodObject<any>;
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
export type CrudContract<
  TEntity extends ZodTypeAny,
  TCreate extends ZodTypeAny,
  TUpdate extends ZodTypeAny,
> = ReturnType<typeof createCrudContract<TEntity, TCreate, TUpdate>>;

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
  TEntity extends ZodTypeAny,
  TCreate extends ZodTypeAny,
  TUpdate extends ZodTypeAny,
>(options: CrudContractOptions<TEntity, TCreate, TUpdate>) {
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
    ? PaginationInputSchema.merge(filterSchema)
    : PaginationInputSchema;

  // Build list output schema
  const listOutputSchema = z.object({
    data: z.array(entitySchema),
    pagination: PaginationOutputSchema,
  });

  // ID input schema
  const idInputSchema = z.object({ id: idSchema });

  // Build contract object
  // deno-lint-ignore no-explicit-any
  const contract: Record<string, any> = {};

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
      .input(idInputSchema.merge(z.object({ data: updateSchema })))
      .output(entitySchema);
  }

  // Delete operation
  if (!disable.delete) {
    contract.delete = baseContract
      .route({ method: 'DELETE', path: `/${resource}/{id}` })
      .input(idInputSchema)
      .output(entitySchema);
  }

  return contract as {
    list: typeof contract.list;
    getById: typeof contract.getById;
    create: typeof contract.create;
    update: typeof contract.update;
    delete: typeof contract.delete;
  };
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
export function createReadOnlyContract<TEntity extends ZodTypeAny>(options: {
  resource: string;
  entitySchema: TEntity;
  idSchema?: ZodTypeAny;
  // deno-lint-ignore no-explicit-any
  filterSchema?: ZodObject<any>;
}) {
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
export function createListOnlyContract<TEntity extends ZodTypeAny>(options: {
  resource: string;
  entitySchema: TEntity;
  // deno-lint-ignore no-explicit-any
  filterSchema?: ZodObject<any>;
}) {
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
