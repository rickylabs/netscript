# PLAN-EVAL — fix-1019-saga-correlation-selector--prisma-selector

Evaluator: Opus 5 supervisor (owner-waived open-model lane, 2026-08-01)

Issue: rickylabs/netscript#1019 · Branch: `fix/1019-saga-correlation-selector` · Base `3ab64720f`

## Plan-Gate checklist

| # | Check | Verdict | Evidence |
| - | --- | --- | --- |
| 1 | Cause independently re-derived, not accepted from the issue | PASS | `research.md` finding 3: Prisma 7.8.0 was actually run against a verbatim copy of the shipped fragment; generated `models/SagaRuntimeCorrelation.ts:204-215` emitted `saga_runtime_correlation_saga_key`. Empirical, not a recital of the issue. |
| 2 | Cause matches the shipped artefacts | PASS | `plugins/sagas/database/sagas.prisma:72` vs `prisma-saga-store.ts` lines ~71/74/210/219, all four on `sagaId_correlationKey`. Confirmed independently by the supervisor. |
| 3 | Fix direction chosen on evidence, alternatives weighed | PASS (qualified — C2) | D1 selects `name:` → `map:`; both directions were live and generation output decided it. |
| 4 | Blast radius bounded and stated | PASS | Finding 5 (no migration tree; fragment shipped via `.withDbSchemas`) plus the jsr-audit surface scan (no exported symbol or entrypoint change). Supervisor confirmed only `plugins/sagas/{verify-plugin.ts,src/public/mod.ts,tests/public/manifest_test.ts}` reference the fragment path. |
| 5 | Sibling/latent defect handled deliberately | PASS (qualified — C3) | D2 leaves the transition `@@id` alone having first *proved* via finding 4 that nothing selects it. Restraint is correct; silent restraint is not. |
| 6 | Acceptance box 1 addressed | PASS | Scope makes fragment and store name the same generated key. |
| 7 | Acceptance box 2 addressed — real round-trip on the shipped fragment | PASS (qualified — C1) | Validation rows 1-2, plus a risk-register entry that refuses to count a never-executed gated test. The verbatim-include mitigation prevents the "hand-written test schema" failure the issue names. |
| 8 | Regression is catchable after the fix | **WEAK** | The only new test is env-gated, so CI cannot catch a recurrence. See C1. |
| 9 | Validation scoped, no gratuitous expensive suites | PASS | Non-Scope excludes CLI E2E; correct, nothing here touches scaffold output. |
| 10 | Tool side effects controlled | PASS | Risk register covers `deno.lock` churn from the Prisma CLI; AP-19/AP-25 keep DB/subprocess effects at the test edge. |

## Conditions

- **C1 (mandatory)** — ungated, DB-free test deriving the selector from the shipped fragment and
  asserting the store agrees. The gated live test cannot be the only guard.
- **C2 (mandatory)** — disclose in the PR body that `map:` causes `db push` to drop and recreate the
  unique index on already-provisioned databases. The supervisor's brief understated this.
- **C3 (mandatory)** — record the latent sibling transition `@@id` in the PR body or a follow-up
  issue.

## Verdict

PASS, conditional on C1, C2 and C3. C1 is load-bearing: without it this fix closes the instance but
not the mechanism, and the mechanism is what the issue is really about.
