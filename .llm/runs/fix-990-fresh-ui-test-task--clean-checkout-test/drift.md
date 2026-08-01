# Drift Log: fresh-ui clean-checkout test task

## 2026-08-01 — Permission lead narrowed empirically

- **What:** The supplied lead included env permission, but the current affected test passes with
  read/write/run and no parent env grant.
- **Source:** Targeted `deno test` permission probes.
- **Expected:** read/write/run/env required.
- **Actual:** write and run are demonstrated requirements; env is not currently required.
- **Severity:** minor.
- **Action:** accept; use the empirically sufficient read/write/run set and document the concrete
  temp-workspace and subprocess capabilities.

## 2026-08-01 — Deno JSONC support differs from repo tooling

- **What:** A rationale comment in `deno.json` passed Deno's test/check/publish paths but broke
  repo-native release tools that strict-parse package manifests with `JSON.parse`.
- **Source:** Opposite-family slice review; focused `publish:readiness` and publish-asset paths.
- **Expected:** Deno's JSONC acceptance would cover the manifest consumers in scope.
- **Actual:** Repository tooling has a stricter manifest contract than Deno itself.
- **Severity:** significant.
- **Action:** fix by moving the capability rationale to the affected test file; do not expand this
  slice into converting unrelated release tools to JSONC parsing.

## 2026-08-01 — Owner-constrained local deliverable

- **What:** The run is limited to the three scoped validation commands plus the evaluator-requested
  publish dry-run; the owner later authorized only the explicit-refspec push and reserved PR creation.
- **Source:** Owner prompt.
- **Expected:** Full harness gate family and draft-PR commit trail.
- **Actual:** Scoped evidence, commit, explicit-refspec push, and no PR creation.
- **Severity:** minor.
- **Action:** accept as explicit run constraint; do not expand external or validation scope.

## 2026-08-01 — Canonical PLAN-EVAL route unavailable

- **What:** The separate local evaluator transport started, but OpenRouter returned HTTP 404
  `model_not_found` for the policy-bound `qwen/qwen3.7-max` model before evaluation began.
- **Source:** `claude-print` session `d0ee36e1-4c48-4f0f-82e1-fb77174944c9`, exit code 1.
- **Expected:** The bound formal-evaluation route produces `plan-eval.md`.
- **Actual:** No evaluator tokens or tools ran and no verdict was produced.
- **Severity:** significant.
- **Action:** pause at the Plan-Gate; request an owner-authorized fallback because policy prohibits
  a closed-model substitution or generator self-evaluation.

## 2026-08-01 — Owner-authorized IMPL-EVAL fallback

- **What:** Final evaluation used a fresh Claude Opus 5 session after the canonical local Qwen route
  remained unavailable.
- **Source:** Owner-authorized fallback already established by the supplied PLAN-EVAL; fresh
  opposite-family IMPL-EVAL session recorded in `evaluate.md`.
- **Expected:** Open-model Qwen formal evaluator.
- **Actual:** Closed-model Claude Opus 5 on the in-plan opposite-family review surface.
- **Severity:** significant.
- **Action:** accept for this run under the owner's explicit evaluator-lane waiver; preserve the
  provider failure and override in the run record.
