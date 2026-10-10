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
 * Caller audience a procedure is restricted to.
 *
 * `'internal'` limits the procedure to service-to-service callers of the same installation, such as
 * workers, sagas, and triggers presenting the installation's internal service credential. A user
 * session never satisfies it. Absent means the procedure carries no audience restriction.
 *
 * @example
 * ```ts
 * const audience: NetScriptProcedureAudience = 'internal';
 * ```
 */
export type NetScriptProcedureAudience = 'internal';

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
 *   access: {
 *     authentication: 'required',
 *     authorization: { scopes: ['orders:read'], roles: ['operator'] },
 *   },
 *   policy: { cache: 'force-cache' },
 * };
 *
 * const internalOnly: NetScriptProcedureMeta = { access: { audience: 'internal' } };
 * ```
 */
export interface NetScriptProcedureMeta {
  /** Access-control semantics applied before a procedure runs. */
  readonly access?: {
    /** Whether callers must provide authentication for the procedure. */
    readonly authentication?: NetScriptAuthenticationRequirement;
    /**
     * Caller audience the procedure is restricted to. `'internal'` implies required
     * authentication and is enforced on every projection that serves the procedure.
     */
    readonly audience?: NetScriptProcedureAudience;
    /** Authorization requirements declared by the procedure contract. */
    readonly authorization?: {
      /** Scopes required by the procedure. */
      readonly scopes?: readonly string[];
      /** Roles required by the procedure. */
      readonly roles?: readonly string[];
    };
  };
  /** Client transport policy declared by the procedure contract. */
  readonly policy?: {
    /** Advisory cache policy consumed by SDK transport resolution. */
    readonly cache?: 'no-store' | 'default' | 'force-cache';
  };
}
