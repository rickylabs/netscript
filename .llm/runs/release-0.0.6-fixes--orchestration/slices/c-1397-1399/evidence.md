# Slice C evidence — #1397 then #1399

Date: 2026-08-12  
Worktree: `/home/codex/repos/ns006-f-c-e2e-gates`  
Branch: `fix/1397-1399-e2e-gate-set-truth`  
Base: `01aa12b67e36b643e1ca4f94421ecba07e030db5`

## Ordered commits

```text
86d265f74 test(cli-e2e): pin deferred gates for every suite (#1399)
78d587ac9 fix(cli-e2e): keep service health across database overrides (#1397)
```

## #1397 negative control: restored old Postgres-only service-health filter

Command:

```text
deno test --allow-env --allow-write packages/cli/e2e/tests/presentation/suite-registry_test.ts
```

Exit code: `1`

```text
running 18 tests from ./packages/cli/e2e/tests/presentation/suite-registry_test.ts
registry exposes scaffold capability suites from constants ... ok
native desktop suite is registered with an honest fixture preflight ... ok
capability suites select only their scoped gates ... ok
plugin suite includes all official plugin and generated-check gates ... ok
true userland suite runs init, four no-samples plugin installs, assertion, and cleanup ... ok
runtime suite includes full scaffold, database, runtime, and behavior gates ... ok
runtime suites pin the exact #1398 OTEL deferral without widening it ... ok
runtime suite waits for the generated app and requests its home page ... ok
runtime DB mutations run only after the resident AppHost starts ... ok
runtime suite omits database resource wait for sqlite ... ok
sqlite runtime suite resolves its reduced-container defaults without mutating cache mode ... ok
runtime suites declare service environment before start and verify it after (#1447) ... ok
runtime database overrides preserve service health and the Postgres gate set ... FAILED
sqlite runtime suite keeps explicit database overrides above suite defaults ... ok
runtime suite wait matrices match runtime resources for postgres and sqlite ... ok
runtime suite selects mssql database resource wait for mssql ... ok
capability defaults are a baseline and caller overrides select database gates ... ok
existing built-in suites preserve their exact resolved options ... ok

ERRORS

runtime database overrides preserve service health and the Postgres gate set
error: AssertionError: Values are not equal.

[Diff] Actual / Expected

    "behavior.workers-executions",
    "behavior.mcp-endpoint-directory",
+   "behavior.service-health",
    "behavior.service-env",
    "behavior.sagas-health",

FAILED | 17 passed | 1 failed
error: Test failed
```

The failure is the MySQL exact-set assertion: the actual selection omitted
`behavior.service-health`. The old-filter perturbation was then removed.

## #1397 green after restoring the fix

Exit code: `0`

```text
running 18 tests from ./packages/cli/e2e/tests/presentation/suite-registry_test.ts
registry exposes scaffold capability suites from constants ... ok
native desktop suite is registered with an honest fixture preflight ... ok
capability suites select only their scoped gates ... ok
plugin suite includes all official plugin and generated-check gates ... ok
true userland suite runs init, four no-samples plugin installs, assertion, and cleanup ... ok
runtime suite includes full scaffold, database, runtime, and behavior gates ... ok
runtime suites pin the exact #1398 OTEL deferral without widening it ... ok
runtime suite waits for the generated app and requests its home page ... ok
runtime DB mutations run only after the resident AppHost starts ... ok
runtime suite omits database resource wait for sqlite ... ok
sqlite runtime suite resolves its reduced-container defaults without mutating cache mode ... ok
runtime suites declare service environment before start and verify it after (#1447) ... ok
runtime database overrides preserve service health and the Postgres gate set ... ok
sqlite runtime suite keeps explicit database overrides above suite defaults ... ok
runtime suite wait matrices match runtime resources for postgres and sqlite ... ok
runtime suite selects mssql database resource wait for mssql ... ok
capability defaults are a baseline and caller overrides select database gates ... ok
existing built-in suites preserve their exact resolved options ... ok

ok | 18 passed | 0 failed
```

## #1399 negative control A: throwaway deferral on an empty suite

The service suite was temporarily assigned the existing #1398 deferred records without changing
the expectation map.

Exit code: `1`

```text
running 19 tests from ./packages/cli/e2e/tests/presentation/suite-registry_test.ts
registry exposes scaffold capability suites from constants ... ok
native desktop suite is registered with an honest fixture preflight ... ok
capability suites select only their scoped gates ... ok
plugin suite includes all official plugin and generated-check gates ... ok
true userland suite runs init, four no-samples plugin installs, assertion, and cleanup ... ok
runtime suite includes full scaffold, database, runtime, and behavior gates ... ok
runtime suites pin the exact #1398 OTEL deferral without widening it ... ok
every registered suite pins its exact deferred-gate set and owning issues ... FAILED
runtime suite waits for the generated app and requests its home page ... ok
runtime DB mutations run only after the resident AppHost starts ... ok
runtime suite omits database resource wait for sqlite ... ok
sqlite runtime suite resolves its reduced-container defaults without mutating cache mode ... ok
runtime suites declare service environment before start and verify it after (#1447) ... ok
runtime database overrides preserve service health and the Postgres gate set ... ok
sqlite runtime suite keeps explicit database overrides above suite defaults ... ok
runtime suite wait matrices match runtime resources for postgres and sqlite ... ok
runtime suite selects mssql database resource wait for mssql ... ok
capability defaults are a baseline and caller overrides select database gates ... ok
existing built-in suites preserve their exact resolved options ... ok

error: AssertionError: Values are not equal: scaffold.service deferred gates must match their issue-owned expectation

[Diff] Actual / Expected

- [
-   {
-     id: "behavior.otel.stream-consumer",
-     issue: "#1398",
-     reason: "workers-combined does not install the stream mutation hook",
-   },
-   {
-     id: "behavior.otel.traces",
-     issue: "#1398",
-     reason: "TC-14 requires the deferred Flow-B stream-consumer record",
-   },
- ]
+ []

FAILED | 18 passed | 1 failed
error: Test failed
```

## #1399 negative control B: removed an expectation entry

The `scaffold.service` expectation was temporarily removed while the registry remained unchanged.

Exit code: `1`

```text
Check packages/cli/e2e/tests/presentation/suite-registry_test.ts
TS1360 [ERROR]: Type '{ "scaffold.contracts": never[]; ... }' does not satisfy the expected type
'Record<SuiteId, readonly DeferredGate[]>'.
  Property '"scaffold.service"' is missing in type '{ "scaffold.contracts": never[]; ... }' but
  required in type 'Record<SuiteId, readonly DeferredGate[]>'.
  } satisfies Record<SuiteId, readonly DeferredGate[]>;
    ~~~~~~~~~

TS7053 [ERROR]: Element implicitly has an 'any' type because expression of type 'SuiteId' can't be
used to index type '{ "scaffold.contracts": never[]; ... }'.
  Property 'scaffold.service' does not exist on type '{ "scaffold.contracts": never[]; ... }'.
      expected[descriptor.id],
      ~~~~~~~~~~~~~~~~~~~~~~~

Found 2 errors.
error: Type checking failed.
```

## #1399 green after restoring both perturbations

Exit code: `0`

```text
running 19 tests from ./packages/cli/e2e/tests/presentation/suite-registry_test.ts
registry exposes scaffold capability suites from constants ... ok
native desktop suite is registered with an honest fixture preflight ... ok
capability suites select only their scoped gates ... ok
plugin suite includes all official plugin and generated-check gates ... ok
true userland suite runs init, four no-samples plugin installs, assertion, and cleanup ... ok
runtime suite includes full scaffold, database, runtime, and behavior gates ... ok
runtime suites pin the exact #1398 OTEL deferral without widening it ... ok
every registered suite pins its exact deferred-gate set and owning issues ... ok
runtime suite waits for the generated app and requests its home page ... ok
runtime DB mutations run only after the resident AppHost starts ... ok
runtime suite omits database resource wait for sqlite ... ok
sqlite runtime suite resolves its reduced-container defaults without mutating cache mode ... ok
runtime suites declare service environment before start and verify it after (#1447) ... ok
runtime database overrides preserve service health and the Postgres gate set ... ok
sqlite runtime suite keeps explicit database overrides above suite defaults ... ok
runtime suite wait matrices match runtime resources for postgres and sqlite ... ok
runtime suite selects mssql database resource wait for mssql ... ok
capability defaults are a baseline and caller overrides select database gates ... ok
existing built-in suites preserve their exact resolved options ... ok

ok | 19 passed | 0 failed
```

## Required gates

All commands below were executed from the worktree root. Full command output was observed directly;
the canonical structured summaries are reproduced without truncation.

### `rtk proxy deno task check`

Exit code: `0`

```json
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-f-c-e2e-gates"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":2876,"batches":24,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
```

### `rtk proxy deno task test`

Exit code: `0`

```text
ok | 3183 passed (617 steps) | 0 failed | 17 ignored (5m8s)
```

### `rtk proxy deno task lint`

Exit code: `0`

```json
{"source":{"mode":"command","cwd":"/home/codex/repos/ns006-f-c-e2e-gates","exitCode":0},"selection":{"filesSelected":2010,"batches":11},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}
```

### `rtk proxy deno task fmt:check`

Exit code: `0`

```json
{"command":"deno fmt --check","cwd":"/home/codex/repos/ns006-f-c-e2e-gates","mode":"check","summary":{"filesSelected":2010,"batches":11,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}
```

### `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx`

Exit code: `0`

```json
{"source":{"mode":"selection","cwd":"/home/codex/repos/ns006-f-c-e2e-gates"},"command":"deno check --unstable-kv <files>","selection":{"filesSelected":861,"batches":8,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}
```

### `rtk proxy deno task quality:gate`

Exit code: `0`

```text
quality:scan: ok=true; scanned packages/cli/src and plugins; findings=[]; allowCount=7
deps:check:zod: zod-alignment PASS instances=zod@3.25.76,zod@4.4.3 residual-v3=@ag-ui/core@0.0.52,@olli/kvdex@3.6.7
arch:check: every doctrine target reported FAIL=0; existing WARN/INFO findings only
```

### `rtk proxy deno task e2e:cli suites`

Exit code: `0`

```text
scaffold.service Service scaffold capability smoke
scaffold.contracts Contracts scaffold capability smoke
scaffold.infrastructure Infrastructure scaffold capability smoke
scaffold.plugins Official plugin scaffold smoke
scaffold.runtime Runtime scaffold capability smoke
scaffold.runtime.sqlite Runtime scaffold capability smoke (sqlite, reduced containers)
scaffold.userland-install True userland plugin install smoke
deploy.targets Deploy target acceptance smoke
deploy.desktop-native Native desktop deployment acceptance
quickstart.walk Published CLI Quickstart walk
```

### `rtk proxy deno task e2e:cli gates scaffold.runtime`

Exit code: `0`. The materialized Postgres gate set contains:

```text
runtime.wait.postgres
behavior.service-health
behavior.live-db-endpoint
```

The complete command printed the full runtime gate inventory. The focused database-matrix test pins
that complete Postgres selection byte-for-byte by ordered gate ID and derives the MySQL/MSSQL sets
only by replacing the database wait and removing the four named Postgres-only evidence gates.

## Expensive gate

`deno task e2e:cli run scaffold.runtime --cleanup --format pretty` was not run. The slice brief
requires orchestrator permission because the gate is serialized, and no permission was requested or
granted; the specified deliverables are fully demonstrated by executed gate-set tests and cheap
inventory commands.

