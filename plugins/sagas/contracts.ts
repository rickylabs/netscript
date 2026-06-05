/**
 * Sagas Plugin - Contracts Only Export
 *
 * This module exports ONLY the contract types and schemas, without pulling in
 * any server-side dependencies like @netscript/queue (which imports ioredis).
 *
 * Use this import in frontend code instead of '@plugins/sagas' to avoid
 * bundling server-only dependencies.
 *
 * @example
 * ```ts
 * // In frontend code:
 * import { sagasContract } from '@plugins/sagas/contracts';
 *
 * // Instead of:
 * // import { sagasContract } from '@plugins/sagas';
 * ```
 *
 * @module
 */

// ============================================================================
// RE-EXPORTS: Contracts (types only, no server dependencies)
// ============================================================================

export * from './contracts/v1/sagas.contract.ts';
