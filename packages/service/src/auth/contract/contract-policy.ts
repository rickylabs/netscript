/**
 * Contract-policy ports for binding procedure metadata to service requests.
 *
 * @module
 */

import type { ContractAuthorizerOptions } from '../options.ts';
import type { AuthorizerPort, Principal } from '../types.ts';

/**
 * Decides whether an authenticated principal is an internal service caller.
 *
 * The default predicate accepts only principals minted by
 * `createInternalCredentialAuthenticator`; claims and roles are never trusted for this decision,
 * so no user-session adapter can map its way into the internal audience.
 */
export type InternalCallerPredicate = (principal: Principal) => boolean;

/** Contract procedure or router whose procedures carry contract-local access metadata. */
export type ContractPolicyContract =
  | {
    readonly '~orpc': {
      readonly meta: { readonly access?: object };
    };
  }
  | { readonly [key: string]: ContractPolicyContract };

/** Normalized service policy derived from a matched procedure's contract access metadata. */
export interface ProcedureAccessPolicy {
  /** Supported runtime authentication mode after optional declarations are rejected at binding. */
  readonly authentication: 'none' | 'required';
  /** Scopes the matched procedure requires from an authenticated principal. */
  readonly requiredScopes: readonly string[];
  /** Roles the matched procedure requires from an authenticated principal. */
  readonly requiredRoles: readonly string[];
  /** Caller audience; `'internal'` admits only principals the internal-caller predicate accepts. */
  readonly audience?: 'internal';
}

/** Request identity used to locate a procedure's contract-local policy. */
export interface ProcedurePolicyRequest {
  /** Request method used by REST procedure matching. */
  readonly method: string;
  /**
   * Undecoded request pathname (as the oRPC handlers match it), including the REST or RPC mount.
   * Pass the raw pathname, not a percent-decoded one: decoding can select a different route.
   */
  readonly path: string;
  /**
   * Percent-decoded path the HTTP router dispatches on (Hono's `c.req.path`). Used to match raw
   * routes declared beside the contract; defaults to `path`.
   */
  readonly routePath?: string;
}

/** Result of resolving a request against the bound contract procedures. */
export type ProcedurePolicyResolution =
  | { readonly matched: false }
  | {
    readonly matched: true;
    /** Access metadata on the matched procedure, or undefined when the contract declares none. */
    readonly policy: ProcedureAccessPolicy | undefined;
  };

/** Resolves request paths to policy carried by their matched contract procedure. */
export interface ProcedurePolicyResolver {
  /** Resolves the contract-local access policy for one request. */
  resolve(request: ProcedurePolicyRequest): ProcedurePolicyResolution;
}

/** Deprecated RPC route prefix mapped to the procedure prefix that replaced it. */
export interface ContractPolicyRpcRouteAlias {
  /** Deprecated prefix that may still appear in a request path. */
  readonly pathPrefix: string;
  /** Current procedure prefix used to resolve the same contract procedure. */
  readonly replacementPrefix: string;
}

/** Actual service projection paths used to bind contract procedure matching. */
export interface ContractPolicyBindingOptions {
  /** REST/OpenAPI mount prefix used by the service builder. */
  readonly apiPath: string;
  /** Primary RPC mount prefix used by the service builder. */
  readonly rpcPath: string;
  /** Additional RPC mount prefixes serving the same contract router. */
  readonly rpcAliases?: readonly string[];
  /** Deprecated procedure prefixes accepted by the RPC projection. */
  readonly deprecatedRpcRoutes?: readonly ContractPolicyRpcRouteAlias[];
}

/** Opt-in authorizer adapter that binds one compiled contract policy to service projection paths. */
export interface ContractPolicyAuthorizerPort extends AuthorizerPort {
  /** Binds the builder's actual projection paths and returns the shared authn/authz resolver. */
  bind(options: ContractPolicyBindingOptions): ProcedurePolicyResolver;
}

/** Signature for constructing an opt-in authorizer from one metadata-bearing contract router. */
export interface ContractAuthorizerFactory {
  /** Constructs the adapter from the contract itself rather than a parallel path-policy map. */
  <TContract extends ContractPolicyContract>(
    contract: TContract,
    options?: ContractAuthorizerOptions,
  ): ContractPolicyAuthorizerPort;
}
