import type { ScaffoldArtifact } from './artifact.ts';

/**
 * Unified generator contract for plugin-owned userland items.
 *
 * @typeParam TInput Input shape validated by the plugin before emission.
 *
 * @example
 * ```ts
 * import { textArtifact, type ItemScaffolder } from '@netscript/plugin/adapter';
 *
 * const jobScaffolder: ItemScaffolder<{ readonly name: string }> = {
 *   name: 'job',
 *   emit(input) {
 *     return [textArtifact(`src/jobs/${input.name}.ts`, 'export {};')];
 *   },
 * };
 * ```
 */
export interface ItemScaffolder<TInput> {
  /** Resource name emitted by this scaffolder. */
  readonly name: string;
  /**
   * Emit deterministic artifacts for a validated input.
   *
   * @param input Validated item input.
   * @returns Artifacts to write or plan.
   */
  emit(input: TInput): readonly ScaffoldArtifact[];
}
