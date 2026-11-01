# Independent S3 and complete-source review

S3 and the full source pass with no blockers. CI's e2e-cli run is still unproven and I don't claim it passed. Because S3 isn't committed yet, this is not tied to a commit; the exact-head IMPL-EVAL comes after the commit. I didn't edit any files or run anything.

**Explicit native never reaches polling:**
- `strategy: 'native'` builds the native watcher directly. That watcher has no fallback path, so neither a setup failure (opening the watch, or the root failing validation) nor a runtime failure (the root being removed) can start polling.
- Hybrid still rethrows a missing or removed root, so recovery reviewed in S1 is unchanged. The trigger adapter doesn't pass a strategy, so triggers keep the automatic default, as planned.

**Error diagnostics:**
- Failures from validating the paths, choosing the strategy, or running the event stream all go through one handler in `watch()`. It calls `onError` with a frozen `WatcherErrorEvent` (`type: 'error'`, a frozen copy of the paths, the original error, and the time), then rethrows the original error.
- If `onError` itself fails, that failure is swallowed so it can't replace the original error.
- After cancellation, nothing is reported.
- The adapter doesn't set `onError` and still treats the rejection as the failure signal, so S1 behavior holds.

**Precedence and unknown values:**
- An explicit `strategy` wins over `forcePolling` and the network-path check. Without one, the old behavior is unchanged.
- An unknown strategy throws a `TypeError` before any watcher is acquired, and that error is reported through `onError`.
- `WATCH_STRATEGIES`, `WatchStrategy`, `KnownWatchStrategy` and `WatcherErrorEvent` are exported and have doc comments.

**Cancellation:**
- Aborting closes the native watch and ends iteration cleanly with no error report.
- The S1 listener cleanup is still in place, and the docs now say each instance supports one watch session.

**Real tests:**
- The permission-denied test uses the real `Deno.watchFs` (the spy forwards to it). It checks exactly one native attempt, no polling, one error event with the original error, and that `onReady` never fires.
- Other real tests cover root removal, native taking precedence over `forcePolling` with an actual file event, clean cancellation, a failing `onError`, an unknown strategy, and explicit polling.
- The permission test is skipped when run as root or on Windows. CI is Linux-only and doesn't run as root, so it will run there.

**Docs:** the reference strategy table and the precedence and unknown-value text match the code.

**Non-blocking notes:**
1. The strategy is checked inside `init()`, after the paths are validated. So an unknown strategy combined with a missing path reports the missing path (`NotFound`) instead of `TypeError`. Checking in the constructor would make that consistent.
2. `WATCH_STRATEGIES` is typed read-only but isn't frozen at runtime.
3. Some tests compare raw path strings, which only holds on Linux. That's fine for this Linux-only CI.

VERDICT: PASS
