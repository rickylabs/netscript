# PR #1952 convergence evidence

## Docker permission follow-up

- Starting head: `f4a4169b60ad1c03410481d4df57c8157d5db3e1`.
- Hosted Docker-tier result at that head: 58 gates passed and
  `runtime.health.listener-unreachable` failed because
  `owned-container-log.ts` invokes `docker` while the gate granted only
  `--allow-run=aspire`.
- Fix: the built argv for only `runtime.health.listener-unreachable` now grants
  `--allow-run=aspire,docker`.
- Regression: `runtime-gates_test.ts` builds the named gate, parses its
  `--allow-run=` argv entry, and verifies the subprocess executables are allowed.
- `behavior.live-db-endpoint` did not fail in the hosted run. The no-TCP-URL red
  observed on PR #1957 remains intermittent and is not acted on by this change.
- The full `deno task e2e:cli` suite was intentionally not run locally. The
  re-fired hosted Docker tier is the runtime proof.
- Lockfile churn: 0.

## Focused validation

All commands captured the process status with `out=$(cmd); rc=$?`; no pipeline
was used.

| Command | Real exit | Result |
| --- | ---: | --- |
| `deno test --allow-all packages/cli/e2e/tests/application/builders/runtime-gates_test.ts` | 0 | 29 passed, 0 failed |
| `deno test --allow-all packages/cli/e2e/tests/application/gates/listener-unreachable-fixture_test.ts` | 0 | 10 passed (10 steps), 0 failed |
| `deno test --allow-all packages/cli/e2e/tests/application/gates/owned-container-log_test.ts` | 0 | 3 passed, 0 failed |
| `deno test --allow-all packages/cli/e2e/tests/application/gates/readiness-disagreement_test.ts` | 0 | 4 passed, 0 failed |
| `deno test --allow-all packages/cli/e2e/tests/application/gates/listener-readiness-gates_test.ts` | 0 | 6 passed, 0 failed |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts` | 0 | 222 files, 2 batches, 0 failed batches |
| `deno fmt --check` on the three changed TypeScript files | 0 | 3 files checked |
