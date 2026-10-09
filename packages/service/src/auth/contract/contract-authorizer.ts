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
  ProcedureAccessPolicy,
  ProcedurePolicyRequest,
  ProcedurePolicyResolution,
  ProcedurePolicyResolver,
} from '../contract-policy.ts';
import {
  compilePathPattern,
  isWithinPrefix,
  joinPath,
  normalizePath,
  relativePath,
  toRouterPath,
  uniquePaths,
} from './contract-path.ts';
import { compileRawRoutes } from './contract-raw-routes.ts';
import { authorizeRequirements } from '../scope-authorizer.ts';
import type { AuthzDecision, AuthzRequest } from '../types.ts';

const OPTIONAL_AUTHENTICATION_ERROR =
  '[netscript.service.contract-policy] optional authentication is unsupported';
const RAW_ROUTE_OVERLAP_ERROR =
  '[netscript.service.contract-policy] raw route overlaps the contract projection';

type ContractProcedure = Extract<
  ContractPolicyContract,
  { readonly '~orpc': { readonly meta: { readonly access?: object } } }
>;

interface ProcedureIndex {
  /** Resolves a request against the bound contract procedures only. */
  resolve(request: ProcedurePolicyRequest): ProcedurePolicyResolution;
  /** Reports whether the bound REST or RPC projection already serves a path. */
  claims(path: string): boolean;
}

interface CompiledProcedure {
  readonly routerPath: readonly string[];
  readonly restMethod?: string;
  readonly restPath?: string;
  readonly policy: ProcedureAccessPolicy | undefined;
}

/**
 * Creates an opt-in authorizer whose decisions come from procedure-local contract metadata.
 *
 * @param contract - Metadata-bearing contract router to traverse at construction.
 * @param options - Optional match-aware legacy fallback and declared raw routes.
 * @returns An authorizer that binds to the service builder's actual REST and RPC paths.
 * @throws {Error} When a procedure declares unsupported optional authentication, or a raw route
 * is not an exact absolute path, is declared twice, or does not require authentication.
 * The bound resolver also throws when a raw route overlaps the REST or RPC projection.
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
 * const authorizer = createContractAuthorizer(contract, {
 *   fallback: legacyAuthorizer,
 *   rawRoutes: [{ path: '/api/tools/mcp', authentication: 'required' }],
 * });
 * createService(router, { name: 'orders' })
 *   .withAuthn({ authenticator })
 *   .withAuthz({ authorizer })
 *   .withRPC()
 *   .route('all', '/api/tools/mcp', () => new Response('ok'));
 * ```
 */
export function createContractAuthorizer<TContract extends ContractPolicyContract>(
  contract: TContract,
  options: ContractAuthorizerOptions = {},
): ContractPolicyAuthorizerPort {
  const procedures = compileProcedures(contract);
  const rawRoutes = compileRawRoutes(options.rawRoutes ?? []);
  let resolver: ProcedurePolicyResolver | undefined;

  return {
    bind(binding: ContractPolicyBindingOptions): ProcedurePolicyResolver {
      resolver = createResolver(createProcedureIndex(procedures, binding), rawRoutes);
      return resolver;
    },

    async authorize(request: AuthzRequest): Promise<AuthzDecision> {
      if (!resolver) {
        return deny('authz.contract-policy-unbound');
      }

      const resolution = resolver.resolve(request);
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

      if (resolution.policy.authentication === 'none') {
        return { allow: true };
      }

      return authorizeRequirements(
        request,
        resolution.policy.requiredScopes,
        resolution.policy.requiredRoles,
      );
    },
  };
}

function compileProcedures(contract: ContractPolicyContract): readonly CompiledProcedure[] {
  const procedures: CompiledProcedure[] = [];
  traverseContract(contract, [], (procedure, routerPath) => {
    const route = readProperty(procedure['~orpc'], 'route');
    const method = readStringProperty(route, 'method');
    const path = readStringProperty(route, 'path');
    procedures.push({
      routerPath,
      ...(method ? { restMethod: method.toUpperCase() } : {}),
      ...(path ? { restPath: path } : {}),
      policy: normalizePolicy(procedure, routerPath),
    });
  });
  return Object.freeze(procedures);
}

function traverseContract(
  contract: ContractPolicyContract,
  routerPath: readonly string[],
  visit: (procedure: ContractProcedure, path: readonly string[]) => void,
): void {
  if (isContractProcedure(contract)) {
    visit(contract, routerPath);
    return;
  }

  for (const [segment, child] of Object.entries(contract)) {
    traverseContract(child, [...routerPath, segment], visit);
  }
}

function isContractProcedure(contract: ContractPolicyContract): contract is ContractProcedure {
  return Object.hasOwn(contract, '~orpc');
}

function normalizePolicy(
  procedure: ContractProcedure,
  routerPath: readonly string[],
): ProcedureAccessPolicy | undefined {
  const access = procedure['~orpc'].meta.access;
  if (!access) return undefined;

  const authentication = readProperty(access, 'authentication');
  if (authentication === 'optional') {
    const procedureName = routerPath.length ? routerPath.join('.') : '<root>';
    throw new Error(`${OPTIONAL_AUTHENTICATION_ERROR}: ${procedureName}`);
  }

  const authorization = readProperty(access, 'authorization');
  return Object.freeze({
    authentication: authentication === 'none' ? 'none' : 'required',
    requiredScopes: readStringList(readProperty(authorization, 'scopes')),
    requiredRoles: readStringList(readProperty(authorization, 'roles')),
  });
}

function createResolver(
  procedures: ProcedureIndex,
  rawRoutes: ReadonlyMap<string, ProcedureAccessPolicy>,
): ProcedurePolicyResolver {
  for (const path of rawRoutes.keys()) {
    if (procedures.claims(path)) {
      throw new Error(`${RAW_ROUTE_OVERLAP_ERROR}: ${path}`);
    }
  }

  return Object.freeze({
    resolve(request: ProcedurePolicyRequest): ProcedurePolicyResolution {
      const rawPolicy = rawRoutes.get(normalizePath(request.path));
      return rawPolicy ? matched(rawPolicy) : procedures.resolve(request);
    },
  });
}

function createProcedureIndex(
  procedures: readonly CompiledProcedure[],
  binding: ContractPolicyBindingOptions,
): ProcedureIndex {
  const rpcPrefixes = uniquePaths([binding.rpcPath, ...(binding.rpcAliases ?? [])])
    .sort((left, right) => right.length - left.length);
  const rpcProcedures = new Map(
    procedures.map((procedure) => [toRouterPath(procedure.routerPath), procedure]),
  );
  const restProcedures = procedures.flatMap((procedure) => {
    if (!procedure.restMethod || !procedure.restPath) return [];
    return [{
      procedure,
      method: procedure.restMethod,
      pattern: compilePathPattern(joinPath(binding.apiPath, procedure.restPath)),
    }];
  });

  const projectRpcPath = (path: string) => {
    const rpcPath = remapDeprecatedRpcPath(path, binding);
    const prefix = rpcPrefixes.find((candidate) => isWithinPrefix(rpcPath, candidate));
    return prefix ? relativePath(rpcPath, prefix) : undefined;
  };

  return Object.freeze({
    claims(path: string): boolean {
      return projectRpcPath(path) !== undefined ||
        restProcedures.some((candidate) => candidate.pattern.test(path));
    },

    resolve(request: ProcedurePolicyRequest): ProcedurePolicyResolution {
      const originalPath = normalizePath(request.path);
      const rpcRouterPath = projectRpcPath(originalPath);
      if (rpcRouterPath !== undefined) {
        const procedure = rpcProcedures.get(rpcRouterPath);
        return procedure ? matched(procedure.policy) : { matched: false };
      }

      const requestMethod = request.method.toUpperCase();
      const restMatch = restProcedures.find((candidate) =>
        candidate.method === requestMethod && candidate.pattern.test(originalPath)
      );
      return restMatch ? matched(restMatch.procedure.policy) : { matched: false };
    },
  });
}

function remapDeprecatedRpcPath(
  path: string,
  binding: ContractPolicyBindingOptions,
): string {
  for (const alias of binding.deprecatedRpcRoutes ?? []) {
    const pathPrefix = normalizePath(alias.pathPrefix);
    const replacementPrefix = normalizePath(alias.replacementPrefix);
    // The canonical destination may be nested beneath the deprecated prefix.
    // Match the RPC transport's distinction between canonical and legacy paths.
    if (isWithinPrefix(path, replacementPrefix)) continue;
    if (path === pathPrefix || path.startsWith(`${pathPrefix}/`)) {
      return `${replacementPrefix}${path.slice(pathPrefix.length)}`;
    }
  }
  return path;
}

function readProperty(value: unknown, property: string): unknown {
  return typeof value === 'object' && value !== null ? Reflect.get(value, property) : undefined;
}

function readStringProperty(value: unknown, property: string): string | undefined {
  const result = readProperty(value, property);
  return typeof result === 'string' ? result : undefined;
}

function readStringList(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return Object.freeze(value.filter((item): item is string => typeof item === 'string'));
}

function matched(policy: ProcedureAccessPolicy | undefined): ProcedurePolicyResolution {
  return { matched: true, policy };
}

function deny(reason: string): AuthzDecision {
  return { allow: false, reason };
}
