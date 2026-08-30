/**
 * Authentication requirements understood by NetScript procedure consumers.
 *
 * @example
 * ```ts
 * const requirement: NetScriptAuthenticationRequirement = 'required';
 * ```
 */
export type NetScriptAuthenticationRequirement = 'none' | 'optional' | 'required';

/**
 * NetScript-owned semantic metadata carried by a contract procedure.
 *
 * Fields are optional and readonly so future NetScript releases can add metadata without changing
 * existing routes. Consumers must treat absent fields as unspecified and must not depend on the
 * metadata representation used by the underlying contract library.
 *
 * @example
 * ```ts
 * const metadata: NetScriptProcedureMeta = {
 *   access: { authentication: 'required' },
 * };
 * ```
 */
export interface NetScriptProcedureMeta {
  /** Access-control semantics applied before a procedure runs. */
  readonly access?: {
    /** Whether callers must provide authentication for the procedure. */
    readonly authentication?: NetScriptAuthenticationRequirement;
  };
}
