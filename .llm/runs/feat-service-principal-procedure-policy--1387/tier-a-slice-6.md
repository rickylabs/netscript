# Tier-A — #1387 Slice 6 (OpenAPI access projection, behavior)

**Content head:** `11e83f06426469b48a67c2211d954ac916cd6fda`
**Evidence head:** `2d3c148d174da9c8e73cc86565eecba08e47fbb3` — product-neutral
**Base:** `0dc715633` · **Verdict:** ACCEPTED

## Ceiling

Two of three authorized files touched (`openapi.ts`, `handlers_test.ts`); `contract-authorizer_test.ts`
correctly untouched — its existing test already proves runtime `optional` rejection, and this slice
only concerns generated docs. `deno.lock` byte-identical. Corpus unchanged (7 654 symbols, same as
Slice 5's end state) — the expected result for a slice that changes an existing function's runtime
output, not its exported type signature.

## Substance — LD-9's exact mapping, verified against the code

`indexProcedureAccess` uses oRPC's own public `traverseContractProcedures` (research finding 10's
pointer, followed rather than reinvented) to build a lookup keyed by both `operationId` and
`method+path`, tolerating either REST-style or RPC-fallback operation naming. `projectProcedureAccess`
then, per operation:

- `none` → `security: []`.
- `required` → `security: [{ bearerAuth: [...scopes] }]`, roles into `x-netscript-roles`.
- `optional` → `security: [{}, { bearerAuth: [] }]` — present in the docs **despite** LD-8 rejecting it
  at runtime construction. This slice does not touch that rejection; it only makes the declaration
  visible, exactly as research requires.
- No metadata → **no mutation at all**; the operation is returned exactly as the generator produced
  it (verified by `Object.hasOwn(operation, 'security') === false` in the test, which is the only
  assertion that can tell "no key" from "key present and falsy").

**Preservation is proven, not assumed.** The bearer security scheme is added via
`spec.components?.securitySchemes?.[BEARER_SECURITY_SCHEME] ?? { type: 'http', scheme: 'bearer' }` —
an existing user-supplied scheme is kept, a default is supplied only when absent. The single test
covers all four access states in one spec and additionally exercises a custom `operationId`, a
`.route({ spec: ... })` override adding `summary` and `x-user-field`, and asserts both survive
verbatim alongside the injected `security`/`x-netscript-roles` — proving this is additive
post-processing, not a rewrite.

## Gate results — all at content head `11e83f064`, `gitHead == actualGitHead`

| Gate | Outcome | Duration |
| --- | --- | --- |
| `check` (scoped) | PASS | 412 ms |
| `lint` (scoped) | PASS | 488 ms |
| `fmt:check` (scoped) | PASS | 405 ms |
| `test` (service) | PASS — **102 passed / 0 failed** | 5 785 ms |
| `doc:lint` | PASS | 470 ms |
| `quality:gate` | PASS | 7 845 ms |
| `mcp-export-corpus` | PASS, unchanged at 7 654 symbols | 6 919 ms |
| `publish:dry-run` | PASS | 30 619 ms |

Evidence set **SUFFICIENT**, zero reasons. Slices 1–5 archives present and untouched.

## Findings

None. This slice is clean, additive, and every locked mapping is verified by direct assertion rather
than a happy-path spec dump.

## Verdict

**ACCEPTED.** Ceiling respected exactly, lock and corpus unchanged as expected, all eight receipts
PASS, evidence set sufficient. LD-9's mapping is implemented exactly as specified and proven against
all four access states plus explicit preservation of user-supplied operation fields.
