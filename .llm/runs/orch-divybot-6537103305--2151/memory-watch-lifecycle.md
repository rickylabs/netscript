# Watch recovery map

`packages/plugin-triggers-core/src/adapters/watchers-file-watcher-adapter.ts` owns a registration's retry loop and status callbacks. Its `#eventFor` belongs to the sibling event-key work; preserve that method when merging. `packages/watchers/src/strategies/native.ts` detects removed roots before file filters and closes the actual watcher on cancellation. `FileWatcher` removes the registration abort listener on completion and stop. Each retry uses a fresh instance.

`plugins/triggers/src/runtime/trigger-health-monitor.ts` projects per-watch state onto the shared child payload. Generated glue must pass its snapshot provider to runChildHealthProcess. Raw failures stay in diagnostics, never health. Custom adapters must forward lifecycle changes explicitly.
