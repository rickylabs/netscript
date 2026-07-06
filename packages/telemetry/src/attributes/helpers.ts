import { DeprecatedMessagingAttributeAliases, MessagingAttributes } from './messaging.ts';
import { DeprecatedExecutionAttributeAliases, NetScriptExecutionAttributes } from './execution.ts';
import { DeprecatedJobAttributeAliases, NetScriptJobAttributes } from './job.ts';
import { DeprecatedSagaAttributeAliases, SagaAttributes } from './saga.ts';
import { GenAiAttributes } from './genai.ts';

/**
 * Primitive value accepted by telemetry attribute builders.
 */
export type TelemetryAttributeBuilderValue = string | number | boolean | string[];

/**
 * Attribute map returned by telemetry attribute builders.
 */
export type TelemetryAttributeBuilderMap = Record<string, TelemetryAttributeBuilderValue>;

function setAttribute(
  attrs: TelemetryAttributeBuilderMap,
  key: string,
  value: TelemetryAttributeBuilderValue | undefined,
  deprecatedAlias?: string,
): void {
  if (value === undefined) {
    return;
  }
  attrs[key] = value;
  if (deprecatedAlias && deprecatedAlias !== key) {
    attrs[deprecatedAlias] = value;
  }
}

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
}): TelemetryAttributeBuilderMap {
  const attrs: TelemetryAttributeBuilderMap = {
    [MessagingAttributes.SYSTEM]: options.system,
    [MessagingAttributes.DESTINATION_NAME]: options.destination,
    [MessagingAttributes.DESTINATION_KIND]: 'queue',
    [MessagingAttributes.OPERATION_TYPE]: options.operation,
    [DeprecatedMessagingAttributeAliases.OPERATION]: options.operation,
  };
  setAttribute(attrs, MessagingAttributes.MESSAGE_ID, options.messageId);
  setAttribute(attrs, MessagingAttributes.CORRELATION_ID, options.correlationId);
  setAttribute(attrs, MessagingAttributes.DELIVERY_COUNT, options.deliveryCount);
  setAttribute(attrs, MessagingAttributes.PRIORITY, options.priority);
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
}): TelemetryAttributeBuilderMap {
  const attrs: TelemetryAttributeBuilderMap = {};
  setAttribute(attrs, NetScriptJobAttributes.JOB_ID, job.id, DeprecatedJobAttributeAliases.JOB_ID);
  setAttribute(
    attrs,
    NetScriptJobAttributes.JOB_NAME,
    job.name,
    DeprecatedJobAttributeAliases.JOB_NAME,
  );
  setAttribute(
    attrs,
    NetScriptJobAttributes.JOB_ENTRYPOINT,
    job.entrypoint,
    DeprecatedJobAttributeAliases.JOB_ENTRYPOINT,
  );
  setAttribute(
    attrs,
    NetScriptJobAttributes.JOB_TIMEOUT_MS,
    job.timeout,
    DeprecatedJobAttributeAliases.JOB_TIMEOUT_MS,
  );
  setAttribute(
    attrs,
    NetScriptJobAttributes.JOB_MAX_RETRIES,
    job.maxRetries,
    DeprecatedJobAttributeAliases.JOB_MAX_RETRIES,
  );
  setAttribute(
    attrs,
    NetScriptJobAttributes.JOB_PRIORITY,
    job.priority,
    DeprecatedJobAttributeAliases.JOB_PRIORITY,
  );
  setAttribute(
    attrs,
    NetScriptJobAttributes.JOB_TAGS,
    job.tags?.length ? job.tags : undefined,
    DeprecatedJobAttributeAliases.JOB_TAGS,
  );
  setAttribute(
    attrs,
    NetScriptJobAttributes.JOB_TIMEZONE,
    job.timezone,
    DeprecatedJobAttributeAliases.JOB_TIMEZONE,
  );
  return attrs;
}

/**
 * Build NetScript execution lifecycle attributes.
 */
export function createExecutionAttributes(execution: {
  id: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}): TelemetryAttributeBuilderMap {
  const attrs: TelemetryAttributeBuilderMap = {};
  setAttribute(
    attrs,
    NetScriptExecutionAttributes.EXECUTION_ID,
    execution.id,
    DeprecatedExecutionAttributeAliases.EXECUTION_ID,
  );
  setAttribute(
    attrs,
    NetScriptExecutionAttributes.EXECUTION_STARTED_AT,
    execution.startedAt,
    DeprecatedExecutionAttributeAliases.EXECUTION_STARTED_AT,
  );
  setAttribute(
    attrs,
    NetScriptExecutionAttributes.EXECUTION_COMPLETED_AT,
    execution.completedAt,
    DeprecatedExecutionAttributeAliases.EXECUTION_COMPLETED_AT,
  );
  setAttribute(
    attrs,
    NetScriptExecutionAttributes.EXECUTION_DURATION_MS,
    execution.durationMs,
    DeprecatedExecutionAttributeAliases.EXECUTION_DURATION_MS,
  );
  return attrs;
}

/**
 * Build NetScript saga attributes with beta.5 deprecated aliases.
 */
export function createSagaAttributes(saga: {
  id: string;
  instanceId?: string;
  eventType?: string;
  attempt?: number;
  durabilityTier?: string;
  correlationKey?: string;
  targetJobId?: string;
  idempotencyKey?: string;
  outcome?: string;
  errorClass?: string;
}): TelemetryAttributeBuilderMap {
  const attrs: TelemetryAttributeBuilderMap = {};
  setAttribute(attrs, SagaAttributes.SAGA_ID, saga.id, DeprecatedSagaAttributeAliases.SAGA_ID);
  setAttribute(
    attrs,
    SagaAttributes.SAGA_INSTANCE_ID,
    saga.instanceId,
    DeprecatedSagaAttributeAliases.SAGA_INSTANCE_ID,
  );
  setAttribute(
    attrs,
    SagaAttributes.SAGA_EVENT_TYPE,
    saga.eventType,
    DeprecatedSagaAttributeAliases.SAGA_EVENT_TYPE,
  );
  setAttribute(
    attrs,
    SagaAttributes.SAGA_ATTEMPT,
    saga.attempt,
    DeprecatedSagaAttributeAliases.SAGA_ATTEMPT,
  );
  setAttribute(
    attrs,
    SagaAttributes.SAGA_DURABILITY_TIER,
    saga.durabilityTier,
    DeprecatedSagaAttributeAliases.SAGA_DURABILITY_TIER,
  );
  setAttribute(
    attrs,
    SagaAttributes.SAGA_CORRELATION_KEY,
    saga.correlationKey,
    DeprecatedSagaAttributeAliases.SAGA_CORRELATION_KEY,
  );
  setAttribute(
    attrs,
    SagaAttributes.TARGET_JOB_ID,
    saga.targetJobId,
    DeprecatedSagaAttributeAliases.TARGET_JOB_ID,
  );
  setAttribute(
    attrs,
    SagaAttributes.IDEMPOTENCY_KEY,
    saga.idempotencyKey,
    DeprecatedSagaAttributeAliases.IDEMPOTENCY_KEY,
  );
  setAttribute(attrs, SagaAttributes.OUTCOME, saga.outcome, DeprecatedSagaAttributeAliases.OUTCOME);
  setAttribute(
    attrs,
    SagaAttributes.ERROR_CLASS,
    saga.errorClass,
    DeprecatedSagaAttributeAliases.ERROR_CLASS,
  );
  return attrs;
}

/**
 * Build OpenTelemetry GenAI semantic-convention attributes.
 */
export function createGenAiAttributes(genai: {
  providerName: string;
  operationName: string;
  requestModel?: string;
  responseModel?: string;
  inputTokens?: number;
  outputTokens?: number;
  toolName?: string;
}): TelemetryAttributeBuilderMap {
  const attrs: TelemetryAttributeBuilderMap = {
    [GenAiAttributes.PROVIDER_NAME]: genai.providerName,
    [GenAiAttributes.OPERATION_NAME]: genai.operationName,
  };
  setAttribute(attrs, GenAiAttributes.REQUEST_MODEL, genai.requestModel);
  setAttribute(attrs, GenAiAttributes.RESPONSE_MODEL, genai.responseModel);
  setAttribute(attrs, GenAiAttributes.USAGE_INPUT_TOKENS, genai.inputTokens);
  setAttribute(attrs, GenAiAttributes.USAGE_OUTPUT_TOKENS, genai.outputTokens);
  setAttribute(attrs, GenAiAttributes.TOOL_NAME, genai.toolName);
  return attrs;
}
