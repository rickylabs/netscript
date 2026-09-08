# PLAN-EVAL-2 — plugin-service-auth--1383 (composite plan after FAIL_FIX)

- Evaluator: Muse Spark (`opencode-go/muse-spark-1.3-contributor`), independent session — not generator session `7930bfda-966a-4a1c-aa82-53c07cd8116b` (Fable/Anthropic), not coordinator/author Astra (OpenAI). Composite authors are now **both** planner and coordinator; independence holds against both families/sessions.
- Authority: `matrix-plan-evaluator-2.json`, role `plan_evaluation`, tier `complex`, first route `muse_spark_1_3@max`, no fallback. Complex-tier authorization on record (`revision-dispatch.json`, milestone-coordinator rationale).
- Reviewed HEAD: `b3576e116` (exact; HEAD equals it, plan.md + plan-amendment-1.md stable since). Baseline `6d6b3057f` confirmed ancestor. First `plan-eval.md` FAIL_FIX preserved; this file is the second-round verdict only.
- Scope: `plan.md` (revision 2) **together with** `plan-amendment-1.md`, which explicitly supersedes conflicting revision-2 details. All other scope/gates carry over.
- Compliance: read-only evaluation. No product/plan edits, commits, pushes, GitHub changes, dispatches, AppHost starts, or releases. Cheap read-only source probes + `deno doc` only; no runtime rerun. Wrote only this file.

## Correction 1 (Q1: shared validator shape) — RESOLVED

Amendment replaces the exported discriminator with `assertServiceAuthPolicy(value: unknown): asserts value is ServiceAuthPolicy` in a **new** runtime module `service-auth-policy.ts`; types stay in `options.ts`. Verified: target file does not exist (no collision); `options.ts` is types-only today (zero runtime exports), so the old §3.1 "(types only, additive)" label contradiction is removed by the amendment's own words ("additive types AND runtime validation"). Co-location matches the module's existing structure (runtime guards live in sibling modules; `mod.ts` already mixes type + runtime exports). #1382 reuse is future-only, not implemented. Correction confirmed.

## Correction 2 (Q2: complete rejection table) — RESOLVED

The 9-row table covers: non-objects, reasonless/non-string/blank-reason public, non-literal-`true` markers (never fallback), both-keys contamination **including explicitly-`undefined` keys** (correct — `'authn' in policy` is `true` for explicit-undefined, verified live), missing/non-object `authn`, missing/non-callable `authenticate`, malformed `authz`, missing/non-callable `authorize`, plus the two acceptance rows. Every row matches native shapes: `AuthnOptions.authenticator` required [observed - `options.ts:24`], `AuthenticatorPort.authenticate` callable [observed - `types.ts:77`], `AuthzOptions.authorizer` required [observed - `options.ts:34`], `AuthorizerPort.authorize` callable [observed - `types.ts:98`]. "Never serialize the supplied policy" matches the redaction precedent. Every row is required through the JS boundary + soundness tests (amendment line 35). Correction confirmed.

## Correction 3 (Q3: procedure metadata + dual-transport proof) — RESOLVED

Wire-method rules are gone from D2 and all generated examples. The replacement is canonical: `access: { authentication: 'required', authorization: { scopes } }` from the existing `NetScriptProcedureMeta` vocabulary [observed - `packages/contracts/src/domain/procedure-meta.ts:29-56`], emitted via the existing `@netscript/contracts` `baseContract`/`oc.$meta` seam [observed - `contract-primitives.ts:148-160`] with the tutorial as the worked precedent [observed - `05-route-authz.md:75-123`]. The native `createContractAuthorizer` resolves **both** transports — RPC by router-path prefix map, REST by method+pattern [observed - `contract-authorizer.ts:170-196`] — bound through the builder's existing `bindContractPolicy` at `installAuth`, so no transport-prefix table, no fallback, unmatched/unmarked denied. D6 now requires the same read-only session to reach the generated list procedure through **both** REST GET and the native typed SDK over RPC (both 200), plus RPC path/method assertion through the native boundary (`resolveRpcWiringPaths` is exported and test-reachable), a write-scoped session 403 on both transports, anonymous/revoked 401, verifier-down 503. The invented write-route assertion is removed, matching the actual generated contract (list procedure only, verified at `new-plugin-use-case.ts:373-425`). Landed SDK/RPC proof patterns exist to copy (`session-credentials-http_test.ts`). Correction confirmed.

## Correction 4 (risk register) — RESOLVED

Amendment adds an 8-row register (likelihood + impact + mitigation/acceptance) covering exactly the load-bearing risks: RPC-read-as-write, ambiguous-policy-as-public, public-declarations-mistaken-for-completion, reason rot, generated-JSR unresolvability, anonymous-list health drop, generator metadata drift, required-field breakage. The previously failing plan-gate box now passes; all other boxes (research, decisions, sweep, slices, gates, deferred scope, jsr-audit) carry over from round 1.

## Plan-gate checklist (composite)

| Box | Result |
| --- | ------ |
| Research present and current | PASS (S1–S20 re-verified at `6d6b3057f` in round 1; unchanged) |
| Decisions locked (D1–D8 as superseded by amendment) | PASS |
| Open-decision sweep (§8 unknowns all safe-to-defer) | PASS |
| Commit slices S0–S6 | PASS |
| Risk register | PASS (amendment table) |
| Gate set selected | PASS |
| Deferred scope explicit (§7) | PASS |
| jsr-audit | PASS |

## Verdict

`PASS`

All four first-round corrections verify against native source. The composite plan (revision 2 + amendment 1) is coherent, bounded, executable through canonical wrappers, and honest about its boundaries (local-source proof only, no release, guarded first-party adoption stays open). Implementation may proceed after coordinator admission; IMPL-EVAL must be a separate session/family from both composite authors.

## Limits

Plan-only review. `scaffold.plugins`/`scaffold.runtime` execution, exact-head CI, any maintainer RFC request, and the owner-approved release enabling published-consumer resolution are downstream and unclaimed. No owner decision is outstanding.
