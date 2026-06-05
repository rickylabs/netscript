import { assertEquals } from '@std/assert';
import { QueueProvider } from '../interfaces/options.ts';

Deno.test('QueueProvider exposes the supported provider identifiers', () => {
  assertEquals(QueueProvider.DenoKv, 'deno-kv');
  assertEquals(QueueProvider.Redis, 'redis');
  assertEquals(QueueProvider.RabbitMQ, 'rabbitmq');
  assertEquals(QueueProvider.Postgres, 'postgres');
});
