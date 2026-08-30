# Plan: logger sub-path reference surface

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-logger-subpath-surface--1784` |
| Branch | `docs/logger-subpath-surface` |
| Phase | `plan` |
| Target | `docs/site/reference/logger/index.md` |
| Archetype | `N/A` for implementation; underlying logger is Doctrine Archetype 2 |
| Scope overlays | `docs` |

## Archetype

This lane changes documentation and generator outputs only, so no framework implementation
archetype applies. The page describes `packages/logger`, classified as Archetype 2 (integration),
and its published sub-paths are verified under Doctrine A1/A2 and the public-surface rules.

## Current Doctrine Verdict

`packages/logger` is Archetype 2 with a **Keep** verdict: preserve its structured logging adapters
and integrations. This slice corrects the reference page without changing that surface.

## Axioms in Play

| Axiom | Why it matters |
| --- | --- |
| A1 | Documentation must inventory the public types consumers actually receive. |
| A2 | Each published sub-path must state one precise concern without a false navigation promise. |
| A14 | `deno doc`, export drift, docs gates, and generated-asset checks preserve the claim. |

## Goal

Replace the false separate-page promise with a source-verified inventory of both logger integration
sub-paths on the existing page.

## Scope

- Correct the `Sub-path exports` introduction.
- Add one table per sub-path, with one row per `deno doc` symbol and explicit `Logger` re-export rows.
- Regenerate only the four derived assets after committing the prose/run-artifact slice.

## Non-Scope

- No logger source, export-map, mapping, separate-page, database, CLI prose, Aspire, or Docker work.
- No issue closure/relabeling, merge, evaluator dispatch, or ready-merge transition.

## Hidden Scope

- `docs/site/**` is generator input, so the corpus gzip/provenance and its CLI/MCP embeddings must be
  regenerated from the S1 prose commit.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Consolidate both sub-path surfaces on the existing page. | Required by #1784; separate pages are out of scope. |
| D2 | Use the two live `deno doc` inventories as the completeness authority. | Export-statement counts alone can misrepresent re-exports. |
| D3 | Include `Logger` in each table and label it a root re-export. | Each sub-path exports it, but it is not a distinct integration symbol. |
| D4 | Describe `logBody` as reserved and ineffective today. | The source declares it but never reads it. |
| D5 | Commit prose/run artifacts as S1, then run generators and commit exactly four assets as S2. | Makes provenance `sourceCommit` equal S1 and keeps rebase cost bounded. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Table placement and inventory authority | safe to defer: resolved | Existing section and live `deno doc` fix both. |
| Separate-page structure | safe to defer: explicitly out of scope | Any contrary conclusion would stop the slice. |
| Mapping upgrade to `complete` | safe to defer | Owned by a later #1777 slice. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A conditional or reserved behavior is overstated. | Read implementation bodies; state `logBody` has no effect and distinguish full/light middleware. |
| A re-export is counted as a distinct integration contract. | Label `Logger` as a root re-export in both tables. |
| A symbol is omitted. | Compare table rows mechanically with each 13-symbol `deno doc` set. |
| Generation stamps the wrong commit. | Commit S1 before `gen:agent-docs-prose`; assert provenance equals S1. |
| Broad generators drift unrelated outputs. | Inspect status and commit only the four authorized derived files. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| Public-surface/documentation drift | existing | Replace the false promise and inventory both sub-paths. |
| False completeness | risk | Prove exact set equality instead of relying on prose such as “all.” |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Source alignment | yes | Exact `deno doc` set comparison and implementation reads. |
| Link integrity | yes | Site and repository docs link gates. |
| Generated-asset freshness | yes | Prose, barrel, publish-asset, and MCP corpus checks. |
| Runtime/Aspire | no | Static docs-only slice; explicitly forbidden. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| None | none | No doctrine violation is introduced or deferred. |

## Validation Plan

Run every command specified in the slice brief with real exit codes, reproduce the known
`docs:readme:check` failure on a clean `origin/main` worktree, determine diagram applicability from
the diff, assert `deno.lock` is unchanged, and report final porcelain status verbatim.

## Deferred Scope

- Re-adopting logger at `mode: 'complete'` and all other #1777 package repairs.

PLAN-EVAL: N/A — this is a small mechanical correction whose current issue and re-derived evidence
fully specify the contract, scope, commit order, acceptance criteria, and gates; no material design
or sequencing decision remains.
