import type { ScaffoldArtifact } from '../../adapter/item/artifact.ts';
import type { PluginCliArgs } from '../types.ts';

/** Result of planning or applying a plugin-owned scaffold operation. */
export interface ScaffoldPlanResult<T> {
  /** True when persistence was intentionally skipped. */
  readonly dryRun: boolean;
  /** Project-relative files the equivalent real run writes. */
  readonly files: readonly string[];
  /** Result produced by the real persistence callback. */
  readonly applied?: T;
}

/** Plan scaffold files and invoke their persistence callback only for a real run. */
export async function applyScaffoldPlan<T>(
  options: Readonly<{
    args: PluginCliArgs;
    artifacts: readonly ScaffoldArtifact[];
    generatedPaths?: readonly string[];
    apply: () => Promise<T>;
  }>,
): Promise<ScaffoldPlanResult<T>> {
  const files = Object.freeze([
    ...options.artifacts.map((artifact) => artifact.path),
    ...(options.generatedPaths ?? []),
  ]);
  if (options.args.flags?.['dry-run'] === true) {
    return Object.freeze({ dryRun: true, files });
  }
  return Object.freeze({ dryRun: false, files, applied: await options.apply() });
}
