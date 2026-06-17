import { Registry } from '../abstracts/registry.ts';

/** A named init preset made of scaffold-time choices. */
export interface InitPreset {
  /** Stable preset identifier used by `init --from`. */
  readonly id: string;
  /** Human-readable preset label. */
  readonly label: string;
}

/** Empty Wave 6 registry for future init presets. */
export class PresetRegistry extends Registry<string, InitPreset> {
  override readonly id = 'init-presets';
  readonly #presets = new Map<string, InitPreset>();

  override register(key: string, value: InitPreset): void {
    this.#presets.set(key, value);
  }

  override get(key: string): InitPreset | undefined {
    return this.#presets.get(key);
  }

  override entries(): readonly (readonly [string, InitPreset])[] {
    return [...this.#presets.entries()].sort(([left], [right]) => left.localeCompare(right));
  }
}
