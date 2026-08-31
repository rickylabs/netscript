# Plan: adopt six clean package references into exports-drift policy

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-exports-drift-clean-six--1778` |
| Branch | `docs/exports-drift-clean-six` |
| Phase | `plan` |
| Target | `.llm/tools/docs/check-exports-drift.ts` |
| Archetype | N/A — repository documentation tooling policy only |
| Scope overlays | docs |

## Archetype

N/A. No package or plugin source changes. `SCOPE-docs.md` applies because the policy protects
published reference pages.

## Current Doctrine Verdict

N/A. The package verdict table was consulted for context, but this slice changes neither package
architecture nor public surfaces.

## Goal

Adopt all six already-clean reference pages into `AUTHORITATIVE_MAPPING` with the strongest honest
coverage policy and a page-specific reason, without changing the pages or checker behavior.

## Scope

- Add mappings for `aspire`, `cli`, `cron`, `database`, `kv`, and `logger`.
- Record a `symbolCoverage.mode` and a true, maintainable reason for each.
- Preserve harness evidence in this run directory.

## Non-Scope

- No `docs/site/**` changes.
- No checker behavior or existing mapping changes.
- No package/plugin source, export-map, generated asset, issue-state, or evaluator changes.

## Hidden Scope

- Prove corpus-input ownership from both named generators.
- Reproduce the pre-existing `docs:readme:check` failure on a clean `origin/main` checkout.
- Run both asset freshness gates even though the source-input inspection predicts no churn.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Use `complete` for `cron`. | Its page inventories every symbol across all four entrypoints and the live complete probe exits 0. |
| D2 | Use `entrypoints-only` for the other five packages. | Their pages map every entrypoint but curate or summarize symbol surfaces; each live complete probe reports omissions. |
| D3 | Do not drop a package. | None of the five pages promises an exhaustive all-symbol inventory; the same public-surface wording already coexists with honest `entrypoints-only` mappings. |
| D4 | Do not regenerate assets. | The changed tool is outside both generators' source corpora; freshness gates will verify the prediction. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Coverage mode per package | resolved now | D1–D3, backed by live probes. |
| PLAN-EVAL | safe to defer / N/A | The issue supplies the complete contract, hard boundaries, decision test, and gates; no architecture or sequencing choice remains. |
| IMPL-EVAL | must occur later | Owner directs a supervisor-dispatched separate evaluator after this implementation handoff. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Weakening coverage merely to pass | Probe `complete` first and document why each lower mode matches the page's actual promise. |
| Accidental docs or lock churn | Path-scoped diffs and `git diff --exit-code -- deno.lock`. |
| False asset assumption | Inspect both generators, then run `check:publish-assets` and `check:assets-barrel`. |
| Mistaking baseline README red for slice failure | Reproduce it from a detached clean `origin/main` worktree. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| --- | --- | --- |
| Policy-by-boilerplate | risk | Give every mapping a distinct page-specific reason. |
| Documentation repair in adoption slice | risk | Drop a package rather than edit `docs/site/**`. |

## Fitness Gates

| Gate | Required | Expected evidence |
| --- | --- | --- |
| Source alignment | yes | Export-map and complete-mode probes. |
| Scope separation | yes | Zero `docs/site/**` diff. |
| Link integrity | yes | `deno task docs:links` exit 0. |
| Asset freshness | yes | Both named freshness tasks exit 0. |

## Arch-Debt Implications

| Entry | Action | Notes |
| --- | --- | --- |
| N/A | none | No doctrine violation is created or deferred. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| --- | --- | --- | --- |
| 1 | Export drift | `deno task docs:exports-drift` | exit 0 |
| 2 | Docs accuracy | `deno task docs:accuracy` | exit 0 |
| 3 | Link integrity | `deno task docs:links` | exit 0 |
| 4 | Publish assets | `deno task check:publish-assets` | exit 0 |
| 5 | Assets barrel | `deno task check:assets-barrel` | exit 0 |
| 6 | Agent prose | `deno task check:agent-docs-prose` | exit 0 |
| 7 | Tool type-check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools/docs --ext ts` | exit 0 |
| 8 | Lock hygiene | `git diff --exit-code -- deno.lock` | exit 0 |
| 9 | README baseline | `deno task docs:readme:check` here and on clean `origin/main` | matching exit 1 at `packages/bench/README.md` |

## Risks

- A page may read more comprehensively than the checker proves. The mapping reason will state the
  bounded promise, and complete-mode findings remain evidence for later page-repair slices.

## Dependencies

- Deno `doc` output for the six live package export maps.
- GitHub issue #1778 and umbrella #1777.

## Drift Watch

- Any package that fails entrypoint coverage, requires a page edit, moves generated assets, or
  changes `deno.lock` must be dropped or explicitly recorded before proceeding.
