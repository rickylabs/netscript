/**
 * @module @netscript/plugin/contract-base
 *
 * The package-core contract seam every NetScript feature plugin converges onto.
 *
 * Exposes the shared base error map, the mandatory `describe` capabilities route
 * fragment, the capabilities output schema, and the `BasePluginContract` type
 * used for compile-time conformance. There is no runtime inheritance: plugin
 * contracts compose by object spread and conform via TypeScript `satisfies`.
 *
 * @example Build a conforming plugin contract
 * ```ts
 * import {
 *   BASE_PLUGIN_CONTRACT_ROUTES,
 *   type BasePluginContract,
 * } from '@netscript/plugin/contract-base';
 *
 * export const contract = {
 *   ...BASE_PLUGIN_CONTRACT_ROUTES,
 *   // plugin-specific routes
 * } satisfies BasePluginContract;
 * ```
 */

export {
  type BasePluginErrorCode,
  type BasePluginErrorDefinition,
  BASE_PLUGIN_ERRORS,
  type InternalErrorData,
} from './domain/base-errors.ts';
export { type PluginCapabilities, PluginCapabilitiesSchema } from './domain/capabilities.ts';
export {
  BASE_PLUGIN_CONTRACT_ROUTES,
  type BasePluginContract,
  type BasePluginDescribeProcedure,
  type BasePluginDescribeRoute,
} from './domain/base-contract.ts';
