/**
 * Contract traversal and projection-path matching shared by the contract-policy authorizers.
 *
 * A procedure is served on two projections: the RPC mount (by router path) and the OpenAPI mount
 * (by `route.path`, or by the router path when the contract declares none, with oRPC's default
 * method). The index selects the procedure the same way oRPC's handlers do, so a policy declared
 * on a procedure cannot be bypassed through the projection or route that was not considered:
 *
 * - it matches the undecoded request pathname and strips mounts exactly as the oRPC handlers do;
 * - RPC keys are oRPC's `toHttpPath()` of the router path;
 * - OpenAPI routes are registered in a `rou3` router (the router oRPC's OpenAPI matcher uses) with
 *   oRPC's `toRou3Pattern()` and default method, so static, parameter, and wildcard precedence is
 *   the upstream precedence rather than declaration order.
 *
 * @module
 */

import { toHttpPath } from '@orpc/client/standard';
import { fallbackContractConfig, type HTTPMethod } from '@orpc/contract';
import { toRou3Pattern } from '@orpc/openapi/standard';
import { addRoute, createRouter, findRoute } from 'rou3';
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
const AMBIGUOUS_ROUTE_ERROR =
  '[netscript.service.contract-policy] procedures with different access share an OpenAPI route';

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
  /** OpenAPI `rou3` route pattern relative to the API mount, derived exactly as oRPC does. */
  readonly restPattern: string;
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
 *   anonymous internal audience, or when procedures with different access share one OpenAPI route
 *   (oRPC would then select by router key order, which the contract cannot see).
 */
export function compileProcedures(contract: ContractPolicyContract): readonly IndexedProcedure[] {
  const procedures: IndexedProcedure[] = [];
  traverseContract(contract, [], (procedure, routerPath) => {
    const route = readProperty(procedure['~orpc'], 'route');
    procedures.push({
      routerPath,
      restMethod: fallbackContractConfig('defaultMethod', readHttpMethod(route)),
      restPattern: toRou3Pattern(readHttpPath(route) ?? toHttpPath(routerPath)),
      policy: normalizePolicy(procedure, routerPath),
    });
  });
  assertUnambiguousRoutes(procedures);
  return Object.freeze(procedures);
}

/** Binds compiled procedures to the service's actual projection mounts. */
export function bindProcedureIndex(
  procedures: readonly IndexedProcedure[],
  binding: ContractPolicyBindingOptions,
): ProcedureIndex {
  // The RPC handlers are registered for the primary mount first, then each distinct alias.
  const rpcMounts = [...new Set([binding.rpcPath, ...(binding.rpcAliases ?? [])])]
    .map(toMountPrefix);
  const apiMount = toMountPrefix(binding.apiPath);
  const rpcProcedures = new Map<string, IndexedProcedure>(
    procedures.map((procedure) => [toHttpPath(procedure.routerPath), procedure]),
  );
  const restRoutes = createRouter<IndexedProcedure>();
  const internalRoutes = createRouter<IndexedProcedure>();
  for (const procedure of procedures) {
    addRoute(restRoutes, procedure.restMethod, procedure.restPattern, procedure);
    if (procedure.policy?.audience === 'internal') {
      addRoute(internalRoutes, '', procedure.restPattern, procedure);
    }
  }

  return Object.freeze({
    find(request: ProcedurePolicyRequest): IndexedProcedure | undefined {
      const rpcPathname = remapDeprecatedRpcPath(request.path, binding);
      for (const mount of rpcMounts) {
        const relative = stripMount(rpcPathname, mount);
        const procedure = relative === undefined ? undefined : rpcProcedures.get(relative);
        if (procedure) return procedure;
      }

      // An RPC miss falls through to the OpenAPI handler, whose mount usually encloses RPC.
      const relative = stripMount(request.path, apiMount);
      if (relative === undefined) return undefined;
      return findRoute(restRoutes, request.method, relative)?.data ??
        // oRPC serves nothing for a method no procedure declares on this path (HEAD, extension
        // methods). Fail closed toward an internal procedure on the path all the same.
        findRoute(internalRoutes, '', relative)?.data;
    },
  });
}

/** Rejects contracts where oRPC's choice between same-route procedures would decide access. */
function assertUnambiguousRoutes(procedures: readonly IndexedProcedure[]): void {
  const routes = new Map<string, IndexedProcedure>();
  for (const procedure of procedures) {
    // Parameter names do not affect matching: `/items/:id` and `/items/:slug` are one route.
    const key = `${procedure.restMethod} ${
      procedure.restPattern.replace(/\/(\*\*)?:[^/]+/g, '/$1:')
    }`;
    const existing = routes.get(key);
    if (existing && !samePolicy(existing.policy, procedure.policy)) {
      throw new Error(
        `${AMBIGUOUS_ROUTE_ERROR}: ${existing.routerPath.join('.')}, ${
          procedure.routerPath.join('.')
        }`,
      );
    }
    routes.set(key, existing ?? procedure);
  }
}

function samePolicy(
  left: ProcedureAccessPolicy | undefined,
  right: ProcedureAccessPolicy | undefined,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

/** Normalizes a mount path the way the oRPC handlers normalize their `prefix` option. */
function toMountPrefix(path: string): string {
  return path.replace(/\/$/, '');
}

/**
 * Returns the handler-relative path oRPC matches for a mount, or undefined outside the mount.
 * Mirrors the oRPC standard handlers: a prefix check on the undecoded pathname, removal of the
 * prefix, then one leading and one trailing slash trimmed.
 */
function stripMount(pathname: string, mount: string): `/${string}` | undefined {
  if (mount && !pathname.startsWith(`${mount}/`) && pathname !== mount) return undefined;
  const remainder = mount ? pathname.replace(mount, '') : pathname;
  return `/${remainder.replace(/^\/|\/$/g, '')}`;
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

function normalizePath(path: string): string {
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
}

function isWithinPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(prefix === '/' ? '/' : `${prefix}/`);
}

function readProperty(value: unknown, property: string): unknown {
  return typeof value === 'object' && value !== null ? Reflect.get(value, property) : undefined;
}

function readStringProperty(value: unknown, property: string): string | undefined {
  const result = readProperty(value, property);
  return typeof result === 'string' ? result : undefined;
}

const HTTP_METHODS: readonly HTTPMethod[] = ['HEAD', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

function readHttpPath(route: unknown): `/${string}` | undefined {
  const path = readStringProperty(route, 'path');
  if (path === undefined) return undefined;
  // `toRou3Pattern()` standardizes slashes; only the leading slash must be present for its type.
  return path.startsWith('/') ? `/${path.slice(1)}` : `/${path}`;
}

function readHttpMethod(route: unknown): HTTPMethod | undefined {
  const method = readStringProperty(route, 'method');
  return HTTP_METHODS.find((candidate) => candidate === method);
}

function readStringList(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return Object.freeze(value.filter((item): item is string => typeof item === 'string'));
}
