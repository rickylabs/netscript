# Context Pack: shipped agent-docs corpus freshness

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `fix-1531-corpus--leaf` |
| Branch | `fix/1531-agent-docs-corpus-gate` |
| Current phase | `final merge-base handoff` |
| Archetype | N/A — docs/tooling |
| Scope overlays | `SCOPE-docs.md` |

## Current State

Draft PR #1608 received an exact-head native Opus 5 `FAIL_FIX`. The corpus mechanism, negative
control, determinism, and shipped-vocabulary accuracy defense were independently confirmed. Cycle 2
first rebased onto `origin/main@6aee2b414`, then reconciled again after `main` advanced to
`6b29d12ea` through PR #1614. Cycle 2 refreshes moving-base generated outputs, corrects ownership to
#1615, and records two non-blocking check/provenance limitations. The exact-head cycle-2 evaluation
passed. Final merge-base work rebases onto `origin/main@bcfbd0f65`, including PR #1617.

## Completed

- Harness/bootstrap identity, explicit branch push, draft PR, labels, and milestone.
- Deterministic site-derived corpus rebuild, stable check mode, CI caller, and shipped-vocabulary
  accuracy defense.
- Corpus plus CLI/MCP generated assets rebuilt; `api-clients` fell 60→0 in the corpus and 13→0 in
  MCP; `@contracts` fell 8→0.
- Negative source-drift control returned raw exit 1, then restoration reran green.
- Focused, generated-asset, docs, scoped static, and root-test gates recorded in `worklog.md`.
- Rebased cleanly onto latest `origin/main@6b29d12ea` and regenerated corpus plus both dependent
  generated assets without touching `deno.lock`; the intervening PR #1614 has no `docs/site` diff.
- Rebased again onto exact merge base `bcfbd0f65`; corpus regeneration is a content no-op with the
  same gzip blob and SHA-256. Root tests are now green after PR #1617: 3355 passed, 0 failed.

## In Progress

- Commit/push the final provenance/generated-asset reconciliation and update PR evidence.

## Next Steps

1. Orchestrator owns the ready transition, CI watch, and merge.
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
| Repo tests | pass | Final exact-merge-base run: 3355 passed, 0 failed, 17 ignored. |

## Open Questions

- None; implementation decisions are locked.

## Drift and Debt

- Drift: evaluator override, two pre-existing link failures, one pre-existing JSDoc failure owned
  by #1612 / PR #1614, the #1615 ranking mismatch, moving-base regeneration, mutating check mode,
  and provenance semantics.
- Debt: none.

## Commits

- `40ea88d8d` — exact-base-rebased bootstrap/harness activation commit.
- `0896d929f` — exact-base-rebased corpus freshness implementation commit.
- `0cebc4494` — exact-base-rebased cycle-1 handoff-evidence commit.
- `6ed1743d0` — exact-base-rebased cycle-2 regeneration/evidence commit.
- `7563aa6b1` — exact-base-rebased provenance reconciliation commit and final normal-generation
  provenance source before the final handoff commit.
