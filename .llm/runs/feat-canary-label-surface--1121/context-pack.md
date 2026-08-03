# Context Pack: Canary label surface (#1121)

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-canary-label-surface--1121` |
| Branch | `feat/canary-label-surface` |
| Current phase | `implement` (Plan-Gate explicitly waived) |
| Archetype | N/A — internal release tooling |
| Scope overlays | none |

## Current State

Research and Design are complete against clean `origin/main` at `0b05217cc`. The owner explicitly
waived the blocked PLAN-EVAL under #1087's safety precedent. Slice 1 is implemented; its first
opposite-family review returned two blockers, now fixed and awaiting gate/review confirmation.

## Completed

- Read the five user-named skills plus required harness/evaluator/handoff references.
- Read issues #1121/#1120 and the observed 0.0.4 trace in full.
- Verified current workflow, release resolver, historical tags/registry versions, and GitHub labels.
- Locked the two-slice plan and explicit result contract.

## In Progress

- Slice 1 reviewer findings fixed; rerun gates/review, then supervisor sign-off commit.

## Next Steps

1. Implement slice 1 under the recorded owner waiver.
2. Run opposite-family review, supervisor sign-off, push, and PR evidence comment.
3. Implement and independently review slice 2.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| JSON resolver output owns identity | plan L1 | Workflow must not reread root version. |
| Payload uses git + GitHub relations | plan L5/L6 | No plan/wave membership input exists. |
| Drift is target scoped | plan L4 | Prevents unrelated historical pre-surface failure. |
| Live cuts remain external | user close-gate instruction | No pre-ticking or override. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-canary-label-surface--1121/*` | new | Plan/design bootstrap only. |
| `.llm/tools/release/canary.ts` | changed | Emits resolver-owned JSON identity; shares ref-name construction. |
| `.llm/tools/release/canary_test.ts` | changed | Covers parse/result identity. |
| `.github/workflows/release-canary.yml` | changed | Consumes JSON with fail-closed extraction. |
| `.llm/tools/release/release-canary-workflow_test.ts` | changed | Pins artifact consumption and bans `deno.json` in the cut step. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS (slice 1) | focused tests 15/15; non-empty 32-file check/lint/fmt wrapper artifacts |
| Fitness | PASS (slice 1 identity) | workflow cut step has no `deno.json`; JSON version is resolved canary |
| Runtime | NOT_RUN | live canaries external |
| Consumer | NOT_RUN | workflow test planned |

## Open Questions

- Live canary evidence remains an operational prerequisite for final close-gate readiness.

## Drift and Debt

- Drift: sibling-checkout trace location; Codex entry supervisor route; formal evaluator credential
  unavailable and owner-waived under #1087; ordinary-review configured model id unavailable, with
  native `opus` resolving to Claude Opus 5.
- Debt: none.

## Commits

- See the draft PR's commit list + per-slice PR comments.
