# Context Pack: #1751 stale sender lease recovery and resume rejection propagation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agentic-sender-lease-recovery--1751` |
| Branch | `fix/agentic-sender-lease-recovery` |
| Current phase | `plan-eval` (selected, pending separate session) |
| Archetype | Operational Archetype 6 — CLI / Tooling |
| Scope overlays | none |

## Current State

Research and Plan are complete against `main` @ `5197e70b716eafb82fbb12ddb9a910c248ddb86a`.
No source implementation, sender inspection/mutation, GitHub mutation, commit, or merge occurred.
PLAN-EVAL is a hard stop because the plan authorizes an eviction path whose false positive can steal
a live writer lease.

## Completed

- Loaded all required harness/tooling/routing instructions and the Archetype-6 gate profile.
- Verified branch/base/no-upstream with authoritative raw Git.
- Re-baselined the supplied reproductions against current ownership, launch, rollout, app-server,
  resume, runner, and repair code.
- Locked the finite three-signal truth table, explicit repair command, audit-before-CAS sequencing,
  direct known-negative exit test, seven RED/GREEN slices, and intended file manifest.
- Selected native Anthropic Fable 5 medium for separate-session PLAN-EVAL.
- Passed artifact-only section/whitespace/scope validation; `plan-eval.md` remains correctly absent.

## In Progress

- None in this generator session. Work is stopped at PLAN-EVAL.

## Next Steps

1. Launch a fresh native Fable 5 medium PLAN-EVAL session with `use harness` and the required skill
   section; read the Plan-Gate protocol and write `plan-eval.md`.
2. If `FAIL_PLAN`, revise Research/Plan/Design only and allow at most two evaluator cycles.
3. If `PASS`, begin Slice 1's committed RED test. Do not skip or squash away the RED-before-GREEN
   sequence.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Stale = debounced dead PID + inactive/absent exact rollout + non-active thread; no unknowns | `plan.md` D1-D3 | All other combinations preserve/indeterminate. |
| Launch never evicts | `plan.md` D4 | Explicit repair owns mutation and audit. |
| Repair command under existing `agentic:runtime` | `plan.md` D5 | No `deno.json` edit. |
| Receipt durable before lease-token CAS removal | `plan.md` D6-D7 | Re-observe immediately before mutation. |
| Known active-writer rejection forces exit 1 | `plan.md` D8-D9 | Direct subprocess status, no pipeline. |
| PLAN-EVAL required | `plan.md` D10 | Separate opposite-family evaluator. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/supervisor.md` | new | Run identity and routes. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/research.md` | new | Re-baseline and load-bearing findings. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/plan.md` | new | Locked safety/implementation/gate plan. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/worklog.md` | new | Design checkpoint and phase evidence. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/context-pack.md` | new | This resumable handoff. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/drift.md` | new | Append-only route/tooling drift. |
| `.llm/runs/fix-agentic-sender-lease-recovery--1751/codex-thread-ids.md` | pre-existing run artifact | Preserved unchanged from the agentic launcher. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | Planning baseline/artifact contract PASS; source gates NOT_RUN | Raw Git and artifact-only checks in `worklog.md`; no source changes. |
| Fitness | Plan-Gate PENDING | `research.md`, `plan.md`, `worklog.md ## Design`. |
| Runtime | NOT_RUN | Planned temp-root lifecycle tests after PLAN-EVAL. |
| Consumer | N/A / NOT_RUN | No published consumer change; compatibility test planned. |

## Open Questions

- No generator-side decision remains open. PLAN-EVAL must adversarially challenge the idle/not-loaded
  thread treatment and the remaining probe-to-CAS race before implementation.

## Drift and Debt

- Drift: owner-provided Codex planning route and unavailable expected `rtk` binary; both minor and
  recorded in `drift.md`.
- Debt: none created or closed.

## Commits

- None in this plan-only phase. See the future draft PR's commit list + per-slice comments after
  PLAN-EVAL `PASS`; V3 has no `commits.md`.
