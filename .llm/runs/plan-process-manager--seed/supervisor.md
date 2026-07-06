# Supervisor Identity — plan-process-manager--seed

Written at run start per `workflow/lane-policy.md` § Supervisor identity. A run dir without this
file is not activated. Other supervisors cross-peek a run by reading this file — it is how a run's
operating identity is discoverable without chat memory.

| Field | Value |
| --- | --- |
| Model | Claude Fable 5 (`claude-fable-5[1m]`) |
| Session | `1e66850d-1c97-4549-b3fb-16e8a34fbc77` · https://claude.ai/code/session_01LqzindaMqYAgt3Dxcti6vD |
| Host | Windows 11 Home 10.0.26200 · user `chaut` |
| Checkout | `C:\Dev\repos\netscript-framework` |
| Worktree | `C:\Dev\repos\netscript-framework\.llm\tmp\wt-process-manager` |
| Branch | `plan/process-manager` |
| Baseline | `317e4b50` (origin/main, 2026-07-06 — the 0.0.1-beta.5 cut commit, PR #503) |
| Run ID | `plan-process-manager--seed` |

## Lane table in force

| Tier | Binding | Role in this run |
| --- | --- | --- |
| A | Fable 5 feature supervisor (this session) | orchestration, synthesis (Stage C), plan lock (Stage E), triage (Stage F), GitHub surface, sign-off commits |
| B | Opus 4.8 sub-agents (Agent tool, high effort) | Stage-D deep-dive design packs; heavy research analysis |
| C | Sonnet-5-high dynamic Workflows | Stage-B discovery corpus fan-out (repo + docs + market); every `workflow.js` committed under `<run-dir>/workflows/` **before** execution |
| D | WSL Codex GPT-5.5 (daemon-attached) | Stage-F adversarial reviewer (distinct model from all authoring lanes A/B/C) |
| E | OpenHands minimax-M3 (separate session) | Stage-G PLAN-EVAL verdict of record |

## Recorded lane/eval overrides

- **2026-07-06 — Stage-F reviewer: Tier D → OpenHands qwen-3.7-max (blocked-lane fallback).**
  The Tier-D launch executed correctly (managed daemon, thread
  `019f36de-ef6d-7f33-80dc-bc3823cfe1af`, worktree `/home/codex/worktrees/pm-stage-f`,
  push-safety green) but the turn failed in 3.5s: ChatGPT usage limit exhausted, resets
  2026-07-07 03:52 (`usageLimitExceeded`, `will_retry: false`). Unblocking Codex credits needs the
  USER. Stage F's hard requirements are unoriented + separate session + distinct-from-authors
  model — the tier is per-run configuration (seed-run.md § Stage F). Fallback reviewer:
  **OpenHands qwen-3.7-max** (separate session via the GitHub Action on PR #504; distinct from
  authoring lanes A Fable 5 / B Opus 4.8 / C Sonnet 5 AND from the Stage-G evaluator minimax-M3,
  preserving generator ≠ evaluator across all stages). Authorized under the standing autonomous
  mandate (a blocked lane must not park the run); the owner may additionally re-run Tier-D Codex
  after credit reset if a second adversarial pass is wanted.

Otherwise defaults per `lane-policy.md`. Seed run is planning-only: no implementation
lanes are dispatched by this run (Stage I hands off briefs only).
