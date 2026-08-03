# Context Pack: close-gate verdict honesty

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-close-gate-verdict-provenance--verdict-honesty` |
| Branch | `fix/close-gate-verdict-provenance` |
| Current phase | `plan-eval` |
| Archetype | `N/A` — repository tooling |
| Scope overlays | `none` |

## Current State

Research, plan, and Design checkpoint are complete against current `origin/main`. The chosen #1105
convention is ENFORCE for unchecked PR Definition-of-Done/Acceptance boxes. No implementation work
has begun. The canonical local Qwen evaluator canary is blocked because its isolated child
environment has no OpenRouter credential; the next legal action is still separate-session
PLAN-EVAL after owner/config resolution.

## Completed

- Read issues #1171 and #1105 in full.
- Read named skills and applicable harness/route/handoff authorities.
- Re-baselined checker, tests, PR template, PR skill, and CI call site.
- Ran existing targeted tests: 3 passed, 0 failed.
- Locked commit slices, gates, risks, and deferred scope.

## In Progress

- Resolve the formal evaluator route. Draft PR #1181 and S0 are already pushed.

## Next Steps

1. Owner/config selects one allowed resolution: provide local `OPENROUTER_API_KEY`, or explicitly
   authorize conversion to a cloud-driven OpenHands Qwen evaluation run.
2. Launch the separate PLAN-EVAL and accept only committed `plan-eval.md` as verdict source.
3. On PASS, repair/establish the routed Codex implementation session and launch S1; otherwise repair
   the plan or report the evaluator finding.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| ENFORCE PR DoD/Acceptance boxes | user + #1105 + plan D1 | unrelated checklists remain non-authoritative |
| Add issue snapshot provenance | #1171 + plan D3-D5 | staleness compares timestamp OR body hash |
| Preserve old issue semantics | #1171 + plan D6 | additive PR findings and report fields |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-close-gate-verdict-provenance--verdict-honesty/**` | new | S0 harness artifacts only |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Plan-Gate | pending | separate evaluator not yet run |
| Static | baseline pass | existing targeted test 3/3 |
| Fitness | N/A | repo-tooling scope |
| Runtime | N/A | no service/scaffold/CLI runtime change |
| Consumer | planned | parser tests + live PR |

## Open Questions

- Which owner-authorized evaluator resolution should be used: configure local
  `OPENROUTER_API_KEY`, or convert the evaluation to a cloud-driven OpenHands Qwen run?

## Drift and Debt

- Drift: local agentic runtime reports `MISSING_IDENTITY`, and the formal evaluator canary reports
  `auth_required` with no provider process launched; both are recorded in `drift.md`.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
