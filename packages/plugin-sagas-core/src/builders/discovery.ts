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
 * import { NETSCRIPT_CONTRIBUTION_BUILDERS } from '@netscript/plugin-sagas-core/discovery';
 * const patterns = NETSCRIPT_CONTRIBUTION_BUILDERS;
 * ```
 *
 * Pass these immutable patterns through the plugin SDK's `additionalBuilders` option.
 * Saga signals and queries are consumed by their owning saga definitions;
 * they are not independent id-based registry entries.
 */
export const NETSCRIPT_CONTRIBUTION_BUILDERS: readonly Readonly<{
  callee: string;
  axis: string | null;
}>[] = Object.freeze([
  Object.freeze({ callee: 'defineSaga', axis: 'sagas' }),
  Object.freeze({ callee: 'defineSignal', axis: null }),
  Object.freeze({ callee: 'defineQuery', axis: null }),
]);
