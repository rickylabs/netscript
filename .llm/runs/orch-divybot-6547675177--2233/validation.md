# Validation

Commands ran on the implementation working tree based on bootstrap commit `797b9bec23409b4b62beba1fb68a519bb4c79418`. Receipts prove these commands; source hashes below bind the reviewed implementation. No claim that bootstrap HEAD contains the uncommitted source.

| Gate | Result | Evidence |
| --- | --- | --- |
| Structured scoped check, both owned TS files | PASS, exit 0 | No findings; both files selected and processed. |
| Structured scoped lint, both owned TS files | PASS, exit 0 | No findings; both files selected and processed. |
| Structured scoped fmt, both owned TS files | PASS, exit 0 | No findings; both files selected and processed. |
| Structured scoped tests | PASS, exit 0 | 45 passed, zero failed/ignored. |
| `deno task quality:gate` | PASS, exit 0 | Durable runner invocation `issue-2233-quality`; stdout SHA-256 `c02501e9bb227d493b15208f45eb025b80012768c4a7a04678ad54581136d573`. |
| `deno task check:agent-docs-prose` | PASS, exit 0 | Durable runner invocation `issue-2233-docs`; stdout SHA-256 `72184d0e79fd4a73f74a1b2d6ed53bf97931241d8a404e78c4f2cf19bfa70e1e`. |
| `deno task check:assets-barrel` | PASS, exit 0 | Durable runner invocation `issue-2233-assets`; stdout SHA-256 `0ecd048fa9c7095048ab35ccf506ebb45905bff90b610b9647950cd616023ad8`. |
| `deno task check:publish-assets` | PASS, exit 0 | Durable runner invocation `issue-2233-publish`; stdout SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`. |
| `deno task check:mcp-export-corpus` | PASS, exit 0 | Durable runner invocation `issue-2233-exports`; stdout SHA-256 `85af3ab887c8fa7ee0bfcccc79ed668b6efbb2783141797bb3b6d0f7aea13cb3`. |
| Four manifest negative controls | Expected exit 1, one assertion failure each | `negative-controls.json`; both rows removed individually, both made volatile individually. |
| CLI JSR audit / native publish dry-run | PASS exit 0, no FAIL findings | Existing vocabulary/cardinality warnings; slow-type scanner counts the banner as WARN, native dry-run succeeds. |
| `git diff --check` | PASS exit 0 | No whitespace errors. |
| Full CLI scaffold/runtime E2E | Not required, not run | Manifest-only CLI adapter; owner forbids local scaffold.runtime. |

## Exact test set

```sh
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv \
  packages/cli/src/public/adapters/agent/deno-agent-docs-generator_test.ts \
  packages/cli/src/public/features/agent/init/init-agent_test.ts \
  .llm/tools/docs/mergeable-carriers_test.ts \
  .llm/tools/docs/carrier-parity_test.ts \
  .llm/tools/docs/build-agent-docs-bundle_test.ts
```

Scoped check/lint/fmt use `.llm/tools/run-deno-{check,lint,fmt}.ts` with the two adapter files via `--file`, `--ext ts`. Lint/fmt explicitly use this run's scoped-deno.json because root config excludes CLI. All four freshness gates ran unchanged through `.llm/tools/gates/run-gate.ts`; assets-barrel regenerated canonically and produced no carrier diff.

## Source identity

- `packages/cli/src/public/adapters/agent/deno-agent-docs-generator.ts`: `e8b7482bb6a391a76e6df84426d4dc9fdd41d745bc4a756653563d407c6c3cef`
- `packages/cli/src/public/adapters/agent/deno-agent-docs-generator_test.ts`: `1795b6b6d0b74f4550c5b93b2b8ba98d66c9d6bb95deb2fde8b4cd7e452f2e8d`
- `.llm/tools/docs/generated-carriers.md`: `7b6e9f94e6f065aea0eaa01ecf506d724f14c383fc2a19d4fe5d0fbbfcd41efd`

## Size impact

The only shipped change adds 707 bytes to the CLI adapter; the test and run records are excluded from publication. MCP and stored carriers are byte unchanged. Original accepted package-size evidence remains #2234 (CLI −15.2%, MCP +8.8%; coordinator Step 0). No added dependency or export.
