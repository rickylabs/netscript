# Plan: Aspire `/public` reference accuracy

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-aspire-public-surface--1782` |
| Branch | `docs/aspire-public-surface` |
| Phase | `implement` |
| Target | `docs/site/reference/aspire/index.md` |
| Archetype | N/A — docs-only correction describing an Archetype 2 integration package |
| Scope overlays | `SCOPE-docs.md` |

## Archetype

This is a docs-only slice. The described `packages/aspire` surface remains Doctrine Archetype 2
(integration), as recorded in the current doctrine verdict; no package source or architecture is
changed.

## Current Doctrine Verdict

Doctrine file 10 classifies `packages/aspire` as Archetype 2 and says to keep its SDK-independent
contribution ports. This slice accurately documents the existing port/domain surface.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | The published surface is the consumer contract and must be documented as it exists. |
| A2 | Entry-point wording must distinguish the aggregate from separately published sub-paths. |
| A14 | Export/docs and derived-asset gates preserve the accuracy claim. |

## Goal

Correct the `/public` description and document the four symbols available only from that entrypoint.

## Scope

- Update one reference-page paragraph and add one four-row symbol table.
- Regenerate exactly the shared prose corpus/provenance, CLI agent-docs barrel, and MCP publish asset.
- Run every gate named in the slice brief and reproduce the known README baseline on clean main.

## Non-Scope

- No hand-written `packages/aspire` source or export-map changes.
- No `AUTHORITATIVE_MAPPING` change or `complete` adoption.
- No logger, database, or CLI reference repair.
- No issue closure, relabeling, merging, or evaluator dispatch.

## Hidden Scope

- `docs/site/**` is generator input. S2 therefore contains four derived assets after the prose/run
  artifact S1 commit, with provenance `sourceCommit` equal to S1.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| LD-1 | Describe `/public` as aggregate plus exclusive domain/port contracts. | This matches the source and avoids claiming it is a pure aggregate. |
| LD-2 | State all four symbols are exclusive to `/public`. | The export-map/search cross-check proves no other published entrypoint reaches them. |
| LD-3 | Preserve the two-commit boundary. | Provenance must cite the immediately preceding prose commit; derived outputs remain isolated for reintegration. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Re-export any symbol from a dedicated sub-path | Safe to defer | Explicitly out of scope and owned by umbrella #1777 follow-up decisions. |
| Re-adopt Aspire at complete symbol coverage | Safe to defer | Separate verification slice by owner direction. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Prose overstates reachability | Verify every name against `src/public/mod.ts`, all published entrypoints, and `deno.json`. |
| Generated output leaks beyond four files | Inspect the generation diff and stage only the four expected outputs. |
| Provenance cites the wrong commit | Generate only after S1 and compare `sourceCommit` to S1's short SHA. |
| Validation mutates `deno.lock` | Compare `deno.lock` to the baseline after generation and gates; never stage churn. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| None | none | No architecture violation is created or deepened. Dedicated sub-path placement remains umbrella scope. |

## Validation Plan

The complete command set is the gate list in issue #1782's slice brief, plus
`docs:readme:check` baseline reproduction, exact generated-file/scope inspection, provenance equality,
and a diagrams applicability decision from the final diff.

## Deferred Scope

- `AUTHORITATIVE_MAPPING` complete-mode adoption and all other #1777 package repairs.

## PLAN-EVAL

`PLAN-EVAL: N/A` — this is a small, mechanical truth correction with source, scope, table shape,
commit boundary, and exact gate set fully specified. No architecture or sequencing decision remains.
