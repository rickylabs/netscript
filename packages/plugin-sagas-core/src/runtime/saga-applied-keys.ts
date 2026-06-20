import type { SagaInstanceId } from '../domain/mod.ts';
import type { SagaAppliedKeyOutcome, SagaAppliedKeyStore } from '../ports/mod.ts';

/** Options for the process-local saga applied-key store. */
export type MemorySagaAppliedKeyStoreOptions = Readonly<{
  keys?: Iterable<readonly [SagaInstanceId, string]>;
}>;

/** Process-local applied-key store for tests and single-process runtime consumers. */
export class MemorySagaAppliedKeyStore implements SagaAppliedKeyStore {
  readonly #keys = new Set<string>();

  /** Create a memory-backed applied-key store. */
  constructor(options: MemorySagaAppliedKeyStoreOptions = {}) {
    for (const [instanceId, idempotencyKey] of options.keys ?? []) {
      this.#keys.add(formatAppliedKey(instanceId, idempotencyKey));
    }
  }

  /** Record an instance/key tuple; returns `applied: false` for duplicates. */
  recordApplied(
    instanceId: SagaInstanceId,
    idempotencyKey: string,
  ): Promise<SagaAppliedKeyOutcome> {
    const key = formatAppliedKey(instanceId, idempotencyKey);
    if (this.#keys.has(key)) {
      return Promise.resolve(Object.freeze({ applied: false }));
    }
    this.#keys.add(key);
    return Promise.resolve(Object.freeze({ applied: true }));
  }

  /** Return the number of retained applied-key tuples. */
  size(): number {
    return this.#keys.size;
  }

  /** Clear retained tuples for deterministic tests or runtime shutdown. */
  clear(): void {
    this.#keys.clear();
  }
}

function formatAppliedKey(instanceId: SagaInstanceId, idempotencyKey: string): string {
  return `${instanceId}:${idempotencyKey}`;
}
