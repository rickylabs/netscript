# Research — 2026-10-31

Baseline main: a410a815ce1401d533b18f2a85eb75e266de94a5. Read issue #2151 and all comments; no covering PR found. #2479 is open; #2477 is already integrated. No Acceptance checkboxes exist in the live issue body; requirements are the native-only proposal plus the owner's recovery/health comment and assigned three slices.

MCP consulted in order: find_guidance(intent), search_docs(query). Returned documentation was unrelated to this subsystem, so repository contracts and docs are authority. Consulted existing NetScript memory before source research. RTK unavailable; use direct commands and structured wrappers.

- Adapter #run catches iterator failure, invokes an optional error hook, and exits permanently. Runtime constructs the adapter without hooks. Factory creation happens outside #run; task and paused state use copied records, which must stay coherent across retry.
- Real Deno.watchFs root-deletion probe yields a remove event for the root on this host. It need not throw. NativeStrategy currently filters it out when listening for create events. Root removal needs to terminate the native watch before event filtering. Hybrid must propagate root loss rather than masking it with polling.
- FileWatcher options have forcePolling, but no strategy field, despite a native/polling/hybrid type already existing. NativeStrategy is not constructible through the public factory. Existing public WatchEvent is a file event and should not become an error payload delivered to trigger handlers.
- Native readiness must be reported after Deno.watchFs opens, rather than after synchronous factory allocation or waiting for a matching file event. Polling readiness must follow root validation and initial snapshot.
- Existing generated trigger glue runs runChildHealthProcess, which accepts a snapshot provider. ChildHealthMonitor can be extended in the trigger runtime and its richer snapshot served by that existing hook, avoiding shared monitor changes or process-local global state.
- Existing watchers AP-13 warning debt is recorded; no new console reporting is needed. Runtime errors use the established telemetry logger at the plugin edge.

JSR/public-surface audit: preserve named exports and existing entrypoints. Add explicit types for watch lifecycle diagnostics and health, JSDoc examples for newly exported contracts/monitor, and optional callbacks for compatibility. Full-export doc lint, package audits, and dry-run publish are selected. No dependency/version changes planned.
