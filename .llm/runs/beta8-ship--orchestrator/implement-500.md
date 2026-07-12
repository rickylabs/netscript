use harness

# Slice brief — #500: provider retry/backoff + rate-limit policy seam (chat/embedding)

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-500`, branch `feat/500-retry-backoff-seam`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-500`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-500 rev-parse HEAD` must start `955b4abf`.
- Push: `git -C /home/codex/repos/ns-b8-500 push origin HEAD:refs/heads/feat/500-retry-backoff-seam`.
- Worklog at `/home/codex/repos/ns-b8-500/.llm/runs/feat-500-retry-seam--codex/worklog.md`.

## Task (issue #500 — read it first; acceptance section is the contract)

Chat/embedding turns have no 429/`Retry-After`/backoff policy (only the MCP plane has backoff at
`packages/ai/src/mcp/application/backoff.ts` — study it and reuse/extract shared logic rather than
duplicating). Ship:
- An opt-in bounded-retry policy wrappable around `ChatClientPort` / `EmbeddingProviderPort`
  (decorator/wrapper shape — no adapter rewrites): respects `Retry-After`, jittered exponential
  backoff, abort-aware (observes AbortSignal before and between attempts).
- Typed `AiRateLimitError`.
- Default behavior remains no-retry.

## Validation (evidence in worklog)

- Scoped check/lint on `packages/ai`.
- Unit tests (fake timers or injected sleep): retry-after honored, jittered backoff bounds, abort
  mid-backoff, retries exhausted → typed error, default no-retry unchanged.
- `deno doc --lint` clean on changed surface; publish dry-run green if export map changed.

## Done means

Seam + tests committed and pushed, worklog committed. Report "DONE" or "BLOCKED: <why>".
