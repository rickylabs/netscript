# @netscript/watchers

[![JSR](https://jsr.io/badges/@netscript/watchers)](https://jsr.io/@netscript/watchers)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**A composable file-watching runtime for NetScript that turns filesystem changes into a normalized
event stream, auto-selecting native OS notifications or polling and passing every event through a
glob, stability, and dedup filter pipeline.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/watchers

# Node.js / Bun
npx jsr add @netscript/watchers
bunx jsr add @netscript/watchers
```

### Usage

```typescript
import { createWatcher } from '@netscript/watchers';

const watcher = createWatcher({
  paths: ['./incoming'],
  patterns: ['*.csv'],
  events: ['create', 'modify'],
  stabilityThreshold: { checkIntervalMs: 1000, stableChecks: 3 },
});

for await (const event of watcher.watch()) {
  console.log(`${event.kind}: ${event.path}`);
  watcher.stop();
}
```

`createWatcher` returns a `FileWatcher` that picks its strategy automatically — native events for
local paths, polling for network paths — and yields `WatchEvent`s only after they clear the filter
pipeline. `stop()` is idempotent, and a supplied `AbortSignal` is chained into the watcher's
internal controller — so aborting that signal shuts the watcher down on the same path as `stop()`,
letting a host runtime bind watcher lifetime to a larger supervisor.

---

## 📦 Key Capabilities

- **Auto-selected strategy**: `FileWatcher` chooses native OS notifications for local paths and
  polling for network shares; set `forcePolling: true` for SMB/NFS mounts where native events are
  unreliable.
- **Composable filter pipeline**: events flow through `GlobFilter` (filename patterns),
  `StabilityFilter` (waits for writes to finish), and `DedupFilter` (skips repeated content hashes)
  in configured order.
- **Explicit stop semantics**: `watch()` is an async generator and `stop()` signals abort, giving
  callers deterministic shutdown driven by an `AbortSignal` or an external supervisor.
- **Resilient filesystem access**: `safeReadFile`, `safeStat`, and `computeContentHash` swallow only
  missing/inaccessible errors, and `AccessFailureTracker` surfaces persistent per-path failures.
- **Typed event contract**: `WatchEvent`, `WatcherOptions`, `EventKind`, and `WatchStrategy` model
  the surface so consumers like the triggers file-watch ingress build on a stable contract.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/watchers/](https://rickylabs.github.io/netscript/reference/watchers/)
- **Background Processing**:
  [rickylabs.github.io/netscript/background-processing/](https://rickylabs.github.io/netscript/background-processing/)
- **Triggers (file-watch ingress)**:
  [rickylabs.github.io/netscript/reference/triggers/](https://rickylabs.github.io/netscript/reference/triggers/)

---

## 📝 License

Apache-2.0 — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
