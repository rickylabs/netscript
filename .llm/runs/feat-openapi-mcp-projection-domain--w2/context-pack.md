# Context Pack: OMB S4 OpenAPI projection domain

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-openapi-mcp-projection-domain--w2` |
| Branch | `feat/openapi-mcp-projection-domain` |
| Current phase | `orchestrator pre-merge handoff` |
| Archetype | `2 — Integration` (pure domain slice) |
| Scope overlays | none |

## Current State

The branch began as a clean exact child of current `origin/main`. Live issue/RFC and the complete P2
no-DB proof/evidence have been consumed. The plan and Design checkpoint are locked. Formal local
PLAN-EVAL is intentionally composed/waived by the milestone-run rule. Slices 1–4 are implemented,
reviewed, committed, and focused-green. The independent OpenHands IMPL-EVAL passed and the current
review-thread gate reports 0 threads / 0 unanswered. The live PR is labeled `status:ready-merge`,
its close-gate and full current check rollup pass, and GitHub reports it mergeable/clean. Merge
authority remains with the milestone orchestrator.

## Completed

- Required skills and harness/doctrine/evaluator workflow read.
- Live issue `#1130` and merged RFC `#1123` read.
- P2 verdict, structured evidence, and raw no-DB spec read.
- Current `@netscript/mcp` surface inspected with `deno doc`.
- Baseline doc-lint and package publish dry-run passed.
- JSR baseline warnings recorded without changing debt.
- Independent OpenHands IMPL-EVAL passed on Actions run `30861395106`; `evaluate.md` is committed.
- Current review-thread gate passed with 0 threads and 0 unanswered.
- Ready-merge close-gate and current PR check rollup passed with zero current failures.

## In Progress

- None. Implementation-supervisor handoff is complete.

## Next Steps

1. Milestone orchestrator performs its final pre-merge ruling.
2. Merge only under milestone-orchestrator authority; the implementation supervisor does not merge.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| New `./openapi-projection` subpath | plan D1 / doctrine 02 | Default MCP surface remains unchanged. |
| Exact identity only | RFC S-2 / plan D3 | Fuzzy matching is suggestions-only. |
| Errors derive from declared responses | P2 / plan D6 | Empty non-2xx set is exactly `{}`. |
| Command domain regroup | F-16 baseline / Hidden Scope | Preserves API while avoiding cardinality deepening. |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-openapi-mcp-projection-domain--w2/*` | new | Harness research, locked plan, design, waiver, and handoff. |
| `packages/mcp/src/domain/command/*` | moved | Existing command contracts/policy regrouped to preserve direct-child cardinality. |
| `packages/mcp/src/domain/openapi/operation-index.ts` | new | Pure deterministic structural operation index. |
| `packages/mcp/openapi-projection.ts` | new | Curated public projection subpath. |
| `packages/mcp/tests/operation-index_test.ts` | new | Public-consumer index contract tests. |
| `packages/mcp/src/domain/openapi/canonical-identity.ts` | new | Exact refusal-first operation resolution. |
| `packages/mcp/tests/{canonical-identity_test.ts,fixtures/openapi/identity-ambiguity.json}` | new | Case-variant, duplicate-id, and fuzzy-suggestion evidence. |
| `packages/mcp/src/domain/openapi/description-ladder.ts` | new | Deterministic four-rung single-line description policy. |
| `packages/mcp/tests/description-ladder_test.ts` | new | Per-rung and real-generated-spec assertions. |
| `packages/mcp/tests/fixtures/openapi/{description-ladder,no-db-generated-openapi}.json` | new | Synthetic rung corpus plus byte-identical committed P2 no-DB spec. |
| `packages/mcp/src/domain/openapi/schema-views.ts` | new | Pure request/response/error/all projections with bounded local refs. |
| `packages/mcp/tests/{schema-views_test.ts,fixtures/openapi/schema-views.json}` | new | Declared-error, ref, request merge, compaction, and no-DB empty-error evidence. |
| `packages/mcp/{deno.json,README.md}` | modified | Export/check surface and domain-subpath documentation. |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Plan | composed/authorized | `plan-eval.md`, user milestone directive |
| Static | final green | 78 tests; scoped check/lint/fmt; doc-lint; publish dry-run; CI publish-asset check |
| Fitness | final green with baseline warnings | quality gate + structured JSR audit |
| Runtime | N/A | pure domain scope |
| Consumer | final green | public entrypoint tests, package suite, scoped gates, doc-lint, publish dry-run, full scaffold runtime/static CI |

## Open Questions

- None blocking.

## Drift and Debt

- Drift: authorized PLAN-EVAL composition, test-only permission correction, OpenHands model-id
  normalization, and unavailable Augment review credits.
- Debt: `MCP-A6-V2-SHAPE` remains untouched; baseline cardinality is addressed without a new entry.

## Commits

- See the draft PR's commit list + per-slice PR comments.
