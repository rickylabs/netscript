# Tier-A — #1387 Slice 5 (contract-policy adapter and middleware binding, behavior)

**Content head:** `c2cbfbf0b3c355682732be5805f0f180498576db`
**Evidence head:** `33b152b0272e2ecc285bd7cad9180b8635c07f6c` — product-neutral
**Base:** `de4089573` (the D-9 ceiling amendment) · **Verdict:** ACCEPTED

## Ceiling

11 of 12 authorized files touched (`contract-policy.ts` untouched, correctly — this is a behavior
slice, the types file needed no change) plus the corpus carrier. No breach. `deno.lock`
byte-identical.

## Substance — every locked decision verified against the code, not the plan's description of it

**LD-8, exact timing.** `createContractAuthorizer` calls `compileProcedures(contract)`
**synchronously, at the top of the function** — before returning the port object — so
`normalizePolicy`'s throw on `authentication === 'optional'` fires during construction, not on first
request. Verified by the negative test asserting the exact stable message
`[netscript.service.contract-policy] optional authentication is unsupported: optionalItem`, named
exactly as the plan required: `createContractAuthorizer rejects optional authentication during
construction`.

**LD-6, verified as an ordering property, not just an outcome.** `contract-authorizer.ts`'s
`authorize()` only reaches the fallback branch `if (!resolution.policy)` — when metadata exists, the
function returns before the fallback is ever referenced. The test
`contract metadata wins when fallback authorization disagrees` proves this the strong way: it counts
`fallbackCalls` and asserts **zero** after two decisions on metadata-bearing procedures, one of which
the fallback would have denied. This is a proof that the fallback is never *consulted*, not merely
that its answer is overridden.

**LD-6's "deny regardless of fallback's own `denyByDefault`."** Research states this explicitly; the
implementation matches it exactly — the contract authorizer denies with `authz.no-matching-rule`
whenever the fallback's `authorizeMatch` reports `{matched: false}`, irrespective of what the
fallback's own standalone `denyByDefault` would have done. The test
`contract authorizer uses fallback only when matched procedure metadata is absent` configures the
fallback with `denyByDefault: false` and still gets a deny on the unmatched RPC path — proving the
override is real, not accidentally matching by coincidence.

**LD-7, one resolver, proved by call count.** `installAuth()` calls `bindContractPolicy()` **once**
and passes the same `policyResolver` object literal into both `createAuthnMiddleware` and
`createAuthzMiddleware`. The middleware test
`one contract resolver makes a declared public procedure bypass authn and authz` asserts
`resolverCalls === 2` (one call per stage, same object) and `authenticatorCalls === authorizerCalls
=== 0` — a declared-public procedure never reaches either underlying port. A second test proves the
converse: a matched *required* procedure on a path **outside the legacy `/api` prefix** still forces
authentication — contract metadata governs independently of the old prefix guard, which is the whole
point of LD-7 (a declared public procedure must not be rejected by prefix logic before its own
metadata is consulted, and vice versa for a declared-required one outside the legacy prefixes).

**Rename continuity and actual-path binding, together.** The single test
`contract resolver dispatches REST, RPC, aliases, and renamed procedure keys` binds to
non-default paths (`/rest`, `/transport`, alias `/legacy-rpc`, a deprecated-route remap
`/transport/v0` → `/transport/v1`) and resolves the **same** renamed procedure (`v1.renamedRead`)
through all of REST, canonical RPC, the alias, and the deprecated prefix — proving both that the
resolver consults the builder's *actual* bound paths (LD-7) and that a router-key rename is
transparent to resolution (research finding 15, LD-11's rename-continuity requirement).

**`createScopeAuthorizer`'s widened return type is backward-compatible, not breaking.**
`ScopeAuthorizerOptions` is unchanged; the return type moved from `AuthorizerPort` to
`MatchAwareAuthorizerPort`, which **extends** `AuthorizerPort`. Every existing call site assigning the
result to `AuthorizerPort` still compiles (a subtype is assignable to its supertype) — this is exactly
what Slice 4's own test already proved would hold. `authorizeRequirements` is extracted so
`createContractAuthorizer` and `createScopeAuthorizer` share one scope/role decision function rather
than duplicating the logic — a real DRY improvement, not incidental.

## Gate results — all at content head `c2cbfbf0b`, `gitHead == actualGitHead`

| Gate | Outcome | Duration |
| --- | --- | --- |
| `check` (scoped) | PASS | 1 344 ms |
| `lint` (scoped) | PASS | 477 ms |
| `fmt:check` (scoped) | PASS | 412 ms |
| `test` (service) | PASS — **101 passed / 0 failed** | 4 244 ms |
| `quality:gate` | PASS | 7 272 ms |
| `mcp-export-corpus` | PASS | 6 063 ms |
| `publish:dry-run` | PASS | 28 587 ms |

Evidence set **SUFFICIENT**, zero reasons. Archives for Slices 1–4 present and untouched.

## Findings

- **F-1 (observation, non-blocking).** `auth-middleware.ts`'s `resolvePolicy` is called once per
  middleware stage from the shared `policyResolver`, and `contract-authorizer.ts`'s own `authorize()`
  re-resolves internally via its own stored `resolver`. For a contract-bound authorizer this means the
  request path resolves twice per stage that reaches authorization (once in the middleware to decide
  whether to short-circuit, once inside `authorize()` itself). Harmless — the resolver is a pure,
  synchronous lookup over an in-memory compiled table — but worth noting as a minor duplication if
  this path becomes hot.

## Verdict

**ACCEPTED.** Ceiling respected exactly (11/12 files, corpus carrier), lock unchanged, all seven
receipts PASS, evidence set sufficient. Every locked decision (LD-6, LD-7, LD-8) is verified against
call-count and message-content assertions rather than outcome-only tests, which is the standard this
lane has been holding evaluators to and the author met it independently.
