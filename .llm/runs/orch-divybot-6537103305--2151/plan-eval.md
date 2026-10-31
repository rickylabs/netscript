# PLAN-EVAL round 1

**PLAN-EVAL round 1: issue #2151 (watch recovery, per-trigger health, native strategy)**

I evaluated this as a separate, read-only, different-family session against the plan gate, blockers only. I edited no files and ran no commands, so I did not write `plan-eval.md`; the supervisor should record this verdict. Local scaffold runtime, labels and milestones were not required, as instructed.

**Spot-checks against current main:**
- **Watcher behavior:** this matches the research. The adapter's `#run` swallows iterator failure and exits for good, because the runtime builds the adapter with no hooks. The watcher factory runs outside `#run`, and `FileWatcher` can only be used once since its internal abort controller can't be reset. So building a fresh watcher on each retry is correct. The native strategy filters out a root `remove` before any failure path, and the hybrid strategy turns any native error into polling. Locked decisions 2 and 3 cover both.
- **Retry cancellation:** decision 2 and the risk register cover abortable bounded backoff, waiting for tasks on stop and unwatch, and ignoring callbacks from stale registrations. The research also notes the copied pause and task records. No blocker.
- **Health snapshot integration:** the shared child health process builds its own base monitor. It accepts an optional snapshot provider, and the sagas glue already uses that pattern. A trigger monitor built by the glue and served through that provider will work, and the extra `fileWatches` field survives the terminal-failure spread. The blocker below comes from the readiness semantics, not this wiring.

**Blocker 1. Open decision not flagged: how per-watch health affects the default scaffold's readiness gate.**

The default triggers install creates a starter file-watch trigger (`incoming-file-watch`) watching `./shared/incoming`. Nothing in the repository creates that directory.

- **Today:** the watcher's start-up path check fails inside `#run`, the error is swallowed, and the triggers child still reports `ready` with HTTP 200.
- **Under decisions 2 and 4 and slice 2:** that watch stays `unavailable` while retrying forever. The aggregate becomes degraded and the child health route returns 503, because only `ready` gives 200.
- **Effect:** the triggers child is one of the resources probed by `behavior.background-children-health`. That probe requires HTTP 200 with `state: ready`, `registryReady` and `dependencyReady`. So the planned health semantics would turn the e2e-cli scaffold runtime gate red. The plan lists "Runtime glue requires e2e-cli CI verdict" but doesn't address this. Leaving it until CI fails would force rework of slice 2's health design.

**Minimal fix:** before slice 2, add a locked decision with its rationale, choosing one of these:
- **(a)** The scaffold makes the starter watch root usable, for example by emitting a placeholder file in the watched directory. Add the triggers file-watch scaffolding resource and its test to the authorized write surface and to slice 2's files.
- **(b)** Per-watch `unavailable` is reported in `fileWatches` (and in the logs), but it does not change the child's aggregate `state` or the HTTP status. The slice 2 proof "/health status degrades then recovers" must then be reworded to match.
- **(c)** The degrade is intended. In that case, list the scaffold/e2e gate changes needed to keep `behavior.background-children-health` green, with an owner sign-off.

Whichever you choose, add a slice 2 test proving the default starter trigger set gives the expected `/health` status.

All other plan-gate items are satisfied enough for a blockers-only review: research re-checked against current main, decisions locked, slices ordered with their proving gates, risks, gate set, deferred scope, and the public-surface (JSR) audit.

VERDICT: FAIL_PLAN


# PLAN-EVAL round 2

**PLAN-EVAL round 2: issue #2151, same evaluator context, blockers only**

The round 1 blocker is fixed and I found no new blockers, so the plan passes. I didn't edit any files.

**How the repair resolves blocker 1 (option b):**
- **Decision 4** now says a watch being unavailable does not change the child's overall readiness. Each unavailable source is listed in `fileWatches`, and the processor keeps handling scheduled and other triggers. It also gives the reason: the scaffold never creates the starter trigger's watched directory.
- **Slice 2's proof** now matches. `/health` `fileWatches` shows the watch go from unavailable to watching, two triggers stay independent, shutdown is covered, and the default starter with its directory missing returns HTTP 200 with that watch marked unavailable. That last test is the one I asked for.
- **Worklog and drift** both record the revised decision before any implementation.
- **No conflicts:** this fits the existing health route, which returns 200 only for `ready` with registry and dependencies ready. Since the overall state no longer depends on watch health, the triggers child stays green in `behavior.background-children-health`. It also fits the existing snapshot-provider pattern, and decision 2's "unavailable until ready" startup state now only affects that watch's `fileWatches` entry.

**New dependency wiring (worklog addendum):** `@std/async` is already a dependency of the watchers package. `@netscript/logger` is a workspace package (0.0.8) that other packages already import by name. Adding it is an ordinary workspace dependency with no version or lockfile change, and the planned architecture checks, JSR audit and per-package publish dry-run will catch any problem. Not a blocker.

Everything else from round 1 still holds.

VERDICT: PASS
