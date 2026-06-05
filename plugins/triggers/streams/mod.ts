/**
 * Browser-safe stream exports for the triggers plugin.
 *
 * @module
 */

export { createTriggersStreamDB, type TriggerEvent } from './factory.ts';
export { TriggerEventSchema, triggersStreamSchema } from './schema.ts';
