# PLAN-EVAL round 1

**PLAN-EVAL round 1: #1366 box 6**

I found two blocking issues in the plan, both about how restarts get counted for children the generator actually produces.

**B1. Watch-mode reloads will be counted as crashes, and the plan's proof never runs in watch mode.**
- **What the generator does:** `buildBackgroundProcessorEntry` sets `WatchMode: true` for every scaffolded background processor (`packages/cli/src/kernel/adapters/plugin/appsettings-entry-builders.ts:96`). `generate-register-background.ts:78-88` and `resolvePermissions` (`packages/aspire/src/application/resolve-permissions.ts:49-51`) then add `--watch` to the `deno run` arguments. So by default the sagas and triggers children run as `deno run --watch …/runtime.ts`.
- **Why that breaks the design:** when a watched file changes, `deno --watch` reruns the module inside the same OS process. As far as I know it does not send SIGINT or SIGTERM first, so the clean-stop path in `run-child-health-process.ts` never runs and the "active" marker is never cleared. Plan decision 3 ("an active prior process counts one restart") then counts every ordinary save as a crash. Three saves within 60 seconds latch `crash-looping`, return HTTP 503, and stay that way until the child has been ready for a full 60 seconds. That is a false red in the normal dev loop.
- **Second effect:** under `--watch`, a crashed child is not restarted until a file changes. So the "distinct OS children" proof is not how the default generated child actually restarts.
- **Needed in the plan:**
  - Decide how a watch reload is classified. Options: a run/session id that tells a same-process reload apart from a new process, a mode where only failed exits count, or an explicit lifecycle hook if one is proven to fire.
  - Add a proof that launches the generated glue with the real `--watch` arguments: a healthy child reloaded three or more times stays `ready`, and a failing child under reloads reaches `crash-looping`.
  - Record a drift entry. The plan's single-owner model and "abrupt termination retains active" both assume one OS process per run, which watch mode breaks.

**B2. Leaving workers out of process history has no justification against box 6.**
- Plan decision 4 says "Workers does not opt into process history", and the stated reason is only "workers budget changes" being deferred. But tracking process history would not touch the in-process budget (`listener-supervisor.ts:167-177`).
- A workers bootstrap, registry or dependency failure still rejects through `runChildHealthProcess` and exits the process. That is the same "OS restarts erase history" gap that research.md uses to justify the feature for sagas and triggers.
- Box 6 applies to every first-party background child. The plan needs to either opt workers' glue into a separate `.data/child-health/workers.json` (with its own regression cases and negative control), or record evidence that workers cannot flap across processes, plus a drift entry with an owner.

**What is sound (not blocking):**
- Monitor defaults and the inclusive boundary are kept, and the existing clock seam is reused.
- The failure model holds up: atomic rename, fail closed, no disk reads on HTTP polling, history attached before bootstrap.
- The triggers monitor is injected into the transport.
- Redaction of `lastFatalError` is unchanged.
- The rule to clear the marker only after a clean drain covers the fatal path through `health.stopped()` at `run-child-health-process.ts:101`.
- The negative-control and doctrine/JSR gates are adequate.
- Generated children already get `--allow-write`, so writing the file will not fail on permissions.

VERDICT: FAIL_PLAN

Response and round-2 decisions: see drift.md and plan.md.


# PLAN-EVAL round 2

**PLAN-EVAL round 2: #1366 box 6**

Both round-1 findings are settled and I found no new blockers.

**B1 (watch-mode reloads counted as crashes) is resolved.**
- **Healthy reloads don't count.** `deno run --watch` reruns the module inside the same OS process, so the process id stays the same across reloads. Under the revised accounting, a reload of a healthy child (same process id, failure flag not set) no longer counts as a restart. A child that failed and is then reloaded still counts. An abrupt OS replacement is caught because the process id changes.
- **Failure is recorded early enough.** The failure flag is written at the failure transition, before the fatal grace timer or watcher reload can run. The 1-second fatal drain is never treated as a clean stop.
- **Recovery still needs a full ready window.** A crash-loop latch still clears only after a full ready window in the live process, so a successful reload cannot flip a restart storm back to green early.
- **The proof now uses the real launch shape.** Both actual generated glue modules run under `--watch`: a failing registry reaches `crash-looping` by the third restart, and three or more healthy reloads stay `ready` with `restartCount` at 0.
- **The process id comes from the transport,** which keeps Deno IO out of the monitor, as Archetype 3 requires.

**B2 (workers excluded from process history) is accepted as declined.**
- The owner's assignment limits this leaf to cross-process detection for sagas and triggers and says to keep #2482's workers behaviour.
- The plan states the limitation, claims nothing new for workers across processes, and keeps the existing workers monitor and listener-budget tests as preservation gates.
- Responsibility for the rest is recorded with the coordinator (#2474), so the gap is documented rather than silent.

**Other checks found nothing blocking:**
- Atomic replacement, fail-closed handling of corrupt or unwritable records, and no disk reads on HTTP polling are unchanged.
- Generated children already get `--allow-write`, and each plugin writes its own `.data/child-health/<plugin>.json`.
- The negative control (detector removed, then restored byte-for-byte) is unchanged.
- The doctrine and JSR surface stays on the existing `./health` subpath with no new dependency.

VERDICT: PASS
