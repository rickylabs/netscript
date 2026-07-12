use harness

# Slice brief — #461 (FAI-11): BYOK per-request key/baseURL resolution seam

## SKILL
Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`, `.agents/skills/jsr-audit/SKILL.md` (gate:jsr).

## Identity + ground rules
- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-461`, branch `feat/461-byok-seam`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-461`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-461 rev-parse HEAD` must start `fd0dafaf`
  (post-#460 main — the per-call modelOptions bag from FAI-10 is already on this base; build on it).
- Push: `git -C /home/codex/repos/ns-b8-461 push origin HEAD:refs/heads/feat/461-byok-seam`.
- Worklog at `/home/codex/repos/ns-b8-461/.llm/runs/feat-461-byok--codex/worklog.md`.

## Task (issue #461 — read it first; acceptance is the contract)
Provider factories take static `apiKey`/`baseURL` at construction; multi-tenant/user-supplied keys
need a per-request override. Ship a per-request key/baseURL resolution seam (including Ollama
host) that adapters resolve WITHOUT an app hand-rolling an override layer. Design consistently
with #460's per-call `modelOptions` bag (same call-level options surface — study how the bag flows
through `ChatClientPort.stream` and the adapters on this base before designing). Keys must never
be logged or echoed in errors (assert in tests).

## Validation (evidence in worklog)
- Scoped check/lint on `packages/ai`; unit tests (per-request key/baseURL override applied per
  adapter incl. Ollama host, static default fallback, no-leak-in-errors); gate:jsr — `deno doc
  --lint` clean + `deno task publish:dry-run` green.

## Done means
Seam + adapters + tests + gates committed and pushed, worklog committed. Report "DONE" or "BLOCKED: <why>".
