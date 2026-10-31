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
