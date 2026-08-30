# Research — docs-aspire-public-surface--1782

## Re-baseline

- Carried-in source: issue #1782 and slice brief.
- Re-derived against `origin/main` at `2a65a8cd0f3872c2b95b00fe0a9edae10531921b` on 2026-08-30.
- Result: the brief's load-bearing export analysis matches source without qualification.

## Findings

| # | Finding | How to verify |
| --- | --- | --- |
| 1 | `packages/aspire/deno.json` publishes `.`, `config`, `schema`, `types`, `constants`, `application`, `adapters`, `testing`, and `public`; it publishes no `domain` or `ports` sub-path. | Read `packages/aspire/deno.json` `exports`. |
| 2 | `src/public/mod.ts` directly exports `AspireError`, `DuplicateContributionError`, `ReferenceSpec`, and `AspireRuntime` from domain/port files. | Read lines 56, 70, and 72 of `packages/aspire/src/public/mod.ts`. |
| 3 | No other published entrypoint re-exports these four symbols. Internal `src/domain/mod.ts` and `src/ports/mod.ts` are not in the export map. | Search the package for the four names and compare matches with the export map. |
| 4 | `AspireError` is the package failure base; `DuplicateContributionError` is thrown by `ContributionRegistry.register` for a repeated plugin name. | Read `src/domain/errors.ts` and `src/runtime/contribution-registry.ts`. |
| 5 | `ReferenceSpec` describes `from`, `to`, and optional `waitFor`; `AspireRuntime` is the async `start`/`stop` plus lifecycle `status` port. | Read `src/domain/reference-spec.ts` and `src/ports/aspire-runtime-port.ts`. |
| 6 | Site generation feeds `_site` into the shared prose corpus, which feeds the CLI agent-docs barrel and MCP publish asset. | Read the three generator scripts named in the brief and the root generation tasks. |

## jsr-audit surface scan

- N/A: this docs slice neither changes nor designs a package/plugin export. It documents the current
  published surface without changing `packages/aspire`.

## Open questions

- None. The entrypoint reachability and definitions are resolved from source.
