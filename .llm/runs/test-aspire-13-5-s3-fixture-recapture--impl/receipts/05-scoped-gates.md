# Slice 5 scoped gate evidence

Date: 2026-08-30

## Type check

```text
deno run --allow-read --allow-run .llm/tools/run-deno-check.ts \
  --root packages/mcp \
  --root packages/telemetry \
  --root .llm/tools/agentic/teardown \
  --root packages/cli/e2e \
  --ext ts,tsx \
  --exclude '^packages/cli/e2e/fixtures/desktop-native/'
```

Result: PASS — 391 files, 0 findings.

## Lint

The scoped lint wrapper passed 378 of 378 files under `packages/mcp`, `packages/telemetry`, and
`packages/cli/e2e`, excluding the nested `desktop-native` workspace. The wrapper correctly refused
to claim a verdict for `.llm/tools/agentic/teardown` because the root configuration excludes `.llm`;
its two owned TypeScript files were therefore checked with the required raw fallback:

```text
deno lint --no-config \
  .llm/tools/validation/check-compat-fixtures_test.ts \
  .llm/tools/agentic/teardown/probes_test.ts
```

Result: PASS — 2 files checked by the fallback, 0 findings.

## Format

The scoped format wrapper passed 390 of 390 TypeScript files across all four roots. The
config-excluded files and fixture documentation were also checked directly:

```text
deno fmt --no-config --single-quote --line-width=100 --check \
  .llm/tools/validation/check-compat-fixtures_test.ts \
  .llm/tools/agentic/teardown/probes_test.ts \
  .llm/tools/agentic/teardown/__fixtures__/README.md \
  .llm/tools/agentic/teardown/__fixtures__/aspire-ps-13.5.3.json
```

Result: PASS — 4 owned files checked directly.

## MCP export corpus

```text
deno task check:mcp-export-corpus
```

Result: PASS — 35 packages, 270 subpaths, 7,614 symbols; corpus SHA-256
`88011e6e459097ba4c74111063dbef13a95823702bd37447f358bc19375cc262`. No export corpus regeneration or
public-surface change occurred.
