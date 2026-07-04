# Context Pack — Agentic Workflow Doctrine V3

**Mission**: codify harness V3 — tiered agent model (Fable supervisor / Opus research /
Sonnet-5 Workflows batch / WSL Codex impl), adopt #306's proposed doctrine, draft-PR-on-start with
stage labels, tracked run dirs, epic/sub-issue standard, drop commits.md, prune stale
skills/tools/harness docs, make `.llm/tools` wrappers mandatory. Everything reviewable from
GitHub + mobile without cloning.

**State**: PLAN-EVAL PASS (OpenHands minimax-M3; `plan-eval.md`). Implementation IN FLIGHT under the
D3 lane override (all slices S2–S8 = Opus 4.8 sub-agents; Fable 5 supervises). **S2 LANDED**
(`f33141fd`): new `.llm/harness/workflow/lane-policy.md` + `netscript-harness` SKILL re-baselined to V3.

- Branch: `feat/agentic-workflow-doctrine-v3` @ base `1b42ba88` · worktree `.llm/tmp/wt-harness-v3`
- Doctrine issue: #306 (adopt) · related: #305 (boundary, framework doctrine), #387 (closure guardrail)
- Epic: #389 · Draft PR: #390 · stage label `status:impl`
- Phase: research + plan + PLAN-EVAL PASS [done] → **slices S2–S8 in flight** (design §8)
- Slice map: **S2 lane-policy [DONE]** · **S3 run-dir move [DONE]** · S4 drop commits.md ·
  S5 GitHub-surface/#387 · S6 tooling mandates+aliases · S7 scrub+frontmatter+fitness-gates ·
  S8 residue+ARCHETYPE-5+eval
- Drift: D1 (tracked run dirs `.llm/runs/`) · D2 (no commits.md) · D3 (Opus-sub-agent impl lane) ·
  D4 (plan-eval.md transcribed) · D5-slice-review-gate (A1 permanent lane-agnostic review gate)

**Resume**: read `supervisor.md`, `worklog.md`, `drift.md`, then latest phase artifact.
