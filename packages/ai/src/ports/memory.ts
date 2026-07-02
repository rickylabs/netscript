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

/** A stored message with registry metadata. */
export interface MemoryRecord {
  /** Stable record id. */
  readonly id: string;
  /** The stored message. */
  readonly message: Message;
  /** Epoch milliseconds when the record was stored, when known. */
  readonly createdAt?: number;
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
