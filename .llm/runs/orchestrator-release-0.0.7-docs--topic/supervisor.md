# Supervisor identity — topic-docs-0.0.7

| Field | Value |
| --- | --- |
| Role | Claude topic orchestrator, `docs` lane |
| Coordinator | `codex-root-0.0.7` (`/home/codex/repos/netscript-547-lffix`, run `release-0.0.7--orchestration`) |
| Route | native Claude Sonnet 5, low effort |
| Worktree | `/home/codex/repos/netscript-007-docs` |
| Branch | `orchestrator/release-0.0.7-docs` (no upstream by design; push by explicit refspec only) |
| Preserved parked Codex topic thread | `019ffcc0-e19b-71d1-95ce-8c72559eb026` (parked, never resumed as topic controller) |
| Leaf | `comparison-docs-programme`, PR #1652, exact head `d35cbca30872d1f55118d63437638e93270c2ac3` |
| Leaf worktree | `/home/codex/repos/netscript-007-docs-comparison` |
| Formal hold | fresh PLAN-EVAL cycle 1 required; reset dispatch order 6 (`briefs/reset-gates/dispatch.json`, coordinator run) |

## First-turn reconciliation (2026-08-15)

- Topic worktree/branch clean at exact `main` `01e096049` — matches the coordinator's parked-state
  record for this lane.
- Leaf worktree `/home/codex/repos/netscript-007-docs-comparison` clean at exact recorded head
  `d35cbca30`.
- PR #1652 ("docs(positioning): seed the Next.js comparison programme"): `OPEN`, draft, mergeable,
  head `d35cbca30872d1f55118d63437638e93270c2ac3` — matches dispatch entry order 6 exactly. All
  status checks are `SKIPPED` (draft-gated), no failures, no drift from the coordinator's dispatch
  record.
- No local supervisor/worklog/context/drift artifacts existed yet in this topic run directory
  (fresh reset); initialized them this turn.
- No leaf or evaluator launched this turn. Order-6 dispatch (PLAN-EVAL cycle 1 for
  `comparison-docs-programme`) has not been granted by the coordinator; concurrency cap in
  `dispatch.json` is 1 globally across all six entries and this lane's turn has not been called.

## Standing control laws (from topic-claude-reset-common.md)

- Supervise only; no product/docs/tooling edits in this worktree.
- Never resume the parked Codex thread `019ffcc0-e19b-71d1-95ce-8c72559eb026` as a controller.
- One evaluator globally at a time, native Claude Sonnet 5 only, fresh session per gate, opposite
  family from the WSL Codex generator.
- No merge, publish, ready-for-review, relabel, issue-close, milestone-scope, or release-writer-lease
  actions from this lane.
- Await explicit coordinator grant of dispatch order 6 before launching the PLAN-EVAL evaluator for
  PR #1652.
