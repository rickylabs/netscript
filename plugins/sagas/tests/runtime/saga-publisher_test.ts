import { assert, assertEquals, assertInstanceOf, assertRejects } from '@std/assert';
import { SagasError } from '@netscript/plugin-sagas-core/domain';
import { publishSagaOrThrow } from '@netscript/plugin-sagas-core/integration/publisher';
import { createSagaPublisher } from '../../src/runtime/saga-publisher.ts';

type PublishedMessage = Readonly<{
  type: 'UserSettingsCreated';
  payload: Readonly<{ userId: string }>;
}>;

const message: PublishedMessage = {
  type: 'UserSettingsCreated',
  payload: { userId: 'user-1' },
};

const DEFAULT_ATTEMPTED_SOURCES = [
  'options.baseUrl',
  'services__sagas-api__https__0',
  'services__sagas-api__http__0',
  'SAGAS_API_URL',
  'NETSCRIPT_SAGAS_URL',
] as const;

/** Env reader over a fixed bag that never resolves a sagas endpoint. */
function readFrom(env: Readonly<Record<string, string>>): (name: string) => string | undefined {
  return (name) => env[name];
}

function rejectFetch(): Promise<Response> {
  return Promise.reject(new Error('fetch must not be called'));
}

Deno.test('saga publisher rejects without a discovered endpoint and never calls fetch', async () => {
  let fetchCalls = 0;
  const publisher = createSagaPublisher<PublishedMessage>({
    readEnv: () => undefined,
    listEnvKeys: () => [],
    fetcher: () => {
      fetchCalls += 1;
      return rejectFetch();
    },
  });

  assertEquals(await publisher.publish(message), {
    published: false,
    messageType: 'UserSettingsCreated',
    messageId: undefined,
    correlationKey: undefined,
    reason: 'no-endpoint',
    retryable: false,
    diagnostic: {
      attempted: DEFAULT_ATTEMPTED_SOURCES,
      aspireDetected: false,
      envEnumerationDenied: false,
    },
  });
  assertEquals(fetchCalls, 0);
});

Deno.test('saga publisher no-endpoint diagnostic names the configured service keys in order', async () => {
  const publisher = createSagaPublisher<PublishedMessage>({
    serviceName: 'billing-sagas',
    readEnv: () => undefined,
    listEnvKeys: () => [],
    fetcher: rejectFetch,
  });

  const result = await publisher.publish(message);

  assert(!result.published);
  assertEquals(result.diagnostic?.attempted, [
    'options.baseUrl',
    'services__billing-sagas__https__0',
    'services__billing-sagas__http__0',
    'SAGAS_API_URL',
    'NETSCRIPT_SAGAS_URL',
  ]);
});

Deno.test('saga publisher no-endpoint diagnostic detects an Aspire environment from services__ keys', async () => {
  const env = { 'services__orders-api__http__0': 'http://orders.internal:49200' };
  const publisher = createSagaPublisher<PublishedMessage>({
    readEnv: readFrom(env),
    listEnvKeys: () => Object.keys(env),
    fetcher: rejectFetch,
  });

  const result = await publisher.publish(message);

  assert(!result.published);
  assertEquals(result.reason, 'no-endpoint');
  assertEquals(result.retryable, false);
  assertEquals(result.diagnostic?.aspireDetected, true);
  assertEquals(result.diagnostic?.envEnumerationDenied, false);
});

Deno.test('saga publisher no-endpoint diagnostic detects the NETSCRIPT_ASPIRE marker', async () => {
  const env = { NETSCRIPT_ASPIRE: '1' };
  const publisher = createSagaPublisher<PublishedMessage>({
    readEnv: readFrom(env),
    listEnvKeys: () => Object.keys(env),
    fetcher: rejectFetch,
  });

  const result = await publisher.publish(message);

  assert(!result.published);
  assertEquals(result.diagnostic?.aspireDetected, true);
});

Deno.test('saga publisher no-endpoint diagnostic records denied env enumeration', async () => {
  const publisher = createSagaPublisher<PublishedMessage>({
    readEnv: () => undefined,
    listEnvKeys: () => {
      throw new Deno.errors.NotCapable('Requires env access');
    },
    fetcher: rejectFetch,
  });

  const result = await publisher.publish(message);

  assert(!result.published);
  assertEquals(result.reason, 'no-endpoint');
  assertEquals(result.retryable, false);
  assertEquals(result.diagnostic, {
    attempted: DEFAULT_ATTEMPTED_SOURCES,
    aspireDetected: false,
    envEnumerationDenied: true,
  });
});

Deno.test({
  name: 'saga publisher default env enumeration reports denial instead of throwing',
  permissions: { env: false },
  async fn() {
    const publisher = createSagaPublisher<PublishedMessage>({
      readEnv: () => undefined,
      fetcher: rejectFetch,
    });

    const result = await publisher.publish(message);

    assert(!result.published);
    assertEquals(result.reason, 'no-endpoint');
    assertEquals(result.diagnostic?.envEnumerationDenied, true);
  },
});

Deno.test('saga publisher no-endpoint diagnostic carries key names only, never env values', async () => {
  const secretUrl = 'https://svc-user:s3cr3t-token@orders.internal:49200';
  const env = { 'services__orders-api__https__0': secretUrl, ORDERS_API_TOKEN: 's3cr3t-token' };
  const publisher = createSagaPublisher<PublishedMessage>({
    readEnv: readFrom(env),
    listEnvKeys: () => Object.keys(env),
    fetcher: rejectFetch,
  });

  const result = await publisher.publish(message);
  const error = await assertRejects(() => publishSagaOrThrow(publisher, message), SagasError);

  assert(!result.published);
  assertEquals(result.diagnostic?.aspireDetected, true);
  assert(error.message.includes('services__sagas-api__https__0'), error.message);
  for (const rendered of [JSON.stringify(result), String(error), JSON.stringify(error.cause)]) {
    assert(!rendered.includes('s3cr3t-token'), `diagnostic leaked an env value: ${rendered}`);
    assert(!rendered.includes('orders.internal'), `diagnostic leaked an env value: ${rendered}`);
    assert(
      !rendered.includes('ORDERS_API_TOKEN'),
      `diagnostic listed an unrelated key: ${rendered}`,
    );
  }
});

Deno.test('publishSagaOrThrow raises the no-endpoint diagnostic as a non-retryable SagasError', async () => {
  const publisher = createSagaPublisher<PublishedMessage>({
    readEnv: () => undefined,
    listEnvKeys: () => [],
    fetcher: rejectFetch,
  });

  const error = await assertRejects(() => publishSagaOrThrow(publisher, message));

  assertInstanceOf(error, SagasError);
  assertEquals(error.code, 'SAGA_NON_RETRYABLE');
  assertEquals(error.retryable, false);
  assertEquals(
    error.message,
    'Saga publisher "http-saga-publisher" rejected message "UserSettingsCreated": no-endpoint ' +
      '(tried in order: options.baseUrl, services__sagas-api__https__0, ' +
      'services__sagas-api__http__0, SAGAS_API_URL, NETSCRIPT_SAGAS_URL; ' +
      'Aspire environment: not detected; environment enumeration: allowed)',
  );
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
