use harness

# Slice brief — #460 (FAI-10): per-call modelOptions passthrough on ChatClientPort.stream

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`
(packages/ai is framework source), `.agents/skills/netscript-tools/SKILL.md`,
`.agents/skills/jsr-audit/SKILL.md` (gate:jsr).

## Identity + ground rules

- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-460`, branch `feat/460-modeloptions-passthrough`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-460`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-460 rev-parse HEAD` must start `955b4abf`.
- Push: `git -C /home/codex/repos/ns-b8-460 push origin HEAD:refs/heads/feat/460-modeloptions-passthrough`.
- Worklog at `/home/codex/repos/ns-b8-460/.llm/runs/feat-460-modeloptions--codex/worklog.md`.

## Task (issue #460 — read it first; acceptance section is the contract)

Extend-and-lift, not greenfield: `openRouterReasoningModelOptions` + `ReasoningEffort` already
exist. Ship a per-call `modelOptions` bag on `ChatClientPort.stream` covering:
- Anthropic adaptive-thinking + effort;
- OpenAI/OpenRouter `reasoning.effort`;
- OpenRouter `maxCompletionTokens`;
- Reject the deprecated Anthropic `enabled`+`budget_tokens` shape (400s) with a typed error.

Use `deno doc` over `@netscript/ai` / `@netscript/ai/ports` to learn the current surface before
broad reads. Doctrine first: record archetype + public-surface impact in the worklog. Contract
first: port/type change, then adapters (anthropic/openai/openrouter/ollama as applicable), then
tests. Static construction-time options keep working; per-call bag overrides per call.

## Validation (evidence in worklog)

- Scoped check/lint on `packages/ai` (`run-deno-check.ts`/`run-deno-lint.ts` `--ext ts,tsx`,
  include `--unstable-kv` semantics via the wrapper).
- Unit tests: per-call override applied per adapter (request-shape assertions with a stubbed
  transport), deprecated-shape rejection, no-options behavior unchanged.
- gate:jsr: `deno doc --lint` clean on changed export surfaces; `deno task publish:dry-run` green
  (record the command output summary).

## Done means

Port + adapters + tests + gates committed and pushed, worklog committed. Report "DONE" or
"BLOCKED: <why>".
