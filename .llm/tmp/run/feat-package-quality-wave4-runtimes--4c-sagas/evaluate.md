# IMPL-EVAL — feat-package-quality-wave4-runtimes--4c-sagas

**Run ID**: `feat-package-quality-wave4-runtimes--4c-sagas`  
**Evaluator**: separate session (Qwen-3.7-Max, OpenHands agent)  
**Date**: 2026-06-09  
**Protocol**: `.agents/skills/netscript-harness/SKILL.md` § Evaluator (IMPL-EVAL)  
**Verdict**: **FAIL_FIX**

---

## Verdict: FAIL_FIX

The plan remains valid, but one required gate has residual findings that block a PASS verdict.

### Blocking Finding

**Gate**: F-7 Doc-score (`plugin-sagas-core`)

Running `deno doc --lint packages/plugin-sagas-core/mod.ts` independently in this evaluator session produces **2 `private-type-ref` errors**:

```
error[private-type-ref]: public type 'SagaBuilder["correlate"]' references private type 'SagaCorrelation'
  --> /home/runner/work/netscript/netscript/packages/plugin-sagas-core/src/builders/define-saga.ts:47:3

error[private-type-ref]: public type 'SagaCorrelationRule' references private type 'SagaCorrelation'
  --> /home/runner/work/netscript/netscript/packages/plugin-sagas-core/src/domain/saga-correlation.ts:10:1
```

Both error messages point to the same root cause: `SagaCorrelation` (defined in `saga-correlation.ts` and re-exported by `src/domain/mod.ts`) is not included in the public type closure at `src/public/mod.ts`. The domain barrel re-exports both `SagaCorrelation` and `SagaCorrelationRule`, but the public/mod.ts barrel (which is the root-exported barrel via `mod.ts`) exports `SagaCorrelationRule` but omits `SagaCorrelation`. Since `SagaBuilder["correlate"]` and `SagaCorrelationRule` both reference `SagaCorrelation` in their types, it must be in the public surface.

**Worklog claim**: C14 logs `raw full-export deno doc --lint mod.ts + all 19 entrypoints PASS (private-type-ref-count=0, missing-jsdoc-count=0)`. This contradicts the current evaluator-run result. Possible causes: generator's worktree state differed from committed state, or C14's sweep only ran per-EP lint without running it against the root-merged export graph that includes builders/mod.ts types.

**Fix required**: Add `SagaCorrelation` to the domain type list in `packages/plugin-sagas-core/src/public/mod.ts` alongside `SagaCorrelationRule`. This is a 1-line addition (no code changes) and satisfies the F-7 strategy in plan § 5 ("First-party `@netscript/*` → Explicit type re-export through barrel").

**Non-blocking note**: The plugin package (`plugins/sagas`) doc-lint is clean (0 errors per the `slice-p13-doc-lint-report.json`). E2E CLI suite: 9/10 gates passing; 1 pre-existing `database.init` failure is outside sagas scope (aspire `--resources` argument forwarding issue).

### Required Fix

```diff
--- a/packages/plugin-sagas-core/src/public/mod.ts
+++ b/packages/plugin-sagas-core/src/public/mod.ts
@@ -26,6 +26,7 @@ export type {
   RetryPolicy,
   SagaConcurrencyPolicy,
   SagaContext,
+  SagaCorrelation,
   SagaCorrelationKey,
   SagaCorrelationRule,
   SagaDefinition,
```

After this fix, re-run `deno doc --lint packages/plugin-sagas-core/mod.ts` and confirm `Checked 1 file` (no errors). Then re-run IMPL-EVAL for a PASS verdict.

---

---

## Non-Blocking Evaluation Observations

The following gates were verified PASS during the evaluator run (separate from the blocking F-7 finding):

### Passing Gates

| Gate | Status | Evidence |
|------|--------|----------|
| **Type Check (core)** | ✅ PASS | `deno check --unstable-kv` all 19 entrypoints: exit 0 |
| **Publish Dry-Run (core)** | ✅ PASS | `deno publish --dry-run --allow-dirty`: exit 0, 0 slow-type findings |
| **Unit Tests (core)** | ✅ PASS | `deno task test`: 17 passed / 0 failed (concurrency, idempotency, scheduler, store, testing helpers) |
| **F-1 File-Size (core)** | ✅ PASS | `redis-transport.ts` → split into transport + commands module; `list-transport.ts` → ditto |
| **Type Check (plugin)** | ✅ PASS | `deno check --unstable-kv` all 12 entrypoints: exit 0 |
| **Doc-Lint (plugin)** | ✅ PASS | `deno doc --lint` all 12 entrypoints: 0 errors per `slice-p13-doc-lint-report.json` |
| **Publish Dry-Run (plugin)** | ✅ PASS | `deno publish --dry-run --allow-dirty`: exit 0, 0 slow-type findings |
| **Lint & Format (plugin)** | ✅ PASS | `deno lint`: 54 files clean; `deno fmt --check`: 61 files clean |
| **Integration Tests (plugin)** | ✅ PASS | `deno task test`: 5 passed / 0 failed (manifest, CLI, aspire, E2E gates, public surface) |
| **F-1 File-Size (plugin)** | ✅ PASS | `v1.ts` 715 → split into handlers (265) + helpers (255) + types (343) + barrel (15) |
| **README (plugin)** | ✅ PASS | 205 lines (threshold 150); doctested examples present |
| **Test Layer Upgrade (plugin)** | ✅ PASS | 0 → 4 integration tests (manifest, CLI, aspire, E2E gates) |
| **Public Surface Lock (both)** | ✅ PASS | 19 + 12 entrypoints retained and documented; no unplanned additions |

### E2E CLI Suite

| Metric | Result |
|--------|--------|
| Total gates | 10 |
| Passed | 9 |
| Failed | 1 (pre-existing, outside sagas scope) |

**Failed gate**: `database.init` — Aspire `--resources` argument forwarding issue. Pre-existing, unrelated to Wave 4c sagas work. Non-blocking for this PR.

### Implementation Evidence

- **Commit History**: 27 commits tracked (14 core + 13 plugin) in `.llm/tmp/run/feat-package-quality-wave4-runtimes--4c-sagas/commits.md`
- **Validation Artifacts**: ~93 per-slice validation files across `core/` and `plugin/` directories
- **Scope delivered**: 519 → 1 doc-lint errors, 2 F-1 splits resolved, test layer 0 → 4, full JSR publishability

### PLAN-EVAL Compliance

All PLAN-EVAL gates from `plan-eval.md` remain satisfied. Deferred decisions per plan § 9 are reaffirmed.

---

## Responses to Trigger Comments

- **"use harness"**: Harness protocol followed. Separate evaluator session conducted per `.agents/skills/netscript-harness/SKILL.md` § Evaluator.
- **"proceed to IMPL-EVAL"**: IMPL-EVAL completed. Verdict: FAIL_FIX (1 remaining gate finding).
- **"Including the full E2E CLI suite test"**: E2E CLI suite executed. 9/10 gates passing. 1 pre-existing failure (non-blocking, non-sagas-related).

---

## Next Steps

1. Generator applies the 1-line fix (add `SagaCorrelation` to `src/public/mod.ts` export closure)
2. Re-run `deno doc --lint packages/plugin-sagas-core/mod.ts` to confirm clean
3. Re-run IMPL-EVAL for PASS verdict
4. Merge to umbrella on PASS
