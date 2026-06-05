import { Registry } from '../abstracts/registry.ts';
import { HumanOutputRenderer } from '../../presentation/output/renderers/human-output-renderer.ts';
import { JsonOutputRenderer } from '../../presentation/output/renderers/json-output-renderer.ts';
import { SilentOutputRenderer } from '../../presentation/output/renderers/silent-output-renderer.ts';
import type { OutputRenderer } from '../../presentation/output/renderers/output-renderer.ts';

/** Output renderer identifiers accepted by the CLI presentation layer. */
export type OutputRendererKey = 'human' | 'json' | 'silent';

/** Ordered default output renderers. */
export const DEFAULT_OUTPUT_RENDERERS: readonly (
  readonly [OutputRendererKey, OutputRenderer]
)[] = Object.freeze([
  ['human', new HumanOutputRenderer()],
  ['json', new JsonOutputRenderer()],
  ['silent', new SilentOutputRenderer()],
]);

/** Registry for CLI output rendering strategies. */
export class OutputRendererRegistry extends Registry<OutputRendererKey, OutputRenderer> {
  override readonly id = 'output-renderers';

  readonly #renderers = new Map<OutputRendererKey, OutputRenderer>();

  constructor(
    renderers: readonly (readonly [OutputRendererKey, OutputRenderer])[] = DEFAULT_OUTPUT_RENDERERS,
  ) {
    super();
    for (const [key, renderer] of renderers) {
      this.register(key, renderer);
    }
  }

  /** Register or replace an output renderer. */
  override register(key: OutputRendererKey, renderer: OutputRenderer): void {
    this.#renderers.set(key, renderer);
  }

  /** Resolve an output renderer by key. */
  override get(key: OutputRendererKey): OutputRenderer | undefined {
    return this.#renderers.get(key);
  }

  /** List registered output renderers in deterministic order. */
  override entries(): readonly (readonly [OutputRendererKey, OutputRenderer])[] {
    return [...this.#renderers.entries()].sort(([left], [right]) => left.localeCompare(right));
  }
}
