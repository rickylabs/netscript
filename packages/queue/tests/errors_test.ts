import { assertEquals, assertInstanceOf } from '@std/assert';
import {
  QueueConfigurationError,
  QueueConnectionError,
  QueueError,
  QueueErrorCode,
  QueueHandlerError,
  QueueValidationError,
} from '../ports/errors.ts';

Deno.test('QueueError stores code, cause, and context', () => {
  const cause = new Error('root cause');
  const error = new QueueError('queue failed', QueueErrorCode.ENQUEUE_FAILED, {
    cause,
    context: { queueName: 'jobs' },
  });

  assertEquals(error.name, 'QueueError');
  assertEquals(error.code, QueueErrorCode.ENQUEUE_FAILED);
  assertEquals(error.cause, cause);
  assertEquals(error.context, { queueName: 'jobs' });
  assertEquals(error.toJSON().code, QueueErrorCode.ENQUEUE_FAILED);
});

Deno.test('queue error subclasses preserve standardized codes', () => {
  const connection = new QueueConnectionError('cannot connect');
  const validation = new QueueValidationError('invalid payload', {
    field: 'type',
  });
  const handler = new QueueHandlerError('handler crashed', new Error('boom'));
  const configuration = new QueueConfigurationError('bad provider');

  assertInstanceOf(connection, QueueError);
  assertEquals(connection.code, QueueErrorCode.CONNECTION_FAILED);
  assertEquals(validation.code, QueueErrorCode.VALIDATION_ERROR);
  assertEquals(validation.context, { field: 'type' });
  assertEquals(handler.code, QueueErrorCode.HANDLER_ERROR);
  assertEquals(configuration.code, QueueErrorCode.CONFIGURATION_ERROR);
});
