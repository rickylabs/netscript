# Context Pack: OMB S9 activation surfaces and migration fixture

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-activation-s9--1135` |
| Branch | `feat/openapi-mcp-activation-s9` |
| Current phase | `implement` |
| Archetype | `2 - Integration` |
| Scope overlays | `none` |

## Current State

Both planned implementation slices are committed and all applicable automated gates are green:
focused tests 29/29 and `scaffold.runtime` 71/71, plus scoped static, quality, doc-lint, and publish
checks. The configured Claude ordinary-review identities were unavailable pre-inference, so the
separate local open-model IMPL-EVAL remains mandatory before sign-off. The pre-existing `deno.lock`
change remains user-owned.

## Completed

- Live issue and canonical rev-2 design read.
- Current MCP initialize/registry, app convention template, failure flows, and agent-init rewrite
  behavior inspected.
- Plan-Gate composed under the owner-authorized milestone waiver.
- Activation byte fixtures and S-18 migration fixture implemented and focused-green.
- Draft PR #1232 opened with required labels/milestone/closing keyword.
- Scoped static/quality/JSR gates and the full consumer runtime smoke completed.

## In Progress

- Gate-evidence commit, then local open-model milestone IMPL-EVAL.

## Next Steps

1. Commit/push gate evidence without claiming sign-off.
2. Run local Qwen IMPL-EVAL in a separate session; fix findings before readiness.
3. On PASS, update acceptance evidence, transition to ready, and verify CI/review threads.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| Current instructions target 21 tools | code/tests | old 14 count is fixture provenance only |
| Exact-pin rewrite requires re-init + restart | RFC S-18 / issue #1135 | zero install only for new scaffolds |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-openapi-mcp-activation-s9--1135/` | new | harness activation and locked plan |
| `packages/mcp/**` | changed | activation guidance contracts, values, and fixtures |
| `packages/cli/**` | changed | app behavior line and S-18 agent-init fixture |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | WAIVED-COMPOSED | `plan-eval.md` |
| Focused | PASS | 29 passed, 0 failed |
| Static | PASS | scoped check/lint/fmt over MCP + owned CLI files |
| Fitness | PASS_WITH_BASELINE | quality gate + targeted clean scan; unrelated doctrine baseline retained |
| Runtime | PASS | `scaffold.runtime`: 71 passed, 0 failed |
| Consumer | PASS | restarted-host 21-tool fixture + scaffold runtime |

## Open Questions

- Canonical Claude ordinary-review identities are unavailable; local open-model formal evaluator is
  the remaining independent review before readiness.

## Drift and Debt

- Drift: historical 14-tool count superseded by current 21-tool registry; configured Claude review
  identities unavailable pre-inference.
- Debt: none planned.

## Commits

- See the draft PR's commit list + per-slice PR comments.
