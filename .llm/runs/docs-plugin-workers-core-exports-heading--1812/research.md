# Research

## Baseline

Re-baselined against `origin/main` `5197e70b7`. The package exports root plus sixteen subpaths, and
the existing page's seventeen-row table matches that export map. The table sat under `##
Entrypoints`, which `parseDocContent()` does not recognize.

## Symbol coverage

`deno doc --json` was run separately against all seventeen published modules. The root's 32 exports
are all documented somewhere on the page. Across all entrypoints there are 377 unique symbols; 334
are absent from the page after shared re-exports are deduplicated and documentation anywhere on the
page is credited.

Representative real omissions include `JobBuilderState` (builders), `WorkersRuntime` (runtime),
`PublicDefinitionSchema` (schemas), `WorkersContractV1` (contracts/v1), `WorkersConfig` (config),
`WorkerInstrumentation` (telemetry), and `TestWorkersRuntime` (testing). Therefore
`entrypoints-only` is the honest policy; `complete` would overclaim the current page.

## Open questions

None. Issue #1812 fixes the heading, mapping fields, generator order, gates, and PR lifecycle.
