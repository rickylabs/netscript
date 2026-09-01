# Research — docs-adopt-plugin-pages-b--1857

## Re-baseline

- Carried-in source: `implement.md`, measured originally at `8e01a347a`.
- Re-derived against `origin/main` @ `d2b33a09bbcb37946e339837238987b79c192fd3`
  on 2026-09-01.
- What changed vs the carried-in version:
  - `origin/main` advanced, so the bootstrap commit was rebased before edits.
  - The authoritative denominator remains 32 mapped rows and 36 physical reference pages.
  - The real checker reproduces the same 14 findings: one triggers omission, four workers
    omissions, seven plugin-auth path mismatches, and two plugin-auth omissions.
  - Symbol coverage was not trusted from the brief; it was freshly measured below.

## Findings

| # | Finding | How to verify |
| - | --- | --- |
| 1 | The unmodified 32-row checker exits 0. | `deno task docs:exports-drift` |
| 2 | Current main has 32 mapping names: fresh, plugin-workers-core, plugin-sagas-core, plugin-sagas, ai, auth-kv-oauth, plugin-triggers-core, plugin-auth-core, mcp, plugin-streams-core, plugin-streams, aspire, cli, watchers, runtime-config, prisma-adapter-mysql, auth-workos, auth-better-auth, cron, database, fresh-ui, kv, logger, plugin, plugin-ai-core, plugin-ai, config, contracts, queue, sdk, service, telemetry. | Import and print `AUTHORITATIVE_MAPPING` from `.llm/tools/docs/check-exports-drift.ts`. |
| 3 | There are 36 physical `docs/site/reference/*/index.md` pages. | `find docs/site/reference -mindepth 2 -maxdepth 2 -type f -name index.md` |
| 4 | Provisional mappings reproduce exactly 14 findings and zero `INVENTS`: triggers omits `/adapter-cli`; workers omits `/adapter-cli`, `/doctor`, `/jobs/health-check.ts`, `/runtime`; plugin-auth has seven path mismatches and omits `/scaffold` plus `/adapter-cli`. | Import `checkDrift`, append three provisional mappings, and run it against the live pages. |
| 5 | `plugins/triggers` has 11 entrypoints and 150 unique non-default exported symbols; the page backticks 17 real symbols, leaving 133. | `deno doc --json` over every `plugins/triggers/deno.json` export via `.llm/tmp/measure-reference-symbol-coverage.ts`. |
| 6 | `plugins/workers` has 13 entrypoints and 175 unique non-default exported symbols; the page backticks 125 real symbols, leaving 50. | Same measured script over `plugins/workers`. |
| 7 | `plugins/auth` has 9 entrypoints and 84 unique non-default exported symbols; the page backticks 5 real symbols, leaving 79. | Same measured script over `plugins/auth`. |
| 8 | The missing adapter CLI entrypoints export the shared `PluginCliArgs`, `PluginCliEntrypoint`, and `PluginCliResult` contracts. Workers doctor exports `workersAdapterPlugin`; its health-check entrypoint exports `HealthCheckJobContext`, `HealthCheckJobHandler`, `HealthCheckJobResult`, and `healthCheckJob`; its runtime entrypoint exports generated-registry contracts and start helpers. | Per-entrypoint arrays in `.llm/tmp/docs-adopt-plugin-pages-b-symbols.jsonl`. |
| 9 | The auth page is a five-package hub for `@netscript/plugin-auth`, `@netscript/plugin-auth-core`, `@netscript/auth-kv-oauth`, `@netscript/auth-workos`, and `@netscript/auth-better-auth`; it is not a package reference. | `docs/site/reference/auth/index.md` § Units. |
| 10 | PR #1803 establishes the parser-compatible table shape: Export, Path, Purpose, with no internal backtick in the captured first two cells. | `docs/site/reference/auth-kv-oauth/index.md` and PR #1803. |

## jsr-audit surface scan (package/plugin waves)

- N/A: this is a documentation/tooling-only adoption. No `packages/*` or `plugins/*` source,
  manifest, dependency, or published export changes.
- Public-surface risk is nevertheless measured directly from every declared entrypoint with
  `deno doc --json`; all three pages have nonzero symbol gaps and must use
  `mode: 'entrypoints-only'`.
- Existing debt remains unchanged, including the triggers/workers Refactor records and workers
  private-type-reference allowance tracked under #1655.

## Open questions

- None. The owner locked the auth hub exclusion, exact commit separation, generator order, gate
  set, PR metadata, and final lifecycle ownership.
