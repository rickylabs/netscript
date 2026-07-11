import { assertEquals } from '@std/assert';

import {
  createInMemoryVectorMemoryStore,
  createVectorAgentMemory,
  recallAgentMemory,
} from '../src/ports/mod.ts';
import type { AgentMemoryPort, MemoryRecord } from '../src/ports/mod.ts';
import type { EmbeddingProviderPort } from '../src/ports/embedding.ts';

const vectors: Record<string, readonly number[]> = {
  alpha: [1, 0],
  beta: [0, 1],
  query: [0.9, 0.1],
};

function embeddings(fail = false): EmbeddingProviderPort {
  return {
    embed(input): Promise<{ embeddings: readonly (readonly number[])[]; model: string }> {
      if (fail) return Promise.reject(new Error('offline'));
      const inputs = typeof input === 'string' ? [input] : input;
      return Promise.resolve({
        embeddings: inputs.map((value) => vectors[value] ?? [0, 0]),
        model: 'fake',
      });
    },
  };
}

function memory(id: string, text: string): MemoryRecord {
  return { id, message: { role: 'system', content: text }, category: 'insight' };
}

Deno.test('vector memory ranks by cosine relevance and honors k', async () => {
  const store = createInMemoryVectorMemoryStore();
  const port = createVectorAgentMemory(embeddings(), store);
  await port.store('thread', memory('b', 'beta'));
  await port.store('thread', memory('a', 'alpha'));

  const results = await port.recall?.('thread', { query: 'query', limit: 1 });

  assertEquals(results?.map((result) => result.record.id), ['a']);
  assertEquals(results?.[0]?.score, 0.9938837346736189);
  const stored = await store.list('thread');
  assertEquals(stored.find((entry) => entry.record.id === 'a')?.record.retrievalCount, 1);
  assertEquals(
    typeof stored.find((entry) => entry.record.id === 'a')?.record.lastRetrievedAt,
    'number',
  );
});

Deno.test('vector memory returns empty for an empty store without embedding', async () => {
  const port = createVectorAgentMemory(embeddings(true), createInMemoryVectorMemoryStore());
  assertEquals(await port.recall?.('thread', { query: 'query', limit: 4 }), []);
});

Deno.test('vector memory recall fails soft when embeddings fail', async () => {
  const store = createInMemoryVectorMemoryStore();
  const writer = createVectorAgentMemory(embeddings(), store);
  await writer.store('thread', memory('a', 'alpha'));
  const reader = createVectorAgentMemory(embeddings(true), store);

  assertEquals(await reader.recall?.('thread', { query: 'query', limit: 4 }), []);
});

Deno.test('recall helper preserves load fallback when recall is absent', async () => {
  let loaded = 0;
  const record = memory('fallback', 'alpha');
  const port: AgentMemoryPort = {
    append: () => Promise.resolve(),
    load: () => {
      loaded++;
      return Promise.resolve([record]);
    },
  };

  assertEquals(await recallAgentMemory(port, 'thread', { query: 'query', limit: 1 }), [
    { record, score: 0 },
  ]);
  assertEquals(loaded, 1);
});

Deno.test('recall helper never lets a recall error break the turn', async () => {
  const port: AgentMemoryPort = {
    append: () => Promise.resolve(),
    load: () => Promise.resolve([memory('not-used', 'alpha')]),
    recall: () => Promise.reject(new Error('store unavailable')),
  };
  assertEquals(await recallAgentMemory(port, 'thread', { query: 'query' }), []);
});
