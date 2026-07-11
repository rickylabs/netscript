/**
 * Agent memory port, with the optional relevance-recall seam.
 *
 * The base port is a plain append/load transcript store. The `recall` method is
 * an **optional** seam: semantic/relevance recall is implemented by slice E10
 * and is deliberately NOT built here. Downstream loops MUST treat `recall` as
 * possibly-absent and fall back to {@linkcode AgentMemoryPort.load} when it is
 * not provided.
 *
 * @module
 */

import type { Message } from '../contracts/message.ts';

/** Stable taxonomy for app-distilled memories. */
export const MEMORY_CATEGORIES = ['correction', 'insight', 'user', 'discovery'] as const;

/** Category assigned by the app's distillation policy. */
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

/** A stored message with registry metadata. */
export interface MemoryRecord {
  /** Stable record id. */
  readonly id: string;
  /** The stored message. */
  readonly message: Message;
  /** Epoch milliseconds when the record was stored, when known. */
  readonly createdAt?: number;
  /** App-assigned category for a distilled memory. */
  readonly category?: MemoryCategory;
  /** Number of successful recalls, used by app-owned pruning policy. */
  readonly retrievalCount?: number;
  /** Epoch milliseconds of the latest successful recall. */
  readonly lastRetrievedAt?: number;
}

/** A relevance-recall query (E10). */
export interface RecallQuery {
  /** Natural-language query text to recall against. */
  readonly query: string;
  /** Maximum number of hits to return. */
  readonly limit?: number;
}

/** A scored recall hit (E10). */
export interface RecallResult {
  /** The recalled memory record. */
  readonly record: MemoryRecord;
  /** Relevance score in `[0, 1]`; higher is more relevant. */
  readonly score: number;
}

/** A distilled memory persisted with its embedding vector. */
export interface VectorMemoryEntry {
  /** Thread that owns the memory. */
  readonly threadId: string;
  /** App-distilled memory record. */
  readonly record: MemoryRecord;
  /** Dense vector produced by the injected embedding provider. */
  readonly vector: readonly number[];
}

/** App-owned persistence seam for vector memory entries. */
export interface VectorMemoryStorePort {
  /** Insert or replace a vector memory entry. */
  store(entry: VectorMemoryEntry): Promise<void>;
  /** List the vector memories belonging to a thread. */
  list(threadId: string): Promise<readonly VectorMemoryEntry[]>;
  /** Persist recall usage metadata for a memory. */
  bumpRecall(threadId: string, id: string, retrievedAt: number): Promise<void>;
}

/**
 * The agent memory capability seam.
 */
export interface AgentMemoryPort {
  /** Append a message to a thread's transcript. */
  append(threadId: string, message: Message): Promise<void>;
  /** Load a thread's full transcript in order. */
  load(threadId: string): Promise<readonly MemoryRecord[]>;
  /**
   * OPTIONAL relevance-recall seam — implemented by slice E10 (semantic recall).
   * The default no-op memory leaves this `undefined`; callers MUST guard on its
   * presence and fall back to {@linkcode AgentMemoryPort.load}. Do NOT build
   * recall in this core.
   */
  recall?(threadId: string, query: RecallQuery): Promise<readonly RecallResult[]>;
}

/** An agent memory implementation that also accepts app-distilled entries. */
export interface VectorAgentMemoryPort extends AgentMemoryPort {
  /** Embed and store an already-distilled memory; no summarization is performed. */
  store(threadId: string, memory: MemoryRecord): Promise<void>;
}

/**
 * Create the default no-op agent memory: appends are dropped, loads return
 * empty, and the optional `recall` seam is intentionally absent.
 */
export function createNoopAgentMemory(): AgentMemoryPort {
  return {
    append(): Promise<void> {
      return Promise.resolve();
    },
    load(): Promise<readonly MemoryRecord[]> {
      return Promise.resolve([]);
    },
    // `recall` is intentionally omitted — see slice E10.
  };
}
