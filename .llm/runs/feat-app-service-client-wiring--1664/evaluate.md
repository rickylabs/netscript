
## Restore + order delta evaluation (9e53cce17)

**Verdict: PASS_IMPL_WITH_FINDINGS**

Scope: `git diff 3b4e2b92b 9e53cce17` only (commits `8470808c7`, `9e53cce17`).

### Scope / touch set

- 5 files, all under `packages/cli/e2e/**`; `deno.lock` diff is empty; no `packages/*/templates`,
  product, or scaffold-output path touched.

### Gate order (main parity)

- `capability-suites.ts` at HEAD: `BEHAVIOR_LIVE_DB_ENDPOINT` (:138) … `BEHAVIOR_APP_REFERENCE`
  (:151) immediately followed by the contiguous trio `ISLAND_SERVED_SURFACE` (:152) →
  `ISLAND_HYDRATION` (:153) → `SERVICE_CLIENT_REFETCH` (:154).
- `git diff origin/main 9e53cce17 -- capability-suites.ts` shows the island block back at its
  main position with `GATE.BEHAVIOR_SERVICE_CLIENT_REFETCH` as the only appended id in that
  hunk; the remaining hunks are the earlier (already PASSed) service-client gate additions
  (`SCAFFOLD_SERVICE_CLIENT_ADD/GENERATE`, `GENERATED_SERVICE_CLIENT_CONTRACT`).
- Sqlite tier is derived (`RUNTIME_SQLITE_GATES = RUNTIME_GATES.filter(...)`, :180) so it
  inherits the order; `BEHAVIOR_LIVE_DB_ENDPOINT` is postgres-only (:177), which is why the
  `live-db < island-served-surface` assertion is correctly scoped to the postgres suite.
- Mirrors: `runtime/behavior-gates.ts` order pinned by
  `service-client-runtime-probe_test.ts` (`behaviorIds.indexOf(LIVE_DB_ENDPOINT) <
  behaviorServedSurfaceIndex`, plus contiguous-trio slice); `suite-registry_test.ts` pins the
  trio and `servedSurfaceIndex === appReferenceIndex + 1` for both tiers and `live-db <
  island-served-surface` for the postgres suite. Slice G's resource-gate expectation (after
  `DATABASE_CODEGEN` + generated-client contract) is untouched by this delta.

### Restore logic

- Proof assertions are byte-identical to `3b4e2b92b`: the evidence literal still computes
  `baselineListRequestCount: baseline`, `finalListRequestCount: listRequestIds.size`,
  `mutationSucceeded: typeof mutationStatus === 'number' && mutationStatus >= 200 &&
  mutationStatus < 300`, `optimisticRowContainedRenamedName`, `finalRowContainedRenamedName`,
  `renamedName`, after the unchanged
  `waitUntil(() => listRequestIds.size === baseline + 1 && completedListIds.size >= baseline + 1,
  'one settled users.list refetch')`. The verdict now runs *inside* the operation
  (`options.assertSettled?.(evidence);`) and therefore strictly before any restore work, so the
  restore's refetch cannot be counted into `baseline + 1`. The restore computes its own
  `restoreBaseline = await waitForCompletedStableBaseline(...)` and asserts
  `listRequestIds.size === restoreBaseline + 1` separately.
- `probeLiveServiceRefetch` now passes `assertSettled: assertSettledRefetch` instead of
  asserting on the return value — same assertion function, earlier call site.
- Restore path: `restoreRenamedRow(client!, originalName, listRequestIds, completedListIds)`
  reads the ready Rename row's current name, clicks Rename with `Fetch` request-stage
  interception, and rewrites only the requested name via
  `restoreMutationPostData(request?.postData, requestedName, originalName)` before
  `Fetch.continueRequest`, i.e. it restores the name captured at probe start through the same
  generated mutation path, then awaits settlement (`'one fixture-restoration users.list
  refetch'`) and `rowContainsExpression(originalName)`.
- Failure paths: `withMutationRestore(operation, () => onMutateRan, restore)` runs the restore
  in `finally` only when the mutation actually ran, and on operation failure wraps a restore
  failure in `AggregateError([operationError, restoreError], ...)` — the original error is
  never masked. `releaseMutationResponse()` is idempotent via `responseReleased`, so the
  restore path safely releases a still-paused mutation response before re-enabling `Fetch`.
  `restoreRenamedRow`'s own `finally` releases a paused request and disables `Fetch`.

### Findings

- **LOW** `service-client-browser-probe.ts:707-712` (`withMutationRestore`): when the proof
  succeeded but the restore throws, the restore error is rethrown and fails the gate, so
  restoration flakiness can red a genuinely green refetch proof. Defensible (a dirty fixture
  would poison later gates), but it is a new failure mode; consider surfacing it as a
  distinguishable error message.
- **LOW** `service-client-browser-probe.ts:987-1050` (`restoreRenamedRow`): adds three further
  `waitUntil`/`waitForExpression` waits plus a fixed `await delay(500)` to the gate's tail. All
  waits are bounded by the shared `TIMEOUT_MS` (no unguarded wait), but wall-clock cost and
  flake surface for `behavior.service-client-refetch` grow.
- **INFO** `service-client-runtime-probe_test.ts`: the previous
  `SERVICE_HEALTH < servedSurfaceIndex` assertion was dropped; still true at HEAD and
  superseded by the stronger app-reference/live-db pins.
- Unit tests pin the restore contract: `restoreMutationPostData` rewrite test, and
  `withMutationRestore` ordering test covering both success (`['settled assertion', 'restore
  captured original name']`) and post-mutation failure (original error identity preserved via
  `assertStrictEquals`), plus a source-order assertion that `restoreRenamedRow(` follows
  `options.assertSettled?.(evidence);` and its argument slice contains `originalName`.

### Evidence

| Command | Exit | Result |
| --- | --- | --- |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | 0 | 995 files, 9 batches, 0 failed, 0 occurrences |
| `TMPDIR=$HOME/tmp deno run ... run-deno-test.ts -- --allow-all packages/cli/e2e/tests` | 0 | 358 passed / 0 failed / 0 ignored |
| `deno task arch:check` | 0 | warnings only (pre-existing `export default` F-5/F-6) |
| `deno task quality:gate` | 0 | warnings only (pre-existing A13 + F-5/F-6) |

Note: the first test run exited 1 only because `$HOME/tmp` did not exist
(`NotFound ... tmpdir` in `service-client-generated-format_test.ts`); after `mkdir -p $HOME/tmp`
the suite is green. No Aspire/Docker/browser gate was executed.
