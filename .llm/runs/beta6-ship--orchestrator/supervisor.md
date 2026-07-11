# Supervisor Identity — beta6-ship--orchestrator

- **Model**: Claude Fable 5 (low effort) — mobile orchestration lane per lane-policy (Fable 5 · low)
- **Session**: `fb43bc3e-0bf9-421f-aa52-e02940d7b703` (`claude attach fb43bc3e`)
- **Host**: WSL2 (native ext4)
- **Checkout/worktree**: `/home/codex/repos/netscript-547-lffix/.claude/worktrees/beta6-ship-orchestrator`
- **Branch**: `worktree-beta6-ship-orchestrator`
- **Baseline**: `b13ca0fa` (origin/main, epic #574 "WSL-first agentic runtime and GPT-5.6 routing")
- **Run shape**: supervisor run (multi phase-group: telemetry T6/T8/@hono-otel, ai-stack FB5/FAI-9,
  cli-e2e coverage, release gates)

## Lane table (per `.llm/harness/workflow/lane-policy.md`)

| Lane | Route |
| --- | --- |
| Supervisor / orchestration | Claude · Fable 5 · low (this session) |
| Implementation slices | Codex · OpenAI · GPT-5.6 Sol · medium (WSL Codex daemon, mobile-visible) |
| Small fixes | Codex · OpenAI · GPT-5.6 Luna · max |
| Review of GPT implementation | Claude (this supervisor, substantive review) |
| Review of Claude-authored work | Codex · GPT-5.6 Sol · xhigh |
| External evaluator (PLAN-EVAL/IMPL-EVAL) | **OWNER-WAIVED this run** — recorded as drift D1 |

## Overrides
- Evaluator dispatch waived by owner (drift D1 in agentic-workflow-eval.md).
- Hard stop: release-ready only; no publish.
