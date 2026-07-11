import { assertEquals, assertGreater } from '@std/assert';
import {
  InMemoryRetriever,
  type InMemoryRetrieverDocument,
} from '../src/adapters/in-memory-retriever.adapter.ts';
import type { EmbeddingProviderPort } from '../src/ports/embedding.ts';

function document(
  id: string,
  title: string,
  content: string,
  embedding?: readonly number[],
  titleEmbedding?: readonly number[],
): InMemoryRetrieverDocument {
  return {
    id,
    content,
    embedding,
    titleEmbedding,
    provenance: {
      sourceId: `source-${id}`,
      title,
      span: { start: 10, end: 10 + content.length, text: content },
    },
  };
}

const queryEmbeddings: EmbeddingProviderPort = {
  embed: () => Promise.resolve({ embeddings: [[1, 0]], model: 'test' }),
};

Deno.test('retrieves vector-only matches with vector tags', async () => {
  const retriever = new InMemoryRetriever({
    documents: [
      document('near', 'Unrelated', 'nothing lexical', [1, 0]),
      document('far', 'Other', 'still nothing', [0, 1]),
    ],
    embeddings: queryEmbeddings,
    alpha: 1,
  });

  const results = await retriever.retrieve('query', 5);
  assertEquals(results.map((result) => result.id), ['near']);
  assertEquals(results[0]?.matchedBy, 'vector');
});

Deno.test('retrieves keyword-only matches without an embedding provider', async () => {
  const retriever = new InMemoryRetriever({
    documents: [
      document('match', 'Guide', 'durable workflow execution'),
      document('miss', 'Other', 'unrelated material'),
    ],
  });

  const results = await retriever.retrieve('durable workflow', 5);
  assertEquals(results.map((result) => result.id), ['match']);
  assertEquals(results[0]?.matchedBy, 'keyword');
});

Deno.test('fuses overlapping channels once and tags the result hybrid', async () => {
  const retriever = new InMemoryRetriever({
    documents: [
      document('both', 'Guide', 'durable workflow', [1, 0]),
      document('keyword', 'Guide', 'durable workflow', [0, 1]),
      document('vector', 'Other', 'unrelated', [0.8, 0.2]),
    ],
    embeddings: queryEmbeddings,
  });

  const results = await retriever.retrieve('durable workflow', 10);
  assertEquals(results.map((result) => result.id), ['both', 'keyword', 'vector']);
  assertEquals(results[0]?.matchedBy, 'hybrid');
  assertEquals(new Set(results.map((result) => result.id)).size, results.length);
});

Deno.test('title boost breaks otherwise equal keyword ranks', async () => {
  const retriever = new InMemoryRetriever({
    documents: [
      document('body-only', 'General notes', 'retrieval details'),
      document('title', 'Retrieval handbook', 'retrieval details'),
    ],
    titleBoost: 0.15,
  });

  const results = await retriever.retrieve('retrieval', 2);
  assertEquals(results.map((result) => result.id), ['title', 'body-only']);
  assertGreater(results[0]?.score ?? 0, results[1]?.score ?? 0);
});

Deno.test('preserves citation-ready provenance shape', async () => {
  const retriever = new InMemoryRetriever({
    documents: [document('citation', 'Architecture', 'retrieval contract')],
  });

  const [result] = await retriever.retrieve('retrieval', 1);
  assertEquals(result?.provenance, {
    sourceId: 'source-citation',
    title: 'Architecture',
    span: { start: 10, end: 28, text: 'retrieval contract' },
  });
});

Deno.test('bounds results by k and treats non-positive k as empty', async () => {
  const retriever = new InMemoryRetriever({
    documents: [
      document('a', 'A', 'shared term'),
      document('b', 'B', 'shared term'),
      document('c', 'C', 'shared term'),
    ],
  });

  assertEquals((await retriever.retrieve('shared', 2)).length, 2);
  assertEquals(await retriever.retrieve('shared', 0), []);
  assertEquals(await retriever.retrieve('shared', -1), []);
});

Deno.test('falls back to keyword retrieval when query embedding fails', async () => {
  const failing: EmbeddingProviderPort = {
    embed: () => Promise.reject(new Error('offline')),
  };
  const retriever = new InMemoryRetriever({
    documents: [document('fallback', 'Guide', 'keyword fallback', [1, 0])],
    embeddings: failing,
  });

  const [result] = await retriever.retrieve('keyword', 1);
  assertEquals(result?.matchedBy, 'keyword');
});
