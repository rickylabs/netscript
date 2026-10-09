/**
 * Contract traversal and projection-path matching shared by the contract-policy authorizers.
 *
 * A procedure is served on two projections: the RPC mount (by router path) and the OpenAPI mount
 * (by `route.path`, or by the router path when the contract declares none, with oRPC's default
 * `POST` method). The index matches both, so a policy declared on a procedure cannot be bypassed
 * by calling the projection that was not considered.
 *
 * @module
 */

import type {
  ContractPolicyBindingOptions,
  ContractPolicyContract,
  ProcedureAccessPolicy,
  ProcedurePolicyRequest,
} from './contract-policy.ts';

const OPTIONAL_AUTHENTICATION_ERROR =
  '[netscript.service.contract-policy] optional authentication is unsupported';
const UNKNOWN_AUDIENCE_ERROR = '[netscript.service.contract-policy] unsupported audience';
const PUBLIC_INTERNAL_ERROR =
  '[netscript.service.contract-policy] an internal audience cannot be anonymous';

/** oRPC's OpenAPI method for procedures whose contract declares no `route.method`. */
const OPENAPI_DEFAULT_METHOD = 'POST';

type ContractProcedure = Extract<
  ContractPolicyContract,
  { readonly '~orpc': { readonly meta: { readonly access?: object } } }
>;

/** One contract procedure with its normalized policy and OpenAPI projection. */
export interface IndexedProcedure {
  /** Router path segments, which are also the RPC projection path. */
  readonly routerPath: readonly string[];
  /** OpenAPI method, defaulted exactly as oRPC does. */
  readonly restMethod: string;
  /** OpenAPI path relative to the API mount, defaulted exactly as oRPC does. */
  readonly restPath: string;
  /** Normalized access policy, or undefined when the procedure declares no access metadata. */
  readonly policy: ProcedureAccessPolicy | undefined;
}

/** Bound lookup from a request to the contract procedure it reaches. */
export interface ProcedureIndex {
  /** Returns the procedure a request reaches, or undefined when it reaches none. */
  find(request: ProcedurePolicyRequest): IndexedProcedure | undefined;
}

/**
 * Traverses a contract once and normalizes every procedure's access metadata.
 *
 * @throws {Error} When a procedure declares optional authentication, an unknown audience, or an
 *   anonymous internal audience.
 */
export function compileProcedures(contract: ContractPolicyContract): readonly IndexedProcedure[] {
  const procedures: IndexedProcedure[] = [];
  traverseContract(contract, [], (procedure, routerPath) => {
    const route = readProperty(procedure['~orpc'], 'route');
    procedures.push({
      routerPath,
      restMethod: (readStringProperty(route, 'method') ?? OPENAPI_DEFAULT_METHOD).toUpperCase(),
      restPath: readStringProperty(route, 'path') ?? toRouterPath(routerPath),
      policy: normalizePolicy(procedure, routerPath),
    });
  });
  return Object.freeze(procedures);
}

/** Binds compiled procedures to the service's actual projection mounts. */
export function bindProcedureIndex(
  procedures: readonly IndexedProcedure[],
  binding: ContractPolicyBindingOptions,
): ProcedureIndex {
  const rpcPrefixes = uniquePaths([binding.rpcPath, ...(binding.rpcAliases ?? [])])
    .sort((left, right) => right.length - left.length);
  const rpcProcedures = new Map(
    procedures.map((procedure) => [toRouterPath(procedure.routerPath), procedure]),
  );
  const restProcedures = procedures.map((procedure) => ({
    procedure,
    method: procedure.restMethod,
    pattern: compilePathPattern(joinPath(binding.apiPath, procedure.restPath)),
  }));

  return Object.freeze({
    find(request: ProcedurePolicyRequest): IndexedProcedure | undefined {
      const originalPath = normalizePath(request.path);
      const rpcPath = remapDeprecatedRpcPath(originalPath, binding);
      const rpcPrefix = rpcPrefixes.find((prefix) => isWithinPrefix(rpcPath, prefix));
      const rpcMatch = rpcPrefix ? rpcProcedures.get(relativePath(rpcPath, rpcPrefix)) : undefined;
      if (rpcMatch) return rpcMatch;

      // The OpenAPI mount usually encloses the RPC mount, so an RPC miss can still be a REST hit.
      const pathMatches = restProcedures.filter((candidate) =>
        candidate.pattern.test(originalPath)
      );
      const requestMethod = request.method.toUpperCase();
      const exact = pathMatches.find((candidate) => candidate.method === requestMethod);
      if (exact) return exact.procedure;

      // A method no procedure declares on this path (HEAD, a lower-case extension method) is not
      // served as a public procedure. Fail closed toward any internal procedure on the path.
      return pathMatches.find((candidate) => candidate.procedure.policy?.audience === 'internal')
        ?.procedure;
    },
  });
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

  const procedureName = routerPath.length ? routerPath.join('.') : '<root>';
  const authentication = readProperty(access, 'authentication');
  if (authentication === 'optional') {
    throw new Error(`${OPTIONAL_AUTHENTICATION_ERROR}: ${procedureName}`);
  }

  const audience = readProperty(access, 'audience');
  if (audience !== undefined && audience !== 'internal') {
    throw new Error(`${UNKNOWN_AUDIENCE_ERROR}: ${procedureName}`);
  }
  if (audience === 'internal' && authentication === 'none') {
    throw new Error(`${PUBLIC_INTERNAL_ERROR}: ${procedureName}`);
  }

  const authorization = readProperty(access, 'authorization');
  return Object.freeze({
    authentication: authentication === 'none' ? 'none' : 'required',
    requiredScopes: readStringList(readProperty(authorization, 'scopes')),
    requiredRoles: readStringList(readProperty(authorization, 'roles')),
    ...(audience === 'internal' ? { audience } : {}),
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

/** Compiles an OpenAPI path template the way oRPC's matcher reads it. */
function compilePathPattern(path: string): RegExp {
  let source = '';
  let index = 0;
  for (const match of path.matchAll(/\{(\+?)[^{}]+\}/g)) {
    const literal = escapeRegExp(path.slice(index, match.index));
    // `{+name}` is oRPC's multi-segment wildcard. It also absorbs its leading slash so the empty
    // remainder matches too: that only widens the guard, whatever the router version does.
    // `{name}` is exactly one segment.
    source += match[1] && literal.endsWith('/')
      ? `${literal.slice(0, -1)}(?:/.*)?`
      : `${literal}${match[1] ? '.*' : '[^/]+'}`;
    index = match.index + match[0].length;
  }
  source += escapeRegExp(path.slice(index));
  return new RegExp(`^${source}/?$`);
}

function joinPath(prefix: string, path: string): string {
  const normalizedPrefix = normalizePath(prefix);
  const normalizedPath = normalizePath(path.replace(/\/{2,}/g, '/'));
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
