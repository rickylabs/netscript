use harness

# Slice brief — #665: route-identity reports effort=Low despite requested medium

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-tools/SKILL.md`,
`.llm/tools/agentic/README.md` (runtime/RouteIdentity sections).

## Identity + ground rules

- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-665`, branch `fix/665-route-identity-effort`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-665`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-665 rev-parse HEAD` must start `955b4abf`.
- Push: `git -C /home/codex/repos/ns-b8-665 push origin HEAD:refs/heads/fix/665-route-identity-effort`.
- Worklog at `/home/codex/repos/ns-b8-665/.llm/runs/fix-665-route-identity--codex/worklog.md`.

## Task (issue #665 — read it first; acceptance boxes are the contract)

Every beta-7 `launch-codex-slice` launch reported `Observed route: effort=Low` vs requested
`medium` while passing `-c model_reasoning_effort=medium` to
`codex debug app-server send-message-v2`. Diagnose FIRST, with evidence in the worklog:

- Is the `-c model_reasoning_effort=<x>` config override actually applied to the child thread
  (inspect how send-message-v2 consumes `-c` overrides — check codex CLI behavior/docs/config
  precedence), or
- does the observed-identity probe (in `.llm/tools/agentic/runtime/` route-identity code) read the
  wrong scope (e.g. the daemon's default profile instead of the per-message override)?

Then fix the real side: requested effort actually applied AND observed identity matches. Third
acceptance box: a mismatch must escalate loudly — non-zero exit or explicit BLOCKED-style operator
action required, not a log line. Keep the escalation behind a flag default-on for launches
(`--allow-route-mismatch` opt-out is acceptable).

You are running INSIDE a live codex thread on this host — you can empirically probe config
precedence with `codex debug` subcommands read-only. Do NOT launch new long-running agent threads;
a short dry-run/probe invocation is fine.

## Validation (evidence in worklog)

- Root-cause evidence (probe output or code trace) recorded in worklog.
- Scoped check/lint on touched files; runtime unit tests green; add a unit test for the
  mismatch-escalation path.

## Done means

Root cause + fix + escalation + tests committed and pushed, worklog committed. Report "DONE" or
"BLOCKED: <why>".
