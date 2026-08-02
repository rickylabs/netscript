# Drift Log: same-semver canary republish

## 2026-08-01 — Local formal evaluator unavailable

- **What:** The canonical local Claude Code + OpenRouter Qwen PLAN-EVAL launch could not start
  because `OPENROUTER_API_KEY` is unavailable in this environment.
- **Source:** `claude-print` preflight exited 4 before launch; no evaluator session was created and
  no model spend occurred.
- **Expected:** A separate local open-model session writes `plan-eval.md` before implementation.
- **Actual:** The local credential is absent. OpenHands is prohibited for a local-machine run unless
  the owner explicitly changes the run route; native closed-model Claude cannot substitute for
  formal evaluation.
- **Severity:** significant
- **Action:** defer pending owner direction; implementation remains blocked.
- **Evidence:** `.llm/tmp/1004-plan-eval.md`; current environment credential preflight.

## 2026-08-01 — Owner waiver supersedes blocked evaluator route

- **What:** The owner routed PLAN-EVAL and IMPL-EVAL for the 0.0.3 fix train to the Opus supervisor;
  the prior missing-OpenRouter blocker is superseded, not removed.
- **Source:** `.llm/runs/fix-1004-canary-republish--same-semver/plan-eval.md` and owner instruction.
- **Expected:** Local Qwen formal evaluator.
- **Actual:** Separate-session, opposite-family Opus supervisor under an explicit owner waiver.
- **Severity:** significant
- **Action:** accept; apply the single FAIL finding and proceed without a second PLAN-EVAL cycle.
- **Evidence:** `plan-eval.md` records the waiver, checklist, finding, and FAIL verdict.

## 2026-08-01 — Working-tree cleanliness added to byte-identity contract

- **What:** The guard now requires a clean working tree in addition to tag/HEAD committed-tree
  equality.
- **Source:** PLAN-EVAL finding 1; `publish-workspace.ts` invokes `deno publish --allow-dirty`.
- **Expected:** The issue brief specified only committed tree comparison.
- **Actual:** Working-tree bytes can differ and are publishable, so committed trees alone are
  insufficient.
- **Severity:** significant
- **Action:** fix in slice 2 and unit-test the dirty rejection.
- **Evidence:** `plan-eval.md`; `.llm/tools/release/canary.ts` and tests.
