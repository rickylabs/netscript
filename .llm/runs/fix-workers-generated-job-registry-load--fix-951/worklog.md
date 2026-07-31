# Worklog — #951 generated job registry not loaded by the worker runtime

## Design

### Public surface

`plugins/workers/src/runtime/generated-jobs.ts`, re-exported through
`plugins/workers/bin/runtime.ts` (`@netscript/plugin-workers/runtime`):

| Symbol                                                | Change   | Purpose                                                        |
| ----------------------------------------------------- | -------- | -------------------------------------------------------------- |
| `resolveGeneratedJobRegistryUrl(): URL`               | new      | The only resolver for the generated registry path.             |
| `loadGeneratedJobRegistry(url?)`                      | widened  | Defaults to the resolver; returns `status`/`url`; throws on unusable. |
| `registerGeneratedJobRegistry(registrar, loaded)`     | new      | The startup check: register, then verify by read-back.         |
| `describeGeneratedJobRegistry(loaded): string`        | new      | One-line startup summary naming the resolved path.             |
| `GeneratedJobRegistryError`                           | new      | Typed fatal for a registry that exists but is unusable.        |
| `GeneratedJobRegistryStatus`                          | new      | `'absent' \| 'loaded'`.                                        |
| `StaticJobDefinitionRegistrar`                        | exported | Was private; referenced by two public signatures.              |
| `registerStaticJobDefinitions(...)`                   | widened  | Returns the count present (was `void`).                        |
| `GeneratedWorkersJobRegistry`                         | widened  | Gains required `status` + `url`; existing fields unchanged.    |

### Domain vocabulary

`GeneratedJobRegistryStatus` is the discriminator that replaced the untyped `{}` degrade:
`absent` (legitimate — no compiled registry), `loaded` (module read, definitions present).
The third outcome is not a status; it is `GeneratedJobRegistryError`, because a present but
unusable registry has no valid continuation.

### Ports

None added. `StaticJobDefinitionRegistrar` is the existing structural seam over
`KvJobRegistry`, now named and exported so the read-back verification is testable without KV.

### Constants

`WORKERS_JOB_REGISTRY_PATH` already existed and stays the single path constant. No new
string literals: the entrypoint guard test asserts no entrypoint reintroduces one.

### Commit slices

| # | Slice                                                          | Gate                                       |
| - | -------------------------------------------------------------- | ------------------------------------------ |
| 1 | Registry loader: one resolver, three outcomes, read-back check | `tests/runtime/generated-jobs_test.ts`     |
| 2 | Entrypoints (`bin/*`, `services/src/main.ts`, glue stub)       | entrypoint guard test + `check`            |
| 3 | Regression guards + updated service test                       | `deno task test`                           |

Landed as one commit — the slices are not independently shippable (slice 1 changes a
signature that slice 2 consumes), and splitting would leave `main` type-broken between them.

### Deferred scope

- Aspire `ServiceReferences` for `WORKERS_API_URL` (`src/aspire/workers-contribution.ts`).
- Duplicate scheduler/worker registration in the same contribution.

Both filed separately rather than folded in; see `plan.md` § Deferred scope.

### Contributor path

To add a workers entrypoint: call `startWorkerProcess()` / `startSchedulerProcess()` /
`startCombinedProcess()` with no `definitions`. The runtime resolves, loads, registers and
verifies the project's generated jobs. Do not resolve the registry path — the guard test in
`tests/runtime/generated-jobs_test.ts` fails the build if you do.

## Gate results

| Gate                          | Command                                                            | Result                                            |
| ----------------------------- | ------------------------------------------------------------------ | ------------------------------------------------- |
| Format                        | `deno task fmt:check`                                              | PASS — 1870 files, 0 findings                     |
| Lint                          | `deno task lint`                                                   | PASS — 1725 files, 0 occurrences                  |
| Type check                    | `deno task check`                                                  | PASS — 2458 files, 0 occurrences                  |
| Tests                         | `deno task test`                                                   | PASS — see § Test evidence                        |
| Doctrine fitness              | `deno task arch:check`                                             | PASS — exit 0, workers `FAIL=0`                   |
| Code quality                  | `deno task quality:scan`                                           | PASS — exit 0                                     |
| Doc lint                      | `run-deno-doc-lint.ts --root plugins/workers`                      | PASS — 23 privateTypeRef vs 24 on `main`, 0 missing JSDoc |
| Runtime / Aspire (`e2e:cli`)  | `deno task e2e:cli run scaffold.runtime --cleanup`                 | see § Runtime gate                                |

### Test evidence

New guards in `plugins/workers/tests/runtime/generated-jobs_test.ts` (8) and the rewritten
`plugins/workers/services/src/generated-jobs_test.ts` (3).

Before/after proof for the entrypoint guard, run against the pre-fix `bin/combined.ts`:

```
no workers entrypoint resolves the generated registry path itself ... FAILED
error: AssertionError: bin/combined.ts builds its own generated-registry path
       (matched /new URL\([^)]*WORKERS_JOB_REGISTRY_PATH/);
       use resolveGeneratedJobRegistryUrl() instead.
```

and against the fixed tree: `ok`.

## Reconcile note

Issue #951 has no comments; the mechanism was re-derived from source and verified by URL
evaluation before any change (`research.md` F1). The issue's stated mechanism is one of four
silent-load paths — recorded in `drift.md` and stated in the PR body rather than silently
widened.
