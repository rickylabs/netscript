import type { TriggerId } from '../domain/mod.ts';
import type { TriggerEnabledStateOverride, TriggerEnabledStatePort } from '../ports/mod.ts';

/** In-memory enabled-state store for deterministic tests. */
export class MemoryTriggerEnabledStateStore implements TriggerEnabledStatePort {
  readonly #overrides = new Map<string, TriggerEnabledStateOverride>();
  readonly #now: () => Date;

  /** Create an in-memory enabled-state store with an optional clock hook. */
  constructor(options: Readonly<{ now?: () => Date }> = {}) {
    this.#now = options.now ?? (() => new Date());
  }

  /** Return the resolved enabled state; absent override means enabled. */
  isEnabled(id: TriggerId): Promise<boolean> {
    return Promise.resolve(this.#overrides.get(id)?.enabled ?? true);
  }

  /** Disable by storing an override; enable by clearing the override. */
  setEnabled(id: TriggerId, enabled: boolean): Promise<void> {
    if (enabled) {
      this.#overrides.delete(id);
      return Promise.resolve();
    }
    this.#overrides.set(id, {
      triggerId: id,
      enabled: false,
      updatedAt: this.#now().toISOString(),
    });
    return Promise.resolve();
  }

  /** List stored enabled-state overrides only. */
  list(): Promise<readonly TriggerEnabledStateOverride[]> {
    return Promise.resolve([...this.#overrides.values()]);
  }

  /** Clear all stored overrides. */
  clear(): void {
    this.#overrides.clear();
  }
}
