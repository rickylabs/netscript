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
- **Source:** Central contract amendment `feaf2da311ccc4b15c210d25fda5ff1699b60576` on
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

## 2026-08-15 — formal-gate route amendment (records IMPL-EVAL finding F7)

**Raised by IMPL-EVAL F7, and the citation error was the topic supervisor's.** Both gate briefs for
this leaf cited "Route amendment 2" as living in _this_ leaf's `drift.md`. It does not: it was
recorded in the **#1656** leaf's `drift.md` and in the topic
`.llm/runs/release-0.0.7-internals--orchestration/drift.md`, never here. The evaluator was therefore
pointed at a file that did not contain its stated authority. Recorded here now so this leaf's drift
log is self-contained, per the harness rule that drift is explicit.

| ID  | Kind                        | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Disposition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | State    |
| --- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| D-3 | Formal-gate route amendment | The canonical `formal_plan_evaluation` / `formal_impl_evaluation` Claude binding is `MODEL_IDS.fable` (`fable-5`) at `medium` (`routing-policy.ts`). `fable-5` has failed **pre-inference three times** on this machine — 2026-08-13T20:42 (PLAN gate), 2026-08-15T05:34 (#1656 PLAN gate), and probe `e58c5f01` at 2026-08-15T11:50 run deliberately before this leaf's IMPL-EVAL — each with `tokens: null`, no inference, no verdict, no artifact, no comment, and no repository mutation. | The owner amendment defaults formal gates to **native Opus 5**. Both of this leaf's formal gates therefore ran `claude-opus-5` / `medium` / `--remote-control`: PLAN-EVAL session `7d544aec-22cc-4656-8483-6d957dbfbfda` (verdict `e15d78588`) and IMPL-EVAL session `740d2a3a-1677-459c-a6b1-a39398649d1a` (verdict `8f62a6121`). Opposite-family is preserved — the author is Codex GPT-5.6 Sol, both evaluators are Claude-family and distinct sessions. Each Fable failure is classified as **transport/model-unavailable drift consuming zero evaluation cycles**, so both gates are cycle 1 and the two-failure loop counter is untouched. | Recorded |

Standing rule carried from the topic drift: when a canonical binding has already failed
pre-inference, probe it cheaply before re-granting — a probe costs one zero-token launch, whereas
re-granting blind costs a full gate cycle and blocks the lane.
