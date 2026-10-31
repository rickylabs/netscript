# Run memory

- 2026-10-31: Consulted prior NetScript memory before source research. RTK is absent on this worker, as prior memory already records; direct commands preserve real exit codes.
- Owner-specific Refs-only instruction overrides generic assignment closing-keyword boilerplate; coordinator owns labels/milestones, no local scaffold.runtime gate.
- Final canonical issue report is delivered by atomic rename to `.divybot-final-report.md`, not by posting a duplicate GitHub comment.
- NetScript MCP find_guidance was called, followed by search_docs. Search results were unrelated to watcher recovery; inspect repository contracts and docs for this subsystem.
- Baseline focused suite: `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all --unstable-kv packages/watchers plugins/triggers/src/runtime/trigger-child-health_test.ts packages/plugin-triggers-core/src/testing/testing_test.ts` passes 29 tests.
- Baseline `quality:gate` passes (receipt uses run-gate.ts); longstanding architecture warnings are non-failing.
- The JSR audit helper flags the banner “Checking for slow types in the public API...” as one warning even with a successful dry-run. Confirm actual slow-type diagnostics from native dry-run before claiming a regression.
- Default starter file-watch root is absent. Per-watch availability must be visible independently of aggregate child startup readiness, or scaffold background-child health becomes red.

- Idle native watch cancellation must close the Deno.FsWatcher directly on AbortSignal. Relying on abortable(iterator) can await iterator.return while its native next() is still pending, preventing stop from draining.
- Adding even existing workspace/std imports changes frozen reference workspace metadata. Use native Deno install in the reference context; inspect minimum metadata diff and explain required lock changes in the PR.
- Structured source wrappers need --allow-write when --output is passed; without output they need only read/run.
- Workspace dependency declarations are mirrored into four locks: root, expo-streams reference, desktop reference, and fresh-ui's private lock. The quality gate checks all four. Native resolver entrypoint refresh only adds the required two workspace dependencies, without versions or integrity churn.
- Per-watch health uses a TriggerHealthMonitor subclass and runChildHealthProcess's existing snapshot provider. The generated glue must pass that provider; the shared runner creates a base monitor internally, so passing only the custom monitor into startCombinedProcess is insufficient.
- Deno's full-export doc lint needs a derived-union constant re-exported too. Re-exporting FileWatchState without FILE_WATCH_STATES creates a private-type-reference diagnostic in the consumer entrypoint.
- Real native failure fixture: a temporary root with mode 000 still permits directory stat on this worker but Deno.watchFs throws PermissionDenied. This exercises native setup failure without a fake iterable or watcher stub; restore mode before cleanup. Skip that particular fixture on Windows or root-user runs where permissions cannot enforce failure.
- Pages workflow runs on drafts even while core CI is skipped. A Utility browser failure can be a Chromium Page.captureScreenshot protocol failure (139/140 tests passing), not a style assertion. Inspect current-head currency and failed logs, compare main, and retry that failed job without weakening tests.
