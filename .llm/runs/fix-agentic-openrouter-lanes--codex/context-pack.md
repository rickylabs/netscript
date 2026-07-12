# Context Pack: durable OpenRouter agentic lanes

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agentic-openrouter-lanes--codex` |
| Branch | `fix/agentic-openrouter-lanes` |
| Current phase | `close` |
| Archetype | `6 - CLI / Tooling` |
| Scope overlays | none |

## Current State

PLAN-EVAL and separate-session IMPL-EVAL passed. All three implementation slices are committed and gated. Claude/OpenRouter is the viable GLM agentic lane; Codex/OpenRouter GLM is explicitly unsupported for native namespace tools; the default provider canary validates every preset without credentials or provider traffic, while live turns require `--live`.

## Completed

- Re-baseline and focused code research.
- Archetype/gate selection.
- Three ordered commit slices and risk controls.
- Separate-session PLAN-EVAL PASS.
- S1 code, focused tests, scoped wrappers, volatile guard, and live no-turn effort handshake.
- S2 Claude gateway wrapper/environment/capability data; three live GLM proofs.
- S3 exhaustive static preset canary, explicit live boundary, rollout-runner migration, CI wiring, and launcher structural extraction.
- Final implementation gates: 239 tests and 105-file scoped check/lint/fmt, all clean; no secret or lock churn.
- Separate Claude Opus 4.8 IMPL-EVAL PASS with independent gate reproduction and all seven mission boundaries verified.

## In Progress

- Final PR evidence/comment/label handoff; no implementation work remains.

## Next Steps

1. Commit and push the evaluator/close artifacts.
2. Complete the PR checklist, change the sole phase label to `status:ready-merge`, and post the evaluator + live-proof comments.
3. Hand PR #696 back to the owner; do not merge without direction.

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
| `.llm/tools/agentic/runtime/preset-canary.ts` | new | Exhaustive credential-free preset and launch-plan validation. |
| `.llm/tools/agentic/runtime/cli/provider-canary.ts` | changed | Static default; explicit `--live` provider boundary. |
| `.github/workflows/ci.yml` | changed | Runs the exhaustive static preset canary. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | PASS | `plan-eval.md` |
| Static | PASS | 239 tests; scoped check/lint/fmt over 105 files; volatile guard; secret scan |
| Runtime | PASS | Claude GLM live tool turn and wrapper; Codex incompatibility structured |
| Consumer | PASS | default exhaustive canary task plus explicit-live rollout-runner coverage and CI step |
| IMPL-EVAL | PASS | separate Claude Opus 4.8 session independently reproduced gates and verified all acceptance boundaries |

## Open Questions

- None.

## Drift and Debt

- Drift: launcher/client evolution, effort misobservation, cached Claude auth, and the temporary launcher LOC overage are recorded in `drift.md`.
- Debt: none introduced or deepened; evaluator's legacy `agentic-lib.ts` LOC observation is low/non-blocking.

## Commits

- See the draft PR commit list + per-slice PR comments.
