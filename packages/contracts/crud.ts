/**
 * CRUD contract generators for NetScript resource APIs.
 *
 * @example
 * ```typescript
 * import { createCrudContract } from "@netscript/contracts/crud";
 * import { z } from "zod";
 *
 * const UserSchema = z.object({ id: z.number(), name: z.string() });
 * const CreateUserSchema = UserSchema.omit({ id: true });
 *
 * const usersContract = createCrudContract({
 *   resource: "users",
 *   entitySchema: UserSchema,
 *   createSchema: CreateUserSchema,
 *   updateSchema: CreateUserSchema.partial(),
 * });
 * ```
 *
 * @module
 */

export * from './crud/create-crud-contract.ts';
export type {
  BaseContractOutputRoute,
  BaseContractRoute,
} from './src/application/contract-primitives.ts';
export type {
  ContractObjectSchema,
  ContractObjectSchemaLike,
  ContractParseResult,
  ContractSchema,
  ContractSchemaInput,
  ContractSchemaLike,
  ContractSchemaOutput,
} from './src/domain/schema-types.ts';
