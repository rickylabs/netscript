/**
 * Opt-in command transport contracts and safe literal error mapping.
 *
 * Ordinary base contracts keep their six errors; command contracts add three
 * client-actionable codes while preserving NetScript procedure metadata. This
 * module requires no permissions and imports no command runtime or store.
 *
 * @example
 * ```ts
 * import { commandBaseContract } from '@netscript/contracts/commands';
 * import { z } from 'zod';
 * const update = commandBaseContract
 *   .input(z.object({ version: z.number().int() }))
 *   .output(z.object({ updated: z.boolean() }));
 * ```
 *
 * @module
 */
export {
  commandBaseContract,
  type CommandContractErrors,
  type CommandContractOutputRoute,
  type CommandContractRoute,
  type CommandErrorConstructors,
  throwCommandContractError,
} from './src/application/command-contract.ts';
export {
  type CommandConflictData,
  CommandConflictSchema,
  type CommandContractFailure,
  type CommandErrorMap,
  commandErrorMap,
  type CommandInProgressData,
  CommandInProgressSchema,
  type IdempotencyKeyReuseData,
  IdempotencyKeyReuseSchema,
} from './src/domain/command-errors.ts';
