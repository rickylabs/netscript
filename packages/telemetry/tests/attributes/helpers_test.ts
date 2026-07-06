import { assertEquals } from '@std/assert';
import {
  createExecutionAttributes,
  createGenAiAttributes,
  createJobAttributes,
  createMessagingAttributes,
  createSagaAttributes,
  createTriggerAttributes,
  DeprecatedJobAttributeAliases,
  GenAiAttributes,
  MessagingAttributes,
  NetScriptAttributeDomains,
  NetScriptJobAttributes,
  SagaAttributes,
  TelemetryConventionChecklist,
} from '../../attributes.ts';

Deno.test('attribute helper builders produce expected semantic keys', () => {
  const messaging = createMessagingAttributes({
    system: 'redis',
    destination: 'jobs',
    operation: 'publish',
    messageId: 'msg-1',
  });

  assertEquals(messaging[MessagingAttributes.SYSTEM], 'redis');
  assertEquals(messaging[MessagingAttributes.MESSAGE_ID], 'msg-1');
  assertEquals(messaging[MessagingAttributes.OPERATION_TYPE], 'publish');
  assertEquals(messaging[MessagingAttributes.OPERATION], 'publish');
});

Deno.test('job builder emits netscript keys plus deprecated aliases during dup window', () => {
  const job = createJobAttributes({
    id: 'job-1',
    name: 'import',
    tags: ['nightly', 'erp'],
  });

  assertEquals(job[NetScriptJobAttributes.JOB_ID], 'job-1');
  assertEquals(job[DeprecatedJobAttributeAliases.JOB_ID], 'job-1');
  assertEquals(job[NetScriptJobAttributes.JOB_TAGS], ['nightly', 'erp']);
});

Deno.test('execution, saga, trigger, and GenAI builders cover T1 domains', () => {
  const execution = createExecutionAttributes({
    id: 'exec-1',
    durationMs: 42,
  });
  const saga = createSagaAttributes({
    id: 'saga-1',
    instanceId: 'saga-1:1',
    outcome: 'success',
  });
  const trigger = createTriggerAttributes({
    id: 'trigger-1',
    type: 'webhook',
  });
  const genai = createGenAiAttributes({
    providerName: 'openai',
    operationName: 'chat',
    requestModel: 'gpt-5',
    inputTokens: 12,
  });

  assertEquals(execution['netscript.execution.id'], 'exec-1');
  assertEquals(execution['execution.id'], 'exec-1');
  assertEquals(saga[SagaAttributes.SAGA_ID], 'saga-1');
  assertEquals(saga['saga.id'], 'saga-1');
  assertEquals(trigger['netscript.trigger.id'], 'trigger-1');
  assertEquals(genai[GenAiAttributes.PROVIDER_NAME], 'openai');
  assertEquals(genai[GenAiAttributes.USAGE_INPUT_TOKENS], 12);
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
