use harness

# Slice brief — #497 (E9): OTel GenAI-semconv adapter for the AI TelemetryPort

## SKILL

Read: `.agents/skills/netscript-harness/SKILL.md`, `.agents/skills/netscript-doctrine/SKILL.md`,
`.agents/skills/netscript-tools/SKILL.md`.

## Identity + ground rules

- WSL Codex implementation agent under the beta-8 orchestrator (`4d300496`). Do NOT open PRs.
  PLAN-EVAL owner-waived (carried drift D1) — plan in worklog, then implement.
- Worktree: `/home/codex/repos/ns-b8-497`, branch `feat/497-otel-genai-adapter`.
- **Every file operation uses absolute paths inside `/home/codex/repos/ns-b8-497`.**
- Base preflight: `git -C /home/codex/repos/ns-b8-497 rev-parse HEAD` must start `955b4abf`.
- Push: `git -C /home/codex/repos/ns-b8-497 push origin HEAD:refs/heads/feat/497-otel-genai-adapter`.
- Worklog at `/home/codex/repos/ns-b8-497/.llm/runs/feat-497-otel-genai--codex/worklog.md`.

## Task (issue #497 — read it first; acceptance boxes are the contract)

Ship the E9 adapter in `@netscript/telemetry` mapping agent-loop chunks (incl. REAL provider
`usage` chunks) onto OTel GenAI-semconv spans (`gen_ai.request.model`, tool-execution spans, usage
attributes), injectable into `createAiRuntime` via the AI stack's `TelemetryPort`
(`packages/ai/src/ports/telemetry.ts`).

HARD constraint: no OTel dependency leaks into `@netscript/ai` core — the adapter lives on the
telemetry side of the seam. Study how `@netscript/telemetry` structures existing adapters and how
beta.7's #624 fixed the JSR dynamic-import graph (`@opentelemetry/*` mapping) — do NOT reintroduce
unmapped dynamic imports; any OTel API usage must keep the JSR publish graph clean.

Use the current GenAI semantic-conventions attribute names (check the pinned @opentelemetry
semconv version in the workspace; use its exported constants where available rather than string
literals).

## Validation (evidence in worklog)

- Scoped check/lint on `packages/telemetry` (and `packages/ai` if the port needed a type touch).
- Unit test: run a scripted fake agent-loop through the adapter with an in-memory span exporter;
  assert chat + tool spans exist with real token usage attributes.
- `deno doc --lint` clean; `deno task publish:dry-run` green for the telemetry package (this is
  the package that broke on JSR in beta.6 — treat the dry-run as a hard gate).

## Done means

Adapter + tests + gates committed and pushed, worklog committed. Report "DONE" or "BLOCKED: <why>".
