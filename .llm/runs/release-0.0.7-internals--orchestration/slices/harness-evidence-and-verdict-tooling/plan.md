# Plan — harness-evidence-and-verdict-tooling

## Scope and profile

- Issues: #1561, #1563, and #1621 exactly.
- Binding profile: `6-cli-tooling`; overlays: none.
- Public/package surface: none. This leaf changes internal validation and workflow tooling plus the
  canonical close-gate operator guidance.
- Current doctrine verdict: N/A for package/plugin architecture; the coordinator-selected tooling
  profile is used for fail-closed CLI behavior, structured diagnostics, and semantic fixtures.

## Locked decisions

1. Empty structured entry lists remain invalid and fail closed. They are recognized as a supported
   YAML list spelling and rejected with an evidence-block-specific repair instead of falling into a
   generic parser exception.
2. A target with zero close-gated markdown checkboxes is rejected before entry resolution. The one
   error names the actual repairs: remove the evidence block or convert plain acceptance bullets to
   markdown checkboxes.
3. The mirror CLI reports parse/mapping failures through its normal structured output contract and
   non-zero exit, rather than leaking an unhandled promise rejection.
4. Exact verdict tokens may have markdown heading and supported emphasis wrappers. Code fences,
   templates/placeholders, unsupported vocabulary, and incidental prose remain non-verdicts.
5. A marker that is absent and a marker that was emitted but cannot be parsed have distinct source
   states; neither becomes PASS.
6. The validation error itself states that only markdown checkbox targets can be mirrored and
   instructs authors to remove the evidence block or convert the issue list to checkboxes.
7. Coordinator control head `33626b1f4752b3a0e53ea21407ff1ddb6af0fcfb` supersedes the earlier
   read-only restriction for exactly `.agents/skills/netscript-pr/SKILL.md`. The existing machine
   convention will state that only markdown checkboxes are close-gated and mirrorable and that a
   plain-bullet `Acceptance` section takes no `acceptance-evidence` block.

## Open-decision sweep

- Resolved: coordinator authorization is recorded in `drift.md`; the acceptance-complete surface is
  exactly nine files, including the one newly authorized `netscript-pr` guidance edit.
- Safe to defer: issue-template checkbox defaults, broader OpenHands routing/model policy, general
  YAML support, and any acceptance convention redesign. None is required by the locked outcome.

## Commit slices

| Slice | What it proves | Files | Named gate |
| --- | --- | --- | --- |
| S0 | Current-main research, RED fixtures, PLAN-EVAL disposition, and drift are reviewable from a draft PR | leaf run artifacts only | bootstrap review + Git truth |
| S1 | Empty-list and zero-checkbox evidence failures are fail-closed, structured, actionable, and covered at parser + dry-run boundaries | `acceptance-evidence.ts`, `mirror-acceptance-evidence.ts`, `acceptance-evidence_test.ts`, `mirror-acceptance-evidence_test.ts` | focused structured test, then contract `test` |
| S2 | Bare/heading/emphasis verdict tokens parse consistently and absence differs from malformed emission | `openhands-agent.yml`, `agentic-lib.ts`, `agentic-lib_test.ts`, `phase-eval-workflow_test.ts` | focused agentic/workflow tests, then contract `check` |
| S3 | The canonical operator convention states the checkbox-only/plain-bullet evidence rule required by #1621 | `.agents/skills/netscript-pr/SKILL.md` plus leaf run artifacts | exact-text review + Tier-A handoff |
| S4 | The acceptance-complete implementation parent has sufficient structured evidence and no incidental lock/source churn; one evidence-only child packages the receipts without a self-reference loop | leaf run artifacts and `receipts/` | contract `check`, `test`, `quality-job`; IMPL-EVAL handoff |

Each implementation slice updates `worklog.md` and `context-pack.md`, receives substantive Tier-A
topic-orchestrator review before its supervisor sign-off commit, pushes with the explicit refspec,
and posts literal-SHA evidence to the draft PR.

## Gate set

- Focused RED/GREEN parser, mirror, agentic-lib, and workflow contract tests through
  `.llm/tools/run-deno-test.ts`.
- Binding durable gates: `check`, `test`, and `quality-job`, with JSON receipts under the run's
  `receipts/` directory.
- Workflow YAML/embedded-script behavior is not claimed from source inspection alone; the existing
  workflow contract test must execute.
- N/A: JSR audit, publish dry-run, package/plugin `quality:gate`, `scaffold.runtime`, Fresh browser,
  Aspire, Docker, and release gates.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Empty evidence accidentally becomes a bypass | Keep rejection/non-zero behavior and test the empty form explicitly. |
| Zero-box logic hides real mismatches when boxes exist | Cardinality check applies only when actionable target count is zero; preserve existing per-entry diagnostics otherwise. |
| Markdown matching admits prose/template false positives | Match whole non-fenced lines, exact token vocabulary, and reject placeholder/menu forms. |
| Three extractor copies drift | Apply equivalent fixtures to shared library and workflow source/behavior contract; keep sync comments current. |
| Guidance authorization is widened beyond #1621 | Edit only the existing `netscript-pr` machine-convention paragraph authorized at control head `33626b1f4`; add no other skill or product surface. |
| Validation churns `deno.lock` | Compare against the true base after every gate and exclude any incidental churn. |

## Deferred scope

- Issue-template policy and converting all Acceptance sections to checkboxes.
- General YAML parsing beyond the documented subset.
- OpenHands provider/model/routing behavior.
- Any release, publish, scaffold, service, browser, or container behavior.

## Debt

No architecture debt is planned. Any required file beyond the clarified bounded contract is a
rescope/escalation, not implicit debt.
