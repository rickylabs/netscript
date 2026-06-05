/**
 * Triggers Plugin - Contracts Only Export
 *
 * Exports ONLY the contract types and schemas, without server-side dependencies.
 * Use this import in frontend code instead of '@plugins/triggers'.
 *
 * @module
 */

export { triggersContract } from './contracts/v1/triggers.contract.ts';
export type { TriggerSSEEvent } from './contracts/v1/triggers.contract.ts';
