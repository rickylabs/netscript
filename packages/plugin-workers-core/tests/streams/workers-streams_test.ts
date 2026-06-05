import { assertEquals } from '@std/assert';
import {
  createStreamMutationHook,
  toExecutionStreamEntity,
  WorkerJobSchema,
} from '../../src/streams/mod.ts';
import type { ExecutionRecord } from '../../src/domain/mod.ts';

Deno.test('toExecutionStreamEntity maps execution records to stream entities', () => {
  const execution: ExecutionRecord = {
    id: '6e029d36-e1bc-4a75-a0d8-58f24e33f6a5',
    concept: 'job',
    jobId: 'health-check',
    topic: 'default',
    status: 'running',
    triggeredBy: 'api',
    triggeredAt: '2026-05-11T00:00:00.000Z',
    startedAt: null,
    completedAt: null,
    exitCode: null,
    duration: null,
    error: null,
    result: null,
    workerId: null,
    attempt: 0,
    maxAttempts: 3,
  };

  assertEquals(toExecutionStreamEntity(execution), {
    id: execution.id,
    jobId: 'health-check',
    topic: 'default',
    concept: 'job',
    status: 'running',
    correlationId: undefined,
    triggeredAt: '2026-05-11T00:00:00.000Z',
    startedAt: null,
    completedAt: null,
    duration: null,
    exitCode: null,
    error: null,
    result: null,
    workerId: null,
    attempt: 0,
  });
});

Deno.test('createStreamMutationHook upserts and deletes execution entities', () => {
  const calls: Array<{ op: string; collection: string; value: unknown }> = [];
  const producer = {
    upsert: (collection: string, value: unknown) => {
      calls.push({ op: 'upsert', collection, value });
    },
    delete: (collection: string, value: unknown) => {
      calls.push({ op: 'delete', collection, value });
    },
  };
  const hook = createStreamMutationHook(
    producer as unknown as Parameters<typeof createStreamMutationHook>[0],
  );
  const execution: ExecutionRecord = {
    id: '6e029d36-e1bc-4a75-a0d8-58f24e33f6a5',
    concept: 'job',
    jobId: 'health-check',
    topic: 'default',
    status: 'completed',
    triggeredBy: 'api',
    triggeredAt: '2026-05-11T00:00:00.000Z',
    startedAt: null,
    completedAt: null,
    exitCode: 0,
    duration: 10,
    error: null,
    result: null,
    workerId: null,
    attempt: 0,
    maxAttempts: 3,
  };

  hook({ type: 'updated', execution });
  hook({ type: 'deleted', execution });

  assertEquals(calls.map((call) => [call.op, call.collection]), [
    ['upsert', 'execution'],
    ['delete', 'execution'],
  ]);
});

Deno.test('WorkerJobSchema keeps the public job stream surface thin', () => {
  assertEquals(
    WorkerJobSchema.parse({
      id: 'health-check',
      name: 'Health Check',
      topic: 'default',
      enabled: true,
    }),
    {
      id: 'health-check',
      name: 'Health Check',
      topic: 'default',
      enabled: true,
    },
  );
});
