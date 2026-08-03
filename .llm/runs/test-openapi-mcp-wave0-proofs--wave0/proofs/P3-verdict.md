# P3 verdict — auth-guarded spec fixture

## Verdict

`PASS`

The existing focused fixture executed against the current branch and passed all three required
branches in one live `preset-auth` service lifecycle: missing credentials returned the exact 401
JSON envelope, a credential missing `docs:read` returned the exact 403 JSON envelope, and a
credential carrying `docs:read` reached `/api/openapi.json` with status 200. Nothing was skipped.

The authorized branch proves reachability when the configured policy permits the request. The
fixture asserts only its 200 status, so this verdict does not add an unsupported claim about the
success-body shape.

## Ratified wording

`spec_unavailable: OpenAPI document could not be fetched. The spec route may require authentication; allow anonymous access to the OpenAPI route (for NetScript auth, add /api/openapi.json to auth.authn.allowAnonymous) or provide a reachable public spec URL.`

The 401 case maps to the generic phrase “may require authentication”: a credential-free fetch can be
rejected before the document is returned. The 403 case shows the narrower authorization form of the
same operator-visible symptom: an authenticated request can still be denied when the configured
matcher covers the spec route and the principal lacks its required scope. The authorized 200 case
shows that the route itself remains reachable when policy permits it. Therefore the guidance names
two configuration-level remedies for a credential-free MCP spec fetch—exempt the NetScript spec
route or supply a reachable public spec URL—without weakening auth, adding a new product envelope,
or implying authenticated-spec support exists in the later production feature.

## Evidence

- Fixture command:
  `deno test --allow-all --frozen packages/service/tests/auth/define-service-auth_test.ts --filter 'defineService auth option enforces 401, 403, and 200'`
- Result: exit 0; `1 passed`, `0 failed`, `1 filtered out`; selected test 46 ms, runner 53 ms.
- Normalized record: `proofs/evidence/P3-auth-fixture.json`.
- Fixture attribution: repository head `5b0ba26b5bd4be87288d981cdb951c978618ca6e`, fixture blob
  `090f1b73803a6ffddaed494885f0c1d56152d7a7`, assertions at lines 60–78.

This implementation verdict does not claim #1129 acceptance and does not issue an IMPL-EVAL
disposition. It stops for separate supervisor/Fable review.
