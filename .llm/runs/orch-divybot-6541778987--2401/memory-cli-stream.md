# Aspire observation and validation recipes

The recurring shipped CLI snapshot loop was database operations/operation-runner.ts. Extend AspireCommandExecutor for process edges; do not call Deno.Command from the application wait path. Follow is NDJSON (individual resource or resources envelope); its first record is a baseline and can contain a stale previous exit. Consume that record before start, require fresh nonterminal state, then accept terminal numeric exit. CLI health/doctor MCP requests and generated telemetry pages have no autonomous timer; one-shot reads remain permitted.

Focused regression gate: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/cli/src/kernel/adapters/database/operations .llm/tools/validation/check-aspire-resource-polling_test.ts`.

Root lint/fmt exclude CLI files even when explicitly named. Use structured wrappers with --config pointing to an explicit config outside Git containing fmt {singleQuote:true,lineWidth:100,semiColons:true} and lint {rules:{tags:[recommended,jsr]}}; use a precise --include or --file selection. All-excluded output is a refusal, never PASS. No dependencies, lockfiles, or caches changed.

Deno BDD steps are nested: --filter on a nested `it` title silently selects zero top-level tests. For a negative control run the entire operation-runner_test.ts file (or filter its suite), inspect nonzero result count and failure names. The restored baseline produced the expected `0` streams versus `1` assertion failure; zero-selected output is not proof.
