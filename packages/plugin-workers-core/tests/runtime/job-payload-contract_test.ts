import { assertEquals, assertRejects } from '@std/assert';
import { z } from 'zod';
import { defineJob } from '../../src/builders/job-builder.ts';
import { InProcessJobRunner } from '../../src/runtime/mod.ts';

type EmbedDocumentPayload = Readonly<{
  documentId: string;
  text: string;
}>;

const EmbedDocumentPayloadSchema = z.object({
  documentId: z.string(),
  text: z.string(),
});

const legacySchemaLessJob = defineJob('legacy-handler')
  .handler(() => ({ success: true }))
  .build();

const handlerFirst = defineJob('handler-first')
  .handler(() => ({ success: true }));
const assertPayloadOrderGuard = () => {
  // @ts-expect-error - payload schemas must be fixed before the handler boundary
  handlerFirst.payload(EmbedDocumentPayloadSchema);
};

Deno.test('a malformed payload is rejected before the application job handler runs', async () => {
  let handlerReached = false;
  const job = defineJob('embed-document')
    .payload(EmbedDocumentPayloadSchema)
    .handler((context) => {
      handlerReached = true;
      return { success: true, data: context.payload.documentId };
    })
    .build();

  await assertRejects(
    async () =>
      await job.handler!({
        id: 'execution-1',
        signal: new AbortController().signal,
        job,
        payload: { imageUrl: 'https://example.test/image.png' } as unknown as EmbedDocumentPayload,
      }),
    Error,
    'payload',
  );
  assertEquals(handlerReached, false);
  assertEquals(legacySchemaLessJob.id, 'legacy-handler');
  assertEquals(typeof assertPayloadOrderGuard, 'function');
});

Deno.test('schema-backed async validation never starts callback after cancellation', async () => {
  const entered = Promise.withResolvers<void>();
  const validation = Promise.withResolvers<void>();
  let callbackStarted = false;
  const schema = z.string().transform(async (value) => {
    entered.resolve();
    await validation.promise;
    return value;
  });
  const job = defineJob('cancelled-validator').payload(schema).handler(() => {
    callbackStarted = true;
    return { success: true };
  }).build();
  const parent = new AbortController();
  const runner = new InProcessJobRunner({ abortGracePeriodMs: 5 });
  const outcome = runner.dispatch(job, { id: job.id, job, payload: 'valid', signal: parent.signal })
    .catch((error: unknown) => error);
  try {
    await entered.promise;
    parent.abort(new DOMException('Cancelled during validation.', 'AbortError'));
    validation.resolve();
    const result = await outcome;
    assertEquals(result instanceof DOMException && result.name, 'AbortError');
    assertEquals(callbackStarted, false);
  } finally {
    validation.resolve();
    await outcome;
    await runner.stop();
  }
});
