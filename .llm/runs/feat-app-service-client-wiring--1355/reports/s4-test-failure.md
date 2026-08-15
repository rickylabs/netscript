# S4 binding test failure and attribution

## Binding receipt

- Content head: `35061bc80ab39c8aa428ca91e44de47d59dbcf82`.
- Receipt: `receipts/s4-test.json`.
- Invocation ID: `app-service-client-wiring-s4-test`.
- Command: `deno task test` through `.llm/tools/gates/run-gate.ts`.
- Attestation: `gitHead == actualGitHead == 35061bc80ab39c8aa428ca91e44de47d59dbcf82`;
  no mismatch override.
- Outcome: **FAIL**, exit 1 after 392,446 ms.
- Structured total: 4,201 passed, 1 failed, 19 ignored, 4,221 results.

The sole failure is `capability suites select only their scoped gates` at
`packages/cli/e2e/tests/presentation/suite-registry_test.ts:54`. The resolved service suite now
contains this final gate:

```text
generated.deno-lint
```

but the expected array at lines 56–62 still ends after `generated.service-check`.

## Attribution

This is **caused by this leaf**, not a carried baseline:

- S2 commit `94328037b` added `GATE.GENERATED_DENO_LINT` to `SERVICE_GATES` in
  `packages/cli/e2e/suites/scaffold/capability-suites.ts:32`.
- `packages/cli/e2e/tests/presentation/suite-registry_test.ts` is unchanged between
  `c53726c69` and the binding content head.
- The focused structured test command at pre-implementation commit
  `c53726c69b98a35bf293b89aeece12279f470be3` passes all 19 tests with exit 0:
  `run-deno-test.ts -- --allow-all packages/cli/e2e/tests/presentation/suite-registry_test.ts`.
- At the current content head, the binding full-suite receipt exposes the stale expectation as the
  only failure.

The earlier S2 full CLI source suite covered `packages/cli/src/`, not `packages/cli/e2e/tests/`, so
it could not detect this stale E2E suite-registry assertion.

## Stop boundary

Per the S4 dispatch, a red that does not reproduce at `c53726c69` stops the artifact-only slice
before repair. No product code was edited. The remaining binding `publish-dry-run` and `arch-check`
gates were not run.

Exact contracted sufficiency is **INSUFFICIENT**:

1. `receipts/s4-check.json` — invocation `app-service-client-wiring-s4-check`; PASS at the content
   head.
2. `receipts/s4-test.json` — invocation `app-service-client-wiring-s4-test`; FAIL at the content
   head.
3. `receipts/s4-publish-dry-run.json` — invocation
   `app-service-client-wiring-s4-publish-dry-run`; missing / NOT_RUN.
4. `receipts/s4-arch-check.json` — invocation `app-service-client-wiring-s4-arch-check`; missing /
   NOT_RUN.
