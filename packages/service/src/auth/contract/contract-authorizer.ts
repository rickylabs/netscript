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
import { normalizePath } from './contract-path.ts';
import { bindProcedureIndex, compileProcedures } from './contract-procedure-index.ts';
import { compileRawRoutes } from './contract-raw-routes.ts';
import { compileRetiredPaths, RETIRED_PROCEDURE_POLICY } from './retired-procedures.ts';
import {
  assertNoStreamPathOverlap,
  createBoundStreamEndpointIndex,
  resolveAuthoritativeStreamEndpoints,
} from './stream-endpoint-policy.ts';
import { isInternalServicePrincipal } from '../internal-credential/internal-credential-authenticator.ts';
import {
  authorizeProcedurePolicy,
  isMatchAwareAuthorizerPort,
  isProcedureAuthorizerPort,
  registerBoundContractAuthorizer,
} from './procedure-policy-decision.ts';
import type { AuthorizerPort, AuthzDecision, AuthzRequest } from '../types.ts';
import { PROCEDURE_ERROR_CODES } from '../types.ts';

const RAW_ROUTE_OVERLAP_ERROR =
  '[netscript.service.contract-policy] raw route overlaps the contract projection';
const DUAL_FALLBACK_ERROR =
  '[netscript.service.contract-policy] fallback authorizer cannot implement both authorizeMatch and authorizeProcedure; choose one dispatch contract.';
const INVALID_FALLBACK_ERROR =
  '[netscript.service.contract-policy] fallback authorizer must implement either authorizeMatch or authorizeProcedure.';

/**
 * Creates an opt-in authorizer whose decisions come from procedure-local contract metadata.
 *
 * Every procedure the contract declares is governed by it on both the RPC and OpenAPI
 * projections: procedures without `meta.access` require authentication and go to the fallback,
 * and `access.audience: 'internal'` admits only internal service callers. To guard a few marked
 * procedures in an otherwise-public or session-guarded service, use
 * `createContractOverlayAuthorizer` instead.
 * Authenticated unmatched requests return 404 `procedure_not_found`; exact `retiredPaths`
 * return 410 `procedure_retired`. Neither discloses availability before authentication.
 *
 * @param contract - Metadata-bearing contract router to traverse at construction.
 * @param options - Optional legacy fallback, raw routes, retired paths and internal predicate.
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
  if (options.fallback !== undefined) {
    const hasMatch = isMatchAwareAuthorizerPort(options.fallback);
    const hasProcedure = isProcedureAuthorizerPort(options.fallback);
    if (hasMatch && hasProcedure) {
      throw new TypeError(DUAL_FALLBACK_ERROR);
    }
    if (!hasMatch && !hasProcedure) {
      throw new TypeError(INVALID_FALLBACK_ERROR);
    }
  }

  const procedures = compileProcedures(contract);
  const policiesByPath = new Map(
    procedures.map((procedure) => [procedure.routerPath.join('.'), procedure.policy] as const),
  );
  const rawRoutes = compileRawRoutes(options.rawRoutes ?? []);
  const retiredPaths = compileRetiredPaths(options.retiredPaths ?? []);
  const isInternalCaller = options.isInternalCaller ?? isInternalServicePrincipal;
  const usesDefaultInternalPredicate = options.isInternalCaller === undefined;
  // Validate explicit streamEndpoints eagerly at authorizer construction.
  if (options.streamEndpoints !== undefined) {
    resolveAuthoritativeStreamEndpoints(undefined, options.streamEndpoints);
  }
  let lastBinding:
    | {
      readonly resolver: ProcedurePolicyResolver;
      readonly findProcedurePath: (
        request: ProcedurePolicyRequest,
      ) => readonly string[] | undefined;
    }
    | undefined;

  async function authorizeWithResolver(
    activeResolver: ProcedurePolicyResolver,
    findProcedurePath: (request: ProcedurePolicyRequest) => readonly string[] | undefined,
    request: AuthzRequest,
  ): Promise<AuthzDecision> {
    const policyRequest: ProcedurePolicyRequest = {
      method: request.method,
      path: request.rawPath ?? request.path,
      routePath: request.path,
    };
    const resolution = activeResolver.resolve(policyRequest);
    if (!resolution.matched) {
      return {
        allow: false,
        reason: 'authz.no-contract-procedure',
        code: PROCEDURE_ERROR_CODES.NOT_FOUND,
      };
    }
    if (resolution.retired) {
      return {
        allow: false,
        reason: 'authz.procedure-retired',
        code: PROCEDURE_ERROR_CODES.RETIRED,
      };
    }

    if (!resolution.policy) {
      const fallback = options.fallback;
      if (!fallback) {
        return deny('authz.no-matching-rule');
      }

      if (isProcedureAuthorizerPort(fallback)) {
        const procedurePath = findProcedurePath(policyRequest);
        if (!procedurePath) {
          return deny('authz.no-matching-rule');
        }
        const fallbackResult = await fallback.authorizeProcedure({
          principal: request.principal,
          procedurePath,
        });
        return fallbackResult.matched ? fallbackResult.decision : deny('authz.no-matching-rule');
      }

      const fallbackResult = await fallback.authorizeMatch(request);
      return fallbackResult.matched ? fallbackResult.decision : deny('authz.no-matching-rule');
    }

    return authorizeProcedurePolicy(request, resolution.policy, isInternalCaller);
  }

  return {
    bind(binding: ContractPolicyBindingOptions): ProcedurePolicyResolver {
      const index = bindProcedureIndex(procedures, binding);
      for (const path of rawRoutes.keys()) {
        if (index.claims(path)) throw new Error(`${RAW_ROUTE_OVERLAP_ERROR}: ${path}`);
      }
      const streamEndpoints = resolveAuthoritativeStreamEndpoints(
        binding.streamMounts,
        options.streamEndpoints,
      );
      const streamExternalPatterns: Array<{ readonly label: string; readonly pattern: string }> = [
        ...index.overlapPatterns,
        ...[...rawRoutes.keys()].map((path) => ({ label: 'rawRoute', pattern: path })),
        ...[...retiredPaths.values()].map((path) => ({ label: 'retiredPath', pattern: path })),
      ];
      assertNoStreamPathOverlap(streamEndpoints, streamExternalPatterns);
      const streamIndex = createBoundStreamEndpointIndex(streamEndpoints);

      const boundResolver: ProcedurePolicyResolver = Object.freeze({
        // Precedence follows real dispatch: oRPC handlers and mounted GET stream endpoints are
        // mutually disjoint (verified at bind), followed by raw routes and internal guards.
        resolve(request: ProcedurePolicyRequest): ProcedurePolicyResolution {
          const procedure = index.find(request);
          if (procedure) return { matched: true, policy: procedure.policy };
          const stream = streamIndex.find(request);
          if (stream) return { matched: true, policy: stream.policy };
          // Raw routes are Hono routes: look them up by the path Hono dispatches on.
          const rawPolicy = rawRoutes.get(normalizePath(request.routePath ?? request.path));
          if (rawPolicy) return { matched: true, policy: rawPolicy };
          const guarded = index.findInternalGuard(request) ??
            streamIndex.findInternalGuard(request);
          if (guarded) return { matched: true, policy: guarded.policy };
          // Use the undecoded path: retirement never expands to encoded or sibling spellings.
          if (retiredPaths.has(request.path)) {
            return { matched: true, policy: RETIRED_PROCEDURE_POLICY, retired: true };
          }
          return { matched: false };
        },
      });
      const findProcedurePath = (request: ProcedurePolicyRequest): readonly string[] | undefined =>
        index.find(request)?.routerPath;
      const boundAuthorizer: AuthorizerPort = Object.freeze({
        authorize: (request: AuthzRequest) =>
          authorizeWithResolver(boundResolver, findProcedurePath, request),
      });
      registerBoundContractAuthorizer(boundResolver, {
        authorizer: boundAuthorizer,
        isInternalCaller,
        mode: 'strict',
        policiesByPath,
        fallback: options.fallback,
        usesDefaultInternalPredicate,
      });
      lastBinding = { resolver: boundResolver, findProcedurePath };
      return boundResolver;
    },

    async authorize(request: AuthzRequest): Promise<AuthzDecision> {
      if (!lastBinding) {
        return deny('authz.contract-policy-unbound');
      }
      return await authorizeWithResolver(
        lastBinding.resolver,
        lastBinding.findProcedurePath,
        request,
      );
    },
  };
}

function deny(reason: string): AuthzDecision {
  return { allow: false, reason };
}
