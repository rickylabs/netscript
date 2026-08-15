# Context pack — NetScript 0.0.7 features lane

Status as of 2026-08-15: the #1502 leaf has a terminal **IMPL-EVAL `PASS`**, conditional on one
body-only correction that is **not yet applied**. PLAN-EVAL cycle 2 passed, slices S1-S4 are
implemented and Tier-A signed off. Nothing is running in this lane. Merge and the ready-flip belong
to the coordinator.

## Control

`topic-features-0.0.7` is now a native Claude Opus 5 / high Remote Control supervisor —
session `19621a0b-c6a0-47c6-b826-93c1634a6875`, bridge `session_01LQBHX8KpA5aYtDraq46J8a`,
PID `2430404`, cwd `/home/codex/repos/netscript-007-features`. Requested and observed routes match
(`supervisor.md` § Controller reset). The historical Codex topic thread
`019ffcc0-e1d2-7850-a308-354b670c6f3d` is parked at `TOPIC_CONTROLLER_PARKED` and preserved; it is
never resumed as a controller. Merge, publish, scope, relabel, issue-close, and central cluster
state remain with `codex-root-0.0.7`.

## Lane state

- Live `origin/main` = `0b3ed5d5a6aea451318f120988c25dfa3993a2ab`. It has **advanced** past the
  immutable dispatch base `01e0960494c95ce56eb35892c211a095eb13e6ed`, which PR #1651's `base.sha`
  still records. The leaf disclosed the advance; the IMPL-EVAL tested the claim that it does not
  invalidate the RFC's coupling findings and confirmed it holds.
- Topic branch `orchestrator/release-0.0.7-features` carries orchestration evidence only.
- Sole leaf: `rfc-plugin-cli-contribution` (#1502), draft PR **#1651**, branch head
  `0e302ad3a5915b7a820adcac0a9d5bdc2d7d0019` (the IMPL-EVAL verdict commit), exactly one lifecycle
  label `status:impl`, 0 review threads. Evaluated final head was `04d431028…`; every binding gate
  attests content head `120859d5c…`.
- Leaf worktree `/home/codex/repos/netscript-007-features-1502` is clean at the branch head with no
  upstream and no active agent.
- Author thread `019ffcc5-d3e1-7c13-9815-e9956ec43683` is idle with all work pushed. Steering is
  `.llm/tools/agentic/codex/codex-resume.ts --thread-id 019ffcc5-… --message …`. Never fire a second
  `send-message-v2` at that worktree. An earlier turn ended without a `task_complete` marker — read
  idle from `codex-status`, not `codex-watch --mode turn` (D-5).
- `rfc-a-stage0-ratification-board` (#1348) stays a coordinator-only checkpoint with no leaf PR.

## Closed gate — PLAN-EVAL cycle 2 `PASS`

Granted at coordinator head `168715e27` (per-topic evaluator queues), dispatched after four-source
head re-verification, verdict `PASS` at `plan-eval.md:205`, evaluated head `12276e6d8…`, verdict-only
commit `3e0c8858b` (adds `plan-eval-cycle-1.md`, rewrites `plan-eval.md`, nothing else). Evaluator:
session `28cc8106-967b-4fb7-90f3-dd95054ae953`, bridge `session_01D7t8efMh88nwR2PazUPkC1`, PID
`2463708`, native Claude Opus 5 · medium, requested = observed. Cycle 2 was the second and final
cycle; the plan gate is closed and no third cycle exists.

Four non-blocking notes are S1 obligations, not gate blockers: **N-1** cite the durable narrowing
authority (`briefs/topic-features/implement.md`, commit `8775be7b3`) and state that
`leaf-contracts.json` was not edited; **N-2** correct the leaf's stale Fable 5 evaluator route in
`plan.md` and the leaf `supervisor.md`; **N-3** name the `PluginCliResult` collision with the live
`@netscript/plugin/cli` export and its migration disposition; **N-4** the contracted receipts attest
`d71b78c3…`, so the S4 final-head rerun is what binds for IMPL-EVAL.

## Implementation phase — complete

| Field | Value |
| --- | --- |
| Final head | `04d431028c1fe455dc18c05e3fa0779e7b593046` |
| Content head (attested by every binding gate) | `120859d5c762706702cd45a3f2be19664e335e22` |
| Deliverable | `rfcs/0000-plugin-cli-contribution.md`, Draft/0000 |
| PR #1651 | open **draft**, exactly one `status:impl`, 0 review threads, 0 current CI failures |
| Binding evidence | six contracted gates all `PASS` at the content head; sufficiency independently recomputed `SUFFICIENT` |
| DoD | 9/10; the only open box is IMPL-EVAL `PASS` + Tier-A completion |
| Acceptance | five entries, 0 `PENDING`, `Closes #1502` intact |

Slice history and Tier-A outcomes: S1 `CHANGES_REQUESTED` (F1 undeclared diagnostic-code type, F2
shallow-vs-deep readonly, F3 handler-ref traversal) → fixed → accepted; S2 accepted with S2-N1
(a grant field whose non-empty case could never occur) and S2-N2 carried; S3 accepted with no
findings, both carried notes closed; S4 `CHANGES_REQUESTED` (S4-F1 unreproducible sufficiency claim)
→ fixed via remedy (b) → accepted. Reviews are in `slices/tier-a-review-1502-s1.md` and
`slices/tier-a-review-1502-s4.md`; briefs in `slices/impl-1502-*.md`.

The Codex author thread `019ffcc5-d3e1-7c13-9815-e9956ec43683` is **idle** with all work pushed.
If it must be steered again, resume it — `.llm/tools/agentic/codex/codex-resume.ts --thread-id
019ffcc5-d3e1-7c13-9815-e9956ec43683 --message …` — and never fire a second `send-message-v2` at
that worktree.

## IMPL-EVAL — terminal `PASS`, conditional

Verdict `PASS` at `evaluate.md:380`, verdict-only commit `0e302ad3a` (touches `evaluate.md` alone),
evaluated final head `04d431028…` / content head `120859d5c…`. Evaluator: fresh session
`2a8cf0a6-7529-4ca6-97ce-69edcca3f84d`, bridge `session_01Y48WxcCgzUAWfJmGmhBykc`, PID `2718910`,
native Claude Opus 5 · high · Remote Control, requested = observed, opposite-family to the Codex
author. It relabelled nothing and did not flip the PR.

**One correction is outstanding and blocks merge by the verdict's own terms.** The PR body's `check`
row cites "1,033 files, 9 batches, 0 failed" against `check-final.json`, but that receipt has
`stdout.bytes: 0` and carries no figures at all; the numbers come from `check-cli-plugin-cycle1.json`
— a cycle-1 receipt at a different head. The fix must **drop or relabel** the figures, not merely
re-point the citation, because no final receipt supports them. Body-only: changes no head, no
receipt, no RFC content.

## Next actions belong to the coordinator

1. **Land the body correction** (or grant this lane to dispatch it) — the verdict is conditional on it.
2. **Decide the ready-flip and merge** — the PR stays draft at `status:impl`. Draft→ready is itself
   an automation trigger, so sequence it deliberately.

Standing prohibitions for this lane are unchanged: no merge, publish, ready-flip, relabel beyond the
PR #1651 grant already exercised, issue filing, `#1348` mutation, central cluster-state change, or
expensive-gate lease. `scaffold.runtime` was never run and remains forbidden for this leaf.

## Open drift

D-1 (Codex leaf mobile visibility unproven — deliberately not repaired, sibling blast radius),
D-2 (contract/scope resolution, superseded route note), D-3 (Claude CLI 2.1.233 vs 2.1.231),
D-4 (#1502 still `status:research` — reported; this lane's relabel grant covers PR #1651 only),
D-5 (missing `task_complete` marker on the author thread — read idle from `codex-status`),
D-6 (`pr-checks PASS` is an all-`skipped` set, not gate evidence),
D-7 (a watcher exit is a wake signal only; verdicts come from committed artifacts).
