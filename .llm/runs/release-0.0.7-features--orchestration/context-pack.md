# Context pack — NetScript 0.0.7 features lane

Status as of 2026-08-15: PLAN-EVAL cycle 2 for PR #1651 returned **`PASS`**; the plan gate is
closed and the leaf is in **implementation (S1, RFC authoring)** on the resumed Codex author thread.

## Control

`topic-features-0.0.7` is now a native Claude Opus 5 / high Remote Control supervisor —
session `19621a0b-c6a0-47c6-b826-93c1634a6875`, bridge `session_01LQBHX8KpA5aYtDraq46J8a`,
PID `2430404`, cwd `/home/codex/repos/netscript-007-features`. Requested and observed routes match
(`supervisor.md` § Controller reset). The historical Codex topic thread
`019ffcc0-e1d2-7850-a308-354b670c6f3d` is parked at `TOPIC_CONTROLLER_PARKED` and preserved; it is
never resumed as a controller. Merge, publish, scope, relabel, issue-close, and central cluster
state remain with `codex-root-0.0.7`.

## Lane state

- Live `origin/main` = `01e0960494c95ce56eb35892c211a095eb13e6ed`, still the immutable dispatch base.
- Topic branch `orchestrator/release-0.0.7-features` carries orchestration evidence only.
- Sole active leaf: `rfc-plugin-cli-contribution` (#1502), draft PR **#1651**, head
  `12276e6d86403ed1340ef79a963e87d401d643e9`, base `main`, exactly one lifecycle label
  `status:plan-eval`, 0 review threads, 0 current CI failures (all checks `skipped` — D-6).
- Leaf worktree `/home/codex/repos/netscript-007-features-1502` on `docs/rfc-plugin-cli-contribution`
  is clean at that head with no upstream and no active agent.
- Author thread `019ffcc5-d3e1-7c13-9815-e9956ec43683` is idle with its plan-fix pushed and
  reconciled. Steering is `codex exec resume 019ffcc5-d3e1-7c13-9815-e9956ec43683 -- "<follow-up>"`
  via `.llm/tools/agentic/codex/codex-resume.ts`. Never fire a second `send-message-v2` at that
  worktree. Its turn ended without a `task_complete` marker — read idle from `codex-status`, not
  `codex-watch --mode turn` (D-5).
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

## Implementation phase

Leaf head is now `3e0c8858b4a2552926d2965b62cbcc97a15c2935` (verdict commit). PR #1651 moved
`status:plan-eval` → `status:impl` under explicit coordinator grant; it stays **draft**.

Authoring runs on the **existing** Codex thread `019ffcc5-d3e1-7c13-9815-e9956ec43683` — resumed,
never replaced. Steering is `.llm/tools/agentic/codex/codex-resume.ts --thread-id
019ffcc5-d3e1-7c13-9815-e9956ec43683 --message …`; never fire a second `send-message-v2` at that
worktree. Slices S1–S4 are bounded, each with structured receipts and a Tier-A stop before the next.

Standing prohibitions: no merge, no publish, no ready-flip, no expensive-gate lease
(`scaffold.runtime` is forbidden for this leaf), no package/plugin source mutation, no issue filing,
no `#1348` mutation, no central cluster-state change. IMPL-EVAL is a separate fresh opposite-family
session after S4 and Tier-A review.

## Open drift

D-1 (Codex leaf mobile visibility unproven — deliberately not repaired, sibling blast radius),
D-2 (contract/scope resolution, superseded route note), D-3 (Claude CLI 2.1.233 vs 2.1.231),
D-4 (#1502 still `status:research` — reported; this lane's relabel grant covers PR #1651 only),
D-5 (missing `task_complete` marker on the author thread — read idle from `codex-status`),
D-6 (`pr-checks PASS` is an all-`skipped` set, not gate evidence),
D-7 (a watcher exit is a wake signal only; verdicts come from committed artifacts).
