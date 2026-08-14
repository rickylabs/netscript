# Worklog — 0.0.7 internals topic

| Time (UTC) | Event | Evidence |
| --- | --- | --- |
| 2026-08-13T20:16:58Z | Topic harness activated and all required skills plus approved coordinator artifacts read completely. | Local skill/workflow reads; coordinator run path `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/` |
| 2026-08-15T00:22:00Z | Replaced parked legacy Codex topic controller with attached native Claude Sonnet 5/low supervisor per the reset common contract; first-turn reconciliation found zero drift on `main`, leaf #1644 (`4d9fb1967`), or leaf #1653 (`09dfb092d`), and no rival controller/evaluator in either leaf worktree. Order-1 IMPL-EVAL handoff prepared but not launched pending coordinator singleton evaluator lease grant. | Session `1d02b9ca-196b-4363-b5ec-d6bd5fdf613c`; PID `2402901`; bridge `session_011m4xHFkn36RbYsSXRpZe1Q`; `gh pr view 1644/1653`; `git status`/`rev-parse` in both leaf worktrees |
| 2026-08-13T20:16:58Z | Reconciled live `main`; it remains the immutable dispatch base. | `git fetch origin main`; `origin/main` = `01e0960494c95ce56eb35892c211a095eb13e6ed` |
| 2026-08-13T20:16:58Z | Reconciled Wave 0 issue state. #1378, #1545, #1561, #1563, and #1621 are open in milestone 0.0.7. | Live GitHub issue fetches |
| 2026-08-13T20:16:58Z | GitHub credential and desired-state runtime preflight passed. | `agentic:gh-token check`: rickylabs; `agentic:runtime doctor`: `no_change`, 18 components ready |
| 2026-08-13T20:16:58Z | Created two fresh no-upstream leaf worktrees and branches from live `origin/main`. | Leaf identity table below |
| 2026-08-13T20:16:58Z | Found a binding-contract/file-surface mismatch for issue-required tests and the approved `netscript-pr` documentation edit. | `drift.md`; leaves may research/bootstrap but must request coordinator clarification before undeclared edits |
| 2026-08-13T20:21:38Z | Launched both Wave 0 leaves concurrently through the Deno agentic suite; requested and observed route identities match. | Leaf `codex-thread-ids.md`; launcher sessions 89309 and 22039 |
| 2026-08-13T20:21:38Z | Launcher reported persistent app-server threads with direct same-thread steering, but `remoteControl/status` was `disabled`. | Do not claim mobile-visible Remote Control; treat the recorded app-server threads as the steering surface |
| 2026-08-13T20:29:03Z | Evidence/verdict leaf completed current-main research, recorded justified mechanical `PLAN-EVAL: N/A`, opened draft PR #1644, and stopped implementation at the binding file-surface mismatch. | PR #1644 head `3abd945232f51fd919f833e6158cdb916a158007`; clarification comment `5286024710` |
| 2026-08-13T20:33:20Z | Coordinator independently authorized the evidence leaf's five implementation/test peers and retained `.agents/skills/netscript-pr/SKILL.md` as read-only. The existing thread resumed through `agentic:codex-resume`; no second implementer was launched. | Authorization commit `41328ea3e6620dbe730157a313ff1d6c6b3f52f5`; PR #1644 |
| 2026-08-13T20:40:45Z | Quality rail finished research/Design only, opened draft PR #1653, posted RESEARCH/PLAN comments, and stopped before implementation at `status:plan-eval`. | Plan head `c573beda9e6f1508e9263062c425641da7f35d44`; PR #1653 |
| 2026-08-13T20:42:11Z | Canonical native opposite-family PLAN-EVAL route initialized but `fable-5` returned `model_not_found` before inference. | Claude session `4427e1d6-ab15-4f80-8840-2281744b1214`; zero tokens/cost |
| 2026-08-13T20:48:14Z | Same evaluator slot escalated per lane policy to Claude/OpenRouter Minimax M3 high and returned `FAIL_PLAN`. Evaluator artifact/commit and PR comment are durable; implementation remains stopped. | Session `977b0618-1b0c-4957-8369-698d3c5274c6`; evaluator head `8a4709afe4271833dad2eff9752115634552b7ba`; comment `5286216418` |
| 2026-08-13T20:50:46Z | Tier-A review of evidence S1 requested one missing mirror-boundary regression and separately flagged the unresolved #1561/#1621 documentation/closing-keyword conflict. | Candidate `a4a301042`; review comment `5286241617` |
| 2026-08-13T21:00:52Z | Tier-A re-review passed evidence S1 after the exact unmatched-index/no-mutation regression landed with replacement structured receipts. | Head `01db2bd360ea15d8bd9b53fee5fc392678321f43`; 19/19 focused tests; comment `5286336338` |
| 2026-08-13T21:04:31Z | Tier-A review passed evidence S2: shared and workflow matchers are parity-checked, absent/unparseable provenance remains distinct, and the lint exclusion is honestly recorded as not fired. | Head `8b4f4b509e4cb9ad6f7e9414b9b948ce9a2b7a33`; 81/81 focused tests; comment `5286371075` |

## Wave 0 identity and status

| Leaf | Worktree | Branch | Base | Requested route | Observed route | Thread | Draft PR | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `quality-scan-allowance-rail` | `/home/codex/repos/netscript-007-quality-rail` | `chore/quality-scan-allowance-rail` | `01e096049` | OpenAI / `gpt-5.6-sol` / high | OpenAI / `gpt-5.6-sol` / high | `019ffcc9-97d6-7602-bb7d-582ecc92b069` | #1653 draft @ `8a4709afe` | `FAIL_PLAN`; implementation hard stop |
| `harness-evidence-and-verdict-tooling` | `/home/codex/repos/netscript-007-harness-evidence` | `fix/harness-evidence-and-verdict-tooling` | `01e096049` | OpenAI / `gpt-5.6-sol` / medium | OpenAI / `gpt-5.6-sol` / medium | `019ffcc9-97ba-7770-a890-a1ebd80ec793` | #1644 draft @ `8b4f4b509` | S1/S2 Tier-A PASS; final gates next |

## Coordinator decisions

The coordinator authorized these exact additional `harness-evidence-and-verdict-tooling` paths:

- `.llm/tools/validation/mirror-acceptance-evidence.ts`
- `.llm/tools/validation/acceptance-evidence_test.ts`
- `.llm/tools/validation/mirror-acceptance-evidence_test.ts`
- `.llm/tools/agentic/lib/agentic-lib_test.ts`
- `.llm/tools/agentic/openhands/phase-eval-workflow_test.ts`
- `.agents/skills/netscript-pr/SKILL.md` remains read/use only, not an edit surface.

The quality leaf now requires coordinator disposition of the three `FAIL_PLAN` findings before a
fresh PLAN-EVAL may pass:

- Name/authorize a durable open, milestoned debt owner for the seven allowances after #1545 closes.
- Amend the binding file surface for `.llm/tools/quality/scan-code-quality_test.ts`,
  `packages/cli/src/kernel/assets/agent-tools.generated.ts`, and
  `.llm/tools/consumer-tools.json`, or supply a truthful accepted alternative.
- Accept a separately owned no-increase baseline for the 20 pre-existing workers `private-type-ref`
  diagnostics, or schedule a prerequisite repair leaf.
- Editorially reconcile live #1545 acceptance from stale 8 to measured 7 before closure.

The topic orchestrator has not mutated central cluster state or widened either leaf itself.

Evidence-leaf closure reconciliation remains coordinator-owned: live #1561/#1621 require
`netscript-pr` guidance, but the coordinator explicitly kept that file read-only. Before final
handoff, authorize/reconcile those acceptance rows or downgrade the affected closing keywords; S1
Tier-A PASS does not waive this conflict.

## Same-thread steering

- Quality rail: `codex exec resume 019ffcc9-97d6-7602-bb7d-582ecc92b069 -- "<follow-up>"`
- Harness evidence/verdict: `codex exec resume 019ffcc9-97ba-7770-a890-a1ebd80ec793 -- "<follow-up>"`

## Supervision rules

- Leaves own disjoint approved Wave 0 boundaries and may run concurrently.
- `quality-scan-allowance-rail` must keep #1378 and #1545 inseparable and perform the applicable
  package/plugin JSR audit plus `quality:gate`.
- `harness-evidence-and-verdict-tooling` owns only #1561, #1563, and #1621; JSR audit and
  package/plugin `quality:gate` are N/A under its locked contract.
- The quality leaf uses a bounded PLAN-EVAL before implementation. The evidence/verdict leaf may
  record `PLAN-EVAL: N/A` only after live research confirms that all remedies are mechanical and
  locked; otherwise it must request the same serialized evaluator slot.
- Every leaf remains draft. No topic action may merge, publish, mutate central cluster state, or
  claim release authority.
