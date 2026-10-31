/** Exact retired-path declarations and their authentication-required policy. @module */

import type { ProcedureAccessPolicy } from './contract-policy.ts';

const INVALID_RETIRED_PATH = '[netscript.service.contract-policy] invalid retired path';
const NON_EXACT_PATH_SYNTAX = /[%*:{}?#\\\s]/;

/** Retired declarations must authenticate before exposing their availability. */
export const RETIRED_PROCEDURE_POLICY: ProcedureAccessPolicy = Object.freeze({
  authentication: 'required',
  requiredScopes: Object.freeze([]),
  requiredRoles: Object.freeze([]),
});

/** Snapshots canonical exact paths once; invalid or duplicate paths fail at construction. */
export function compileRetiredPaths(paths: readonly string[]): ReadonlySet<string> {
  const compiled = new Set<string>();
  for (const path of paths) {
    if (
      typeof path !== 'string' || !path.startsWith('/') || NON_EXACT_PATH_SYNTAX.test(path) ||
      path.includes('//') || (path !== '/' && path.endsWith('/')) ||
      path.split('/').some((segment) => segment === '.' || segment === '..')
    ) {
      throw new TypeError(`${INVALID_RETIRED_PATH}: ${String(path)} is not a canonical exact path`);
    }
    if (compiled.has(path)) {
      throw new TypeError(`${INVALID_RETIRED_PATH}: ${path} is declared more than once`);
    }
    compiled.add(path);
  }
  return compiled;
}
