# PLAN-EVAL cycle 1 — identity and transport, recorded BEFORE launch

| Field | Value |
| --- | --- |
| Cycle | **1** (first formal PLAN-EVAL for this leaf) |
| Target | issue **#1112**, draft PR **#1711** |
| Immutable plan head | `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a` — verified local == remote == PR, clean |
| Base | `main@cf648f1ff973d74c213bb125a6f5f5b9328e693b` |
| Central checkpoint | `d050b73990dcb9ad1af2a37cd4109a2567e98b8d` (reachable commit) |
| Generator (author) | Codex `01a047f1-56bf-7060-b9c4-dbc5dc4ad2a8`, `openai` · `gpt-5.6-sol` · high — **idle, not resumed** |
| Evaluator family | native **Claude** — opposite family to the GPT-5.6-SOL author |
| Requested route | `claude-fable-5` · effort **medium** · Remote Control **required** |
| providerEnv | **empty** (no OpenRouter or relay transport) |
| Transport | daemon / background route |
| Evaluator worktree | `/home/codex/repos/netscript-007-eval-1711` — detached, evaluator-only, at the exact head |
| Brief | `briefs/1711-plan-eval/plan-eval.md`, 6142 bytes, sha256 `1db6bebaba04d96c…` |

**Generator ≠ evaluator** holds by construction: the author is Codex and is not resumed for this cycle;
the evaluator is a fresh native Claude session in its own worktree and never enters the author's.

**Preconditions verified before launch:** plan head identical three ways, worktree clean, author idle,
Docker **0** containers, no runtime lease held by this lane.

Observed route will be recorded below after launch, proven from process argv rather than from the
session registry — the registry has been observed reporting `model: null` / `effort: null` while argv
carried the correct flags, so argv is the authority here.

## Observed route — after launch

| Field | Value |
| --- | --- |
| Evaluator OS PID | `247931` |
| Session id | `f3d30077-c9a7-4727-9d55-c391c1a08604` |
| cwd | `/home/codex/repos/netscript-007-eval-1711` — the dedicated evaluator worktree |
| Name | `NetScript 0.0.7 #1711 PLAN-EVAL c1` |
| Observed argv | `--model claude-fable-5 --effort medium --remote-control --permission-mode bypassPermissions` |
| Route verdict | **matched** — requested `claude-fable-5` · medium · Remote Control |
| Brief delivery | verified **present in argv** as the positional prompt, not swallowed by a variadic flag |
| providerEnv | launched with `OPENROUTER_API_KEY` and `OPENAI_API_KEY` unset — **empty**, no relay transport |

Route was proven from `/proc/247931/cmdline`, **not** from the session registry. That distinction is
load-bearing in this lane: the registry has been observed reporting `model: null` / `effort: null` while
argv carried the correct flags, so a registry read alone would not have established the route.

**Remote Control bridge: not yet attached at the time of this record.** `bridgeSessionId` is still
`null` after ~30 s of polling. The `--remote-control` flag is present and proven in argv; the bridge
session had not registered yet. This is reported as observed rather than assumed, and the bridge id and
Remote Control URL are appended below once the bridge registers.

## Attempt 1 — INTERRUPTED, no verdict produced

The Remote Control bridge never registered. `bridgeSessionId` stayed `null` past two minutes, so the
mandatory attachment gate was **not** satisfied. The `--remote-control` argv flag alone does not
satisfy it — that was this topic's error in treating a proven flag as proven attachment.

**Root cause:** attempt 1 was launched with a raw `nohup claude …`. That starts a session but does
**not** register a background job, which is what produces the job id, bridge session id, and Remote
Control URL. `.agents/skills/claude-manager/SKILL.md:36` specifies `claude --bg` for non-blocking
launches, and `:49-50` requires "the launcher's registry evidence (matching PID and cwd plus a
non-empty `bridgeSessionId`) before claiming attachment". The nohup route cannot produce that evidence.

**Verified before stopping — no work was lost:**

| Check | Result |
| --- | --- |
| PID `247931` identity | argv and `--name` matched the #1711 evaluator exactly; parent `247929` was this topic's own wrapper |
| Verdict artifact | **none** — `plan-eval.md` absent from the evaluator worktree |
| Worktree state | **clean** at `069fd3e9175d28aaaf1b8c836e35d1f9bbbaa42a`, nothing written or committed |
| PR #1711 comments | **zero** — nothing posted |

Stopped exactly `247931` and its exact wrapper `247929`, plus this topic's own stale bridge-watcher
`250224`. Confirmed no other `#1711 PLAN-EVAL` process survives, so two evaluators never coexisted.

The pre-launch identity and brief commits are **preserved unchanged**; this section is appended, not
substituted. The immutable plan head is untouched.
