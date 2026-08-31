# Context Pack: #1751 stale sender lease recovery and resume rejection propagation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agentic-sender-lease-recovery--1751` |
| Branch | `fix/agentic-sender-lease-recovery` |
| Current phase | `implement` — Slice 7 blocked on out-of-manifest full-agentic lint findings |
| Archetype | Operational Archetype 6 — CLI / Tooling |
| Scope overlays | none |

## Current State

Slices 1-6 are accepted through `00877bcbd`; all six protected RED test blobs are unchanged, the
resume known-negative is green, and the supervisor recorded 528/528 full agentic tests. Slice 7's
README documentation is drafted. The required full agentic check passes over 173 files and format
passes over 173 files after an authorized formatting-only fix in `codex-resume.ts`, but lint exits 1
with 14 findings across 9 files outside this leaf's declared manifest. Work is stopped before the
full test gate, commit, push, or PR comment pending coordinator rescope or upstream lint repair.

## Completed

- Loaded all required harness/tooling/routing instructions and the Archetype-6 gate profile.
- Verified branch/base/no-upstream with authoritative raw Git.
- Re-baselined the supplied reproductions against current ownership, launch, rollout, app-server,
  resume, runner, and repair code.
- Locked the finite three-signal truth table, explicit repair command, audit-before-CAS sequencing,
  direct known-negative exit test, seven RED/GREEN slices, and intended file manifest.
- Completed two separate PLAN-EVAL cycles; cycle 2 is `PASS` in `plan-eval-cycle-2.md`.
- Landed the supervisor's cycle-2 R1/R2 record corrections before implementation.
- Landed the finite classifier and preserve-only launch behavior in Slice 2; its exact Slice 1
  boundary is green and unchanged.
- Landed explicit audited sender-lease repair in Slice 4 with D6/D7 sequencing and all four Slice 3
  test blobs unchanged; supervisor verification recorded 10/10 focused and 526/526 full green.
- Added the Slice 5 real-wrapper rejection and accepted-path subprocess cases behind a test-owned
  fake `bash`; no real message can be delivered.
- Captured intended Slice 5 RED evidence: exit 1, 1 passed, 1 failed, with the failing rejection
  path returning actual 0 versus expected 1.
- Captured scoped structured check/lint/fmt passes for the one Slice 5 test file.
- Landed Slice 6 GREEN at `00877bcbd`; the supervisor verified D8, all six protected blobs, Slice 5
  at 2/2, and the full agentic suite at 528/528.
- Drafted the final README safety and operator guidance.
- Captured Slice 7 structured check PASS (173 files, exit 0) and format PASS after the declared-file
  correction (173 files, exit 0).

## In Progress

- Slice 7 is blocked because the required structured lint gate reports 14 findings across 9 files
  outside the approved manifest. No unrelated source edit is authorized.

## Next Steps

1. Coordinator chooses either to land the unrelated agentic lint repairs elsewhere or explicitly
   rescope this leaf's manifest.
2. Resume Slice 7 only after the full agentic lint command can produce a green covered verdict.
3. Then run the full agentic suite and raw Git checks, finalize artifacts, commit, explicitly push,
   post the Slice 7 PR comment, and hand off for evidence freeze/Tier-A/IMPL-EVAL.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Stale = debounced dead PID + inactive/absent exact rollout + non-active thread; no unknowns | `plan.md` D1-D3 | All other combinations preserve/indeterminate. |
| Proven absence is provenance-bound | `plan.md` D2 | Unestablishable/mismatched record session home remains `indeterminate`. |
| Launch never evicts | `plan.md` D4 | Explicit repair owns mutation and audit. |
| Repair command under existing `agentic:runtime` | `plan.md` D5 | No `deno.json` edit. |
| Receipt durable before lease-token CAS removal | `plan.md` D6-D7 | Re-observe immediately before mutation. |
| Known active-writer rejection forces exit 1 | `plan.md` D8-D9 | Direct subprocess status, no pipeline. |
| PLAN-EVAL required | `plan.md` D10 | Separate opposite-family evaluator. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/tools/agentic/README.md` | modified | Final operator and safety documentation, not committed. |
| `.llm/tools/agentic/codex/codex-resume.ts` | modified | Authorized formatting-only correction exposed by the full format gate, not committed. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/worklog.md` | modified | Slice 6 acceptance and Slice 7 blocker evidence. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/context-pack.md` | modified | Current blocked handoff. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/drift.md` | modified | Out-of-manifest lint blocker. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | BLOCKED | Check: 173 files, exit 0. Format: 173 files, exit 0 after in-scope fix. Lint: 173 files, 14 findings across 9 out-of-manifest files, exit 1. |
| Fitness | Plan-Gate PASS; Slice 7 incomplete | `plan-eval-cycle-2.md`; no Tier-A handoff until required gates pass. |
| Runtime | PASS at Slice 6 head | Supervisor: Slice 5 2/2 and full agentic 528/528 at `00877bcbd`. Slice 7 full suite not run after lint blocker. |
| Consumer | PASS at Slice 6 head | Resume output and compatibility behavior verified by supervisor; final docs are drafted. |

## Open Questions

- Whether the nine unrelated lint files may be repaired in this leaf is a coordinator rescope
  decision; current authority forbids editing them.

## Drift and Debt

- Drift: owner-provided Codex planning route, unavailable expected `rtk` binary, and the root lint
  config's `.llm/` exclusion; all minor and recorded in `drift.md`.
- Debt: none created or closed.

## Commits

- Slice 6 GREEN is `00877bcbd`. Slice 7 has no commit because its required lint gate is blocked.
  V3 has no `commits.md`.
