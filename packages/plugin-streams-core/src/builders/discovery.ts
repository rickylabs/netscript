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
 * import { NETSCRIPT_CONTRIBUTION_BUILDERS } from '@netscript/plugin-streams-core/discovery';
 * const patterns = NETSCRIPT_CONTRIBUTION_BUILDERS;
 * ```
 *
 * Pass these immutable patterns through the plugin SDK's `additionalBuilders` option.
 * Schema maps are consumed by their owning stream definitions;
 * they are not independent id-based registry entries.
 */
export const NETSCRIPT_CONTRIBUTION_BUILDERS: readonly Readonly<{
  callee: string;
  axis: string | null;
}>[] = Object.freeze([
  Object.freeze({ callee: 'defineStreamSchema', axis: null }),
]);
