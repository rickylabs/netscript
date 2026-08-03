# Supervisor Identity — fix-1013-saga-send-spawn--1013

Written at run start per `workflow/lane-policy.md` § Supervisor identity.

| Field | Value |
| --- | --- |
| Model | Codex · OpenAI · GPT-5 (current root session) |
| Session | Current `/root` Codex session; product thread id is not exposed to the shell |
| Host | `YogaBook9i` · WSL/Linux · user `codex` |
| Checkout | `/home/codex/repos/ns004-sagasend` |
| Worktree | `/home/codex/repos/ns004-sagasend` |
| Branch | `fix/1013-saga-send-spawn` |
| Baseline | `ab0fa13fe5c92129761ebe4dc0246b979733ecaf` from `origin/main`, 2026-08-03 |
| Run ID | `fix-1013-saga-send-spawn--1013` |

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` | Owner-started Codex root session | Research, plan, and harness coordination |
| `normal_implementation` | Codex · OpenAI · canonical route from lane policy | Planned implementation after PLAN-EVAL |
| `review_codex` | Claude · Anthropic · canonical opposite-family route | Planned substantive slice review |
| `formal_evaluation` | Claude Code + OpenRouter · Qwen evaluation preset · `xhigh` | Required PLAN-EVAL and IMPL-EVAL |

## Recorded lane/eval overrides

- The owner started this run in Codex rather than the canonical Fable orchestrator lane. This file
  records that session identity; it does not waive evaluator separation or slice review.
- The local `formal_evaluation` route is blocked before launch: `agentic:provider-canary` reported
  `auth_required` because the OpenRouter credential is absent. OpenHands is prohibited for this
  local-machine run. No closed-model substitute is authorized.
