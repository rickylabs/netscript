import { assert, assertEquals } from '@std/assert';
import {
  createExecutionAttributes,
  createGenAiAttributes,
  createJobAttributes,
  createMessagingAttributes,
  createSagaAttributes,
  createTriggerAttributes,
  DeprecatedJobAttributeAliases,
  GenAiAttributes,
  KVAttributes,
  MessagingAttributes,
  NetScriptAttributeDomains,
  NetScriptCorrelationAttributes,
  NetScriptExecutionAttributes,
  NetScriptJobAttributes,
  SagaAttributes,
  SchedulerAttributes,
  SSEAttributes,
  TelemetryConventionChecklist,
  TriggerAttributes,
  WorkerAttributes,
} from '../../attributes.ts';

const UPSTREAM_MESSAGING_SEMCONV_KEYS = new Set([
  'messaging.batch.message_count',
  'messaging.client.id',
  'messaging.consumer.group.name',
  'messaging.destination.anonymous',
  'messaging.destination.name',
  'messaging.destination.partition.id',
  'messaging.destination.subscription.name',
  'messaging.destination.template',
  'messaging.destination.temporary',
  'messaging.message.body.size',
  'messaging.message.conversation_id',
  'messaging.message.envelope.size',
  'messaging.message.id',
  'messaging.operation',
  'messaging.operation.name',
  'messaging.operation.type',
  'messaging.system',
]);

const UPSTREAM_SEMCONV_KEYS = new Set([
  ...UPSTREAM_MESSAGING_SEMCONV_KEYS,
  ...Object.values(GenAiAttributes),
  'error.type',
]);

function assertNetScriptDomain(value: string): void {
  const domain = Object.values(NetScriptAttributeDomains).find((candidate) =>
    value === candidate || value.startsWith(`${candidate}.`)
  );
  assert(domain, `${value} must derive from NetScriptAttributeDomains`);
}

Deno.test('attribute helper builders produce expected semantic keys', () => {
  const messaging = createMessagingAttributes({
    system: 'redis',
    destination: 'jobs',
    operation: 'publish',
    messageId: 'msg-1',
    correlationId: 'corr-1',
    deliveryCount: 2,
    priority: 10,
  });

  assertEquals(messaging[MessagingAttributes.SYSTEM], 'redis');
  assertEquals(messaging[MessagingAttributes.MESSAGE_ID], 'msg-1');
  assertEquals(messaging[MessagingAttributes.MESSAGE_CONVERSATION_ID], 'corr-1');
  assertEquals(messaging[NetScriptCorrelationAttributes.CORRELATION_ID], 'corr-1');
  assertEquals(messaging[MessagingAttributes.DELIVERY_COUNT], 2);
  assertEquals(messaging[MessagingAttributes.PRIORITY], 10);
  assertEquals(messaging[MessagingAttributes.OPERATION_NAME], 'publish');
  assertEquals(messaging[MessagingAttributes.OPERATION_TYPE], 'publish');
  assertEquals(messaging[MessagingAttributes.OPERATION], 'publish');
});

Deno.test('job builder emits netscript keys plus deprecated aliases during dup window', () => {
  const job = createJobAttributes({
    id: 'job-1',
    name: 'import',
    tags: ['nightly', 'erp'],
    correlationId: 'corr-1',
  });

  assertEquals(job[NetScriptJobAttributes.JOB_ID], 'job-1');
  assertEquals(job[DeprecatedJobAttributeAliases.JOB_ID], 'job-1');
  assertEquals(job[NetScriptJobAttributes.JOB_TAGS], ['nightly', 'erp']);
  assertEquals(job[NetScriptCorrelationAttributes.CORRELATION_ID], 'corr-1');
});

Deno.test('execution, saga, trigger, and GenAI builders cover T1 domains', () => {
  const execution = createExecutionAttributes({
    id: 'exec-1',
    durationMs: 42,
    correlationId: 'corr-exec',
  });
  const saga = createSagaAttributes({
    id: 'saga-1',
    instanceId: 'saga-1:1',
    outcome: 'success',
    correlationKey: 'corr-saga',
  });
  const trigger = createTriggerAttributes({
    id: 'trigger-1',
    type: 'webhook',
    correlationId: 'corr-trigger',
  });
  const genai = createGenAiAttributes({
    providerName: 'openai',
    operationName: 'chat',
    requestModel: 'gpt-5',
    inputTokens: 12,
    correlationId: 'corr-genai',
  });

  assertEquals(execution['netscript.execution.id'], 'exec-1');
  assertEquals(execution['execution.id'], 'exec-1');
  assertEquals(execution[NetScriptCorrelationAttributes.CORRELATION_ID], 'corr-exec');
  assertEquals(saga[SagaAttributes.SAGA_ID], 'saga-1');
  assertEquals(saga['saga.id'], 'saga-1');
  assertEquals(saga[NetScriptCorrelationAttributes.CORRELATION_ID], 'corr-saga');
  assertEquals(trigger['netscript.trigger.id'], 'trigger-1');
  assertEquals(trigger[NetScriptCorrelationAttributes.CORRELATION_ID], 'corr-trigger');
  assertEquals(genai[GenAiAttributes.PROVIDER_NAME], 'openai');
  assertEquals(genai[GenAiAttributes.USAGE_INPUT_TOKENS], 12);
  assertEquals(genai[NetScriptCorrelationAttributes.CORRELATION_ID], 'corr-genai');
});

Deno.test('telemetry convention publishes TC-1 through TC-14 and netscript root domains', () => {
  assertEquals(TelemetryConventionChecklist.map((item) => item.id), [
    'TC-1',
    'TC-2',
    'TC-3',
    'TC-4',
    'TC-5',
    'TC-6',
    'TC-7',
    'TC-8',
    'TC-9',
    'TC-10',
    'TC-11',
    'TC-12',
    'TC-13',
    'TC-14',
  ]);
  assertEquals(NetScriptAttributeDomains.JOB, 'netscript.job');
  assertEquals(NetScriptAttributeDomains.CORRELATION, 'netscript.correlation');
});

Deno.test('TC-5 messaging keys match current OpenTelemetry messaging semconv verbatim', () => {
  const messagingSemconvKeys = Object.values(MessagingAttributes).filter((key) =>
    key.startsWith('messaging.')
  );

  assertEquals(messagingSemconvKeys, [
    'messaging.system',
    'messaging.destination.name',
    'messaging.operation',
    'messaging.operation.name',
    'messaging.operation.type',
    'messaging.message.id',
    'messaging.message.conversation_id',
    'messaging.message.body.size',
    'messaging.message.envelope.size',
    'messaging.message.body.size',
  ]);

  for (const key of messagingSemconvKeys) {
    assert(
      UPSTREAM_MESSAGING_SEMCONV_KEYS.has(key),
      `${key} must be present in the OpenTelemetry messaging semconv registry`,
    );
  }
});

Deno.test('canonical exported attribute keys derive from NetScript domains or semconv keys', () => {
  const canonicalAttributeMaps = [
    MessagingAttributes,
    NetScriptJobAttributes,
    NetScriptExecutionAttributes,
    SagaAttributes,
    TriggerAttributes,
    WorkerAttributes,
    SchedulerAttributes,
    SSEAttributes,
    KVAttributes,
    GenAiAttributes,
    NetScriptCorrelationAttributes,
  ];

  const keys = canonicalAttributeMaps.flatMap((attributes) => Object.values(attributes));

  for (const key of keys) {
    if (key.startsWith('netscript.')) {
      assertNetScriptDomain(key);
      continue;
    }

    assert(
      UPSTREAM_SEMCONV_KEYS.has(key),
      `${key} must be an exact semconv key or live under NetScriptAttributeDomains`,
    );
  }
});
