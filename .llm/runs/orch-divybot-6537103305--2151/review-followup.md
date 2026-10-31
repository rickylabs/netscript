# Independent review-follow-up source sign-off

The review-follow-up repair passes source sign-off with no blockers. All three review comments are fixed without breaking startup behavior or the external drain path. I edited nothing and ran nothing.

**(1) Polling no longer reports ready after a failed first scan:**
- The first scan now checks each root, scans it fully, and returns whether every root succeeded. If not, it waits one poll interval and tries again, and `onReady` is not called.
- Only errors that the failure tracker counts as persistent are thrown, and they keep their original type. Any other error type is thrown immediately.
- `onReady` runs once, after a complete scan and only if the watch wasn't cancelled. Each retry clears the partial snapshot first.
- Through hybrid's fallback, an unreadable root now stays `unavailable` and reports an error on each attempt. The adapter's retry then recovers it to `watching` once the root is readable again. Your real chmod test proves this.

**(2) Startup grace for network shares is the same as before:**
- On main, a network root that was unreachable at startup was counted as failure 1 during the first scan, then 2 and 3 on the next two polls, and the watch threw on the third.
- The new loop has the same count and timing, using the same interval and the default of 3 consecutive failures. Local roots are still rejected up front by path validation, so the reviewed native, hybrid and recovery behavior is unchanged.

**(3) A callback can cancel its own watch without waiting on itself:**
- Every handler, `onError` and status callback runs inside its own scope that marks it as active, and the scope is turned off as soon as the callback settles.
- Inside an active callback, `unwatch()` and `stop()` still abort the watch, stop the watcher and remove the record, but they don't wait for the task. So there is no self-wait.
- Outside callbacks they still wait. That covers the trigger runtime's shutdown `stop()` and the existing test where an in-flight handler is drained.
- Work that a callback leaves running after it finishes (a timer, for example) sees an inactive scope and is treated as an outside caller. If `watch()` is called from inside a callback, the new task inherits that scope, but it only calls `unwatch`/`stop` through its own nested callback scopes, so it can't skip a drain by mistake.
- No other callback can be active once every task has settled, because each task waits for its callbacks. That makes the disable step safe in the current flows.

**Non-blocking notes:**
1. Turning the scope storage off when all tasks settle relies on the next `run()` turning it back on. Node documents that behavior, and Deno's compatibility layer is meant to match it. Each callback-cancellation test uses a fresh adapter, though. Either add a case that drains everything, registers again on the same adapter and then cancels from inside a callback, or remove the `disable()` call, since the storage is owned by the adapter and is garbage-collected with it.
2. Inside a callback, `unwatch()` for a different trigger now returns without waiting for that trigger to drain. That fits the updated doc comment, but you could say so in the reference paragraph.
3. When a polling root becomes reachable after the first scan failed, files already there are now treated as existing rather than emitted as `create`. That matches `processExisting: false`, but it differs from main's polling, which emitted them as `create`, so a release note may be worthwhile.

The final exact-head evaluation still needs to follow the committed fix, and the required CI and e2e-cli checks remain external prerequisites.

VERDICT: PASS

The recommended same-adapter re-registration regression was added afterward; it passes in the 64-result suite and fails with the old production adapter. Reference documentation also clarifies cross-trigger callback cancellation and the initial polling snapshot baseline. No additional product code change followed this review. Final exact-head attestation is recorded on the PR timeline.
