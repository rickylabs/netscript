# Context Pack: config-aware installed workers registry generation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-workers-config-registry--1451-g` |
| Branch | `feat/workers-config-aware-registry` |
| Current phase | Tier-A follow-up complete; non-draft PR #1872 in `status:impl-eval` |
| Archetype | 5 — Plugin Package, with Archetype-6 generator edge |
| Scope overlays | none |

## Current State

Slice G is implemented within six product files. Tier-A accepted the slice subject to one bounded
D6 test gap; the isolated POSIX-vs-Windows separator equivalence test and focused gates are now
complete. Supervisor dispositions own the required lock row and sample follow-up #1874.

## Completed

- Skills/harness/doctrine/locked-plan read.
- Exact base and Slice C normalized schema verified.
- Baseline plugin/CLI doc lint, installed integration, dependency provenance, and lock blob captured.
- Entry CLI loads config and validates the workers section exactly once at the edge.
- Generator binds normalized policy to canonical discovery identity and emits full policy literals.
- Original focused acceptance passes 15/15; the follow-up plugin suite passes 6/6 with zero focused
  check diagnostics and zero format findings.

## In Progress

- Push the bounded D6 test follow-up and return PR #1872 to supervisor evaluation.

## Next Steps

1. Supervisor re-reviews the bounded test follow-up at the new head.
2. Heavy CI and separate-session IMPL-EVAL complete on non-draft PR #1872.
3. Supervisor performs close-gate verification and decides #1451 closure; sample parity remains in
   #1874.

## Key Decisions

| Decision | Source | Notes |
| --- | --- | --- |
| D5 | clustered plan | one schema parse at entry; normalized data inward |
| D6 | clustered plan | canonical path binding; source/id verification |
| D7 | clustered plan | grouped exact identity wholly shadows flat |

## Files Changed

| Path | Status | Notes |
| --- | --- | --- |
| `.llm/runs/feat-workers-config-registry--1451-g/*` | new/preserved | Harness identity, evidence, design, and handoff context |
| six allowed product/test/doc paths | modified/new | Config-aware installed workers registry Slice G |

## Gates

| Gate family | Current status | Evidence |
| --- | --- | --- |
| Static | PASS | original tests 15/15; D6 follow-up tests 6/6; focused check 0; follow-up fmt 0 |
| Fitness | PASS with baseline findings | doc-lint A/B plugin 20 / CLI 0; quality and architecture pass |
| Runtime | N/A locally | binding owner prohibition |
| Consumer | PASS | installed registry 10/10; policy flows through startup registration, zero fetch |

## Open Questions

- None for this bounded follow-up. The official sample mismatch is tracked as #1874.

## Drift and Debt

- Drift: RTK unavailable; supervisor corrected the lock disposition in `2a2e253a1`; root quality
  config excludes CLI lint/fmt; official sample source mismatch is tracked as #1874; Tier-A found
  and this follow-up closes the missing isolated D6 separator assertion.
- Debt: existing `plugins/workers` Refactor entry unchanged.

## Commits

- Implementation: `236ddcf3a` — config-aware installed job registry Slice G.
- Lock correction: `2a2e253a1` — required direct config member edge (supervisor-owned).
- PR: `https://github.com/rickylabs/netscript/pull/1872` (non-draft, evaluation active).
