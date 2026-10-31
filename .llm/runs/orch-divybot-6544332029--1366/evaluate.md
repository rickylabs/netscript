# IMPL-EVAL round 1 — independent substantive slice review

**IMPL-EVAL round 1 (precommit slice review): #1366 box 6**

I found no blocking issues in the sagas/triggers implementation; passing on the reasons below.

**Restart accounting and watch handling.**
- When a child starts, it reads the saved history once. It counts one restart only if the previous run recorded a failure, or if the previous run was still marked active under a different process id (`child-health-monitor.ts`, `trackProcess`). It then persists through `starting()`.
- A healthy `--watch` reload has the same process id and no failure flag, so it is not counted. A failed run followed by a reload is counted.
- `stopped()` clears the active marker but keeps the failure flag. The wrapper skips `health.stopped()` once a failure is terminal (`run-child-health-process.ts`, `if (!terminal)`). So the 1-second fatal drain never clears an earlier failure.
- I traced the actual cleanup order:
  - **Sagas:** `deliveryFailed`/startup `failed()`, then `stop()` → `stopped()`, then the wrapper's `failed()`.
  - **Triggers:** the `catch` calls `failed()`, then `finally` only calls `stopped()` on abort.
  - In both, the record that remains on disk is `failed:true`.
- Graceful SIGTERM ends with `active:false, failed:false`.

**Persistence failures fail closed.**
- The file adapter rejects corrupt, oversized or inaccessible files. A missing file is the only case treated as a first boot. Writes go to a temp file, are synced to disk, then renamed.
- A read or write failure latches `#historyFailed`, so the snapshot reports `failed` with `dependencyReady:false` permanently.
- A snapshot that throws during an HTTP request now goes through the fatal path instead of returning green.
- Polling only writes to disk once, when crash-loop recovery happens.

**Recovery, readiness and redaction.**
- The crash-loop latch survives a process replacement and still needs a full uninterrupted ready window before it clears.
- `lastFatalError` stays the fixed redacted message. The tests check that the secret placed in the registry error never appears in any payload.

**Generated glue uses the new history.**
- Sagas passes the wrapper's monitor into the supervisor, which is the same monitor that `trackProcess` attaches to.
- Triggers passes its `TriggerHealthMonitor` as `options.health`, so file-watch metadata is kept.
- The two plugins write separate files (`.data/child-health/{sagas,triggers}.json`).
- Both runtimes already get bare `--allow-read`/`--allow-write`. Bare `--watch` only reloads on changes to imported modules, so writing the history file does not cause a reload.

**Workers behaviour is preserved.**
- The workers glue has no history attached, so `#persist` does nothing.
- The only change workers can see is that an unexpected exception from the snapshot is now fatal instead of an HTTP 500. `Worker.readHealthStatus` already catches its own IO errors, so this is not a realistic regression.

**The tests prove the right things.**
- They launch the real generated glue source as separate OS processes. The default case reaches `crash-looping` and HTTP 503 on the third restart, with `restartCount` 0 through 3 and inside the 60-second window.
- A healthy restart stays ready, and a SIGTERM exits 0 without being counted.
- Replacement after a SIGKILL is counted once.
- Under `--watch`, a failing child latches within the same process id, and healthy reloads stay at `restartCount` 0.
- Unit tests cover custom thresholds and the boundary, widely spaced restarts that never latch, a persistence failure that stays unhealthy even after the runtime reports ready, and threshold validation.
- The negative control you recorded (detector removed, then restored byte-for-byte) shows these tests catch the defect.

**Doctrine.**
- The new public types and the file adapter are exported only through the existing `./health` subpath.
- `zod` and `@std/path` are already dependencies of the plugin package, and the existing `ChildHealthMonitor` constructor still works unchanged.
- The domain/port/adapter split keeps Deno IO in the adapter and the transport.
- The 18 `doc:lint` errors are inherited from main; the `./health` subpath has none.

**Before commit:** `plugins/sagas/src/adapter/resources/resources.test.ts` and the triggers glue tests check the glue stub text with `assertStringIncludes`. Those assertions still match, because the new `restartHistoryPath` argument was only added to the stubs. Make sure the regenerated docs, corpus and carriers are committed, and the final review will pin the exact pushed head.

VERDICT: PASS


# IMPL-EVAL round 4 — permissions CI correction

**IMPL-EVAL round 4 (CI-fix slice): #1366 box 6**

I found no blockers in the permissions fix; this round passes.

**Stale temp files now end up private.** `Deno.openSync(..., { mode: 0o600 })` sets the mode only when it creates a file. Reopening a leftover `.tmp` with `truncate` kept its old, broader mode, and the rename then carried that mode onto the history file. The new `Deno.chmodSync(temporary, 0o600)` runs right after open and before any bytes are written, so the published file is always 0600. That holds for a freshly created temp too, where umask would otherwise decide the final mode.

**The order is safe.** The sequence is:
1. Open with truncate, which empties the stale file before anything else happens.
2. Chmod to 0600.
3. Write, then sync.
4. Close the handle, then rename.

The only moment the temp file still has its old mode is while it is empty, so no history record is exposed. The existing Windows condition is reused, which avoids POSIX mode calls where they do not apply.

**Errors still fail closed.** If the chmod throws, `using` still closes the handle, `write()` throws, and the monitor's `#persist` latches `#historyFailed`, so health reports `failed`. Nothing is renamed, and the previous history file is left as it was.

**The test now reproduces the CI failure on any machine.**
- The fixture explicitly sets the stale `.tmp` to 0644 after the first write.
- `replacement.read()` correctly ignores the temp file.
- The second write reuses that 0644 temp file. Before the fix, it renames a 0644 file into place and the unchanged 0600 assertion fails, whatever the local umask is. That matches your one-fail/one-pass result before the fix and the CI failure (420 = 0644 against 384 = 0600).
- The assertion is not weakened, and the Windows guard matches the adapter's.

**Nothing else changed.** The diff touches only the adapter, its test, and run-record text. Public types, thresholds, restart counting, glue, and generated carriers are untouched, so no regeneration is needed.

**Not a blocker:** the chmod goes by path, not by the open handle, so a swapped symlink between open and chmod could be followed in a hostile directory. The adapter's documented single-owner, private `.data` directory model already covers this, and open-with-create follows symlinks the same way.

**Still to do:**
- Record the full focused set and the scoped check, lint, format and quality results before you commit.
- The final verdict belongs to round 5 on the exact pushed head.
- The required `scaffold.runtime` CI check is still pending and owned by the coordinator; it is not proven by this review.

VERDICT: PASS


# Owner-requested CI repair — independent review 1

**CI-REPAIR-EVAL 1 (pre-commit correction review): #1366 box 6**

I found no blockers; this pass is a PASS. The fixes are narrow and address the two real CI failures. The third red check, the aggregate check-test job, only fails because test-2 fails.

**1. Formatting of the emitted triggers runtime is fixed.**
- `plugins/triggers/src/adapter/resources/glue/runtime.stub.ts` now emits the `runChildHealthProcess(...)` call in the multiline layout Deno fmt expects. Only whitespace changed: the arguments, the history path (`.data/child-health/triggers.json`) and the `health` pass-through are the same. The sagas stub was already multiline, so it needed no change.
- The new regression test is sound:
  - It takes the real `collectInstallArtifacts(triggersAdapterPlugin)` output for `triggers/runtime.ts`.
  - It pipes that through `deno fmt --config <root deno.json> --ext ts -`.
  - It asserts both exit 0 and byte equality with the input.
  - The relative path `../../../../../deno.json` correctly resolves to the repo root from `src/adapter/resources/`.
  - The root formatting settings (lineWidth 100, singleQuote, semicolons, 2-space indent) match the consumer policy, so the test stands in for CI's `generated.deno-fmt-check`.
  - It tests the actual emitted bytes, not the stub text, so it would also catch future formatting drift.

**2. Public type closure is fixed.** `ChildHealthMonitor.trackProcess(history: ChildRestartHistoryPort, …)` now has its port type re-exported, along with `ChildRestartHistory`, which the port refers to. Both are type-only re-exports from `@netscript/plugin/health` at all four facades that expose the monitor:
- `plugins/workers/bin/runtime.ts`
- `plugins/workers/worker/mod.ts`
- `plugins/sagas/src/runtime/mod.ts`
- `plugins/triggers/src/runtime/mod.ts`

Nothing is duplicated, no runtime values or worker behaviour change, and both types already exist on the `./health` subpath. The failing gate (`plugins/workers/tests/public/type-refs_test.ts`, `deno doc --lint` over non-contract entrypoints) is the right test to prove it, and your before/after result matches.

**3. Scope holds.** No changes to monitor behaviour, thresholds, persistence or the adapter, and no lock churn. The drift and worklog entries correctly record this as an owner-requested, bounded repair, separate from the five closed feature rounds.

**Not blockers:**
- `ChildHealthMonitorOptions`, which this PR added as a constructor parameter of `ChildHealthMonitor` and `TriggerHealthMonitor`, is still not re-exported from those four facades. Your passing doc-lint gate shows Deno doesn't flag it, and consumers can import it from `@netscript/plugin/health`. Adding it to the same export lists would make the closure complete, but it is optional.
- I could not run commands here, so I did not check the regenerated corpus rows line by line. The 9 `ChildRestartHistory` occurrences in the diff are consistent with the new re-exports. Rely on the freshness gate exiting 0.

**Before commit:** finish and record the six-file lint/format results, the repository quality scan, carrier and corpus freshness, and the clean-main comparison showing the wider sibling doc-lint errors are inherited.

**Still required after push:**
- An exact-head review of the new head.
- Fresh CI on that head, including both e2e-cli `scaffold.runtime` tiers. That check is owned by the coordinator, is still unproven, and must not be run locally.

I am not claiming the earlier red runtime jobs passed. Latest main run 41197676281 passing is only a baseline, not evidence for this branch.

VERDICT: PASS
