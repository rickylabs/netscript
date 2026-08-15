# Drift Log: OpenHands dispatch claim and refusal

Drift is append-only.

## 2026-08-15 — frozen file contract excludes required caller and tests

- **What:** The four-file outer bound cannot implement or prove the live #1611/#1613 acceptance
  contract.
- **Source:** Live issues plus baseline source/test inspection in `research.md` F1-F5.
- **Expected:** A valid plan would narrow the four allowed paths to the exact implementation edits.
- **Actual:** The real `agentic:dispatch-openhands` caller that must select phase/bind live head is
  excluded; three directly affected executed test files are excluded; the included phase workflow
  already has the desired retry and currently needs no edit.
- **Severity:** significant
- **Action:** rescope — coordinator must replace the exact file contract before plan gate or
  implementation.
- **Evidence:** `.llm/tools/agentic/openhands/dispatch-openhands.ts:58-72,202-282`;
  `.github/scripts/openhands-comment-trigger.test.ts:63-233`;
  `.llm/tools/agentic/lib/agentic-lib_test.ts:334-359`;
  `.llm/tools/agentic/openhands/phase-eval-workflow_test.ts:202-233`;
  `.github/workflows/openhands-phase-eval.yml:302-317`.

## 2026-08-15 — frozen file contract rescope resolved

- **What:** The coordinator accepted the research finding and replaced the invalid four-path outer
  bound with an eight-path production-and-regression envelope.
- **Source:** Central contract amendment
  `feaf2da311ccc4b15c210d25fda5ff1699b60576` on
  `chore/release-0.0.7-orchestration`.
- **Expected:** The contract must include the real CLI caller and executable regression evidence,
  while excluding the already-correct phase workflow from mutation.
- **Actual:** The amendment adds `dispatch-openhands.ts`, its new CLI test, and the three affected
  existing suites; retains the trusted policy, workflow, and builder; and makes
  `openhands-phase-eval.yml` read-only precedent.
- **Severity:** significant (resolved before implementation)
- **Action:** accept/resolved — repair the plan to the amended envelope and retain required
  PLAN-EVAL.
- **Evidence:** `.llm/runs/release-0.0.7--orchestration/leaf-contracts.json` at `feaf2da31`;
  `research.md` § Frozen-contract verdict and resolution; `plan.md` § Exact Narrowed Edit Surface.
