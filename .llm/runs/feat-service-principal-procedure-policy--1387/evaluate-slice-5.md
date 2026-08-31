# IMPL-EVAL — #1387 Slice 5 (contract-policy adapter and middleware binding)

**Evaluator:** Claude, separate session, opposite family to the Codex author (per
`workflow/lane-policy.md` native opposite-family route; recorded route: OpenRouter DeepSeek V4 Flash
IMPL preset).
**Certified content head:** `c2cbfbf0b3c355682732be5805f0f180498576db`
**Evidence head:** `00cfde5d7101a4b5424639530c09da875dbe726b` (verified product-neutral: `git diff
c2cbfbf0b..00cfde5d7 -- packages plugins docs templates` empty; only the evidence-set and Tier-A
commit touched run artifacts).
**Base:** `de4089573` (the D-9 ceiling amendment).
**Verdict:** **ACCEPTED_WITH_FINDINGS** at `c2cbfbf0b3c355682732be5805f0f180498576db`.

## What was verified (independently re-run at the content head)

| Claim | Method | Result |
| --- | --- | --- |
| Ceiling — 12 authorized files | `git diff --name-status de4089573..c2cbfbf0b` | exactly the 12 authorized product files + the corpus carrier (`mcp/.../export-surface-corpus.generated.ts`) under the plan's regeneration exception — no breach |
| `contract-policy.ts` untouched is correct | diff + surface read | byte-identical; the behavior slice implements ports Slice 4 already defined (`ContractPolicyAuthorizerPort`, `ProcedurePolicyResolver`, `ContractAuthorizerOptions`) — no type change was needed |
| `deno.lock` | `sha256sum` of base vs content | `edfa0c24…` both, byte-identical |
| LD-8 construction-time throw | call-path trace | `createContractAuthorizer` → `compileProcedures` (**line 56, synchronous, before the port object returns**) → `traverseContract` → `normalizePolicy` (**lines 141–144**) throws `[netscript.service.contract-policy] optional authentication is unsupported: <name>` on `authentication === 'optional'`. Not on first request, not in `build()` |
| LD-8 negative test | read + run | name is exactly `createContractAuthorizer rejects optional authentication during construction` (`contract-authorizer_test.ts:27`); passes at head (auth suite ok #18). Counterfactual: removing the throw makes `normalizePolicy` return a `'required'` policy and construction succeed, so `assertThrows` fails — the test is coupled to the throw itself |
| LD-6 as an ordering property | code trace + test | `authorize()` reaches the fallback **only** via `if (!resolution.policy)` (`contract-authorizer.ts:75–83`); matched-procedure returns at lines 85–93 untouched. Test `contract metadata wins when fallback authorization disagrees` asserts `fallbackCalls === 0` after two decisions the fallback would have made oppositely (deny a public path, allow a missing-scope path) — a non-consultation proof, not an override proof |
| LD-6 deny-regardless-of-`denyByDefault` | code trace + test | `contract-authorizer.ts:81–82` keys solely on `fallbackResult.matched`; `scope-authorizer`'s `authorizeMatch` (lines 48–62) never reads `denyByDefault`. Test `contract authorizer uses fallback only when matched procedure metadata is absent` configures `denyByDefault: false` and still denies the unmatched RPC path with `authz.no-matching-rule`. General case holds structurally, not by coincidence |
| LD-7 one resolver, both stages | code + tests | `installAuth()` calls `bindContractPolicy()` **once** (`service-builder-impl.ts:455`) and passes the same `policyResolver` const into both `createAuthnMiddleware` and `createAuthzMiddleware` (lines 458/464–473). Middleware test `one contract resolver…` asserts `resolverCalls === 2`, `authenticatorCalls === 0`, `authorizerCalls === 0` — proven claim (authn+authz short-circuit before the underlying ports; exactly one resolver consultation per stage). See E-2 for the exact scope of what this test does and does not isolate |
| Rename continuity + actual bind paths | test trace | Dispatch test binds non-default `apiPath: '/rest'`, `rpcPath: '/transport'`, alias `/legacy-rpc`, deprecated remap `/transport/v0 → /transport/v1`, and resolves the **renamed** router key `v1.renamedRead` through all four mounts; negative `/transport/v1/readItem → {matched:false}` proves router keys rather than hardcoded originals. Builder test re-runs the same mounts through the real builder with status codes 200/200/200/401/403/200 |
| `createScopeAuthorizer` widening | type + test | returns `MatchAwareAuthorizerPort` which **extends** `AuthorizerPort` (`types.ts:107`) — subtype→supertype assignment, backward-compatible. Slice 4's `type-assignability_test.ts:73` (`const standaloneAuthorizer: AuthorizerPort = createScopeAuthorizer({ rules: [] })`) still compiles at this head: scoped check 0 diagnostics / 48 files, and the file's two tests pass (#100/#101 in the full 101-test suite) |
| Scoped check/lint/fmt | receipts + re-run | receipts at head: check 1 344 ms / lint 477 ms / fmt-check 412 ms, all 0 findings; I re-ran `run-deno-check.ts --root packages/service` cold → 0 diagnostics |
| Service tests | receipt + re-run | receipt: 101 passed / 0 failed, 4 244 ms; I re-ran the full suite → 1..101 all ok |
| quality gate | receipt | PASS, 7 272 ms; `quality:scan` + `arch:check`, FAIL=0 (pre-existing WARNs only) |
| publish dry run | receipt | PASS, 28 587 ms; 342 KB stderr ending `Success Dry run complete` (stdout 0 bytes is normal for the task) |
| mcp-export-corpus | receipt | PASS, 6 063 ms, 7 654 symbols; corpus carrier regenerated to add `createContractAuthorizer` for `.` and `./auth` |
| Service JSR audit | worklog claim + own re-run | plan-named stop; no durable receipt (see E-1); I independently ran `audit-jsr-package.ts --root packages/service` at head → `dry-run: OK slowTypeWarnings=1`, one sanctioned oRPC-bound INFO — matches the worklog's claim exactly |
| Receipts integrity | each receipt inspected | all 7 top-level receipts `gitHead == actualGitHead == c2cbfbf0b`, correct `argv` per gate, positive `durationMs`, PASS outcome — never exitCode alone |
| Slices 1–4 archive | git + filesystem | `slice-1-2ddd6048`, `slice-3-c297064aa`, `slice-4-9cc8c4c5f` receipts all at their named slice head; `slice-2-f9b32b4f` mostly at `f9b32b4f` with 3 gates legitimately re-run at `04d22e7e` (its IMPL-EVAL-follow-up commit), each internally `gitHead == actualGitHead`. The Slice 5 evidence commit only **added** the 8 top-level Slice 5 receipts; the Tier-A commit touched nothing in receipts — archived sets intact and untouched |
| No blocking quality patterns | diff scan | no `as unknown as`, no `deno-lint-ignore`, no `: any` introduced in the slice |

## Ruling on the tier-a findings

- **F-1 (resolver consulted twice per authz stage):** confirmed, genuinely **harmless** — see below.

## Evaluator findings (all non-blocking)

- **E-1 (process, evidence capture).** The service JSR audit is named in the plan's Slice 5 Tier-A
  stop but has **no durable receipt** and is absent from `receipts/evidence-set.json`
  `expectedGateIds`. The worklog asserts it ran as an exact direct command. This matches a
  run-wide convention (Slices 1–4 make the same claim with no receipts; Slice 1's worklog explains
  the runner catalog does not expose `audit-jsr-package` as a gate ID and names the receipted
  `publish:dry-run` as the durable publishability backstop). Not blocking: I independently re-ran the
  audit at the exact content head and it passes. Recommendation: if the plan continues to name JSR
  audits in Tier-A stops, capture them as receipts (catalog gate ID or dedicated receipt file) so the
  evidence contract and the stop list agree.
- **E-2 (test-sensitivity observation, LD-7).** The middleware test's `resolverCalls === 2` proves
  the *middleware layer* consumes one injected resolver exactly once per stage and short-circuits
  before `authenticator`/`authorizer`. It does **not** go through the builder; and a hypothetical
  regression where `installAuth()` called `.bind()` twice would return two deterministically
  identical resolver objects whose behavior produces the same status codes in the builder test — so
  that specific sharing-bug variant is not isolated by the current tests. The actual code satisfies
  LD-7 directly (single `bindContractPolicy()` call, one `policyResolver` const passed to both
  middlewares — `service-builder-impl.ts:455-473`), and the builder test *would* catch an asymmetric
  drop (resolver missing on authn turns the expected 403 into a 401 missing-principal). Observation
  only; no defect exists to fix.
- **E-3 (archival note, pre-Slice-5).** The Slice 2 archive holds 3 receipts at `04d22e7e` (its
  IMPL-EVAL follow-up commit) rather than `f9b32b4f`; internally consistent and attributable to
  Slice 2's own history — noted for completeness, not a Slice 5 issue.

## F-1 ruling — resolver consulted twice per authorized path: genuinely harmless, no follow-up

Trace at the content head:

1. Authn middleware resolves (`auth-middleware.ts:40`, `resolvePolicy`) → decides short-circuit.
2. Authz middleware resolves (`auth-middleware.ts:93`) → decides public-procedure/unguarded bypass.
3. If authorization is reached, `options.authorizer.authorize(...)` (line 110) — and the contract
   authorizer's own `authorize()` calls its stored `resolver.resolve()` again
   (`contract-authorizer.ts:70`).

So a *required* contract-bound request resolves three times total (authn, authz middleware, authorize
internal); a *public* one resolves twice (authn, authz middleware, no authorize). The authz stage
performs two resolutions because the middleware short-circuit and the port decision are structurally
separate — the authorizer cannot assume a middleware already resolved. The resolver is a pure,
synchronous lookup over a frozen in-memory map built once at bind; state is immutable between the
two resolutions, so there is no correctness hazard, only one extra hash lookup per guarded request.

**Ruling:** harmless. Not worth a follow-up issue; a one-line comment noting the double-resolve could
be added if this path ever becomes hot, but no action is required for Slice 5 acceptance.

## Not run

`e2e:cli`, `scaffold.runtime`, Aspire, Docker, or browser gates — prohibited for this lane; no
runtime lease held or acquired. The brief's ceiling is behavior-validated through the service unit
suite, which exercises real Hono requests through the builder (100/101 tests are subscripted Hono
`app.request` flows).

## Verdict

| Field | Value |
| --- | --- |
| Verdict | **ACCEPTED_WITH_FINDINGS** |
| Certified head | `c2cbfbf0b3c355682732be5805f0f180498576db` (content), `00cfde5d7101a4b5424639530c09da875dbe726b` (evidence, product-neutral) |
| Rationale | All locked decisions (LD-6, LD-7, LD-8) verified against the code and by independently passing tests; ceiling respected exactly (12 files, `contract-policy.ts` correctly untouched for a behavior slice, corpus carrier per the regeneration exception); `deno.lock` byte-identical; all 7 receipts at the exact content head, verified by `argv`/`durationMs`/`gitHead`, never exitCode alone; Slices 1–4 archives intact and untouched; the widening return type is backward-compatible and Slice 4's assignability test still compiles and runs. The three findings are non-blocking: a receipt-capture convention gap for the plan-named JSR audit (independently re-run green here, `publish:dry-run` backstops publishability), a test-sensitivity observation on the LD-7 sharing property, and a pre-existing Slice 2 archival note. F-1 is confirmed genuinely harmless. |