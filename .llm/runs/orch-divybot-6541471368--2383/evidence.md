# Compensation persistence evidence

## Focused acceptance proof

Structured wrapper command:

```text
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts --output <report> -- --allow-all --unstable-kv --frozen packages/plugin-sagas-core/tests/runtime/saga-compensation-retry_test.ts packages/plugin-sagas-core/tests/prisma-transition-postgres_test.ts
```

Real isolated Redis/PostgreSQL were enabled. `SAGA_POSTGRES_TEST_FILTER=compensation` selected the focused generated-client cases; `SAGA_POSTGRES_EVIDENCE` retained the child output privately.
Wrapper exit **0**, **19 passed / 0 failed / 0 ignored**. Eighteen KV-family cases are memory, persisted Deno KV and real Redis × before/after commit failure × compensated/failed/compensating outcome. The nineteenth result encloses **12 passed / 0 failed** real PostgreSQL generated-client cases (ordinary/command adapter × before/after commit × compensated/failed/compensating).

Before commit: KV intercepts its single physical atomic batch and proves state, history and replay were in that same batch. PostgreSQL throws after the actual replay insert inside its transaction, before updating state. Both retain original canonical envelope/history, correlation and no digest. Recreate the engine, reopen persistent KV/Redis handles or reconstruct the PostgreSQL store without clearing rows, then retry the same outcome: committed true, version 2, requested status and one compensation history row.

After commit: inject loss of acknowledgement only after provider success. Reopen/reconstruct and retry: committed false, version 2, correct requested status, exactly one compensation history row. A second replay does not change the envelope or history.

## Red negative controls

Separate verification worktree retains these tests and restores only the former independent compensation replay reservation (see negative-control.patch). No production or reviewed source is mutated.

- Structured KV-family before-commit filter: exit **1**, **0 passed / 9 failed / 0 ignored**. All three outcomes fail on memory, persisted KV and real Redis.
- Structured PostgreSQL wrapper: exit **1**; its child runs **0 passed / 6 failed**, all three outcomes on both real PostgreSQL adapters.
- Each acceptance retry fails specifically because the poisoned reservation returns `committed: false` where `committed: true` is required. This reproduces the stranded outcome without undoing unrelated inbound fixes. The current atomic implementation passes every case.

## Static and architecture gates

Structured check/lint/fmt: two changed TS files selected, zero findings or dropped files. PostgreSQL template is type-checked as its generated consumer test by the provider harness.
`quality:gate` through run-gate.ts: exit **0**, PASS, including code-quality and architecture scans. Existing repository warnings remain advisory.
JSR audit for core and plugin: exit **0**, dry-run OK; existing cardinality warnings and scanner counting its slow-type-check banner are unchanged. No exported API/dependency/lock changes.
Full core/store/runtime/service suite and exact-head CI/evaluation will be recorded before READY. Full local scaffold.runtime deliberately NOT RUN under the owner's host scheduling constraint; request coordinator-armed e2e-cli verdict.


## Broader regression and documentation

Structured full core/store/runtime/service suite with both real providers: exit **0**, **285 passed / 0 failed / 2 optional-provider/CI ignores**. The PostgreSQL child runs **14 passed / 0 failed**, including all eight compensation cases. Scope: `packages/plugin-sagas-core plugins/sagas/tests/runtime plugins/sagas/src/runtime plugins/sagas/tests/services plugins/sagas/services/src/prisma-retention_test.ts`.
Public JSDoc policy regression: **4 passed / 0 failed / 0 ignored**.
Full-export structured doc-lint: core **7** private references; plugin **30**, zero missing JSDoc or other errors. These are the same inherited counts recorded by #2499, and this PR changes no exported production TS, so they are reported as existing failures, not green gates.


## IMPL-EVAL repair

Round 1 found one missing locked-plan case: chained compensation, which keeps the outcome `compensating` and exercises KV's open-state retention branch. Added that third status to the shared fixture and every provider case. Final focused proof: **18 KV-family + 12 PostgreSQL child cases**, all pass; expanded old-path controls: **9 KV-family + 6 PostgreSQL child failures**, all specifically poisoned retries. These supersede the earlier two-status counts above where historical results are named.


## Final repair gate refresh

Expanded structured core/store/runtime/service suite: **291 passed / 0 failed / 2 optional-provider/CI ignores**, exit **0**, with real Redis and PostgreSQL. PostgreSQL generated child: **18 passed / 0 failed**, including all twelve compensation cases. Scoped source check/lint/fmt again pass after the third-status repair; quality:gate also returns PASS. No new source/API/doc-lint debt.
