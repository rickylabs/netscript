/** @module @netscript/plugin-triggers/scaffolding */

export {
  FileWatchTriggerScaffolder,
  ScheduledTriggerScaffolder,
  triggerScaffolder,
  WebhookTriggerScaffolder,
} from './trigger-scaffolders.ts';
export type { TriggerDefinitionScaffolder } from './trigger-scaffolders.ts';
export { renderStringArray, toTriggerExportName, toTriggerFileStem } from './input.ts';
export type { TriggerScaffoldInput, TriggerScaffoldKind } from './input.ts';
