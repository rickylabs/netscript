import type { KvKey, KvStore } from '@netscript/kv';
import type { TriggerId } from '../domain/mod.ts';
import type { TriggerEnabledStateOverride, TriggerEnabledStatePort } from '../ports/mod.ts';

const DEFAULT_ENABLED_STATE_PREFIX = ['triggers', 'enabled-state'] as const satisfies KvKey;

/** Options for creating the KV-backed trigger enabled-state store. */
export type KvTriggerEnabledStateStoreOptions = Readonly<{
  kv: KvStore;
  prefix?: KvKey;
  now?: () => Date;
}>;

/** KV-backed enabled-state store that records overrides only. */
export class KvTriggerEnabledStateStore implements TriggerEnabledStatePort {
  readonly #kv: KvStore;
  readonly #prefix: KvKey;
  readonly #now: () => Date;

  /** Create an enabled-state store over the supplied KV adapter. */
  constructor(options: KvTriggerEnabledStateStoreOptions) {
    this.#kv = options.kv;
    this.#prefix = options.prefix ?? DEFAULT_ENABLED_STATE_PREFIX;
    this.#now = options.now ?? (() => new Date());
  }

  /** Return the resolved enabled state; absent override means enabled. */
  async isEnabled(id: TriggerId): Promise<boolean> {
    const entry = await this.#kv.get<TriggerEnabledStateOverride>(this.#key(id));
    return entry?.value.enabled ?? true;
  }

  /** Disable by storing an override; enable by clearing the override. */
  async setEnabled(id: TriggerId, enabled: boolean): Promise<void> {
    const key = this.#key(id);

    if (this.#kv.atomic) {
      await this.#kv.atomic([], [
        enabled ? { type: 'delete', key } : {
          type: 'set',
          key,
          value: this.#createDisabledOverride(id),
        },
      ]);
      return;
    }

    if (enabled) {
      await this.#kv.delete(key);
      return;
    }
    await this.#kv.set(key, this.#createDisabledOverride(id));
  }

  /** List stored enabled-state overrides only. */
  async list(): Promise<readonly TriggerEnabledStateOverride[]> {
    const overrides: TriggerEnabledStateOverride[] = [];
    for await (
      const entry of this.#kv.list<TriggerEnabledStateOverride>({ prefix: this.#prefix })
    ) {
      overrides.push(entry.value);
    }
    return overrides;
  }

  #key(id: TriggerId): KvKey {
    return [...this.#prefix, id];
  }

  #createDisabledOverride(id: TriggerId): TriggerEnabledStateOverride {
    return {
      triggerId: id,
      enabled: false,
      updatedAt: this.#now().toISOString(),
    };
  }
}

/**
 * Create a KV-backed enabled-state store over the supplied adapter.
 *
 * @param options - KV adapter, optional key prefix, and optional clock.
 * @returns Trigger enabled-state port backed by KV overrides.
 */
export function createKvTriggerEnabledStateStore(
  options: KvTriggerEnabledStateStoreOptions,
): TriggerEnabledStatePort {
  return new KvTriggerEnabledStateStore(options);
}
