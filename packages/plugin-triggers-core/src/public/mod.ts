/**
 * @module @netscript/plugin-triggers-core/public
 *
 * Curated root exports for `@netscript/plugin-triggers-core`.
 *
 * This barrel starts empty in slice F1. Later slices add only stable,
 * documented root exports that fit the 25-export budget in the v2 plan.
 */

export {
  defineFileWatch,
  defineScheduledTrigger,
  defineWebhook,
  enqueueJob,
} from '../builders/mod.ts';
export type {
  TriggerDlqPort,
  TriggerIdempotencyPort,
  TriggerIngressPort,
  TriggerProcessorPort,
  TriggerSchedulerPort,
  WebhookVerifierPort,
} from '../ports/mod.ts';
export { createTriggerIngress, createTriggerProcessor, TriggerProcessor } from '../runtime/mod.ts';
export type { LoggerPort, TriggerProcessorOptions } from '../runtime/mod.ts';
export type {
  DefineScheduledTriggerSpec,
  FileWatchHandler,
  FileWatchSpec,
  ScheduledTriggerHandler,
  WebhookHandler,
  WebhookSpec,
} from '../builders/mod.ts';
