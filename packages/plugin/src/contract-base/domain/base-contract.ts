/**
 * Mandatory base contract seam every NetScript feature plugin converges onto.
 *
 * There is no runtime inheritance in oRPC: contracts compose by object spread
 * and conform by TypeScript `satisfies`. This module provides:
 *
 * - `BASE_PLUGIN_CONTRACT_ROUTES` — a spreadable fragment carrying the single
 *   mandatory `describe` route (already wired to {@link BASE_PLUGIN_ERRORS} and
 *   the {@link PluginCapabilitiesSchema} output).
 * - `BasePluginContract` — the type a plugin contract object declares it
 *   `satisfies`; it fails to compile when `describe` is missing or mis-typed.
 *
 * @module
 */

import { os } from '@orpc/server';
import { BASE_PLUGIN_ERRORS } from './base-errors.ts';
import { type PluginCapabilities, PluginCapabilitiesSchema } from './capabilities.ts';

/**
 * Opaque oRPC contract procedure produced by route composition.
 *
 * Carries a phantom `__output` marker so {@link BasePluginContract} can enforce
 * that the mandatory `describe` route yields a {@link PluginCapabilities}
 * document at the type level.
 */
export interface BasePluginContractProcedure<TOutput> {
  /** oRPC procedure marker used by implementers and routers. */
  readonly '~orpc': unknown;
  /** Phantom marker carrying the procedure output type; never present at runtime. */
  readonly __output?: TOutput;
}

/**
 * The minimum every plugin contract must satisfy.
 *
 * A plugin contract object declared `... satisfies BasePluginContract` fails to
 * compile when the mandatory `describe` route is absent or its output type does
 * not match {@link PluginCapabilities}. Extra routes are permitted via the index
 * signature.
 *
 * @example A conforming contract
 * ```ts
 * import { BASE_PLUGIN_CONTRACT_ROUTES, type BasePluginContract } from '@netscript/plugin/contract-base';
 *
 * const contract = {
 *   ...BASE_PLUGIN_CONTRACT_ROUTES,
 *   // plugin-specific routes here
 * } satisfies BasePluginContract;
 * ```
 */
export interface BasePluginContract {
  /** Mandatory marketplace-discoverable capabilities route. */
  readonly describe: BasePluginContractProcedure<PluginCapabilities>;
  /** Plugin-specific routes layered onto the base seam. */
  readonly [route: string]: unknown;
}

/**
 * The mandatory contract route fragment shared by every feature plugin.
 *
 * Spread this into a plugin contract object so the `describe` route — wired to
 * the base error map and the capabilities output schema — is always present.
 *
 * @example
 * ```ts
 * const contract = { ...BASE_PLUGIN_CONTRACT_ROUTES } satisfies BasePluginContract;
 * ```
 */
export const BASE_PLUGIN_CONTRACT_ROUTES: BasePluginContract = Object.freeze({
  // Centralized contract definition: the oRPC error/route builders are opaque,
  // so the seam crosses into oRPC with the sanctioned `as unknown as` boundary
  // cast — the same pattern `@netscript/contracts` uses for `baseContract`.
  describe: os
    .errors({ ...BASE_PLUGIN_ERRORS } as unknown as Parameters<typeof os.errors>[0])
    .route({ method: 'GET', path: '/describe' })
    .output(PluginCapabilitiesSchema) as unknown as BasePluginContractProcedure<PluginCapabilities>,
});
