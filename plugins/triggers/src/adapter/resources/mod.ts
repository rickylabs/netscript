/** Triggers adapter resources.
 *
 * @module
 */

export { type BarrelInput, barrelScaffolder, DEFAULT_BARREL_INPUT } from './barrel/barrel.ts';
export {
  DEFAULT_FILE_WATCH_INPUT,
  fileWatchResource,
  fileWatchScaffolder,
} from './file-watch/file-watch.ts';
export {
  DEFAULT_RUNTIME_GLUE_INPUT,
  type RuntimeGlueInput,
  runtimeGlueScaffolder,
} from './glue/glue.ts';
export {
  DEFAULT_SCHEDULED_INPUT,
  scheduledResource,
  scheduledScaffolder,
} from './scheduled/scheduled.ts';
export { DEFAULT_WEBHOOK_INPUT, webhookResource, webhookScaffolder } from './webhook/webhook.ts';
export {
  exportStem,
  fileStem,
  parseFileWatchInput,
  parseScheduledInput,
  parseWebhookInput,
  requiredResourceId,
  stringArrayLiteral,
  TRIGGER_RESOURCE_KINDS,
  triggerPath,
} from './input.ts';
export type {
  FileWatchInput,
  ScheduledInput,
  TriggerInput,
  TriggerResourceKind,
  WebhookInput,
} from './input.ts';
