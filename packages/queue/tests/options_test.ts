import { assertEquals } from '@std/assert';
import { QueueProvider } from '../ports/options.ts';
import type { QueueOptions } from '../ports/options.ts';
import { MemoryDeadLetterStore } from '../testing/mod.ts';

Deno.test('QueueProvider exposes the supported provider identifiers', () => {
  assertEquals(QueueProvider.DenoKv, 'deno-kv');
  assertEquals(QueueProvider.Redis, 'redis');
  assertEquals(QueueProvider.RabbitMQ, 'rabbitmq');
  assertEquals(QueueProvider.Postgres, 'postgres');
});

Deno.test('QueueOptions accepts an injected dead-letter store', () => {
  const deadLetterStore = new MemoryDeadLetterStore();
  const options: QueueOptions = {
    provider: QueueProvider.DenoKv,
    deadLetterStore,
  };

  assertEquals(options.deadLetterStore, deadLetterStore);
});
