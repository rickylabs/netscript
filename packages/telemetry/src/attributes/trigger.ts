import { NetScriptCorrelationAttributes } from '../domain/telemetry-convention.ts';

/**
 * Semantic trigger attribute names used by trigger instrumentation.
 */
export const TriggerAttributes = {
  TRIGGER_ID: 'netscript.trigger.id',
  TRIGGER_TYPE: 'netscript.trigger.type',
  TRIGGER_NAME: 'netscript.trigger.name',
  TRIGGER_TOPIC: 'netscript.trigger.topic',
  EVENT_ID: 'netscript.trigger.event.id',
  EVENT_KIND: 'netscript.trigger.event.kind',
  EVENT_STATUS: 'netscript.trigger.event.status',
  ACTION_TYPE: 'netscript.trigger.action.type',
  ACTION_TARGET: 'netscript.trigger.action.target',
  ACTION_STATUS: 'netscript.trigger.action.status',
  ACTION_DURATION_MS: 'netscript.trigger.action.duration_ms',
  FILE_PATH: 'netscript.trigger.file.path',
  FILE_NAME: 'netscript.trigger.file.name',
  FILE_SIZE: 'netscript.trigger.file.size',
  FILE_HASH: 'netscript.trigger.file.hash',
  FILE_EXTENSION: 'netscript.trigger.file.extension',
  ACTION_COUNT: 'netscript.trigger.action.count',
  LIFECYCLE_STAGE: 'netscript.trigger.lifecycle.stage',
  LIFECYCLE_STAGED_PATH: 'netscript.trigger.lifecycle.staged_path',
  LIFECYCLE_ARCHIVE_PATH: 'netscript.trigger.lifecycle.archive_path',
} as const;

/**
 * Build semantic attributes for a trigger definition.
 */
export function createTriggerAttributes(trigger: {
  id: string;
  name?: string;
  type?: string;
  topic?: string;
  correlationId?: string;
}): Record<string, string> {
  const attrs: Record<string, string> = {
    [TriggerAttributes.TRIGGER_ID]: trigger.id,
  };
  if (trigger.name) attrs[TriggerAttributes.TRIGGER_NAME] = trigger.name;
  if (trigger.type) attrs[TriggerAttributes.TRIGGER_TYPE] = trigger.type;
  if (trigger.topic) attrs[TriggerAttributes.TRIGGER_TOPIC] = trigger.topic;
  if (trigger.correlationId) {
    attrs[NetScriptCorrelationAttributes.CORRELATION_ID] = trigger.correlationId;
  }
  return attrs;
}

/**
 * Build semantic attributes for a trigger file payload.
 */
export function createTriggerFileAttributes(payload: {
  filePath?: string;
  fileName?: string;
  fileSize?: number | null;
  fileExtension?: string;
  contentHash?: string | null;
}): Record<string, string | number> {
  const attrs: Record<string, string | number> = {};
  if (payload.filePath) attrs[TriggerAttributes.FILE_PATH] = payload.filePath;
  if (payload.fileName) attrs[TriggerAttributes.FILE_NAME] = payload.fileName;
  if (payload.fileSize != null) attrs[TriggerAttributes.FILE_SIZE] = payload.fileSize;
  if (payload.fileExtension) attrs[TriggerAttributes.FILE_EXTENSION] = payload.fileExtension;
  if (payload.contentHash) attrs[TriggerAttributes.FILE_HASH] = payload.contentHash;
  return attrs;
}
