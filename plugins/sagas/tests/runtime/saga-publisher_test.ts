import { assertEquals } from '@std/assert';
import { createSagaPublisher } from '../../src/runtime/saga-publisher.ts';

type PublishedMessage = Readonly<{
  type: 'UserSettingsCreated';
  payload: Readonly<{ userId: string }>;
}>;

const message: PublishedMessage = {
  type: 'UserSettingsCreated',
  payload: { userId: 'user-1' },
};

Deno.test('saga publisher rejects without a discovered endpoint and never calls fetch', async () => {
  let fetchCalls = 0;
  const publisher = createSagaPublisher<PublishedMessage>({
    readEnv: () => undefined,
    fetcher: () => {
      fetchCalls += 1;
      return Promise.reject(new Error('fetch must not be called'));
    },
  });

  assertEquals(await publisher.publish(message), {
    published: false,
    messageType: 'UserSettingsCreated',
    messageId: undefined,
    correlationKey: undefined,
    reason: 'no-endpoint',
    retryable: false,
  });
  assertEquals(fetchCalls, 0);
});

Deno.test('saga publisher prefers an Aspire service reference', async () => {
  let requestedUrl = '';
  const publisher = createSagaPublisher<PublishedMessage>({
    readEnv: (name) =>
      name === 'services__sagas-api__https__0' ? 'https://sagas.internal/' : undefined,
    fetcher: (input) => {
      requestedUrl = String(input);
      return Promise.resolve(
        new Response(JSON.stringify({
          published: true,
          messageType: 'UserSettingsCreated',
        })),
      );
    },
  });

  const result = await publisher.publish(message);
  assertEquals(result.published, true);
  assertEquals(requestedUrl, 'https://sagas.internal/api/v1/sagas/publish');
});
