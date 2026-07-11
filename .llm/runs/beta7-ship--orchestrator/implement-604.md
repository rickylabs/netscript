use harness

# Slice brief — #604: classify Codex quota exhaustion as a machine-readable signal

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-tools/SKILL.md`,
`.agents/skills/codex-wsl-remote/SKILL.md`, `.llm/tools/agentic/README.md`.

## Identity + ground rules

- WSL Codex implementation agent under the beta-7 orchestrator (Claude session `df71d36c`).
  Do NOT open PRs. **PLAN-EVAL waiver** (owner-waived, drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-wt-604`, branch `feat/604-quota-exhausted-signal`.
- Push: `git push origin HEAD:refs/heads/feat/604-quota-exhausted-signal`.
- Worklog at `.llm/runs/feat-604-quota-signal--codex/worklog.md`, committed with the slice.

## Task (issue #604, pilot-eval I3/B4)

Quota exhaustion currently surfaces only as a CLI error string ("You have hit your usage limit ...
try again at 5:42 AM"). Make it a classified signal:

1. Add a `classifyCodexFailure(stderr/stdout: string)` in `.llm/tools/agentic/codex/` (or lib)
   returning a discriminated union: `{ kind: "quota_exhausted", resetAt?: string (ISO, parsed from
   the message w/ host-local tz assumption documented) } | { kind: "model_capacity" } |
   { kind: "other", raw }`. Patterns live in `.llm/tools/agentic/config/` (volatile-value law).
2. Surface it in `agentic:codex-status` (the status/doctor path of the desired-state runtime
   controller) so a supervisor sees `quota_exhausted` + reset time as data.
3. This is the trigger contract lane-policy's fallback route needs — reference it in
   `.llm/harness/workflow/lane-policy.md` only if a one-line pointer is needed; do not restate
   routing.
4. Unit tests: real-world message fixtures (the beta.6 run's exact string above; a capacity error:
   "gpt-5.6-sol is at capacity"), edge cases (no time in message, 12h/24h formats).

Coordinate with #603 (slice runner consumes this): if #603 lands first, wire it; otherwise keep the
classifier self-contained so #603 can adopt it.

## Validation (evidence in worklog)

- Scoped check/lint on `.llm/tools/agentic`; `deno test` new + existing agentic tests green.

## Done means

Classifier + status surfacing + tests landed, committed + pushed, worklog updated.
Report "DONE" or "BLOCKED: <why>".
