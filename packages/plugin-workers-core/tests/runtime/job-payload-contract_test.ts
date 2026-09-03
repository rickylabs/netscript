import { assertEquals, assertRejects } from '@std/assert';
import { z } from 'zod';
import { defineJob } from '../../src/builders/job-builder.ts';

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
