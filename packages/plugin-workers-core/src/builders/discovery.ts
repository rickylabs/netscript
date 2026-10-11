/**
 * Factory-owned discovery metadata for host tooling.
 *
 * @module
 */

/**
 * Registry axes for exported factories; null excludes values without a contribution id.
 *
 * @example
 * ```ts
 * import { NETSCRIPT_CONTRIBUTION_BUILDERS } from '@netscript/plugin-workers-core/discovery';
 * const patterns = NETSCRIPT_CONTRIBUTION_BUILDERS;
 * ```
 *
 * Pass these immutable patterns through the plugin SDK's `additionalBuilders` option.
 * Schema maps, saga signals, and saga queries are consumed by their owning definitions;
 * they are not independent id-based registry entries.
 */
export const NETSCRIPT_CONTRIBUTION_BUILDERS: readonly Readonly<{
  callee: string;
  axis: string | null;
}>[] = Object.freeze([
  Object.freeze({ callee: 'defineJob', axis: 'jobs' }),
  Object.freeze({ callee: 'defineTask', axis: 'tasks' }),
  Object.freeze({ callee: 'defineWorkflow', axis: 'workflows' }),
]);
