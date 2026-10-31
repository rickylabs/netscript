# Watch recovery map

`packages/plugin-triggers-core/src/adapters/watchers-file-watcher-adapter.ts` owns a registration's retry loop and status callbacks. Its `#eventFor` belongs to the sibling event-key work; preserve that method when merging. `packages/watchers/src/strategies/native.ts` detects removed roots before file filters and closes the actual watcher on cancellation. `FileWatcher` removes the registration abort listener on completion and stop. Each retry uses a fresh instance.

`plugins/triggers/src/runtime/trigger-health-monitor.ts` projects per-watch state onto the shared child payload. Generated glue must pass its snapshot provider to runChildHealthProcess. Raw failures stay in diagnostics, never health. Custom adapters must forward lifecycle changes explicitly.

Review follow-up: initial polling stat and walk share the existing AccessFailureTracker grace budget. Failed scans never call onReady; transient shares can recover within the polling session. Persistent errors propagate before readiness. Callback cancellation uses per-adapter AsyncLocalStorage scope: external calls drain, reentrant handler/error/status calls cancel without self-await; the scope is inactive after callback completion and disabled when all tasks settle.
