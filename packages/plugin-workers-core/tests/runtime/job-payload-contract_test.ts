import { assertEquals, assertRejects } from '@std/assert';
import { defineJob } from '../../src/builders/job-builder.ts';

type EmbedDocumentPayload = Readonly<{
  documentId: string;
  text: string;
}>;

Deno.test('a malformed payload is rejected before the application job handler runs', async () => {
  let handlerReached = false;
  const job = defineJob('embed-document')
    .payload<EmbedDocumentPayload>()
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
});
