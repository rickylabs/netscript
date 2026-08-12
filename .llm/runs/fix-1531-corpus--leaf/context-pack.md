# Context Pack: shipped agent-docs corpus freshness

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-1531-corpus--leaf` |
| Branch | `fix/1531-agent-docs-corpus-gate` |
| Current phase | `handoff` |
| Archetype | N/A — docs/tooling |
| Scope overlays | `SCOPE-docs.md` |

## Current State

Draft PR #1608 exists from bootstrap commit `73ed851d3`. Implementation, regeneration, direct
census, positive/negative freshness proofs, and requested validation are complete. PLAN-EVAL is
recorded N/A; the orchestrator owns the separate native Opus 5 read-only IMPL-EVAL fallback.

## Completed

- Harness/bootstrap identity, explicit branch push, draft PR, labels, and milestone.
- Deterministic site-derived corpus rebuild, stable check mode, CI caller, and shipped-vocabulary
  accuracy defense.
- Corpus plus CLI/MCP generated assets rebuilt; `api-clients` fell 60→0 in the corpus and 13→0 in
  MCP; `@contracts` fell 8→0.
- Negative source-drift control returned raw exit 1, then restoration reran green.
- Focused, generated-asset, docs, scoped static, and root-test gates recorded in `worklog.md`.

## In Progress

- Commit/push the immutable implementation head and publish the implementation evidence comment.

## Next Steps

1. Orchestrator dispatches the native Opus 5 read-only evaluator against the immutable head.
2. If another docs change lands before merge, rerun `deno task gen:agent-docs-prose`, rebuild
   publish assets, and require `deno task check:agent-docs-prose` to be clean.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Preserve non-site entries | plan D1/D2 | Avoids taking #1260 content-selection scope. |
| Workflow-call the check | plan D3 | A task alone is not a gate. |
| Audit shipped vocabulary | plan D4 | Independent defense for stale terminology. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| `.llm/runs/fix-1531-corpus--leaf/**` | new | Harness evidence and resumable state. |
| `.llm/tools/docs/**` | modified | Site-derived rebuild, stable check mode, shipped vocabulary check, tests. |
| `.llm/assets/agent-docs/**` | regenerated | Fresh current-site corpus and provenance. |
| `packages/{cli,mcp}/src/**.generated.ts` | regenerated | Embedded fresh corpus. |
| `deno.json`, `.github/workflows/ci.yml` | modified | Callable freshness task and CI wiring. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | pass | Focused tests plus scoped check/lint/fmt are green. |
| Fitness/docs | partial | Corpus, snippets, accuracy pass; links has two unchanged-base anchor failures. |
| Runtime | N/A | No runtime behavior. |
| Consumer | pass | MCP generated asset has zero `api-clients`; asset checks pass. |
| Repo tests | partial | 3300 pass; one unchanged-base fitness failure and one #1260 corpus-ranking drift. |

## Open Questions

- None; implementation decisions are locked.

## Drift and Debt

- Drift: evaluator override, two pre-existing link failures, one pre-existing JSDoc failure, and one
  refreshed-corpus ranking mismatch deferred to #1260.
- Debt: none.

## Commits

- See draft PR #1608 commit list + per-slice comments.
