# Worklog

## Design

- Public surface: no package API changes; five existing root entrypoints become explicit in docs.
- Domain vocabulary: `PackageMapping` and `SymbolCoverage` remain unchanged.
- Ports: none.
- Constants: none.
- Commit slices: one mechanical docs/mapping/generation slice, proven by the required gate set.
- Deferred scope: the other ten #1777 packages and every package source change.
- Contributor path: add a package reference table row, declare its evidence-based coverage policy,
  then regenerate the docs corpus and run drift checks.

## PLAN-EVAL

N/A for the issue-locked mechanical fix described in `plan.md`.

## Implementation

- Compared all five pages with `deno doc --json` and selected one `complete` policy plus four
  `entrypoints-only` policies.
- Added one root export table to each page.
- Added the five mappings without changing the checker contract.

## Gate results

| Command | Exit |
| --- | ---: |
| `deno task gen:agent-docs-prose` | 0 |
| `deno task gen:assets-barrel` | 0 |
| `deno task gen:publish-assets` | 0 |
| `deno task docs:exports-drift` | 0 |
| `deno task --cwd docs/site check:source-format` | 0 |
| `deno task --cwd docs/site build` | 0 |
| `deno task --cwd docs/site check:links` | 0 |
| `deno task --cwd docs/site check:caveats` | 0 |
| `deno task docs:links` | 0 |
| `deno task docs:accuracy` | 0 |
| `deno task docs:snippets` | 0 |
| `deno task check:agent-docs-prose` | 0 |
| `deno task check:assets-barrel` | 0 |
| `deno task check:publish-assets` | 0 |
| `deno task check:mcp-export-corpus` | 0 |
| `deno check --unstable-kv packages/cli/src/kernel/assets/agent-docs.generated.ts packages/mcp/src/publish-assets.generated.ts` | 0 |

Final Git whitespace, status, and lock checks are recorded after this artifact update.

`check:assets-barrel` first returned 1 because its final comparison is working tree versus index
and the intended generated asset was not staged. After staging only the owned changes, the same
command returned 0. This was an index-state diagnostic, not generated-content drift.

## Reconcile

Issue #1793 was read live and remains open at `status:impl`; its four Acceptance boxes will be
mapped in the PR body. Push and PR creation remain pending.
