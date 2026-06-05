/** @module @netscript/plugin-triggers-core/builders */

export { defineFileWatch } from './define-file-watch.ts';
export { defineScheduledTrigger } from './define-scheduled-trigger.ts';
export { defineWebhook, enqueueJob } from './define-webhook.ts';
export type { FileWatchHandler, FileWatchSpec } from './define-file-watch.ts';
export type {
  DefineScheduledTriggerSpec,
  ScheduledTriggerHandler,
} from './define-scheduled-trigger.ts';
export type { WebhookHandler, WebhookSpec } from './define-webhook.ts';
