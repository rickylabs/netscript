import { assertEquals, assertRejects, assertThrows } from '@std/assert';
import { z } from 'zod';
import { defineJob, defineTask } from '@netscript/plugin-workers-core';
import { workerJobEffect, workerTaskEffect } from '../src/integration/workers/mod.ts';
import { encodeWorkerEffect } from '../src/integration/workers/worker-effects.ts';
const route = { destination: 'workers', topic: 'document' };
const schema = z.object({ documentId: z.string() });
const job = defineJob('document').payload(schema).handler(({ payload }) => ({
  success: true,
  data: payload.documentId,
})).build();
const task = defineTask('document-task').payload(schema).handler(({ payload }) =>
  payload.documentId
).build();

Deno.test('worker effects expose distinct explicit job and task constructors', () => {
  assertEquals(workerJobEffect(job, { documentId: 'one' }, route).kind, 'worker-job');
  assertEquals(workerTaskEffect(task, { documentId: 'one' }, route).kind, 'worker-task');
  assertEquals(task.payloadSchema, schema);
});

Deno.test('worker effects validate the selected schema and privately snapshot payload', async () => {
  const payload = { documentId: 'one' };
  const intent = workerJobEffect(job, payload, route);
  payload.documentId = 'changed';
  assertEquals(Object.isFrozen(intent), true);
  assertEquals(await encodeWorkerEffect(intent), '{"documentId":"one"}');
  await assertRejects(() =>
    Promise.resolve(task.handler?.({ id: 'task', payload: { documentId: 4 as unknown as string } }))
  );
  const asyncJob = defineJob('async').payload({
    '~standard': {
      version: 1,
      vendor: 'async',
      validate: async (value: unknown) => {
        await Promise.resolve();
        return schema['~standard'].validate(value);
      },
    },
  }).entrypoint('job.ts').build();
  assertEquals(
    await encodeWorkerEffect(workerJobEffect(asyncJob, { documentId: 'two' }, route)),
    '{"documentId":"two"}',
  );
  // @ts-expect-error selected definition controls payload; the payload cannot widen it
  const wrongJob = workerJobEffect(job, { taskId: 'other' }, route);
  // @ts-expect-error schema-backed task payload cannot be inferred independently
  const wrongTask = workerTaskEffect(task, { taskId: 'other' }, route);
  await assertRejects(() => encodeWorkerEffect(wrongJob));
  await assertRejects(() => encodeWorkerEffect(wrongTask));
  await assertRejects(() => encodeWorkerEffect({ ...intent }));
});

Deno.test('durable worker effects refuse legacy type-only definitions and non-JSON output', async () => {
  const legacy = defineTask('legacy').payload<{ documentId: string }>().handler(({ payload }) =>
    payload.documentId
  ).build();
  assertThrows(
    () => workerTaskEffect(legacy, { documentId: 'one' }, route),
    TypeError,
    'runtime payload schema',
  );
  assertThrows(
    () => workerJobEffect(defineJob('legacy-job').entrypoint('job.ts').build(), {}, route),
    TypeError,
    'runtime payload schema',
  );
  const exotic = defineJob('exotic').payload(z.date()).entrypoint('job.ts').build();
  await assertRejects(() => encodeWorkerEffect(workerJobEffect(exotic, new Date(), route)));
});
