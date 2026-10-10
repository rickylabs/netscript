/**
 * Contract-local policy traversal and request matching for service authentication.
 *
 * @module
 */

import type { ContractAuthorizerOptions } from '../options.ts';
import type {
  ContractPolicyAuthorizerPort,
  ContractPolicyBindingOptions,
  ContractPolicyContract,
  ProcedurePolicyRequest,
  ProcedurePolicyResolution,
  ProcedurePolicyResolver,
} from './contract-policy.ts';
import { bindProcedureIndex, compileProcedures } from './contract-procedure-index.ts';
import { isInternalServicePrincipal } from '../internal-credential/internal-credential-authenticator.ts';
import { authorizeProcedurePolicy } from './procedure-policy-decision.ts';
import type { AuthzDecision, AuthzRequest } from '../types.ts';

/**
 * Creates an opt-in authorizer whose decisions come from procedure-local contract metadata.
 *
 * Every procedure the contract declares is governed by it on both the RPC and OpenAPI
 * projections: procedures without `meta.access` require authentication and go to the fallback,
 * and `access.audience: 'internal'` admits only internal service callers. To guard a few marked
 * procedures in an otherwise-public or session-guarded service, use
 * `createContractOverlayAuthorizer` instead.
 *
 * @param contract - Metadata-bearing contract router to traverse at construction.
 * @param options - Optional match-aware legacy fallback and internal-caller predicate.
 * @returns An authorizer that binds to the service builder's actual REST and RPC paths.
 * @throws {Error} When a procedure declares optional authentication, an unknown audience, or an
 *   anonymous internal audience.
 *
 * @example
 * ```ts
 * import { createService } from '@netscript/service';
 * import type {
 *   AuthenticatorPort,
 *   ContractPolicyContract,
 *   MatchAwareAuthorizerPort,
 *   ServiceRouter,
 * } from '@netscript/service';
 *
 * declare const contract: ContractPolicyContract;
 * declare const legacyAuthorizer: MatchAwareAuthorizerPort;
 * declare const router: ServiceRouter;
 * declare const authenticator: AuthenticatorPort;
 *
 * const authorizer = createContractAuthorizer(contract, { fallback: legacyAuthorizer });
 * createService(router, { name: 'orders' })
 *   .withAuthn({ authenticator })
 *   .withAuthz({ authorizer })
 *   .withRPC();
 * ```
 */
export function createContractAuthorizer<TContract extends ContractPolicyContract>(
  contract: TContract,
  options: ContractAuthorizerOptions = {},
): ContractPolicyAuthorizerPort {
  const procedures = compileProcedures(contract);
  const isInternalCaller = options.isInternalCaller ?? isInternalServicePrincipal;
  let resolver: ProcedurePolicyResolver | undefined;

  return {
    bind(binding: ContractPolicyBindingOptions): ProcedurePolicyResolver {
      const index = bindProcedureIndex(procedures, binding);
      resolver = Object.freeze({
        resolve(request: ProcedurePolicyRequest): ProcedurePolicyResolution {
          const procedure = index.find(request);
          return procedure ? { matched: true, policy: procedure.policy } : { matched: false };
        },
      });
      return resolver;
    },

    async authorize(request: AuthzRequest): Promise<AuthzDecision> {
      if (!resolver) {
        return deny('authz.contract-policy-unbound');
      }

      const resolution = resolver.resolve({
        method: request.method,
        path: request.rawPath ?? request.path,
      });
      if (!resolution.matched) {
        return deny('authz.no-contract-procedure');
      }

      if (!resolution.policy) {
        const fallback = options.fallback;
        if (!fallback) {
          return deny('authz.no-matching-rule');
        }

        const fallbackResult = await fallback.authorizeMatch(request);
        return fallbackResult.matched ? fallbackResult.decision : deny('authz.no-matching-rule');
      }

      return authorizeProcedurePolicy(request, resolution.policy, isInternalCaller);
    },
  };
}

function deny(reason: string): AuthzDecision {
  return { allow: false, reason };
}
