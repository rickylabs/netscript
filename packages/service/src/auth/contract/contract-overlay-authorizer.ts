/**
 * Contract-policy authorizer that governs only access-marked procedures.
 *
 * @module
 */

import type { ContractOverlayAuthorizerOptions } from '../options.ts';
import type {
  ContractPolicyAuthorizerPort,
  ContractPolicyBindingOptions,
  ContractPolicyContract,
  ProcedurePolicyRequest,
  ProcedurePolicyResolution,
  ProcedurePolicyResolver,
} from './contract-policy.ts';
import { bindProcedureIndex, compileProcedures } from './contract-procedure-index.ts';
import {
  assertNoStreamPathOverlap,
  createBoundStreamEndpointIndex,
  resolveAuthoritativeStreamEndpoints,
} from './stream-endpoint-policy.ts';
import { isInternalServicePrincipal } from '../internal-credential/internal-credential-authenticator.ts';
import {
  authorizeProcedurePolicy,
  registerBoundContractAuthorizer,
} from './procedure-policy-decision.ts';
import type { AuthorizerPort, AuthzDecision, AuthzRequest } from '../types.ts';

/**
 * Creates an authorizer that overlays procedure access metadata on the service's own policy.
 *
 * Procedures that declare `meta.access` are enforced on both the RPC and OpenAPI projections,
 * whatever the path guard says: `access.audience: 'internal'` requires authentication and admits
 * only internal service callers, and `authentication: 'none'` stays anonymous. Every other request
 * keeps the service's policy — the `protect`/`allowAnonymous` path guard plus the optional
 * fallback authorizer — so marking a few internal procedures never forces authentication onto
 * public ones.
 *
 * @param contract - Metadata-bearing contract router to traverse at construction.
 * @param options - Optional fallback authorizer and internal-caller predicate.
 * @returns An authorizer that binds to the service builder's actual REST and RPC paths.
 * @throws {Error} When a procedure declares optional authentication, an unknown audience, or an
 *   anonymous internal audience.
 *
 * @example
 * ```ts
 * import { defineService } from '@netscript/service';
 * import {
 *   createContractOverlayAuthorizer,
 *   createInternalCredentialAuthenticator,
 *   loadInstallationSecret,
 * } from '@netscript/service/auth';
 * import type { ContractPolicyContract, ServiceRouter } from '@netscript/service';
 *
 * declare const contract: ContractPolicyContract;
 * declare const router: ServiceRouter;
 *
 * const secret = await loadInstallationSecret();
 * await defineService(router, {
 *   name: 'orders',
 *   auth: {
 *     // Unmarked procedures stay public; internal ones require the service credential.
 *     authn: {
 *       authenticator: createInternalCredentialAuthenticator({ secret, service: 'orders' }),
 *       allowAnonymous: ['/api', '/health'],
 *     },
 *     authz: { authorizer: createContractOverlayAuthorizer(contract) },
 *   },
 * });
 * ```
 */
export function createContractOverlayAuthorizer<TContract extends ContractPolicyContract>(
  contract: TContract,
  options: ContractOverlayAuthorizerOptions = {},
): ContractPolicyAuthorizerPort {
  const procedures = compileProcedures(contract);
  const isInternalCaller = options.isInternalCaller ?? isInternalServicePrincipal;
  if (options.streamEndpoints !== undefined) {
    resolveAuthoritativeStreamEndpoints(undefined, options.streamEndpoints);
  }
  let lastResolver: ProcedurePolicyResolver | undefined;

  async function authorizeWithResolver(
    activeResolver: ProcedurePolicyResolver,
    request: AuthzRequest,
  ): Promise<AuthzDecision> {
    const resolution = activeResolver.resolve({
      method: request.method,
      path: request.rawPath ?? request.path,
    });
    if (resolution.matched && resolution.policy) {
      return authorizeProcedurePolicy(request, resolution.policy, isInternalCaller);
    }
    return options.fallback ? await options.fallback.authorize(request) : { allow: true };
  }

  return {
    bind(binding: ContractPolicyBindingOptions): ProcedurePolicyResolver {
      const index = bindProcedureIndex(procedures, binding);
      const streamEndpoints = resolveAuthoritativeStreamEndpoints(
        binding.streamMounts,
        options.streamEndpoints,
      );
      assertNoStreamPathOverlap(streamEndpoints, index.overlapPatterns);
      const streamIndex = createBoundStreamEndpointIndex(streamEndpoints);

      const boundResolver: ProcedurePolicyResolver = Object.freeze({
        resolve(request: ProcedurePolicyRequest): ProcedurePolicyResolution {
          const policy = (
            index.find(request) ??
              streamIndex.find(request) ??
              index.findInternalGuard(request) ??
              streamIndex.findInternalGuard(request)
          )?.policy;
          // Unmarked oRPC procedures are deliberately unmatched: the service's own policy applies.
          // Mounted stream endpoints always carry a normalized policy and never fall through.
          return policy ? { matched: true, policy } : { matched: false };
        },
      });
      const boundAuthorizer: AuthorizerPort = Object.freeze({
        authorize: (request: AuthzRequest) => authorizeWithResolver(boundResolver, request),
      });
      registerBoundContractAuthorizer(boundResolver, {
        authorizer: boundAuthorizer,
        isInternalCaller,
      });
      lastResolver = boundResolver;
      return boundResolver;
    },

    async authorize(request: AuthzRequest): Promise<AuthzDecision> {
      if (!lastResolver) {
        return { allow: false, reason: 'authz.contract-policy-unbound' };
      }
      return await authorizeWithResolver(lastResolver, request);
    },
  };
}
