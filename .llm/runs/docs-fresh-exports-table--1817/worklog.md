# Worklog: Fresh export-table adoption

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-fresh-exports-table--1817` |
| Branch | `docs/fresh-exports-table` |
| Archetype | `4 — Public DSL/Builder` (described package only) |
| Scope overlays | `docs` |

## Design

### Public Surface

- No package surface changes. The owned documentation contract is a sixteen-row `## Exports`
  table mirroring `packages/fresh/deno.json`.

### Domain Vocabulary

- `ExportMapping` — the checker record tying a package export map to its authoritative reference.
- `SymbolCoveragePolicy` — explicitly distinguishes entrypoint coverage from complete symbol prose.

### Ports

- `deno doc --json` — authoritative inspection boundary for each published entrypoint.

### Constants

- The sixteen export keys and paths come only from `packages/fresh/deno.json`.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Prove all Fresh entrypoints are documented and drift-checked, then refresh derived consumers. | Required #1817 docs/corpus gate set | Fresh reference, export-drift mapping, generated corpus, and run artifacts |

### Deferred Scope

- Dedicated `/desktop`, `/defer/island`, `/ai`, and `/ai/sandbox` symbol sections — explicitly out
  of scope in issue #1817.
- Exhaustive updates for the seven partially documented existing sections — separately tracked
  symbol-prose work.

### Contributor Path

Future Fresh export changes start in `packages/fresh/deno.json`; contributors then update the
`## Exports` table and run `deno task docs:exports-drift` before regenerating the corpus chain.

## Progress Log

| Date | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31 | 1 | Research | Ran `deno doc --json` against all sixteen entrypoint modules and compared symbol sets with existing sections. |
| 2026-08-31 | 1 | Plan gate | `PLAN-EVAL: N/A` recorded before implementation; mechanical contract is complete and evidence-checkable. |
| 2026-08-31 | 1 | Implementation | Added the sixteen-row `## Exports` table and the `fresh` authoritative mapping. |
| 2026-08-31 | 1 | Generation | Ran `gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets`; each exited 0. |
| 2026-08-31 | 1 | Gate | Required docs, corpus, generated typecheck, diff, lock, and provenance checks passed at implementation commit `e4dcf7200`. |
| 2026-08-31 | 1 | Reconcile | Issue #1817 remains open at `status:impl`; the resolving PR will carry `Closes #1817`, exact acceptance evidence, `type:docs`, `area:fresh`, `area:docs`, and docs-only CI labels. |

## Gate Results

The corpus freshness checks intentionally compare generated files with `HEAD`. A pre-commit
exploratory `check:assets-barrel` returned 1 solely because the newly generated barrel was not yet
committed; it is excluded from acceptance evidence. At implementation commit `e4dcf7200`, every
required gate returned 0. The PR validation table will use a complete replay at the final pushed
head after this evidence update.

| Gate | Exit | Notes |
| --- | ---: | --- |
| `deno task docs:exports-drift` | 0 | Fresh recognized with all sixteen entrypoints. |
| `deno task --cwd docs/site check:source-format` | 0 | Source format OK. |
| `deno task --cwd docs/site build` | 0 | 639 files generated; rendered output OK. |
| `deno task --cwd docs/site check:links` | 0 | 35,344 internal links resolve. |
| `deno task --cwd docs/site check:caveats` | 0 | 18 caveat references resolve. |
| `deno task docs:links` | 0 | No broken links or anchors. |
| `deno task docs:accuracy` | 0 | PASS; pre-existing TanStack peer warning only. |
| `deno task docs:snippets` | 0 | 581 snippets scanned; PASS. |
| `deno task check:agent-docs-prose` | 0 | Generated prose is fresh. |
| `deno task check:assets-barrel` | 0 | CLI generated assets match committed inputs. |
| `deno task check:publish-assets` | 0 | MCP publish assets are fresh. |
| `deno task check:mcp-export-corpus` | 0 | 35 packages, 270 subpaths, and 7,623 symbols verified. |
| `deno check --unstable-kv packages/cli/src/kernel/assets/agent-docs.generated.ts packages/mcp/src/publish-assets.generated.ts` | 0 | Both generated consumers type-check. |
| `git diff --check` | 0 | No whitespace errors. |
| `git status --porcelain` | 0 | Exact output was empty. |
| `git diff --exit-code origin/main -- deno.lock` | 0 | `deno.lock` is unchanged. |
| `git merge-base --is-ancestor f48eadd99 HEAD` | 0 | Generated provenance source commit is a valid ancestor. |

## Handoff Notes

- The separate IMPL-EVAL should independently rerun `deno task docs:exports-drift` and inspect the
  four new purpose lines against their modules' `deno doc --json` output.
- This implementation session does not self-certify; the supervisor owns IMPL-EVAL and lifecycle
  progression beyond `status:impl`.
