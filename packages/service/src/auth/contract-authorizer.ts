/**
 * Contract-local policy traversal and request matching for service authentication.
 *
 * @module
 */

import type { ContractAuthorizerOptions } from './options.ts';
import type {
  ContractPolicyAuthorizerPort,
  ContractPolicyBindingOptions,
  ContractPolicyContract,
  ProcedureAccessPolicy,
  ProcedurePolicyRequest,
  ProcedurePolicyResolution,
  ProcedurePolicyResolver,
} from './contract-policy.ts';
import { authorizeRequirements } from './scope-authorizer.ts';
import type { AuthzDecision, AuthzRequest } from './types.ts';

const OPTIONAL_AUTHENTICATION_ERROR =
  '[netscript.service.contract-policy] optional authentication is unsupported';

type ContractProcedure = Extract<
  ContractPolicyContract,
  { readonly '~orpc': { readonly meta: { readonly access?: object } } }
>;

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
 * @param options - Optional match-aware legacy fallback.
 * @returns An authorizer that binds to the service builder's actual REST and RPC paths.
 * @throws {Error} When a procedure declares unsupported optional authentication.
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
  let resolver: ProcedurePolicyResolver | undefined;

  return {
    bind(binding: ContractPolicyBindingOptions): ProcedurePolicyResolver {
      resolver = createResolver(procedures, binding);
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
  procedures: readonly CompiledProcedure[],
  binding: ContractPolicyBindingOptions,
): ProcedurePolicyResolver {
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

  return Object.freeze({
    resolve(request: ProcedurePolicyRequest): ProcedurePolicyResolution {
      const originalPath = normalizePath(request.path);
      const rpcPath = remapDeprecatedRpcPath(originalPath, binding);
      const rpcPrefix = rpcPrefixes.find((prefix) => isWithinPrefix(rpcPath, prefix));
      if (rpcPrefix) {
        const procedure = rpcProcedures.get(relativePath(rpcPath, rpcPrefix));
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
    if (path === pathPrefix || path.startsWith(`${pathPrefix}/`)) {
      return `${normalizePath(alias.replacementPrefix)}${path.slice(pathPrefix.length)}`;
    }
  }
  return path;
}

function compilePathPattern(path: string): RegExp {
  let source = '';
  let index = 0;
  for (const match of path.matchAll(/\{[^{}]+\}/g)) {
    source += escapeRegExp(path.slice(index, match.index));
    source += '[^/]+';
    index = match.index + match[0].length;
  }
  source += escapeRegExp(path.slice(index));
  return new RegExp(`^${source}/?$`);
}

function joinPath(prefix: string, path: string): string {
  const normalizedPrefix = normalizePath(prefix);
  const normalizedPath = normalizePath(path);
  if (normalizedPrefix === '/') return normalizedPath;
  if (normalizedPath === '/') return normalizedPrefix;
  return `${normalizedPrefix}${normalizedPath}`;
}

function toRouterPath(segments: readonly string[]): string {
  return normalizePath(`/${segments.join('/')}`);
}

function relativePath(path: string, prefix: string): string {
  return normalizePath(path.slice(prefix.length));
}

function uniquePaths(paths: readonly string[]): string[] {
  return [...new Set(paths.map(normalizePath))];
}

function normalizePath(path: string): string {
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
}

function isWithinPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix === '/' ? '/' : `${prefix}/`);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
