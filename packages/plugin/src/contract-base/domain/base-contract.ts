/**
 * Mandatory base contract seam every NetScript feature plugin converges onto.
 *
 * There is no runtime inheritance in oRPC: contracts compose by object spread
 * and conform by TypeScript `satisfies`. This module provides:
 *
 * - `BASE_PLUGIN_CONTRACT_ROUTES` — a spreadable fragment carrying the single
 *   mandatory `describe` route, built with the real oRPC **contract** builder
 *   (`oc`) and wired to {@link BASE_PLUGIN_ERRORS} and the
 *   {@link PluginCapabilitiesSchema} output.
 * - `BasePluginContract` — the type a plugin contract object declares it
 *   `satisfies`; it genuinely fails to compile when the mandatory `describe`
 *   route is missing or its `.output(...)` schema does not yield a
 *   {@link PluginCapabilities} document.
 *
 * Unlike the previous design, `describe` is a real `ContractProcedure` (not a
 * phantom-typed marker) and the additional-routes index signature is constrained
 * to {@link AnyContractRouter} rather than `unknown`, so `satisfies` is a
 * meaningful guard and the workers contract no longer needs to erase its
 * inferred type when handing the definition to `implement()`.
 *
 * @module
 */

import { oc } from '@orpc/contract';
import type {
  AnyContractRouter,
  AnySchema,
  ContractProcedure,
  ContractProcedureBuilderWithOutput,
  ErrorMap,
  MergedErrorMap,
  Meta,
  Schema,
} from '@orpc/contract';
import { BASE_PLUGIN_ERRORS } from './base-errors.ts';
import { type PluginCapabilities, PluginCapabilitiesSchema } from './capabilities.ts';

/**
 * The mandatory `describe` route shape every plugin contract must carry.
 *
 * A real oRPC {@link ContractProcedure} whose `.output(...)` schema yields a
 * {@link PluginCapabilities} document. The input schema and error map are left
 * open (`any` / {@link ErrorMap}) so a plugin may layer additional inputs or
 * errors onto the seam route, but the output is invariant: a `describe` route
 * whose output is not `PluginCapabilities` fails `satisfies BasePluginContract`.
 */
export type BasePluginDescribeProcedure = ContractProcedure<
  AnySchema,
  Schema<unknown, PluginCapabilities>,
  ErrorMap,
  Meta
>;

/**
 * The minimum every plugin contract must satisfy.
 *
 * A plugin contract object declared `... satisfies BasePluginContract` fails to
 * compile when the mandatory `describe` route is absent or its `.output(...)`
 * schema does not yield {@link PluginCapabilities}. Additional plugin routes are
 * permitted by the index signature, which is constrained to
 * {@link AnyContractRouter} — every route must still be a real oRPC contract
 * procedure or nested contract router, so the index signature is a genuine
 * constraint rather than an escape hatch.
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
  readonly describe: BasePluginDescribeProcedure;
  /** Plugin-specific routes layered onto the base seam (each a real contract router). */
  readonly [route: string]: AnyContractRouter;
}

/**
 * Explicit type of the seam's `describe` route value.
 *
 * Spelled out so the exported {@link BASE_PLUGIN_CONTRACT_ROUTES} value carries a
 * concrete annotation that satisfies `--isolatedDeclarations` (the JSR
 * slow-types bar) without inferring a complex initializer type.
 */
export type BasePluginDescribeRoute = ContractProcedureBuilderWithOutput<
  Schema<unknown, unknown>,
  typeof PluginCapabilitiesSchema,
  MergedErrorMap<Record<never, never>, ReturnType<typeof oc.errors>['~orpc']['errorMap']>,
  Record<never, never>
>;

/**
 * The mandatory contract route fragment shared by every feature plugin.
 *
 * Spread this into a plugin contract object so the `describe` route — built with
 * the real oRPC contract builder and wired to the base error map and the
 * capabilities output schema — is always present.
 *
 * @example
 * ```ts
 * const contract = { ...BASE_PLUGIN_CONTRACT_ROUTES } satisfies BasePluginContract;
 * ```
 */
export const BASE_PLUGIN_CONTRACT_ROUTES: { readonly describe: BasePluginDescribeRoute } = Object
  .freeze({
    describe: oc
      .errors({ ...BASE_PLUGIN_ERRORS })
      .route({ method: 'GET', path: '/describe' })
      .output(PluginCapabilitiesSchema),
  });
