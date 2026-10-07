import { z } from 'zod';
import type { ContractObjectSchema } from './schema-types.ts';

/** Safe data for an optimistic command conflict. */
export type CommandConflictData = Readonly<{ kind: 'optimistic_conflict'; retryable: false }>;

/** Safe data for reuse of an idempotency key with a different request. */
export type IdempotencyKeyReuseData = Readonly<{ kind: 'idempotency_key_reuse'; retryable: false }>;

/** Safe data for a command whose identical request is already in progress. */
export type CommandInProgressData = Readonly<{
  kind: 'in_progress';
  retryable: true;
  retryAfterMs?: number;
}>;

/** Client-actionable command failure payloads, independent of the service implementation. */
export type CommandContractFailure =
  | CommandConflictData
  | IdempotencyKeyReuseData
  | CommandInProgressData;

const conflictSchema = z.strictObject({
  kind: z.literal('optimistic_conflict'),
  retryable: z.literal(false),
});
const reuseSchema = z.strictObject({
  kind: z.literal('idempotency_key_reuse'),
  retryable: z.literal(false),
});
const progressSchema = z.strictObject({
  kind: z.literal('in_progress'),
  retryable: z.literal(true),
  retryAfterMs: z.number().int().nonnegative().optional(),
});
const safeFailureSchema = z.discriminatedUnion('kind', [
  conflictSchema,
  reuseSchema,
  progressSchema,
]);

/** Strict transport schema for an optimistic command conflict. */
export const CommandConflictSchema: ContractObjectSchema<CommandConflictData, CommandConflictData> =
  conflictSchema;

/** Strict transport schema for idempotency-key reuse. */
export const IdempotencyKeyReuseSchema: ContractObjectSchema<
  IdempotencyKeyReuseData,
  IdempotencyKeyReuseData
> = reuseSchema;

/** Strict transport schema for a bounded command retry hint. */
export const CommandInProgressSchema: ContractObjectSchema<
  CommandInProgressData,
  CommandInProgressData
> = progressSchema;

/** Exact command error map, opt-in and additional to the six base errors. */
export type CommandErrorMap = Readonly<{
  COMMAND_CONFLICT: Readonly<{
    status: 409;
    message: 'The command no longer matches current state';
    data: ContractObjectSchema<CommandConflictData, CommandConflictData>;
  }>;
  IDEMPOTENCY_KEY_REUSE: Readonly<{
    status: 409;
    message: 'The idempotency key was used for another request';
    data: ContractObjectSchema<IdempotencyKeyReuseData, IdempotencyKeyReuseData>;
  }>;
  COMMAND_IN_PROGRESS: Readonly<{
    status: 409;
    message: 'An identical command is still in progress';
    data: ContractObjectSchema<CommandInProgressData, CommandInProgressData>;
  }>;
}>;

/** Exact literal command errors applied by commandBaseContract. */
export const commandErrorMap: CommandErrorMap = {
  COMMAND_CONFLICT: {
    status: 409,
    message: 'The command no longer matches current state',
    data: CommandConflictSchema,
  },
  IDEMPOTENCY_KEY_REUSE: {
    status: 409,
    message: 'The idempotency key was used for another request',
    data: IdempotencyKeyReuseSchema,
  },
  COMMAND_IN_PROGRESS: {
    status: 409,
    message: 'An identical command is still in progress',
    data: CommandInProgressSchema,
  },
};

/** Read only structurally validated, client-actionable failure data. */
export function readCommandContractFailure(error: unknown): CommandContractFailure | undefined {
  if (typeof error !== 'object' || error === null || !('failure' in error)) return undefined;
  const result = safeFailureSchema.safeParse(error.failure);
  return result.success ? result.data : undefined;
}
