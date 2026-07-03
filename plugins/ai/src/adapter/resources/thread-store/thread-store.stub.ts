/** Type-checked source stub for the opt-in AI thread store.
 *
 * @module
 */

import { defineStub, type StubSource } from '@netscript/plugin/adapter';

/**
 * Opt-in (`--persist-threads`) app-owned thread persistence. The plugin bundles
 * NO store: this emits a starter `Deno.Kv`-backed implementation of an app-owned
 * `ThreadStore` port that the durable chat route can persist sessions through.
 * Swap the body for Postgres/Turso/etc. — it is entirely yours.
 */
export const threadStoreStub: StubSource<never> = defineStub({
  source: `/** App-owned AI thread persistence (opt-in). Starter Deno.Kv implementation. */

import type { NetScriptChatMessage } from '@netscript/fresh/ai';

/** App-owned persistence port for durable chat threads. */
export interface ThreadStore {
  load(sessionId: string): Promise<readonly NetScriptChatMessage[]>;
  append(sessionId: string, message: NetScriptChatMessage): Promise<void>;
  clear(sessionId: string): Promise<void>;
}

/** Starter Deno.Kv-backed thread store. Replace with your database of choice. */
export function createKvThreadStore(kv: Deno.Kv): ThreadStore {
  const key = (sessionId: string): Deno.KvKey => ['ai', 'threads', sessionId];
  return {
    async load(sessionId) {
      const entry = await kv.get<NetScriptChatMessage[]>(key(sessionId));
      return entry.value ?? [];
    },
    async append(sessionId, message) {
      const current = await this.load(sessionId);
      await kv.set(key(sessionId), [...current, message]);
    },
    async clear(sessionId) {
      await kv.delete(key(sessionId));
    },
  };
}
`,
  tokens: [],
});
