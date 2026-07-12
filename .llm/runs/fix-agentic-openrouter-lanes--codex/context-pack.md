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

PLAN-EVAL passed. S1 is landed. S2 is implemented and gated: Claude/OpenRouter is the viable GLM agentic lane; Codex/OpenRouter GLM is explicitly unsupported for native namespace tools; runtime launch/resume planning and redacted live proof exist.

## Completed

- Re-baseline and focused code research.
- Archetype/gate selection.
- Three ordered commit slices and risk controls.
- Separate-session PLAN-EVAL PASS.
- S1 code, focused tests, scoped wrappers, volatile guard, and live no-turn effort handshake.
- S2 Claude gateway wrapper/environment/capability data; full 235-test suite and three live GLM proofs.

## In Progress

- S2 commit/push/comment, then S3 exhaustive preset canaries.

## Next Steps

1. Commit/push/comment S2.
2. Add exhaustive static preset-canary mode and explicit live selection.
3. Run final gate ledger and hand off to IMPL-EVAL.

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
| `.llm/tools/agentic/claude/claude-print.ts` | new | Isolated gateway launch/resume wrapper. |
| `.llm/tools/agentic/runtime/provider-profiles.ts` | changed | Supported Claude GLM and unsupported Codex GLM capability records. |
| `.llm/runs/fix-agentic-openrouter-lanes--codex/glm-live-evidence.md` | new | Redacted acceptance transcript and structured canaries. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | PASS | `plan-eval.md` |
| Static | PASS for S1 | scoped check/lint/fmt; focused suite and volatile guard |
| Runtime | PASS | Claude GLM live tool turn and wrapper; Codex incompatibility structured |
| Consumer | not run | implementation pending |

## Open Questions

- None; S3 is deterministic canary coverage and final gating.

## Drift and Debt

- Drift: launcher implementation already moved to a JSONL app-server client versus the carried-in direct-command description; recorded in `drift.md`.
- Debt: none.

## Commits

- See the draft PR commit list + per-slice PR comments.
