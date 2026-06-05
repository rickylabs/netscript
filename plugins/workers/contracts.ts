/**
 * Workers Plugin - Contracts Only Export
 *
 * This module exports ONLY the contract types and schemas, without pulling in
 * any server-side dependencies like @netscript/queue (which imports ioredis).
 *
 * Use this import in frontend code instead of '@plugins/workers' to avoid
 * bundling server-only dependencies.
 *
 * @example
 * ```ts
 * // In frontend code:
 * import { workersContract } from '@plugins/workers/contracts';
 *
 * // Instead of:
 * // import { workersContract } from '@plugins/workers';
 * ```
 *
 * @module
 */

export * from '@netscript/plugin-workers-core/contracts';
