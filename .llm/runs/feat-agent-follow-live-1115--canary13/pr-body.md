Closes #1115

## Summary

- add `agentic:codex-follow`, a readable JSONL/pretty live stream resolved by thread id through the
  same shared resolver as `codex-watch`
- make `agentic:codex-status` report evidence-derived working, idle, stalled, dead, and refused
  states with model, effort, worktree, current reasoning, and commit/file artifacts
- include agy conversations in the same inventory using its worktree index and transcript, including
  dispatch issue, current step, non-zero command exits, and artifact evidence
- document both runtime layouts and the one-command supervisor workflow

## Harness

- Run: `.llm/runs/feat-agent-follow-live-1115--canary13/`
- Base: `canary/0.0.5-canary.13`
- Archetype: 6 — CLI/tooling
- PLAN-EVAL: `COMPOSED` per milestone-run D6
- Drift D1: owner addendum widened acceptance to agy; plan amended before provider implementation
- Lock hygiene: inherited `deno.lock` modification excluded

## Validation

- Codex/compatibility suite: 41 passed, 0 failed
- Focused state/failure/shared-lib suite: 89 passed, 0 failed
- scoped check/lint/fmt: clean
- real status proof: concurrent Codex lanes reported worktree, state, reasoning, and file artifact
- real agy proof: `--worktree /home/codex/repos/ns-quickstart` resolved one conversation with issue,
  current step, and commit
- real follow proof: a completed thread rendered RUN/EXIT/SAY/IDLE and exited

```acceptance-evidence
issue: 1115
entries:
  - box-index: 1
    evidence: "codex-follow append-stream test plus real thread transcript prove readable live reasoning, command, message, write, and terminal events."
  - box-index: 2
    evidence: "resolveCodexRollout is shared by codex-follow and codex-watch; newest exact-thread fixture passes."
  - box-index: 3
    evidence: "fake-clock reducer tests prove working, idle, stalled-for-N, dead, and refused from rollout events/recency rather than process presence."
  - box-index: 4
    evidence: "status fixtures and real mixed-fleet runs report each worktree plus clean-branch commit or dirty rollout file-write evidence."
  - box-index: 5
    evidence: ".llm/tools/agentic/README.md and .llm/harness/workflow/tooling.md document follow, status, Codex rollout records, and agy index/transcript layout."
  - box-index: 6
    evidence: "real agentic:codex-status runs answered state, worktree, current reasoning/step, and artifact for concurrent Codex and agy agents in one command."
```
