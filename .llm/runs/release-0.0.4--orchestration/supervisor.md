# Supervisor — NetScript 0.0.4 release orchestration

| Field | Value |
| --- | --- |
| Run id | `release-0.0.4--orchestration` |
| Supervisor model | Claude Opus 5 (orchestrator lane) |
| Host | WSL2 Linux 6.18.33.2, `/home/codex/repos/ns-004` |
| Branch | `release/0.0.4` (no upstream at run start) |
| Baseline | `f663fe0e4` — `fix(agentic): root Antigravity runs at the requested cwd (#1063)` |
| Milestone | `0.0.4` (number 22) |
| Started | 2026-08-03 |
| Shape | Supervisor run — one supervisor per PR, each PR closing a group of linked issues |

## Role boundary

The supervisor delegates, verifies and consolidates. It does not implement. Implementation routes to
Codex via `agentic:launch-codex-slice`; documentation routes to Gemini 3.6 Flash by owner decision
(2026-08-03); formal evaluation, where genuinely needed, routes to the bound open-model evaluator
lane in a session separate from the generator. The merge decision is the supervisor's.

## Lane assignments

| Slice | PR | Issues | Lane | Effort |
| --- | --- | --- | --- | --- |
| `slices/sagas` | PR-A | #1064 #1065 #1066 | Codex · `gpt-5.6-sol` | high |
| `slices/plugins` | PR-B | #1067 #1014 #1015 #1017 #1022 | Codex · `gpt-5.6-sol` | medium |
| `slices/agentic` | PR-G | #1074 #1056 #1048 #1004 | Codex · `gpt-5.6-sol` | medium |
| `slices/docs` | PR-C | #1068 #1069 #1070 #1020 | Gemini 3.6 Flash (`google/gemini-3.6-flash`) | — |
| `slices/scaffold` | PR-D | #1071 #1072 #1073 #1024 #1061 | Codex · `gpt-5.6-sol` | high |
| `slices/hygiene` | PR-E | #1016 #1021 #1039 | Codex · `gpt-5.6-sol` | low |
| _pending_ | PR-F | #1011 #1012 | Codex · `gpt-5.6-sol` | medium |
| _pending_ | PR-H | #1013 | Codex · `gpt-5.6-sol` | medium — sequenced after PR-A |
| _pending_ | — | PRs #778, #775 | disposition review | — |

Waves: **1** = A, B, G (dispatched). **2** = C, D, E. **3** = F, H, and the #778/#775 disposition.
Concurrency capped at three supervisors — the machine is shared with live wave-four demo runs.

## Decisions recorded at run start

1. **`qwen/qwen3.8-max` does not exist.** The briefing named "Qwen 3.8 max" for evaluation; the live
   OpenRouter registry's newest Qwen max is `qwen/qwen3.7-max`, which is what `lane-policy.md` and
   `config/models.ts` already bind. **No change made.** The discrepancy was an off-by-one, not a
   policy gap.
2. **Gemini documentation lane is now policy, not an open question.** `google/gemini-3.6-flash`
   verified present on OpenRouter. `lane-policy.md` currently records a distinct Gemini lane as an
   owner open question; PR-G replaces that paragraph with a dated decision record and adds the
   binding in `config/`. Gemini is a **generator** lane only — the formal evaluator lane remains
   open-models-only, unchanged.
3. **Three issues moved out of 0.0.4 to 0.0.5**: #829 (compile-able plugin `./services`
   entrypoints), #742 (saga definition versioning), #734 (dashboard-panel manifest axis). All
   `wave:v1` feature work, epic-shaped, none repairing a known-broken primitive. Rationale commented
   on each issue.
4. **#1074 filed** — `repair codex-remote` is permanently refused by dead session rollouts, and
   `agentic:codex-status` misreports `appServerProcesses`. Found while doctoring the runtime for this
   run; assigned to PR-G. In scope because 0.0.4 exists partly to make the harness earn its place.

## Environment at run start

`agentic:runtime doctor --json` returned `degraded` — `codex-app-server unavailable`,
`codex: blocked`. `repair codex-remote --dry-run` refused with `active_session` despite state
`absent` (no app-server process, no control socket). Root cause read from source, not inferred:
`recentActiveSessions()` in `runtime/adapters/local-codex-remote-adapter.ts:31` counts any recent
session rollout whose tail lacks `"type":"task_complete"` as active, so killed sessions wedge the
repair path permanently. Daemon brought up with `codex app-server daemon start` (additive — socket
absent, no app-server processes, wave-four runs no Codex). Doctor then returned `no_change`, zero
diagnostics, `codex: available`. Defect filed as #1074.

## Shared-machine constraints

Live wave-four demo runs occupy `/home/codex/repos/wave4-deepseek`, `wave4-fable` and `wave4-grok`,
with resident aspire processes and `postgres-a3084932` / `redis-*` / `garnet-*` containers. Not
touched, not owned by this run. Ownership is proven by path containment before any teardown.
