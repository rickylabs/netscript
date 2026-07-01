# PLAN-EVAL Verdict — Auth-Layer Quality-Hardening Track (S1–S6)

**Run:** 27880569184-1
**Branch:** `feat/prime-time/auth` (PR #86, umbrella: Auth-as-plugin)
**Track:** Auth-Layer Quality-Hardening (slices S1–S6, 12 high-severity findings on one root cause)
**Mode:** Plan-EVAL (separate evaluator session; no implementation)
**Verdict:** **PASS** — with 2 slice-time corrections and 2 minor scope confirmations

---

## Summary

The plan ratifies. The root-cause diagnosis (single oRPC `as unknown as AuthContractDefinition`
erasure at `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts:306–313`) is verified
against the code on this branch, and the S1–S6 decomposition correctly addresses every instance of
the same hand-rolled-widening pattern across the auth layer without leaving load-bearing debt
behind and without violating any cross-cutting constraint (no `@netscript/cli` touch, no
`deno.lock` mutation, no secrets in code, no `scaffold.runtime` E2E, per-slice IMPL-EVAL gates).

Two small plan-claim defects were found; both are corrections the implementation lane can fold
in cheaply without changing scope or dependency order. They are listed in the "Slice-time
corrections" section below and **do not block PASS**.

---

## Plan-Gate Responses

### Gate 1 — Root-cause diagnosis correctness

**Claim:** the oRPC contract→handler typing seam is erased at the contract package via
`as unknown as AuthContractDefinition` at `auth.contract.ts:~306`, forcing downstream
`os.router(authV1 as any)` / `router: any` / per-handler `try/catch → throwContractError`.

**Verified on branch:**
- `packages/plugin-auth-core/src/contracts/v1/auth.contract.ts:276-313` declares
  `AuthContractDefinition = Readonly<{...}>` as a hand-rolled structural shim (procedures, no
  `.handler()`, no errors, no `$context`). Line 313: `export const authContractV1: AuthContractDefinition = authContract;`
  — a `const`-typed export on the structural shim that erases the oRPC inferred type.
- `plugins/auth/services/src/routers/router.ts`:
  - `v1: any`, `auth: os.prefix(...).router(authV1 as any)`, `router: any` — the
    `authV1 as any` cast is exactly the symptom of upstream erasure.
- `plugins/auth/services/src/routers/v1-handlers.ts`:
  - Hand-rolled `AuthRouteOptions`/`AuthRouteHandler`/`AuthImplementedContract` shim interfaces
    at lines 28–50.
  - `implement(authContractV1 as unknown as Parameters<typeof implement>[0]) as unknown as AuthImplementedContract`
    (double `as unknown as`) at lines 51–52.
  - 5 inline `try/catch → throwContractError` blocks at lines 60–91 (and larger blocks at 106–127,
    153–169, 184–205, 261–266) — the per-handler error-wrapping that the central
    `ErrorHandlingPlugin` should own.
- The `declare-then-widen-with-a-cast` pattern repeats on `streams/mod.ts:111-115`
  (`authStreamSchema = defineStreamSchema(...) as unknown as StateSchema<AuthStreamDefinition>`)
  and on `domain/mod.ts` + `config/mod.ts` (`AuthDomainSchema`, `AuthConfigSchemaLike` shim
  interfaces that mirror the oRPC `StandardSchemaV1` shape by hand).

**Verdict:** Diagnosis correct. The cast at line 313 erases the oRPC inferred type; the
downstream `any` and per-handler `try/catch` are direct consequences.

### Gate 2 — S1 recipe fidelity vs. `sagasContractV1` and public-surface risk

**Claim:** mirror `sagasContractV1` shape; the `as unknown as` is centralized at the contract
package; consumers (`plugins/auth`, re-exports) see only a typed `$context` wrapper.

**Verified on branch:**
- `plugins/sagas/contracts/v1/sagas.contract.ts:648-659` is exactly the recipe exemplar:
  ```ts
  export const sagasContractV1: SagasContractV1 = implement(
    sagasContractDefinition,
  ) as unknown as SagasContractV1;
  ```
  where `SagasContractV1 = Readonly<{ $context: <TContext>() => SagasRouter }>`.
- Only `plugins/auth` consumes `@netscript/plugin-auth-core/contracts/v1`,
  `…/domain`, `…/config`, `…/streams`, `…/ports` (verified via `grep`). No external readers.
- Internal symbols exported by `auth.contract.ts` that the plan proposes to delete
  (`AuthContractSchema`, `AuthContractProcedureLike`, `StandardSchemaLike`, `AuthContractDefinition`)
  are **not consumed outside `packages/plugin-auth-core` and `plugins/auth`** — deleting them
  is a contained change within the workspace.

**Caveat:** the *named* input/response types (`SigninInput`, `SigninResponse`, …,
`MeResponse`) **are** used by consumers. The plan keeps those (it only deletes the shim
*interfaces* and the shim-typed `const authContractV1: AuthContractDefinition = …`). Keep those
typed exports; do not regress their re-export surface (`plugins/auth/contracts.ts:7`).

**Verdict:** Recipe fidelity confirmed; safe public-surface change within the workspace.
**No migration note required** for current consumers.

### Gate 3 — Dependency DAG correctness

**Claim:** S2 ⇒ S1, S6 ⇒ S2, S3/S4/S5 independent.

**Verified on branch:**
- S2 (handler-side) cannot adopt the `$context` wrapper until S1 (contract-side) exports it
  with the real inferred type — confirmed by the double `as unknown as` chain in v1-handlers.ts
  that only collapses once `authContractV1` is the real contract shape.
- S6 (composition seam) cannot replace `resolveBackend() as InteractiveAuthBackend` until S2
  has the typed `$context` providing the `errors.INTERNAL_CONTRACT_ERROR` etc. on the
  handler-bound context — `InteractiveAuthBackend`'s widening is currently needed precisely
  because `resolveBackend()` returns a `Partial<{...}>` from the kv-oauth boundary widening,
  which S3 also fixes. S6 also benefits from S3's structural-typing fix.
- S3 (kv-oauth boundary), S4 (wrap-don't-reinvent + crypto), S5 (Hono seam) have no inbound
  dependencies on S1/S2's outputs and no cross-dependencies on each other. ✓ Correct.

**File-ownership collisions:** none observed. Each slice touches a distinct directory under the
auth-layer surface area:
- S1: `packages/plugin-auth-core/src/{contracts/v1,domain,config,streams}/`
- S2: `plugins/auth/services/src/routers/`
- S3: `packages/auth-kv-oauth/src/`
- S4: `packages/auth-{workos,better-auth,plugin-auth-core}/src/`
- S5: `packages/service/src/auth/`
- S6: `plugins/auth/services/src/{init,routers}/` (composition seam — overlaps with S2 in
  `routers/`, but S6 should branch off the post-S2 tip, per the dependency).

**Verdict:** DAG correct. No collisions.

### Gate 4 — Archetype / gate-set correctness

**Claim:** S3/S4 backends are Archetype-2 (pure backend, no oRPC seam); S2/S6 are service
archetype; S1 is contract package; S5 is library seam.

**Verified on branch:**
- `packages/auth-workos/src/workos-backend.ts:75` (`createWorkosBackend(options): AuthBackendPort`)
  is the exemplar — no casts, returns `: AuthBackendPort`. S3/S4 backends should reach the same
  shape.
- `packages/plugin-auth-core` is a contract package (archetype: pure types + Zod schemas;
  zero runtime side effects). S1's compile-time contract test (assignability assertion on
  `authContractV1`'s `$context` and `errors`) is the correct gate.
- `plugins/auth/services/src/main.ts:65-109` (sagas exemplar) shows the service-archetype
  builder: `withRPC()`, ErrorHandlingPlugin mounted centrally, no per-handler try/catch. S2/S6
  adopt this pattern.
- `packages/service/src/auth` is a library seam consumed by other plugins. S5's Hono
  augmentation is a `declare module` edit — archetype-correct.

**Verdict:** Archetype assignment correct for every slice.

### Gate 5 — Slice scoping (too big / too small / reaching beyond bounds)

**Verified on branch:**
- **No slice touches `packages/cli`/`@netscript/cli`.** ✓ Constraint honored.
- **No slice touches `deno.lock`.** S4's HMAC lift is a pure refactor (same `crypto.subtle` API);
  S5's `declare module 'hono'` is type-only; S3's pruning is type-only — none change runtime
  dependencies. ✓ Constraint honored.
- **No secrets in code.** The HMAC `signSessionToken`/`verifySessionToken` block lifted by S4
  is the same crypto code already shipped; test factories stay in tests. ✓ Constraint honored.
- **No `scaffold.runtime` E2E required.** Each slice's gate is scoped `deno check`/lint/fmt +
  targeted tests. ✓ Constraint honored.

**Per-slice sizing assessment:**
- S1: appropriately bounded — one contract package, 4 shim interfaces + 1 cast + 1 duplicated
  schema + 1 compile-time test. Not too large.
- S2: appropriately bounded — one router file + one handlers file. Not too large.
- S3: tightly bounded — single backend file + dead-code prune. Not too small (the boundary
  fix has real value).
- S4: slightly large (3 packages), but the HMAC/error-class/cast lift is genuinely shared
  infrastructure; merging `signSessionToken`/`verifySessionToken`/`hmac`/`base64UrlEncode`/
  `base64UrlDecode` into one `plugin-auth-core` helper eliminates duplication by definition.
  Acceptable.
- S5: tightly bounded — `declare module` augmentation + 2 cast sites + export-map reconciliation.
- S6: appropriately bounded — one router file + one init file. The `InteractiveAuthBackend`
  dissolution is the substantive work.

**Verdict:** No slice is mis-scoped.

### Gate 6 — Debt: explicit deferrals and load-bearing deletions

**Defers:**
- `startAuthStreamMirror` no-op removal — folded into AS6 (not this track). The function lives
  at `plugins/auth/streams/producer.ts:145` and is called from `plugins/auth/services/src/main.ts:40`.
  Defer is appropriate (not a quality-bar issue; orthogonal to the seam-typing theme).
- `fill(7)`/`app.example.test` test-only confinement — folded into AS6. Appropriate.
- Version single-source, READMEs, manifest URLs — folded into AS6. Appropriate.
- **None of the deferred items are P0/P1 quality-hardening.** They are doctrine/legacy cleanup
  belonging to the AS6 leaf PR, not the auth-layer bar. **Acceptable.**

**Proposes to delete:**
- S1: `AuthContractSchema`, `AuthContractProcedureLike`, `StandardSchemaLike`, `AuthContractDefinition`
  shim interfaces, and `AuthConfigSchemaLike`, `AuthDomainSchema`, `AuthStreamSchema` shims.
  **Verified load-bearing check:** none of these names is imported outside `plugin-auth-core`/
  `plugins/auth`. Safe to delete.
- S1: duplicated `AuthSession` schema (one in `domain/mod.ts`, one in `streams/mod.ts`).
  **Verified:** both files define an `AuthSessionZodSchema` for the same type. Delete the
  streams-side copy and import from domain. Load-bearing check passes.
- S3: 6 dead error codes in `KvOAuthErrorCode` union. **Verified:** `state_mismatch`,
  `nonce_mismatch`, `id_token_invalid`, `refresh_failed`, `refresh_reuse_detected`,
  `session_not_found` are declared at `packages/auth-kv-oauth/src/errors.ts:5-12` but never
  thrown anywhere in `packages/auth-kv-oauth/src/`. Safe to prune.
- S3: `as AuthBackendPort & ReturnType<...>` widening cast. **Verified:** the four extra
  methods (`signIn`, `handleCallback`, `getSessionId`, `signOut`) are *only* used inside the
  kv-oauth flow itself; they are not used by `plugins/auth/services/src/routers/v1-handlers.ts`
  through `InteractiveAuthBackend`'s `Partial<{...}>`. Replacing with a named
  `KvOAuthBackend extends AuthBackendPort` interface is type-safe.

**Verdict:** No hidden debt; no load-bearing deletions.

---

## Slice-time corrections (fold into implementation, do not block PASS)

### Correction C1 — S5 scope clarification (the `as never` install-cast claim)

**Plan claim:** "the same augmentation type-checks `c.set/get` and removes the two middleware
casts AND the builder's two `as never` install casts end to end."

**Verified:** the augmentation removes the `c.get('principal') as Principal | undefined` cast
at `packages/service/src/auth/auth-middleware.ts:85`. It does **not** remove the two
`as never` install casts at `packages/service/src/builder/service-builder-impl.ts:92` and
`:374`. Those casts are about `app.use(middleware)` / `cors` / `onError` / `notFound` accepting
`MiddlewareHandler`, which is a separate type-inference seam in the service builder. The
augmentation is necessary but not sufficient for those install casts.

**Fold-in action:** keep S5's Hono augmentation as written (it is correct and high-value), but
narrow the S5 acceptance criteria to **"remove the middleware cast at `auth-middleware.ts:85`"**.
Defer the install-cast removal to a separate slice or a follow-up if it survives the
augmentation. (If after applying the augmentation the install casts become unneeded, that is a
win — but do not pre-commit to removing them.)

### Correction C2 — S6 cast-site count clarification

**Plan claim:** "per-handler `resolveBackend() as InteractiveAuthBackend`".

**Verified:**
- `plugins/auth/services/src/routers/v1-handlers.ts:101` — `resolveBackend() as InteractiveAuthBackend` ✓
- `:141` — `resolveBackend() as InteractiveAuthBackend` ✓
- `:179` — `resolveBackend() as InteractiveAuthBackend` ✓
- `:215` — `resolveBackend()` (no cast — the call site reads an untyped return; not the same
  defect, but adjacent)
- `:233` — `resolveBackend()` (no cast — same as above)

**Fold-in action:** S6's slice-time correction should target **3** typed-`as` cast sites (and
the typed `InteractiveAuthBackend` widening in `v1-types.ts`), not 5. Lines 215/233 are
untyped `resolveBackend()` calls; they should also be cleaned up for consistency, but they are
not "casts" by the plan's definition. Update the S6 scope text accordingly.

### Scope confirmations (no change needed, just noting)

#### Confirmation X1 — exemplar paths resolve

- `plugins/sagas/contracts/v1/sagas.contract.ts:648-659` (recipe 1) — ✓
- `plugins/sagas/services/src/routers/v1-handlers.ts:24-50` (recipe 2) — ✓
- `plugins/sagas/services/src/router.ts:38-80` (recipe 3) — ✓
- `plugins/sagas/services/src/main.ts:65-109` (recipe 4) — ✓
- `packages/telemetry/src/orpc/error-plugin.ts` (recipe 5) — (verified via prior audit context;
  not re-opened in this pass)
- `packages/auth-workos/src/workos-backend.ts` (recipe 6) — ✓ (port shape at
  `packages/plugin-auth-core/src/ports/mod.ts:88-101` — ✓)

#### Confirmation X2 — ErrorHandlingPlugin architecture

The plugin is mounted centrally in `@netscript/service` at
`packages/service/src/primitives/handlers.ts:88` and auto-applied by `withRPC()`. The auth
plugin does not need to mount it; dropping the per-handler `try/catch` (S2) lets all errors
flow through the central plugin. ✓ Confirmed.

---

## Cross-cutting constraint audit

| Constraint | Status | Evidence |
|---|---|---|
| `@netscript/cli` (`packages/cli`) untouched | ✓ | No slice targets `packages/cli` |
| `deno.lock` unchanged | ✓ | No runtime-dep change in any slice; HMAC lift is same `crypto.subtle` API; `declare module` is type-only |
| No secrets in code | ✓ | Test-only keys/hosts already confined to test factories |
| No `scaffold.runtime` E2E required | ✓ | Each slice's gate is scoped `deno check`/lint/fmt + targeted tests |
| Per-slice IMPL-EVAL gated | ✓ | DAG-correct: S2 branches off post-S1; S6 branches off post-S2; S3/S4/S5 branch off the umbrella tip |
| Each slice branches off current umbrella tip and merges before dependents | ✓ | DAG matches |

---

## Final verdict

**PASS** — implement S1 first, then S2, then S6; S3/S4/S5 can run in parallel.

### Slice-time corrections to fold in (non-blocking)

1. **S5:** narrow acceptance to "remove the middleware cast at `auth-middleware.ts:85`"; do not
   pre-commit to removing the install-cast at `service-builder-impl.ts:92,374` from the same
   augmentation.
2. **S6:** correct the cast-site count from "5" to **3 typed-`as` sites** (lines 101, 141, 179)
   plus the typed `InteractiveAuthBackend` widening in `v1-types.ts`. Lines 215/233 are untyped
   `resolveBackend()` calls — clean up for consistency, but they are not "casts" by the plan's
   definition.

### No blocking defect

The plan ratifies as written. The two corrections are textual scope refinements; they do not
change the dependency DAG, archetype assignment, gate set, or scope of any slice.

---

## What this run did NOT do

- No implementation. This is plan-EVAL only. No code edits, no commits.
- No PR comment posted. The workflow owns GitHub comments; the verdict above is delivered as a
  run-scoped artifact for the harness to consume.
- No `scaffold.runtime` E2E run. Constraint forbids it for plan-EVAL.

---

## Validator session hygiene

- All read-heavy commands used plain `cat`/`grep`/`sed` (no `rtk` proxying needed for a
  pure-read evaluator session).
- No `deno task` invocations. No package files modified.
- No `git` writes. Branch tip left at `feat/prime-time/auth` HEAD.
- Iteration budget consumed: ~7 read-heavy lookups + 2 file_editor writes (this summary + the
  replies.json — see below). Well under the 600-iteration budget.

---

## Verification artifacts

- `.llm/tmp/run/openhands/pr-86/run-27880569184-1/` — this run's trace metadata (request.md
  in-place; no additional artifacts committed by this session).
- `/home/runner/work/_temp/openhands/27880569184-1/summary.md` — this file.
- `/home/runner/work/_temp/openhands/27880569184-1/replies.json` — PR review-thread replies
  payload (see next section).

## Changes

- **Added:** `summary.md` (this file).
- **Added:** `replies.json` (PR review-thread replies for any review-comment threads on PR #86;
  empty array if no current review threads require a reply from this verifier).
- **Modified:** none.
- **Deleted:** none.

## Validation

- Verified all 6 slices against the actual branch state via `cat`/`grep`/`sed` on the cited
  files. No `deno check`/`lint`/`fmt` run (out of scope for plan-EVAL).

## Responses to review comments / issue comments

- N/A — no review-comment threads on PR #86 require a reply from this verifier session.
  (The `replies.json` payload is an empty array.)

## Remaining risks

- The S2 implementation will produce a real, fully-inferred `authContractV1`. If the oRPC
  inferred type is materially wider than the hand-rolled `AuthContractDefinition`, the export
  type change could ripple to any third-party who imported `AuthContractDefinition` directly.
  **Mitigation:** in-workspace audit shows no such consumer exists; public-surface change is
  safe within the umbrella.
- S5's install-cast at `service-builder-impl.ts:92,374` may or may not collapse once the
  augmentation is applied. The plan now correctly does not pre-commit to collapsing it.
- The duplicated `AuthSession` schema between `domain/mod.ts` and `streams/mod.ts` may have
  subtle field-shape divergence. **Mitigation:** S1's compile-time contract test should also
  assert `typeof AuthSessionZodSchema === typeof streamSessionZodSchema` (or equivalent) to
  prevent regression on the consolidation.