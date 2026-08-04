# Drift Log: Aspire CLI adapter hardening

## 2026-08-04 — F1(b) re-scope replaces manifest emission

- **What:** Issue #1133's original manifest-template deliverable is replaced by production hardening
  of the `aspire-cli` endpoint source.
- **Source:** RFC #1123 §F1, P1 verdict, owner/orchestrator comment, staged brief.
- **Expected:** Post-allocation manifest template emission if P1 passed.
- **Actual:** P1 `FAIL` selects qualified F1(b); S5's CLI adapter is primary and this slice extends it.
- **Severity:** significant
- **Action:** rescope
- **Evidence:** `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/P1-verdict.md`

## 2026-08-04 — formal PLAN-EVAL composed at milestone level

- **What:** No local formal PLAN-EVAL is launched.
- **Source:** Milestone-run evaluator protocol and orchestrator ruling D6 in the owner brief.
- **Expected:** Ordinary single-run harness would use a separate local PLAN-EVAL.
- **Actual:** `plan-eval.md` records `COMPOSED_NOT_LOCAL`; evaluation occurs via separate composed surfaces.
- **Severity:** minor
- **Action:** accept
- **Evidence:** `.llm/harness/workflow/milestone-run.md`

## 2026-08-04 — real Aspire proxy collision required target-port selection

- **What:** A live scaffold described fixed proxy URL `127.0.0.1:3001` while that port belonged to a
  foreign `products` process; the resource's allocated executable `PORT` was the trustworthy live target.
- **Source:** Canonical `scaffold.runtime` named gate `behavior.mcp-endpoint-directory`.
- **Expected:** The first declared HTTP URL would resolve to the described service.
- **Actual:** Identity probe correctly returned `identity_mismatch`; adapter selection was hardened to
  prefer the described executable target port without weakening project/run/service identity checks.
- **Severity:** significant
- **Action:** fix
- **Evidence:** focused multi-port fixture plus scaffold output recorded in `worklog.md`.

## 2026-08-04 — local full gate blocked by unrelated runtime health

- **What:** Serialized canonical attempts did not reach a green suite after S7 was registered.
- **Source:** `scaffold.runtime --cleanup --format pretty`.
- **Expected:** All baseline runtime resources healthy, then S7 assertion passes.
- **Actual:** Attempts stopped at existing users DB-health aggregation or workers-api readiness; cleanup
  passed. The one S7 execution fired its negative identity case and drove the target-port fix.
- **Severity:** minor
- **Action:** defer to fresh branch CI verdict
- **Evidence:** `worklog.md`; GitHub scaffold-runtime was green on the prior adapter commit.

## 2026-08-04 — composed evaluator surface did not auto-start

- **What:** Draft-to-ready fired repository review workflows, but the OpenHands job was policy-skipped
  and no separate review verdict was posted automatically.
- **Source:** Milestone-run evaluator protocol / orchestrator ruling D6 and PR #1206 checks.
- **Expected:** Ready transition plus label surface composes a separate review/evaluation.
- **Actual:** Automated implementation and runtime gates passed; separate reviewer sign-off remains
  pending. Cloud OpenHands cannot be forced for this local run under its routing policy.
- **Severity:** minor
- **Action:** leave `status:impl-eval` and request an eligible composed/owner review; never self-certify.
- **Evidence:** PR #1206 timeline and OpenHands Agent check on head `dfcf2b23a`.
