# Context Pack: shipped agent-docs corpus freshness

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-1531-corpus--leaf` |
| Branch | `fix/1531-agent-docs-corpus-gate` |
| Current phase | `cycle-2 handoff` |
| Archetype | N/A — docs/tooling |
| Scope overlays | `SCOPE-docs.md` |

## Current State

Draft PR #1608 received an exact-head native Opus 5 `FAIL_FIX`. The corpus mechanism, negative
control, determinism, and shipped-vocabulary accuracy defense were independently confirmed. Cycle 2
rebases onto `origin/main@6aee2b414`, refreshes moving-base generated outputs, corrects ownership to
#1615, and records two non-blocking check/provenance limitations.

## Completed

- Harness/bootstrap identity, explicit branch push, draft PR, labels, and milestone.
- Deterministic site-derived corpus rebuild, stable check mode, CI caller, and shipped-vocabulary
  accuracy defense.
- Corpus plus CLI/MCP generated assets rebuilt; `api-clients` fell 60→0 in the corpus and 13→0 in
  MCP; `@contracts` fell 8→0.
- Negative source-drift control returned raw exit 1, then restoration reran green.
- Focused, generated-asset, docs, scoped static, and root-test gates recorded in `worklog.md`.
- Rebased cleanly onto `origin/main@6aee2b414` and regenerated corpus plus both dependent generated
  assets without touching `deno.lock`.

## In Progress

- Commit/push the cycle-2 immutable head and update PR evidence.

## Next Steps

1. Orchestrator dispatches a fresh native Opus 5 read-only evaluator against the cycle-2 immutable
   head.
2. If another docs change lands before merge, rerun `deno task gen:agent-docs-prose`, rebuild
   publish assets, and require `deno task check:agent-docs-prose` to be clean.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Preserve non-site entries | plan D1/D2 | #1260 is closed for corpus presence; ranking regression is tracked by #1615. |
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
| Fitness/docs | partial | Cycle-2 corpus, snippets, and accuracy pass; links retains two unchanged-base anchor failures and is not workflow-called. |
| Runtime | N/A | No runtime behavior. |
| Consumer | pass | MCP generated asset has zero `api-clients`; asset checks pass. |
| Repo tests | partial | 3300 pass; one unchanged-base fitness failure and one #1615 corpus-ranking drift. |

## Open Questions

- None; implementation decisions are locked.

## Drift and Debt

- Drift: evaluator override, two pre-existing link failures, one pre-existing JSDoc failure owned
  by #1612 / PR #1614, the #1615 ranking mismatch, moving-base regeneration, mutating check mode,
  and provenance semantics.
- Debt: none.

## Commits

- `429dbfdfb` — rebased bootstrap/harness activation commit.
- `53bd62062` — rebased corpus freshness implementation commit.
- `d07384b38` — rebased cycle-1 handoff-evidence commit and cycle-2 normal-generation provenance source.
