/**
 * Pagination and query helpers for NetScript data APIs.
 *
 * @example
 * ```typescript
 * import { paginatedQuery } from "@netscript/contracts/query";
 *
 * const users = await paginatedQuery(db.user, { page: 1, limit: 20 });
 * ```
 *
 * @module
 */

export type {
  ContractObjectSchema,
  ContractObjectSchemaLike,
  ContractParseResult,
  ContractSchema,
  ContractSchemaInput,
  ContractSchemaLike,
  ContractSchemaOutput,
} from './src/domain/schema-types.ts';
export * from './src/application/paginated-query.ts';
export * from './schemas/filters.ts';
export * from './schemas/pagination.ts';
