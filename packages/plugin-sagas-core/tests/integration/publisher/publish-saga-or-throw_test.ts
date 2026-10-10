import {
  assert,
  assertEquals,
  assertInstanceOf,
  assertRejects,
  assertStrictEquals,
} from '@std/assert';
import { type SagaMessage, SagasError } from '../../../src/domain/mod.ts';
import type {
  SagaPublisherPort,
  SagaPublisherPublishManyOptions,
  SagaPublisherPublishOptions,
  SagaPublisherReceipt,
  SagaPublisherResult,
} from '../../../src/integration/publisher/mod.ts';

type TestMessage = Readonly<{
  type: 'TestMessage';
  payload: Readonly<{ value: string }>;
}>;

type PublishSagaOrThrow = <
  TMessage extends SagaMessage,
  TNextMessage extends TMessage,
>(
  publisher: SagaPublisherPort<TMessage>,
  message: TNextMessage,
  options?: SagaPublisherPublishOptions,
) => Promise<SagaPublisherReceipt<TNextMessage['type']>>;

async function loadPublishSagaOrThrow(): Promise<PublishSagaOrThrow> {
  const publisherModule = await import('../../../src/integration/publisher/mod.ts');
  const candidate: unknown = Reflect.get(publisherModule, 'publishSagaOrThrow');
  assert(
    typeof candidate === 'function',
    'publisher subpath must export publishSagaOrThrow',
  );
  return candidate as PublishSagaOrThrow;
}

function createPublisher(
  result: SagaPublisherResult<TestMessage['type']>,
  observeOptions: (options: SagaPublisherPublishOptions | undefined) => void = () => {},
): SagaPublisherPort<TestMessage> {
  return {
    id: 'test-publisher',
    publish<TNextMessage extends TestMessage>(
      _message: TNextMessage,
      options?: SagaPublisherPublishOptions,
    ): Promise<SagaPublisherResult<TNextMessage['type']>> {
      observeOptions(options);
      return Promise.resolve(result as SagaPublisherResult<TNextMessage['type']>);
    },
    publishMany<TNextMessage extends TestMessage>(
      _messages: readonly TNextMessage[],
      _options?: SagaPublisherPublishManyOptions,
    ): Promise<readonly SagaPublisherResult<TNextMessage['type']>[]> {
      return Promise.resolve([]);
    },
  };
}

Deno.test('publishSagaOrThrow returns the accepted receipt and forwards options', async () => {
  const acceptedAt = new Date('2026-08-31T00:00:00.000Z');
  const receipt: SagaPublisherReceipt<TestMessage['type']> = {
    published: true,
    messageType: 'TestMessage',
    acceptedAt,
  };
  let observed: SagaPublisherPublishOptions | undefined;
  const publisher = createPublisher(receipt, (options) => observed = options);
  const publishSagaOrThrow = await loadPublishSagaOrThrow();

  const result = await publishSagaOrThrow(
    publisher,
    { type: 'TestMessage', payload: { value: 'accepted' } },
    { topic: 'test-topic', idempotencyKey: 'test-key' },
  );

  assertStrictEquals(result, receipt);
  assertEquals(observed, { topic: 'test-topic', idempotencyKey: 'test-key' });
});

Deno.test('publishSagaOrThrow raises a retryable SagasError with rejected receipt context', async () => {
  const rejection = {
    published: false as const,
    messageType: 'TestMessage' as const,
    reason: 'publisher unavailable',
    retryable: true,
  };
  const publishSagaOrThrow = await loadPublishSagaOrThrow();

  const error = await assertRejects(() =>
    publishSagaOrThrow(
      createPublisher(rejection),
      { type: 'TestMessage', payload: { value: 'retry' } },
    )
  );

  assertInstanceOf(error, SagasError);
  assertEquals(error.code, 'SAGA_RETRYABLE');
  assertEquals(error.retryable, true);
  assertStrictEquals(error.cause, rejection);
  assert(error.message.includes('test-publisher'));
  assert(error.message.includes('TestMessage'));
  assert(error.message.includes('publisher unavailable'));
});

Deno.test('publishSagaOrThrow raises a non-retryable SagasError', async () => {
  const rejection = {
    published: false as const,
    messageType: 'TestMessage' as const,
    reason: 'message rejected',
    retryable: false,
  };
  const publishSagaOrThrow = await loadPublishSagaOrThrow();

  const error = await assertRejects(() =>
    publishSagaOrThrow(
      createPublisher(rejection),
      { type: 'TestMessage', payload: { value: 'reject' } },
    )
  );

  assertInstanceOf(error, SagasError);
  assertEquals(error.code, 'SAGA_NON_RETRYABLE');
  assertEquals(error.retryable, false);
  assertStrictEquals(error.cause, rejection);
});

Deno.test('publishSagaOrThrow renders an endpoint diagnostic into the SagasError message', async () => {
  const rejection = {
    published: false as const,
    messageType: 'TestMessage' as const,
    reason: 'no-endpoint',
    retryable: false,
    diagnostic: {
      attempted: ['options.baseUrl', 'services__sagas-api__http__0', 'SAGAS_API_URL'],
      aspireDetected: true,
      envEnumerationDenied: false,
    },
  };
  const publishSagaOrThrow = await loadPublishSagaOrThrow();

  const error = await assertRejects(() =>
    publishSagaOrThrow(
      createPublisher(rejection),
      { type: 'TestMessage', payload: { value: 'unresolved' } },
    )
  );

  assertInstanceOf(error, SagasError);
  assertEquals(error.code, 'SAGA_NON_RETRYABLE');
  assertStrictEquals(error.cause, rejection);
  assertEquals(
    error.message,
    'Saga publisher "test-publisher" rejected message "TestMessage": no-endpoint ' +
      '(tried in order: options.baseUrl, services__sagas-api__http__0, SAGAS_API_URL; ' +
      'Aspire environment: detected; environment enumeration: allowed)',
  );
});

Deno.test('publishSagaOrThrow marks Aspire detection inconclusive when enumeration was denied', async () => {
  const rejection = {
    published: false as const,
    messageType: 'TestMessage' as const,
    reason: 'no-endpoint',
    retryable: false,
    diagnostic: {
      attempted: ['options.baseUrl'],
      aspireDetected: false,
      envEnumerationDenied: true,
    },
  };
  const publishSagaOrThrow = await loadPublishSagaOrThrow();

  const error = await assertRejects(() =>
    publishSagaOrThrow(
      createPublisher(rejection),
      { type: 'TestMessage', payload: { value: 'denied' } },
    )
  );

  assertInstanceOf(error, SagasError);
  assert(
    error.message.endsWith(
      'no-endpoint (tried in order: options.baseUrl; ' +
        'Aspire environment: not detected; environment enumeration: denied)',
    ),
    error.message,
  );
});
