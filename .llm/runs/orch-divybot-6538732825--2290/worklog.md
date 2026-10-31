# Worklog

## Design

1. Public surface: `createContractAuthorizer(contract, { retiredPaths })`, `AuthzDecision.code`,
   `PROCEDURE_ERROR_CODES`, derived `ProcedureErrorCode`; existing root and auth subpaths.
2. Domain vocabulary: missing procedure (404 `procedure_not_found`), retired procedure (410
   `procedure_retired`), exact mounted retired path, resolver retirement marker.
3. Ports: existing AuthenticatorPort, AuthorizerPort and ProcedurePolicyResolver; Hono is the HTTP
   adapter. Composition root stays the service builder. No new port or external IO.
4. Constants: PROCEDURE_ERROR_CODES for stable wire values; internal frozen retired auth policy
   and retirement validation error prefix. No new lifecycle or resource ownership.
5. Commit slices: bootstrap; cohesive implementation+tests+docs proven by scoped and broad gates;
   evidence handoff. See plan.md for exact file surface and validation.
6. Deferred: parameterized retired routes, automatic alias retirement, SDK-specific UI/errors,
   scaffold changes and local E2E; no requirement needs these.
7. Contributor path: packages/service/src/auth/contract/contract-authorizer.ts shows resolution
   precedence and links the retirement compiler. README explains application declaration.

## Routing owner override

Verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both in a separate session with
claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.”
Matrix feature lookup completed; this explicit grant selects the evaluator, not an inferred
fallback. Generator and evaluator remain separate sessions and vendor families.

## Bootstrap

Read assignment in full. Specific operator directives take precedence over contradictory generic
footer guidance: PR starts with Refs, no closing keyword; no labels or milestones; canonical final
uses the excluded report handoff. No implementation before PLAN-EVAL PASS.
