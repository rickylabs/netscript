# Independent S2 review

The S2 slice passes with no blockers. Per-trigger watch health is visible through the existing child `/health`, and a missing watch directory doesn't stop the child from reporting ready. I didn't edit any files or run anything.

**Visible through the existing health route:**
- The generated child startup code now builds a `TriggerHealthMonitor` (child health plus each watch's state). It passes it to the runtime and gives the shared health process `() => health.snapshot()` as the snapshot source. The base monitor that process creates is no longer used, so the trigger monitor is the only source.
- If the child fails, the health process copies that snapshot into its final failure payload, so `fileWatches` is kept there too.
- `TriggerHealthMonitor` and its snapshot type are exported from the triggers runtime entry point that the generated code imports. No other copy of the generated text in the repo needs updating.

**Ordering is consistent:**
- The runtime marks each watch unavailable before calling `watch()`.
- Status changes update the monitor first, before the logging setup is awaited, so health can't be reordered behind logging.
- The adapter's checks that a registration is still current stop late updates after `stop()` or `unwatch()`.
- Each entry carries only the trigger id, state and time, never raw filesystem errors.

**Two watches stay independent and readiness is unaffected:**
- The real-watcher test removes one watched directory. Over HTTP, that watch shows `unavailable` while the other stays `watching`, the child stays `ready` with HTTP 200, and the other trigger still gets its event. Recreating the directory brings the first watch back to `watching`, and a later file reaches its handler.
- The starter-trigger test loads the actual generated starter definition with its directory missing. The child is ready, HTTP is 200, and the starter shows as unavailable. That covers the round 1 plan blocker.

**Snapshots are immutable and shutdown is clean:**
- Each snapshot, its watch list and every entry are frozen and sorted by trigger id.
- `stopped()` and `failed()` mark every watch unavailable, and later updates are ignored once the child is stopped or failed. On failure, `failed()` runs before the watchers are stopped. On normal shutdown, `stopped()` runs only after they have drained.
- `starting()` clears the list for a fresh startup.

**Non-blocking note:** late watch updates are blocked only in the `stopped` and `failed` states, not in `crash-looping`. The trigger runtime never calls `restarting()`, so it can't reach that state, and this is only worth tidying if a restart supervisor is added later.

VERDICT: PASS
