# Worklog: deterministic agent-docs corpus freshness

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-agent-docs-corpus-determinism--w5-b-corpus` |
| Branch | `fix/agent-docs-corpus-determinism` |
| Archetype | N/A |
| Scope overlays | docs |

## Design

### Public Surface

- `buildAgentDocsProse` / `buildAgentDocsProseFromSite` — generation entry points.
- A semantic freshness/check entry point in the same tool module for task and fixture reuse.
- `AgentDocsProseProvenance.sha256` — canonical uncompressed corpus identity.

### Domain Vocabulary

- canonical corpus bytes — sorted-file JSON serialization before compression.
- content identity — SHA-256 of canonical corpus bytes.
- transport bytes — gzip representation stored as `prose.json.gz`.
- freshness verdict — current/stale result based on expected versus checked-in canonical content.

### Ports

- None. Filesystem and Web Compression APIs remain direct repository-tool dependencies.

### Constants

- Existing `PROSE_PATH`, `PROVENANCE_PATH`, schema version, and corpus path selection rules remain
  the finite vocabulary; no new configurable registry is needed.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 0 | Activate harness and open the draft review surface. | artifact review | `.llm/runs/fix-agent-docs-corpus-determinism--w5-b-corpus/*` |
| 1 | Prove content-identity freshness while preserving unchanged gzip transport and aligning consumers. | focused regressions + required full gates + double freshness run | builder/task/tests, affected consumer/release helpers, generated agent-docs assets, run artifacts, `slices/w5-b-corpus/evidence.md` |

### Deferred Scope

- Replacing Web Compression with a pinned native encoder — unnecessary for the required property.

### Contributor Path

Start at `.llm/tools/docs/build-agent-docs-bundle.ts`; its focused test file demonstrates canonical
identity, transport variance tolerance, and real input drift.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-12 | 0 | bootstrap | Baseline and requested branch verified; required skills and harness workflow loaded. |
| 2026-08-12 | 0 | pre-fix probe | One local baseline run passed, demonstrating the known flap cannot be proven by a single regeneration. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| `PLAN-EVAL: N/A` | This is a focused defect with owner-locked contract, scope, discriminating tests, gates, and release constraints; no material design decision remains open. | owner brief + research/plan |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| none | minor | N/A |

## Gate Results

Not run for the implementation slice yet.

## Handoff Notes

- Evaluator should inspect content-hash semantics, alternate gzip coverage, staleness failure, and
  the two consecutive full freshness runs first.
