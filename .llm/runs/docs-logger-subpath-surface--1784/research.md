# Research — docs-logger-subpath-surface--1784

## Re-baseline

- Carried-in source: issue #1784, umbrella #1777, and the slice brief.
- Re-derived against `origin/main` at `38439740f248ef2ba5f173dad96b2edaa829392c` on 2026-08-30.
- The carried-in defect is current: no separate logger integration page exists and none of the five
  named positive probes occurs in `docs/site/reference/logger/index.md`.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `packages/logger/deno.json` publishes `.`, `./middleware`, and `./orpc`. | Read its `exports` map. |
| 2 | The four candidate separate-page paths contain zero tracked files on `origin/main`. | `git ls-tree -r --name-only origin/main -- <path>` for each candidate. |
| 3 | The page promises separately generated pages, but names none of the five issue probes. | Read/grep `docs/site/reference/logger/index.md`. |
| 4 | `deno doc --json packages/logger/middleware.ts` reports 13 public symbols. | Enumerate the module's `nodes[*].symbols`. |
| 5 | `deno doc --json packages/logger/orpc.ts` reports 13 public symbols. | Enumerate the module's `nodes[*].symbols`. |
| 6 | The sub-paths share only `Logger`, which both re-export from LogTape and the root surface. | Compare the two `deno doc` symbol sets and source export statements. |
| 7 | The target is 26 table rows: 24 sub-path-specific symbols plus one `Logger` re-export row in each table. | Set comparison of the two 13-symbol inventories. |
| 8 | `docs/site/**` feeds `_site`, then the prose gzip/provenance pair, then the CLI and MCP generated assets. | Read the three named generator implementations and root tasks. |

## jsr-audit surface scan (package/plugin waves)

- N/A: this is a docs-only repair. It audits but does not modify the already-published logger
  surface; source and publishability changes are forbidden.

## Open questions

- None. Source fixes, separate pages, `AUTHORITATIVE_MAPPING`, database, and CLI are explicitly out
  of scope.
