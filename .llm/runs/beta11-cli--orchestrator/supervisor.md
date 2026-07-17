# Supervisor Identity — beta11-cli--orchestrator

Written at run start per `workflow/lane-policy.md` § Supervisor identity. A run dir without this
file is not activated. Other supervisors cross-peek a run by reading this file — it is how a run's
operating identity is discoverable without chat memory.

| Field | Value |
| --- | --- |
| Model | Claude Fable 5 (`claude-fable-5`) · effort low |
| Session | `86d308d5-c761-4e5d-a41f-8be959bc46d2` (pre-assigned in kickoff.md) |
| Host | WSL2 Linux / user `codex` |
| Checkout | `/home/codex/repos/netscript-beta10-cli` |
| Worktree | (per-slice worktrees via agentic suite; none yet) |
| Branch | supervision from `plan/rfc-single-deployment` (RFC record branch — DO NOT build on it); work branches re-baselined from `origin/main` |
| Baseline | `origin/main` @ `ca72db14` (2026-07-17) |
| Run ID | `beta11-cli--orchestrator` |

## Mission

Ship milestone 13 — `0.0.1-beta.11`: Desktop Frontend wave (epic #840: #841 SDK auto-update
wrapper, #842 oRPC MessagePort bindings, #843 fresh-ui desktop components, re-scoped
#452/#456/#457) + #826 aggregate-health fix + #824 unified-runtime seed run (drafts-only until
owner ratification). GitHub milestone 13 is the single source of truth.

## Routes in force

| Task lane | Provider / model / effort | Role in this run |
| --- | --- | --- |
| `planning_decisions` | Claude · Anthropic · Fable 5 · low | this supervisor session |
| `light_implementation` | Codex · OpenAI · GPT-5.6 Sol · low | default implementation workhorse (Codex limit RESET 2026-07-17, unrestricted) |
| `normal_implementation` | Codex · OpenAI · GPT-5.6 Sol · medium | research-heavy slices |
| `complex_implementation` | Codex · OpenAI · GPT-5.6 Sol · high | new-feature/complex slices (#841/#842/#843 cores) |
| `review_codex*` ladder | Fable/Opus per effort-paired ladder | Tier-A slice reviews (supervisor-triggered) |
| `formal_evaluation` | Claude · OpenRouter · qwen/qwen3.7-max (`claude-openrouter`/`claude-print`) | PLAN-EVAL / IMPL-EVAL, separate sessions, open models ONLY |
| `chore_code` | Claude · Anthropic · Opus 4.8 · medium | delegated code chores |
| `documentation_review` | Claude · Anthropic · Sonnet 5 · high | docs/cleanup chores |

Reference `.llm/harness/workflow/lane-policy.md`; do not copy its complete route table here.

## Stop-lines (from kickoff.md — repeated verbatim in every sub-agent brief)

1. NO merge to `main` for any PR without BOTH CI green AND an opposite-family eval PASS recorded
   on the PR, and merge authorization per the harness flow.
2. HARD STOP before any release publish (`release:cut`, JSR publish, tag push, canary or stable)
   — owner sign-off in-turn only; a stale or relayed approval does not count.
3. HARD STOP before closing milestone 13 — owner sign-off only.
4. These stop-lines are repeated verbatim in EVERY sub-agent brief (implementation, evaluator,
   seed-run — all). A sub-brief without the stop-lines section is invalid.
5. The #824 seed run is drafts-only until owner ratification; its board filing needs the owner
   in-turn.
