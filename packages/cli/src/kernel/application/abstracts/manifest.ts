import { Registry } from './registry.ts';

/** One manifest item with optional file provenance. */
export interface ManifestEntry<TKey, TValue> {
  /** Stable manifest key. */
  readonly key: TKey;
  /** Manifest value. */
  readonly value: TValue;
  /** Source file path when the entry was read from disk. */
  readonly sourcePath?: string;
}

/**
 * Layer-2 registry base for file-backed manifests.
 *
 * Demonstrated concretes: template registry assets and deploy target manifests.
 */
export abstract class Manifest<TKey, TValue> extends Registry<TKey, TValue> {
  /** Load manifest entries from a root directory. */
  abstract load(root: string): Promise<readonly ManifestEntry<TKey, TValue>[]>;

  /** Persist manifest entries to a root directory. */
  abstract write(root: string, entries: readonly ManifestEntry<TKey, TValue>[]): Promise<void>;

  /** Convert loaded entries to deterministic registry tuples. Final helper. */
  protected toEntries(
    entries: readonly ManifestEntry<TKey, TValue>[],
  ): readonly (readonly [TKey, TValue])[] {
    return entries.map((entry) => [entry.key, entry.value] as const);
  }
}
