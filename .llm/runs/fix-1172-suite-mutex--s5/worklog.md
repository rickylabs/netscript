# S5 worklog — #1172 suite mutex

## Design

- **Public surface:** `createSuiteLeaseManager` supplies the testable lease behavior;
  `createDefaultSuiteLeaseManager` supplies the Deno filesystem/process adapter. `SuiteRunner`
  consumes the `SuiteLeaseManager` port.
- **Domain vocabulary:** `SuiteLeaseRecord` persists `{ pid, startedAt, suiteId, worktree }`;
  `SuiteLeaseContentionError` is the named non-product-failure verdict; `SuiteLease` is the
  release handle.
- **Ports:** `SuiteLeaseFileSystem` isolates exclusive create/read/remove; `isProcessAlive`,
  `now`, `pid`, `leasePath`, and `notice` are injected for deterministic negative tests.
- **Constants:** `SUITE_LEASE_FILENAME` names the OS-temp lease;
  `SUITE_LEASE_STALE_CHECK = "holder-process-dead"` makes the sole stale-check semantic explicit;
  `SCAFFOLD.RUNTIME` remains the authoritative expensive-suite id.
- **Commit slice:** one locked S5 slice: add job-level CI queueing, add and wire the local lease,
  prove live/dead contention and runner release/cheap-suite behavior, and record gate evidence.
- **Deferred scope:** no lease for cheap suites; no changes to production E2E workflows, `ci.yml`,
  or release tooling; no actual `scaffold.runtime` execution.
- **Contributor path:** add lease policy at the `SCAFFOLD.RUNTIME` guard in `suite-runner.ts`; extend
  lease mechanics through `suite-lease.ts` and its focused fake-port tests.

## Implementation

- Added job-level `concurrency` only to `scaffold-runtime` in `.github/workflows/e2e-cli.yml`:
  global group `e2e-scaffold-runtime-global`, `cancel-in-progress: false`. The workflow-level
  ref-scoped supersession policy remains unchanged.
- Added an OS-temp exclusive lease file containing the locked metadata contract.
- Live PID contention throws `SuiteLeaseContentionError` before suite work begins and explicitly
  labels the outcome as contention rather than a product failure.
- Dead PID ownership logs a stale-lease notice, removes the stale record, and retries acquisition.
- The runner acquires only for `SCAFFOLD.RUNTIME` and releases in `finally`, including thrown suite
  paths.

## Test coverage

| Negative case | Evidence |
| --- | --- |
| Second acquire while holder alive | focused test asserts refusal includes holder PID, lease path, and holder worktree |
| Holder dead | focused test asserts stale notice/removal and successful replacement acquisition |
| Suite failure path | runner test forces reporter failure, observes release, then acquires again |
| Cheap suite | runner test executes `scaffold.service` and observes zero lease acquisitions |

## Gate evidence

| Gate | Exit | Result |
| --- | ---: | --- |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli/e2e --ext ts` | 0 | PASS — 119 files, 1 batch, 0 failed batches/findings |
| `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root packages/cli/e2e --ext ts` | 0 | PASS — 119 files, 0 occurrences |
| `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/cli/e2e --ext ts` | 0 | PASS — 119 files, 0 failed batches/findings |
| `deno task --cwd packages/cli/e2e test` | 0 | PASS — 84 passed, 0 failed |
| `deno eval` YAML parse of `.github/workflows/e2e-cli.yml` with `jsr:@std/yaml` | 0 | PASS — parsed to an object |
| `deno task quality:gate` (harness-required package fitness) | 0 | PASS — code-quality scan clean; architecture checks have no failures (pre-existing warnings remain) |

Note: the first YAML probe used the obsolete Deno 2.9 `eval --allow-read` flag and exited 1 before
evaluation; the corrected Deno 2.9 invocation above exited 0. No workflow content changed between
the two invocations.

## Real live-holder refusal transcript

The probe wrote the production lease path with its live parent shell PID, invoked
`createDefaultSuiteLeaseManager().acquire(SCAFFOLD.RUNTIME, Deno.cwd())`, cleaned the temporary
lease in `finally`, and intentionally exited non-zero (`23`). It did **not** execute the suite.

```text
E2E suite contention: refused to start because pid 4110093 holds /tmp/netscript-e2e-scaffold-runtime.lease for scaffold.runtime from worktree /home/codex/repos/ns004-s5-lease since 2026-08-03T22:00:00.000Z. This is a contention verdict, not a product failure.
```

## Reconcile

- Issue #1172 remains open for supervisor review/sign-off.
- Locked scope remains intact; no drift or deferred follow-up was discovered.
- No actual `scaffold.runtime` suite was run.

## S5 sign-off (Tier-A review)

- 2026-08-03 · Reviewed `09c89be53`: job-level global concurrency scoped to scaffold-runtime only
  (queue, not cancel); lease is port-injected for deterministic tests; runner acquires only for
  SCAFFOLD.RUNTIME and releases in finally on both paths; real live-holder refusal transcript in
  worklog names pid/worktree/lease path and exits 23. Independent re-run: 84/84 tests, scoped
  wrappers green.
