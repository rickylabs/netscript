# Context Pack: #1046 run-owned teardown

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1046-run-owned-teardown--enforced-teardown` |
| Branch | `fix/1046-run-owned-teardown` |
| Current phase | `implement` |
| Archetype | `6 — CLI / tooling` |
| Scope overlays | `docs` |

## Current State

Research F1–F10 and locked decisions D1–D8 are approved by the existing supervisor PLAN-EVAL PASS.
The implementation thread is attached to this worktree. Slice 1 is being completed by restoring the
mandatory Design and resumability artifacts omitted from the bootstrap commit.

## Completed

- Research, locked plan, supervisor identity, implementation brief, and PLAN-EVAL PASS.
- Draft PR #1047 exists for the branch.

## In Progress

- Slice 1 harness artifact completion, followed by slices 2–11 in the approved order.

## Next Steps

1. Commit/push/comment slice 1 and verify local/remote SHA equality.
2. Add red ownership tests, implement the pure classifier, and run focused wrapper/test gates.
3. Continue registry, probes, reporting, teardown, enforcement, E2E default, and discoverability.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Fail closed | `plan.md` D1–D2 | `foreign` and `unproven` are never actionable. |
| Per-resource mutation only | `plan.md` D3 | No bulk stop/removal form is expressible. |
| Registry identity uses PID + start time | `plan.md` D1 | Bare PID matches never prove ownership. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `worklog.md` | new | Design checkpoint and evidence ledger. |
| `context-pack.md` | new | Resumable implementation state. |
| `drift.md` | new | Append-only process drift. |
| `codex-thread-ids.md` | new | Daemon-attached implementation identity. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | pending | Per-slice wrapper/test commands will be recorded in `worklog.md`. |
| Fitness | N/A | No package/plugin source changes. |
| Runtime | pending | Fixture tests and read-only host leak check. |
| Consumer | pending | Dogfood task; base may not yet contain PR #1034 assets. |

## Open Questions

- Whether the base bundle can evidence all of `aspire`, `deno`, and `help.md`; if not, PR acceptance
  box 5 remains unticked and the PR body states the gap.

## Drift and Debt

- Drift: bootstrap omitted three mandatory artifacts; repaired before implementation.
- Debt: none.

## Commits

- See draft PR #1047 plus per-slice comments.

