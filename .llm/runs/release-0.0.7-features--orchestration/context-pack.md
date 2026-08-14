# Context pack — NetScript 0.0.7 features lane

Status as of 2026-08-15 (Claude topic-supervisor reset, first turn): reconciled and **held**. No
evaluator, leaf, or authoring turn is running in this lane.

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

## The hold

The formal gate is **PLAN-EVAL cycle 2** for #1651, `briefs/reset-gates/dispatch.json` order 3:
fresh separate session, native Claude Opus 5 · **medium**, Remote Control enabled and recorded,
output `plan-eval.md` in `.llm/runs/docs-rfc-plugin-cli-contribution--1502`, preserving the cycle-1
verdict as `plan-eval-cycle-1.md`. Fable 5 is unassigned and needs a coordinator amendment; no
OpenRouter/DeepSeek/Minimax/AGY substitution. One evaluator globally at a time, serial across the
six reset entries — this lane's entry is third.

Do not dispatch it, and do not resume RFC authoring, until `codex-root-0.0.7` grants dispatch order
3. On grant: re-verify PR/branch head equals `12276e6d8…` and refuse on any mismatch. After a cycle-2
`PASS`, RFC authoring resumes on the same Codex thread; the leaf stays draft through Tier-A topic
review and a separate opposite-family IMPL-EVAL. Cycle 2 is the second and final PLAN-EVAL cycle
before escalation.

## Open drift

D-1 (Codex leaf mobile visibility unproven — deliberately not repaired, sibling blast radius),
D-2 (contract/scope resolution, superseded route note), D-3 (Claude CLI 2.1.233 vs 2.1.231),
D-4 (#1502 still `status:research` — reported, this lane cannot relabel), D-5 (missing
`task_complete` marker), D-6 (`pr-checks PASS` is an all-`skipped` set, not gate evidence).
