# Plan & Design — READY FOR REVIEW

Scope: issue #2290, milestone 0.0.9 group D1. Archetype 2 Integration for the auth adapter,
with the Service overlay. The enclosing service runtime is unchanged; exercise its real in-process
Hono/oRPC request pipeline rather than start Aspire or the forbidden local scaffold runtime suite.

## Locked decisions

1. Extend the existing `AuthzDecision` denied branch with optional typed `code`:
   `procedure_not_found` or `procedure_retired`, with named public constants and derived type.
   Middleware preserves existing permission-denial 403 shapes and maps only these codes to
   404 NOT_FOUND or 410 GONE, adding a stable `code` field. Ordinary denials stay 403.
2. Add `ContractAuthorizerOptions.retiredPaths: readonly string[]`. Paths are exact mounted
   absolute paths, all methods, query ignored; reject noncanonical, encoded, wildcard, parameter,
   query/fragment, backslash, whitespace, dot segments, and duplicate declarations at construction.
   Snapshot into a Set once. No prefixes or implicit REST/RPC alias expansion.
3. Active REST/RPC/alias/deprecated procedure matching, declared raw policies, and internal
   guards precede retired lookup. The shared resolver marks a retired path as authentication
   required, even outside protect prefixes; a `retired?: true` tag lets authorization return 410.
   Unmatched guarded authenticated requests get 404, anonymous requests retain their existing
   401. Outside protected coverage, undeclared requests keep current behavior.
4. Existing fallback is consulted only for matched metadata-less procedures; never for retired or
   unknown paths. No retired handler is invoked; this is an error seam, not a compatibility shim.
5. Generated HTTP consumers can branch on JSON code; SDK regeneration or a new client error
   abstraction is deferred because the middleware owns this error before contract dispatch.

## Slices

0. Bootstrap this run and draft PR; plan artifacts only. Gate: independent PLAN-EVAL PASS.
1. Implement public types/constants/options, retirement compiler, resolver, middleware mapping;
   add HTTP and direct-authorizer regression tests and update superseded unknown-path assertions.
   Update authz tutorial, service reference, README and CHANGELOG. Files: declared service auth
   sources, two public manifests, tests/auth, and the named docs. Gate: structured check/test/lint/
   fmt, quality:gate, doc lint, JSR audit, member publish dry-run and negative control. Independent
   slice/implementation review before commit, then push and comment with evidence.
2. Evidence/handoff reconciliation if needed; run artifacts only unless evaluator blockers require
   scoped fixes. Mark ready after no-blocker review, inspect CI state without waiting, answer all
   review threads, and final independent review of the exact pushed head. No merge or labels.

## Risks and mitigations

- Route disclosure: authentication precedes typed response; test anonymous/malformed credentials,
  standalone authz missing principal, and retired paths outside protect coverage.
- Retirement shadowing live authorization: current projection/raw/internal precedence wins; test it.
- Encoding ambiguity: retired exact lookup uses raw pathname; validate declaration and test variants.
- Generic denial regression: keep existing 403 body and exception behavior; run existing auth tests.
- Publication: new surface is explicit and documented; use existing service slow-type allowance.
- Broad baseline gate failures: record command failures truthfully, compare baseline where needed,
  avoid unrelated changes and never suppress checks to manufacture green.

Open decisions: none requiring implementation rework. Parameterized retirement and SDK-specific
upgrade UI are safe to defer. No accepted architecture debt is introduced.

Expected broader gates: quality:gate (quality scan, dependency checks, doctrine), service doc lint,
JSR audit and member publish:dry-run. Scoped wrappers cover source and auth tests. Runtime wiring
changes require the coordinator-armed e2e-cli CI verdict; do not run local scaffold.runtime.
