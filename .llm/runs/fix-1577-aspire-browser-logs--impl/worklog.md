# Worklog: restore generated browser-log child resources

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-1577-aspire-browser-logs--impl` |
| Branch | `fix/1577-aspire-browser-logs` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | none |

## Design

### Public Surface

- Generated `aspire/.helpers/register-apps.mts` application registration behavior.

### Domain Vocabulary

- endpoint-bearing app — enabled `Type: 'app'` entry for which `needsHttpEndpoint(...)` is true.
- endpoint-less executable — task/desktop resource that receives no HTTP/HTTPS endpoint.

### Ports

- Aspire generated `ExecutableResourcePromise` API from the pinned browsers integration.

### Constants

- Existing `SCAFFOLD_ASPIRE_INTEGRATIONS.BROWSERS`; no new finite vocabulary.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | Prove endpoint-gated browser-log emission and stale-test reconciliation | focused CLI tests + required gates | generator, focused tests, run artifacts |

### Deferred Scope

- Runtime scaffold smoke — prohibited for this lane and owned by the orchestrator.
- IMPL-EVAL — automatic label-driven lifecycle only.

### Contributor Path

Start at `generate-register-apps.ts`, follow `needsHttpEndpoint`, then read the app registration
tests in `generators-background-app_test.ts` and endpoint boundary tests in
`register-http-endpoint_test.ts`.

## Progress Log

- 2026-08-12 — `PLAN-EVAL: N/A`: small mechanical fix with complete issue contract, safety
  predicate, placement, tests, and gates. Local evaluators are additionally prohibited by owner.
- 2026-08-12 — Exact API proof complete: pinned restore generated an awaitable
  `ExecutableResourcePromise.withBrowserLogs()` method.
- 2026-08-12 — Implemented `type === 'app'` browser-log emission inside the existing endpoint
  branch, after `withHttpEndpoint` and before the readiness probe.
- 2026-08-12 — Reconciled the stale `fixtures.MINIMAL_APP` negative assertion: that fixture is an
  endpoint-bearing app, so the test now requires the call and its ordering. Extended the
  `fixtures.UNPINNED_TASK_APP` negative case to forbid browser logs.

## Gate Evidence

| Gate | Exit | Verbatim verdict |
| --- | ---: | --- |
| focused package-task filter | 0 | `Task test deno test --allow-all '--filter' 'browser logs|endpoint-less task|browser logs integration package'` |
| scoped check | 0 | `{"selection":{"filesSelected":867,"batches":8,"failedBatches":0},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueCodes":0,"uniquePaths":0},"groups":[]}` |
| scoped lint | 0 | `{"selection":{"filesSelected":867,"batches":5},"summary":{"totalOccurrences":0,"uniqueOccurrences":0,"uniqueRules":0,"uniquePaths":0},"groups":[]}` |
| scoped fmt | 0 | `{"summary":{"filesSelected":867,"batches":5,"failedBatches":0,"findings":0,"ignoredFindings":0},"findings":[]}` |
| `deno task --cwd packages/cli test` | 1 | `FAILED | 799 passed (531 steps) | 3 failed (2m46s)` |
| `deno task quality:gate` | 0 | `quality:scan ... "ok":true`; doctrine roots report `FAIL=0` with existing warnings |

The full package-task failures are outside the changed generator surface and arise from repository-
relative assumptions under the mandated package cwd: missing `docs/site/durable-workflows/streams.md`,
missing `packages/cli/e2e/src/application/gates/scaffold/service-env/configure-service-env.ts`, and
missing `docs/site/quickstart.vto`. The changed `generateRegisterApps` suite and the config pin test
both pass in that same run. No unrelated E2E harness fix was attempted.

`deno.lock` SHA-256 remained
`73be92b116b9065372505157da4f6729176e975aa118e9944746317887e9a4c4`.

## Reconcile Notes

- Issue #1577 remains open at milestone `0.0.6`; its resolving PR will carry `Closes #1577`,
  `type:fix`, `area:aspire`, `priority:p1`, and exactly one `status:impl` label.
- Shipped help source `skills/help.md` already states the restored default accurately; no source or
  generated asset edit is needed.
- Automatic separate-session evaluation and runtime smoke remain orchestrator-owned and pending.
