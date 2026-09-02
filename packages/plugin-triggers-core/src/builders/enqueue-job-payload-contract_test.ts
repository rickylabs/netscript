import { createSuccessResult, defineJob } from '@netscript/plugin-workers-core';
import { enqueueJob } from './define-webhook.ts';

type EmbedDocumentPayload = Readonly<{
  documentId: string;
  text: string;
}>;

type TranscribeImagePayload = Readonly<{
  imageUrl: string;
  language?: string;
}>;

const embedDocument = defineJob('embed-document')
  .handler((context: Readonly<{ id: string; payload: EmbedDocumentPayload }>) =>
    createSuccessResult(context.payload.documentId)
  )
  .build();

const transcribeImage = defineJob('transcribe-image')
  .handler((context: Readonly<{ id: string; payload: TranscribeImagePayload }>) =>
    createSuccessResult(context.payload.imageUrl)
  )
  .build();

const embedPayload: EmbedDocumentPayload = {
  documentId: 'document-1',
  text: 'hello',
};

Deno.test('enqueueJob binds payload to the selected job definition', () => {
  enqueueJob(embedDocument, { payload: embedPayload });

  enqueueJob(transcribeImage, {
    // @ts-expect-error EmbedDocumentPayload does not belong to transcribe-image.
    payload: embedPayload,
  });
});
