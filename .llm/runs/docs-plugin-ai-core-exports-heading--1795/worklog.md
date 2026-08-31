# Worklog: plugin-ai-core exports heading

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-plugin-ai-core-exports-heading--1795` |
| Branch | `docs/plugin-ai-core-exports-heading` |
| Archetype | N/A — docs/tooling only |
| Scope overlays | docs |

## Design

### Public Surface

- No published API changes; align the reference page with the existing two-entrypoint package surface.

### Domain Vocabulary, Ports, and Constants

- No new domain types, ports, or constants.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Recognize the existing exports table and adopt the package into drift checking, including derived corpora. | Required issue #1795 gate set | page, checker mapping, generated corpus, run artifacts |

### Deferred Scope

- Five missing contract-symbol table entries and the other #1777 packages remain outside this issue.

### Contributor Path

Future maintainers update the package export map and dedicated reference tables, then run `deno task docs:exports-drift` and the docs-corpus generator/check chain.

## PLAN-EVAL

`PLAN-EVAL: N/A` — mechanical scope with a reproducible set-diff deciding symbol coverage.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31 | 1 | research | Root 23/23 documented; contract subpath has five genuinely undocumented exports. |
| 2026-08-31 | 1 | implementation | Renamed only the heading, added the evidence-based mapping, and regenerated the corpus chain in order. |
| 2026-08-31 | 1 | reconcile | Issue remains open at `status:impl`; scope, milestone, closing-keyword intent, and acceptance mapping remain aligned. |

## Gate Results

| Gate | Exit | Notes |
| --- | ---: | --- |
| `deno task docs:exports-drift` | 0 | New mapping included; checker PASS. |
| `deno task --cwd docs/site check:source-format` | 0 | PASS. |
| `deno task --cwd docs/site build` | 0 | 639 files generated; rendered output PASS. |
| `deno task --cwd docs/site check:links` | 0 | 35,344 internal links resolve. |
| `deno task --cwd docs/site check:caveats` | 0 | 18 caveat markers resolve. |
| `deno task docs:links` | 0 | PASS. |
| `deno task docs:accuracy` | 0 | PASS. |
| `deno task docs:snippets` | 0 | PASS. |
| `deno task check:agent-docs-prose` | 0 | PASS after regeneration. |
| `deno task check:assets-barrel` | 1 pre-commit | Expected diagnostic: task compares generated output to Git `HEAD`; correct generated delta was not yet committed. Must rerun at committed head. |
| `deno task check:assets-barrel` | 0 committed head | PASS after the generated corpus was committed, confirming the task's Git-diff contract. |
| `deno task check:publish-assets` | 0 | PASS. |
| `deno task check:mcp-export-corpus` | 0 | PASS. |
| targeted generated-file `deno check --unstable-kv` | 0 | PASS. |

The full required set will be rerun without further source changes at the final pushed head; the PR validation table is the delivery record for those final exit codes.
