/** Vector-ranked implementation of the existing optional agent-memory recall seam. */

import type { Message } from '../contracts/message.ts';
import type { EmbeddingProviderPort } from '../ports/embedding.ts';
import type {
  AgentMemoryPort,
  MemoryRecord,
  RecallQuery,
  RecallResult,
  VectorAgentMemoryPort,
  VectorMemoryStorePort,
} from '../ports/memory.ts';

/** Compose vector-recalled memory from injected embedding and persistence ports. */
export function createVectorAgentMemory(
  embeddings: EmbeddingProviderPort,
  store: VectorMemoryStorePort,
): VectorAgentMemoryPort {
  const transcripts = new Map<string, MemoryRecord[]>();
  let sequence = 0;
  return {
    append(threadId, message): Promise<void> {
      const records = transcripts.get(threadId) ?? [];
      records.push({ id: `message-${sequence++}`, message, createdAt: Date.now() });
      transcripts.set(threadId, records);
      return Promise.resolve();
    },
    load(threadId): Promise<readonly MemoryRecord[]> {
      return Promise.resolve(transcripts.get(threadId) ?? []);
    },
    async store(threadId, memory): Promise<void> {
      const response = await embeddings.embed(messageText(memory.message));
      const vector = response.embeddings[0];
      if (!vector) throw new TypeError('Embedding provider returned no vector for the memory.');
      await store.store({ threadId, record: memory, vector });
    },
    async recall(threadId, query): Promise<readonly RecallResult[]> {
      try {
        const limit = normalizeLimit(query.limit);
        if (limit === 0) return [];
        const entries = await store.list(threadId);
        if (entries.length === 0) return [];
        const response = await embeddings.embed(query.query);
        const queryVector = response.embeddings[0];
        if (!queryVector) return [];
        const ranked = entries
          .map((entry) => ({
            record: entry.record,
            score: cosineSimilarity(queryVector, entry.vector),
          }))
          .sort((left, right) =>
            right.score - left.score || left.record.id.localeCompare(right.record.id)
          )
          .slice(0, limit);
        const retrievedAt = Date.now();
        await Promise.all(
          ranked.map((result) => store.bumpRecall(threadId, result.record.id, retrievedAt)),
        );
        return ranked;
      } catch {
        return [];
      }
    },
  };
}

/** Recall relevant memory, falling back to transcript load only when recall is absent. */
export async function recallAgentMemory(
  memory: AgentMemoryPort,
  threadId: string,
  query: RecallQuery,
): Promise<readonly RecallResult[]> {
  if (!memory.recall) {
    const records = await memory.load(threadId);
    return records.slice(0, normalizeLimit(query.limit)).map((record) => ({ record, score: 0 }));
  }
  try {
    return await memory.recall(threadId, query);
  } catch {
    return [];
  }
}

function normalizeLimit(limit: number | undefined): number {
  if (limit === undefined) return Number.MAX_SAFE_INTEGER;
  if (!Number.isFinite(limit)) return 0;
  return Math.max(0, Math.floor(limit));
}

function messageText(message: Message): string {
  if (typeof message.content === 'string') return message.content;
  return message.content.map((part) => 'text' in part ? part.text : '').filter(Boolean).join('\n');
}

function cosineSimilarity(left: readonly number[], right: readonly number[]): number {
  if (left.length !== right.length || left.length === 0) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index++) {
    const a = left[index] ?? 0;
    const b = right[index] ?? 0;
    dot += a * b;
    leftMagnitude += a * a;
    rightMagnitude += b * b;
  }
  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  if (denominator === 0) return 0;
  return Math.max(0, Math.min(1, dot / denominator));
}
