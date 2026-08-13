import { dirname, join } from '@std/path';

import type { GateReceipt } from './contract.ts';

export interface ReceiptStore {
  write(receipt: GateReceipt): Promise<void>;
}

/** Atomic file replacement: readers observe either the old complete receipt or the new one. */
export class AtomicFileReceiptStore implements ReceiptStore {
  constructor(private readonly path: string) {}

  async write(receipt: GateReceipt): Promise<void> {
    await Deno.mkdir(dirname(this.path), { recursive: true });
    const temp = join(
      dirname(this.path),
      `.${this.path.split(/[\\/]/).pop()}.${crypto.randomUUID()}.tmp`,
    );
    const body = `${JSON.stringify(receipt, null, 2)}\n`;
    try {
      await Deno.writeTextFile(temp, body, { createNew: true });
      await Deno.rename(temp, this.path);
    } finally {
      await Deno.remove(temp).catch(() => undefined);
    }
  }
}

/**
 * Lifecycle-local at-most-once broker. It is deliberately not a distributed or crash-safe lock.
 * Same-id/same-hash callers replay one promise; mismatched reuse and exhaustion fail closed.
 */
export class LifecycleMemoryStore<T> {
  readonly #entries = new Map<string, { hash: string; promise: Promise<T> }>();

  constructor(private readonly capacity = 256) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new Error('capacity must be positive');
  }

  run(id: string, hash: string, operation: () => Promise<T>): Promise<T> {
    const current = this.#entries.get(id);
    if (current) {
      if (current.hash !== hash) {
        throw new Error(`Invocation ${id} was reused with a different request hash`);
      }
      return current.promise;
    }
    if (this.#entries.size >= this.capacity) {
      throw new Error(`Lifecycle receipt capacity ${this.capacity} exhausted`);
    }
    // Store synchronously before invoking operation: concurrent callers cannot spawn twice.
    const promise = Promise.resolve().then(operation);
    this.#entries.set(id, { hash, promise });
    return promise;
  }

  get size(): number {
    return this.#entries.size;
  }
}
