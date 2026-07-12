# Context Pack: durable OpenRouter agentic lanes

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agentic-openrouter-lanes--codex` |
| Branch | `fix/agentic-openrouter-lanes` |
| Current phase | `implement` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | none |

## Current State

Research, locked plan, and Design checkpoint are complete. Separate Claude Opus 4.8 PLAN-EVAL returned PASS. S1 implementation and gates are complete: profile materialization, effort propagation/observation, v0.144 identity parsing, and truthful exit behavior.

## Completed

- Re-baseline and focused code research.
- Archetype/gate selection.
- Three ordered commit slices and risk controls.
- Separate-session PLAN-EVAL PASS.
- S1 code, focused tests, scoped wrappers, volatile guard, and live no-turn effort handshake.

## In Progress

- S1 commit/push/comment, then S2 GLM lane viability.

## Next Steps

1. Commit/push/comment S1.
2. Run bounded Codex/Claude OpenRouter probes for S2.
3. Implement the viable GLM lane and structured capability boundary.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Responses-only named profile files | plan D1 | No legacy profile table/chat wire. |
| At least one non-empty real GLM turn | plan D5 | Hard acceptance gate. |
| Exhaustive static + opt-in live canaries | plan D4 | CI-safe and spend-safe. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/fix-agentic-openrouter-lanes--codex/` | changed/new | Harness bootstrap and carried-in brief/thread identity. |
| `.llm/tools/agentic/codex/` | changed/new | S1 app-server and launcher behavior/tests. |
| `.llm/tools/agentic/lib/agentic-lib.ts` | changed | v0.144 identity parsing. |
| `.llm/tools/agentic/runtime/adapters/codex-adapter.ts` | changed | Explicit route flags reach launcher. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | PASS | `plan-eval.md` |
| Static | PASS for S1 | scoped check/lint/fmt; focused suite and volatile guard |
| Runtime | not run | live GLM gate pending |
| Consumer | not run | implementation pending |

## Open Questions

- Which of Codex or Claude can currently complete GLM 5.2 through OpenRouter? Resolve in S2.

## Drift and Debt

- Drift: launcher implementation already moved to a JSONL app-server client versus the carried-in direct-command description; recorded in `drift.md`.
- Debt: none.

## Commits

- See the draft PR commit list + per-slice PR comments.
