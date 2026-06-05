import { assertEquals } from '@std/assert';
import { createStreamTopicFixture, MemoryStreamProducer } from '../../src/testing/mod.ts';

Deno.test('MemoryStreamProducer records upsert and delete events', async () => {
  const producer = new MemoryStreamProducer();

  producer.upsert('execution', { id: 'exec-1', status: 'running' });
  producer.delete('execution', 'exec-1');
  await producer.flush();

  assertEquals(producer.events(), [
    {
      entityType: 'execution',
      operation: 'upsert',
      key: 'exec-1',
      value: { id: 'exec-1', status: 'running' },
    },
    { entityType: 'execution', operation: 'delete', key: 'exec-1' },
  ]);
});

Deno.test('createStreamTopicFixture returns an execution collection schema', () => {
  const fixture = createStreamTopicFixture();

  assertEquals(fixture.execution.primaryKey, 'id');
  assertEquals(fixture.execution.type, 'execution');
});
