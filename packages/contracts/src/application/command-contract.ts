import type {
  AnySchema,
  ContractBuilder,
  ContractProcedureBuilderWithInputOutput,
  ContractProcedureBuilderWithOutput,
  MergedErrorMap,
  Schema,
} from '@orpc/contract';
import { baseContract } from './contract-primitives.ts';
import type { BaseContractErrors, BaseContractMeta } from './contract-primitives.ts';
import { commandErrorMap, readCommandContractFailure } from '../domain/command-errors.ts';
import type {
  CommandConflictData,
  CommandErrorMap,
  CommandInProgressData,
  IdempotencyKeyReuseData,
} from '../domain/command-errors.ts';

/** Exact six base errors plus three opt-in command errors. */
export type CommandContractErrors = MergedErrorMap<BaseContractErrors, CommandErrorMap>;

/**
 * Compose command routes with literal errors and the live NetScript metadata contract.
 *
 * @example
 * ```ts
 * import { commandBaseContract } from '@netscript/contracts/commands';
 * import { z } from 'zod';
 * const update = commandBaseContract
 *   .meta({ access: { authentication: 'required' } })
 *   .input(z.object({ version: z.number().int() }))
 *   .output(z.object({ updated: z.boolean() }));
 * ```
 */
export const commandBaseContract: ContractBuilder<
  Schema<unknown, unknown>,
  Schema<unknown, unknown>,
  CommandContractErrors,
  BaseContractMeta
> = baseContract.errors(commandErrorMap);

/** Input/output route annotation preserving command errors and NetScript metadata. */
export type CommandContractRoute<TInput extends AnySchema, TOutput extends AnySchema> =
  ContractProcedureBuilderWithInputOutput<TInput, TOutput, CommandContractErrors, BaseContractMeta>;

/** Output-only route annotation preserving command errors and NetScript metadata. */
export type CommandContractOutputRoute<TOutput extends AnySchema> =
  ContractProcedureBuilderWithOutput<
    Schema<unknown, unknown>,
    TOutput,
    CommandContractErrors,
    BaseContractMeta
  >;

/** Handler-owned constructors for the three client-actionable command errors. */
export interface CommandErrorConstructors {
  /** Construct an optimistic command conflict. */
  COMMAND_CONFLICT(options: { message?: string; data: CommandConflictData }): unknown;
  /** Construct an idempotency-key reuse error. */
  IDEMPOTENCY_KEY_REUSE(options: { message?: string; data: IdempotencyKeyReuseData }): unknown;
  /** Construct an in-progress command error. */
  COMMAND_IN_PROGRESS(options: { message?: string; data: CommandInProgressData }): unknown;
}

/**
 * Throw a validated safe command contract error, or rethrow the original error unchanged.
 *
 * @param error - A command failure or application error caught by the handler.
 * @param errors - The implementing handler's declared command error constructors.
 * @example
 * ```ts
 * import { throwCommandContractError } from '@netscript/contracts/commands';
 * // In a command handler's catch block:
 * // throwCommandContractError(error, errors);
 * ```
 */
export function throwCommandContractError(error: unknown, errors: CommandErrorConstructors): never {
  const failure = readCommandContractFailure(error);
  if (failure === undefined) throw error;
  switch (failure.kind) {
    case 'optimistic_conflict':
      throw errors.COMMAND_CONFLICT({ data: failure });
    case 'idempotency_key_reuse':
      throw errors.IDEMPOTENCY_KEY_REUSE({ data: failure });
    case 'in_progress':
      throw errors.COMMAND_IN_PROGRESS({ data: failure });
  }
}
