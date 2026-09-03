## Probe-delta evaluation (dbb577826)

- Evaluator: Claude Fable 5.1, independent bounded IMPL-EVAL session (opposite family to the
  Codex author), detached checkout `worktrees/007-eval-1664` at `dbb577826`.
- Scope: only the delta `git diff 4e86a3113 dbb577826`
  ("test(cli): make service refetch browser proof deterministic"). The prior PASS on the product
  delta is not re-examined.
- Constraints honored: no Aspire, Docker, browser, or `e2e:cli` run; no product code changed; no
  commit or push.

### Verdict

PASS_IMPL_WITH_FINDINGS

### Scope check (item 1)

- `git diff --name-only 4e86a3113 dbb577826` = 4 paths: the two e2e files plus the run's own
  `drift.md` / `worklog.md` (harness artifacts, not product). `deno.lock` diff is empty. No
  template, Fresh runtime, SDK, or generated carrier path is touched.

### Acceptance claim still proven (item 2)

The gate consumer is unchanged and remains exact, not "any change observed"
(`packages/cli/e2e/src/application/gates/scaffold/service-client-runtime-probe.ts:125-141`):

```ts
if (!evidence.mutationSucceeded) throw new Error('users.update did not return a success response');
if (!evidence.optimisticRowContainedRenamedName) throw new Error(`optimistic row did not contain ${evidence.renamedName}`);
const expected = evidence.baselineListRequestCount + 1;
if (evidence.finalListRequestCount !== expected) throw new Error(`users.list request count was ${evidence.finalListRequestCount}; expected ${expected}`);
if (!evidence.finalRowContainedRenamedName) throw new Error(`persisted row did not contain ${evidence.renamedName}`);
```

In the probe (`service-client-browser-probe.ts`):

- `await waitUntil(() => listRequestIds.size === baseline + 1 && completedListIds.size >= baseline + 1, 'one settled users.list refetch')` (line ~362) — unchanged; exactly one
  `users.list` request after the executed `users.update`, which is the generated-map invalidation
  (#1355). `rowContainsExpression` is a strict `===` on the row text (line ~790), so the
  optimistic and persisted-row checks are exact-name checks, not substring/"changed" checks.
- The `initialDataUpdatedAt: cachedAt` claim (#1360) is exercised by the same SSR → Refresh →
  Rename flow; nothing in the delta weakens it.

### Reordering soundness (item 3)

- Flow after the delta: `Page.loadEventFired` → row-presence gate (name discarded) → click
  Refresh → `waitForCompletedStableBaseline` (all observed `users.list` requests completed and
  the count stable for `BASELINE_CONFIRMATION_MS = 500`) → read `originalName` → click Rename.
- The template renders `<p>{item.name}</p>` and the Rename button submits
  `` `${item.name}*` `` from the same rendered item
  (`packages/cli/src/kernel/assets/app/routes/examples/(_islands)/ServiceShowcaseLab.tsx.template:209,228`),
  so an expected name captured from the DOM after the settled Refresh is the exact value the
  island will optimistically render and persist. The previous stale-capture failure
  (`Seed User**` vs expected `Seed User*`) cannot recur; a spurious pass is likewise excluded
  because the strict equality needs the post-Refresh name plus exactly one `*`.
- CDP workaround: `Fetch.disable` is issued only after `Fetch.requestPaused` (Response stage,
  `users.update`), after the optimistic assertion executed while the response was held, and after
  `Fetch.continueResponse`. Interception therefore still guards the optimistic observation; only
  its release is made explicit. The `Network.loadingFinished` wait on `paused.networkId` and the
  refetch wait remain in place, so the mutation completion is still observed, not assumed.
- Unit test (`service-client-runtime-probe_test.ts:817-841`) now pins the order
  `waitForCompletedStableBaseline` < `originalName = await waitForExpression` <
  `clickRenameExpression` and `Fetch.continueResponse` < `Fetch.disable` by source index.

### Findings

1. LOW — `service-client-browser-probe.ts:~718-730` (`optimisticDiagnosticsExpression`):
   `islandHydrated` is now `interactionObserved`, so the ternary's middle branch
   (`'Browser QueryClient was reachable from the hydrated Preact tree, but Rename was not rendered'`)
   is unreachable dead text. Diagnostics only; no gate reads it. Cleanup candidate.
2. LOW — `service-client-browser-probe.ts:~316`: `originalName` is read from the DOM after the
   network baseline is stable (+500 ms) but without an explicit `ul[data-state="success"]`
   check. In practice React Query resolves and Preact renders well within that window (author's
   green rerun confirms), but a `data-state` guard would make the read causally rather than
   temporally ordered. Not blocking.
3. INFO — the unit test is source-string/ordering based (as before); it proves the probe's shape,
   not its runtime behavior. Runtime proof rests on the author's recorded standalone rerun
   (`SERVICE_CLIENT_BROWSER_PROBE_RESULT` baseline 1 → final 2, mutationSucceeded true) and the
   pending `behavior.service-client-refetch` CI gate, which this session did not run.

### Evidence (item 4; `TMPDIR=$HOME/tmp`, checkout `dbb577826`)

| Command | Exit | Result |
| --- | --- | --- |
| `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root packages/cli --ext ts,tsx` | 0 | 984 files, 9 batches, 0 failed batches, 0 diagnostics |
| `run-deno-test.ts -- --allow-all packages/cli/e2e/tests/application/gates/service-client-runtime-probe_test.ts` | 0 | 25 passed / 0 failed / 0 ignored |
| `run-deno-test.ts -- --allow-all packages/cli/e2e/tests/` | 0 | 325 passed / 0 failed / 0 ignored |
| `deno task arch:check` | 0 | warnings only, 0 failures |
| `deno task quality:gate` | 0 | pass |
| `git diff 4e86a3113 dbb577826 -- deno.lock \| wc -l` | 0 | 0 lines (unchanged) |

Note: a first full-directory test run returned exit 1 with a single
`service-client-generated-format_test.ts` failure caused by `NotFound: tmpdir` (the shared
`$HOME/tmp` directory was removed by a concurrent session mid-run). Recreating the directory and
rerunning gave 325/325; the failure is environmental and unrelated to the delta.
