/** In-memory starter for the app-owned vector-memory persistence seam. */

import type { VectorMemoryEntry, VectorMemoryStorePort } from '../ports/memory.ts';

/** Create an injected, process-local vector store suitable for tests and small apps. */
export function createInMemoryVectorMemoryStore(): VectorMemoryStorePort {
  const threads = new Map<string, Map<string, VectorMemoryEntry>>();
  return {
    store(entry): Promise<void> {
      const entries = threads.get(entry.threadId) ?? new Map<string, VectorMemoryEntry>();
      entries.set(entry.record.id, entry);
      threads.set(entry.threadId, entries);
      return Promise.resolve();
    },
    list(threadId): Promise<readonly VectorMemoryEntry[]> {
      return Promise.resolve([...threads.get(threadId)?.values() ?? []]);
    },
    bumpRecall(threadId, id, retrievedAt): Promise<void> {
      const entries = threads.get(threadId);
      const entry = entries?.get(id);
      if (entry) {
        entries?.set(id, {
          ...entry,
          record: {
            ...entry.record,
            retrievalCount: (entry.record.retrievalCount ?? 0) + 1,
            lastRetrievedAt: retrievedAt,
          },
        });
      }
      return Promise.resolve();
    },
  };
}
