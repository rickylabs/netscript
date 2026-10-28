# S8b validation

The following commands ran locally. `check.json`, `lint.json`, `fmt.json`, `tests.json` and
`root-test-bridge.json` are structured wrapper output. The exports and broader-quality commands have
actual `run-gate.ts` receipts. They record precommit HEAD `da605e2fc`; implementation was present in
the working tree during execution. Receipts prove command execution, not a clean-tree/head match.

| Command / working directory | Exit | Evidence |
| --- | --- | --- |
| `deno task build` / docs/site | 0 | 754 files, 251 HTML pages; source formatting and rendered-placeholder checks pass |
| `deno task check:links` / docs/site | 0 | 42,230 internal links across 251 pages, all resolve |
| `deno task check:caveats` / docs/site | 0 | 15 markers across 12 pages, all references resolve |
| `deno task docs:exports-drift` / root | 0 | exports-drift.receipt.json, PASS |
| `deno task docs:snippets` / root | 0 | scanned=655, TS-like=344, checked=27, exempt=14, malformed=0 |
| `deno task quality:scan` / root | 0 | quality-scan.receipt.json, PASS, no new allowances |
| scoped run-deno-check/lint/fmt wrappers / docs/site | 0 | six owned TS files selected, zero findings; check includes --unstable-kv |
| run-deno-test fixture / docs/site | 0 | tests.json, 7 passed; includes intentional omission controls |
| run-deno-test root CI bridge / root | 0 | root-test-bridge.json, 1 passed; invokes the same seven substantive tests with existing site config |
| Playwright capture / local /netscript/ mount | 0 | browser-results.json; 18 route/scheme checks, six screenshots |
| `deno task e2e:cli` / root | 1 | e2e-cli-summary.json; runtime UNPROVEN, Aspire environment failure before scaffolding |
| `deno task maint:leak-check -- --slice-dir <run> --worktree <worktree>` / root | 0 | leak-report.md and resource-summary.json; no run-owned runtime resource, all foreign/unknown entries left untouched |

Fixture command:

```sh
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --cwd docs/site -- --no-lock --allow-read _plugins/design-system/renderer-fixture.ts
```

Root CI bridge command:

```sh
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --no-lock --allow-read --allow-run=deno docs/site/_plugins/design-system_test.ts
```

Source wrappers select `--cwd docs/site --root _plugins --root design-system --include design-system
--ext ts`, with `--deno-arg --no-lock` for the check wrapper. All tests/type checks use configured
sources rather than a raw root check verdict.

The full CLI suite failed at `preflight.aspire`, then `cleanup.aspire-stop` failed with no generated
AppHost. The default mise shim hides the installed .NET SDK from Aspire; direct SDK PATH fixes that
probe. Docker's daemon is still unavailable. No runtime gate or CI gate was modified, skipped or
reported green. This is ready for documentation review, not a runtime merge/release certification.

PLAN-EVAL and IMPL-EVAL each ran in separate native Claude Opus 5.5 sessions, independent from the
OpenAI implementer. The same evaluator was retained across each phase's allowed follow-up. Final
IMPL-EVAL PASS approves the implementation slice and CI bridge for commit and review, while
preserving the unproven runtime status.

Post-commit command evidence: `quality-scan-final.receipt.json` attests the broader scanner on clean
implementation HEAD `fafe315a15b50e403623a402615ff635f473224f`, including the final CI test bridge.
The earlier exports/quality receipts remain preserved with their original provenance. Failed runtime
preflight and cleanup command receipts are retained as runtime-preflight.receipt.json and
runtime-cleanup.receipt.json; they came from the single full suite invocation, not split smoke runs.
