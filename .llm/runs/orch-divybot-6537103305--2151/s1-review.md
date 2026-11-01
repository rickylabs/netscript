# S1 independent review round 1

I'm failing slice 1 for one blocker: a slow memory leak while a watch retries. Everything else I was asked to verify checks out. I didn't edit any files or run anything.

**Checked and correct:**
- **Root removal and recreation:** the native watcher throws when the watched root itself is removed, before any event-kind filtering. Hybrid rethrows that error instead of switching to polling. A recreated root is reopened by a fresh watcher on the next retry.
- **Readiness:** native reports ready only after the OS watch opens. Polling reports ready only after it checks the roots and takes its first snapshot. A watch counts as `watching` only on that signal, and that is also when the retry delay resets.
- **Retry, cancellation and stale records:** the retry wait is abortable and the delay doubles up to a cap. A watcher that ends on its own counts as a failure. `unwatch`, `stop` and replacing a registration all cancel the retry and wait for the running task. A replaced registration can't update the new one.
- **Pause:** the pause flag is now stored on the live record, so it stays correct across retries.
- **Isolation:** handler exceptions, `onError` failures and status-callback failures are all contained. A handler failure never restarts the watch.
- **Production wiring:** the trigger runtime now creates the adapter with `onError` (logged at error level) and status changes (logged at info level).

**Blocker: each retry leaves an abort listener behind.**
- Every retry attempt calls `createWatcher` with `signal: record.controller.signal`. That signal belongs to the trigger's registration and lives as long as it does.
- The `FileWatcher` constructor (`packages/watchers/src/file-watcher.ts:239-241`) adds an abort listener to that signal. The listener's closure keeps the watcher, its options and the `onReady` closure alive. It is never removed. `stop()` and the end of `watch()` don't detach it, and the adapter's per-attempt cleanup only calls `watcher.stop()`.
- So every failed attempt leaves one listener and one dead `FileWatcher` on that signal until shutdown. In the default scaffold the starter trigger's directory doesn't exist, so it retries about every 30 seconds forever. That is roughly 2,880 leaked watchers per trigger per day, which breaks the plan's own "per-attempt cleanup" leak mitigation. The `std` delay is not affected because it removes its own listener. No test checks listener count.

**Fix (pick one):**
- **(a) In the adapter**, give each attempt its own `AbortController`. Link it to the registration signal with a stored listener, pass its signal to the factory, and in the existing `finally` remove that listener and abort the attempt controller.
- **(b) In `FileWatcher`**, keep a reference to the chained listener and remove it in `stop()` and in the `watch()` `finally`.

Then add a deterministic adapter test: a factory that records `addEventListener`/`removeEventListener` on the signal it receives (or a counting signal) shows that after N failed retries the registration signal has no listeners left from those attempts.

VERDICT: FAIL_FIX


# S1 independent repair review

The S1 repair passes: no abort listener is left on the registration signal after retries, and I found no regressions next to the change. I didn't edit any files or run anything.

**Listener fix (option b) is correct:**
- `FileWatcher` now uses a single named listener, `onExternalAbort`, linking the outside signal to its own internal one. It is removed in `stop()` and in the `watch()` `finally`, so either path detaches it.
- When the watched directory is missing, the path check fails inside `watch()` and the `finally` still runs. The adapter also always calls `watcher.stop()` in its own per-attempt `finally`. So no listener survives a retry, and the default starter trigger with its missing directory no longer leaks a watcher every ~30 seconds.
- If the signal is already aborted, the constructor doesn't register a listener, and `watch()` returns before checking any paths. So no watcher is set up after cancellation.
- The new tests check the right things. One runs five real missing-directory failures and confirms each registered listener is removed. One confirms `stop()` alone detaches a watcher that was never started. One confirms a pre-aborted watcher finishes with `running === false`.

**Logging hooks:**
- `ensureLogging()` only runs when no logger was injected, and only configures logging once.
- If two triggers fail at the same moment during startup, both calls may run the configuration. That is harmless because it resets and rewrites the same settings rather than throwing.
- Nothing else in the trigger child sets up logging, so this doesn't wipe another configuration. It matches how the service builder already does it.
- Any failure in these hooks is still contained by the adapter's error isolation.

**Non-blocking note:** the `finally` now detaches the outside signal when a watch session ends. If someone called `watch()` a second time on the same `FileWatcher`, aborting that signal would no longer stop the second session. The adapter always creates a fresh watcher per attempt, so it's unaffected. If you want, S3 can document that each instance supports one watch session.

VERDICT: PASS
