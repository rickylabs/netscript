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
 * import { NETSCRIPT_CONTRIBUTION_BUILDERS } from '@netscript/plugin-triggers-core/discovery';
 * const patterns = NETSCRIPT_CONTRIBUTION_BUILDERS;
 * ```
 *
 * Pass these immutable patterns through the plugin SDK's `additionalBuilders` option.
 */
export const NETSCRIPT_CONTRIBUTION_BUILDERS: readonly Readonly<{
  callee: string;
  axis: string | null;
}>[] = Object.freeze([
  Object.freeze({ callee: 'defineWebhook', axis: 'triggers' }),
  Object.freeze({ callee: 'defineScheduledTrigger', axis: 'triggers' }),
  Object.freeze({ callee: 'defineFileWatch', axis: 'triggers' }),
]);
