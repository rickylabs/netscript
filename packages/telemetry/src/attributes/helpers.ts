import { MessagingAttributes } from './messaging.ts';
import { JobAttributes } from './job.ts';

/**
 * Build semantic messaging attributes for a queue operation.
 */
export function createMessagingAttributes(options: {
  system: string;
  destination: string;
  operation: string;
  messageId?: string;
  correlationId?: string;
  deliveryCount?: number;
  priority?: number;
}): Record<string, string | number> {
  const attrs: Record<string, string | number> = {
    [MessagingAttributes.SYSTEM]: options.system,
    [MessagingAttributes.DESTINATION_NAME]: options.destination,
    [MessagingAttributes.DESTINATION_KIND]: 'queue',
    [MessagingAttributes.OPERATION]: options.operation,
  };
  if (options.messageId) attrs[MessagingAttributes.MESSAGE_ID] = options.messageId;
  if (options.correlationId) attrs[MessagingAttributes.CORRELATION_ID] = options.correlationId;
  if (options.deliveryCount) attrs[MessagingAttributes.DELIVERY_COUNT] = options.deliveryCount;
  if (options.priority) attrs[MessagingAttributes.PRIORITY] = options.priority;
  return attrs;
}

/**
 * Build semantic job attributes for scheduler or worker spans.
 */
export function createJobAttributes(job: {
  id: string;
  name?: string;
  entrypoint?: string;
  timeout?: number;
  maxRetries?: number;
  priority?: number;
  tags?: string[];
  timezone?: string;
}): Record<string, string | number> {
  const attrs: Record<string, string | number> = {
    [JobAttributes.JOB_ID]: job.id,
  };
  if (job.name) attrs[JobAttributes.JOB_NAME] = job.name;
  if (job.entrypoint) attrs[JobAttributes.JOB_ENTRYPOINT] = job.entrypoint;
  if (job.timeout !== undefined) attrs[JobAttributes.JOB_TIMEOUT_MS] = job.timeout;
  if (job.maxRetries !== undefined) attrs[JobAttributes.JOB_MAX_RETRIES] = job.maxRetries;
  if (job.priority !== undefined) attrs[JobAttributes.JOB_PRIORITY] = job.priority;
  if (job.tags?.length) attrs[JobAttributes.JOB_TAGS] = job.tags.join(',');
  if (job.timezone) attrs[JobAttributes.JOB_TIMEZONE] = job.timezone;
  return attrs;
}
