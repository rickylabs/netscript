# Context Pack: config-aware installed workers registry generation

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-workers-config-registry--1451-g` |
| Branch | `feat/workers-config-aware-registry` |
| Current phase | implementation complete; draft PR #1872 awaiting separate evaluation |
| Archetype | 5 — Plugin Package, with Archetype-6 generator edge |
| Scope overlays | none |

## Current State

Slice G is implemented within six product files. The clustered PLAN-EVAL remains authoritative;
focused acceptance and static/fitness gates pass, subject to the explicitly recorded lock and
official-sample drift.

## Completed

- Skills/harness/doctrine/locked-plan read.
- Exact base and Slice C normalized schema verified.
- Baseline plugin/CLI doc lint, installed integration, dependency provenance, and lock blob captured.
- Entry CLI loads config and validates the workers section exactly once at the edge.
- Generator binds normalized policy to canonical discovery identity and emits full policy literals.
- Focused acceptance passes 15/15; plugin publish dry-run, quality gate, and architecture gate pass.

## In Progress

- Restore and verify the lock blob, inspect the final diff, then commit/push/open the metadata-complete
  draft PR.

## Next Steps

1. Run separate-session IMPL-EVAL for draft PR #1872 at the current head.
2. Hosted owner triages the official-sample drift and runs the runtime smoke at merge readiness.
3. Supervisor performs close-gate verification and decides #1451 closure.

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
| Static | PASS | focused check 0; tests 15/15; workers lint/fmt 0 |
| Fitness | PASS with baseline findings | doc-lint A/B plugin 20 / CLI 0; quality and architecture pass |
| Runtime | N/A locally | binding owner prohibition |
| Consumer | PASS | installed registry 10/10; policy flows through startup registration, zero fetch |

## Open Questions

- Existing official sample authors a plugin-owned entrypoint without `source: 'plugin'`; recorded for
  supervisor/hosted-smoke triage because the locked Slice G touch set does not permit that file.

## Drift and Debt

- Drift: RTK unavailable; direct config dependency mutates Deno's member lock snapshot; root quality
  config excludes CLI lint/fmt; official sample source disagrees with D6 discovery.
- Debt: existing `plugins/workers` Refactor entry unchanged.

## Commits

- Implementation: `236ddcf3a` — config-aware installed job registry Slice G.
- Draft PR: `https://github.com/rickylabs/netscript/pull/1872`.
