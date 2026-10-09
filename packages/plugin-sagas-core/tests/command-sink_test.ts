import { assert, assertEquals, assertRejects } from '@std/assert';
import {
  type CommandOutboxDelivery,
  createSagaCommandOutboxSink,
  type SagaMessage,
  type SagaPublisherPort,
  type SagaPublisherPublishOptions,
  type SagaPublisherResult,
} from '../commands.ts';
import { CommandRelayError } from '@netscript/service/commands/relay';
const trace = {
  traceparent: '00-' + 'a'.repeat(32) + '-' + 'b'.repeat(16) + '-01',
  tracestate: 'vendor=value',
};
const message: CommandOutboxDelivery = {
  id: 'message',
  destination: 'sagas',
  topic: 'project.changed',
  payload: { name: 'safe' },
  dedupeKey: 'other-dedupe',
  correlationId: 'correlation',
  trace,
};
Deno.test('saga command sink uses checked publisher and stable outbox identity correlation and W3C', async () => {
  const requests: unknown[] = [];
  const publisher: SagaPublisherPort = {
    id: 'publisher',
    publish<T extends SagaMessage>(
      next: T,
      options?: SagaPublisherPublishOptions,
    ): Promise<SagaPublisherResult<T['type']>> {
      requests.push({ next, options });
      return Promise.resolve({
        published: true,
        messageType: next.type,
        messageId: next.id,
        acceptedAt: new Date(1),
      });
    },
    publishMany() {
      return Promise.resolve([]);
    },
  };
  const sink = createSagaCommandOutboxSink({ id: 'sagas', publisher });
  assertEquals(await sink.publish(message), { identity: 'message', acceptedAt: new Date(1) });
  assertEquals(requests, [{
    next: {
      id: 'message',
      type: 'project.changed',
      payload: { name: 'safe' },
      correlationKey: 'correlation',
      idempotencyKey: 'message',
      ...trace,
    },
    options: {
      topic: 'project.changed',
      correlationKey: 'correlation',
      idempotencyKey: 'message',
      ...trace,
    },
  }]);
});
Deno.test('saga command sink refuses checked rejection unavailable malformed or mismatched receipt and aborted delivery', async () => {
  let calls = 0;
  for (
    const mode of ['rejected', 'unavailable', 'mismatch', 'invalid-time', 'unchecked', 'wrong-id']
  ) {
    const publisher: SagaPublisherPort = {
      id: 'publisher',
      publish<T extends SagaMessage>(next: T): Promise<SagaPublisherResult<T['type']>> {
        calls++;
        if (mode === 'rejected' || mode === 'unavailable') {
          return Promise.resolve({
            published: false,
            messageType: next.type,
            reason: 'private reason',
            retryable: mode === 'unavailable',
          });
        }
        const receipt: SagaPublisherResult<T['type']> = {
          published: true,
          messageType: next.type,
          acceptedAt: new Date(1),
        };
        if (mode === 'mismatch') Reflect.set(receipt, 'messageType', 'wrong');
        if (mode === 'invalid-time') Reflect.set(receipt, 'acceptedAt', new Date(NaN));
        if (mode === 'unchecked') Reflect.set(receipt, 'published', 'unchecked');
        if (mode === 'wrong-id') Reflect.set(receipt, 'messageId', 'foreign-message');
        return Promise.resolve(receipt);
      },
      publishMany() {
        return Promise.resolve([]);
      },
    };
    const sink = createSagaCommandOutboxSink({ id: 'sagas', publisher });
    const error = await assertRejects(() => sink.publish(message), CommandRelayError);
    assert(error instanceof CommandRelayError);
    assertEquals(
      error.failure,
      mode === 'rejected'
        ? 'rejected'
        : mode === 'unavailable'
        ? 'unavailable'
        : 'invalid_response',
    );
    const before = calls;
    await assertRejects(() => sink.publish(message, AbortSignal.abort()));
    assertEquals(calls, before);
  }
});
