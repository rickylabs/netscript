/**
 * Validation and compilation of raw routes declared to the contract-policy authorizer.
 *
 * @module
 */

import { normalizePath } from './contract-path.ts';
import type { ProcedureAccessPolicy } from './contract-policy.ts';
import type { ContractAuthorizerRawRoute } from '../options.ts';

const INVALID_RAW_ROUTE_ERROR = '[netscript.service.contract-policy] invalid raw route';
const NON_EXACT_PATH_SYNTAX = /[*:{}?#]/;

/**
 * Compiles raw-route declarations into exact-path, authentication-required policies.
 *
 * @throws {Error} When a path is not exact and absolute, repeats, or authentication is not required.
 */
export function compileRawRoutes(
  routes: readonly ContractAuthorizerRawRoute[],
): ReadonlyMap<string, ProcedureAccessPolicy> {
  const compiled = new Map<string, ProcedureAccessPolicy>();
  for (const route of routes) {
    const path = readRawRoutePath(route);
    if (route.authentication !== 'required') {
      throw new Error(`${INVALID_RAW_ROUTE_ERROR}: ${path} must require authentication`);
    }
    if (compiled.has(path)) {
      throw new Error(`${INVALID_RAW_ROUTE_ERROR}: ${path} is declared more than once`);
    }
    compiled.set(
      path,
      Object.freeze({
        authentication: 'required',
        requiredScopes: freezeStrings(route.authorization?.scopes),
        requiredRoles: freezeStrings(route.authorization?.roles),
      }),
    );
  }
  return compiled;
}

function readRawRoutePath(route: ContractAuthorizerRawRoute): string {
  const path = route.path;
  if (typeof path !== 'string' || !path.startsWith('/') || NON_EXACT_PATH_SYNTAX.test(path)) {
    throw new Error(`${INVALID_RAW_ROUTE_ERROR}: ${String(path)} is not an exact absolute path`);
  }
  return normalizePath(path);
}

function freezeStrings(values: readonly string[] | undefined): readonly string[] {
  return Object.freeze((values ?? []).filter((value) => typeof value === 'string'));
}
