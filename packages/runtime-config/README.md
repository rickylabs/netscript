# @netscript/runtime-config

[![JSR](https://jsr.io/badges/@netscript/runtime-config)](https://jsr.io/@netscript/runtime-config)
[![CI](https://github.com/rickylabs/netscript/actions/workflows/ci.yml/badge.svg)](https://github.com/rickylabs/netscript/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/badge/docs-rickylabs.github.io-blue)](https://rickylabs.github.io/netscript/)

**Hot-reloadable runtime overrides for NetScript services: load job, saga, trigger, feature-flag,
and task overrides from a versioned config directory and reload them through a file watcher without
restarting the process.**

---

## 🚀 Quick Start

### Installation

```bash
# Deno (recommended)
deno add jsr:@netscript/runtime-config

# Node.js / Bun
npx jsr add @netscript/runtime-config
bunx jsr add @netscript/runtime-config
```

### Usage

```typescript
import {
  getJobOverride,
  isFeatureEnabled,
  loadRuntimeConfig,
  summarizeRuntimeConfig,
  watchRuntimeConfig,
} from '@netscript/runtime-config';

// Load the active override snapshot from the runtime config directory.
// Missing files resolve to empty defaults, so startup never blocks on config.
const config = await loadRuntimeConfig();

if (isFeatureEnabled(config, 'email-worker', true)) {
  const cleanup = getJobOverride(config, 'cleanup');
  if (cleanup?.enabled === false) {
    // A runtime override has disabled the scheduled cleanup job.
  }
}

// Reload when operators roll out new overrides; the callback owns reporting.
const controller = new AbortController();
watchRuntimeConfig(async (next) => {
  const summary = summarizeRuntimeConfig(next, '[runtime-config]');
  for (const message of summary.messages) console.info(message);
}, { signal: controller.signal });
```

---

## 📦 Key Capabilities

- **Versioned snapshot loading**: `loadRuntimeConfig()` reads a `current` pointer file and resolves
  the active job, saga, trigger, feature-flag, and task override files for that version.
- **Empty-default startup**: a missing runtime directory, pointer, or topic file yields empty
  defaults, so a service can boot before deployment tooling writes any overrides.
- **Debounced hot reload**: `watchRuntimeConfig()` watches the config directory with `Deno.watchFs`
  and invokes a consumer callback after debounced reloads, cancellable through an `AbortSignal`.
- **Typed override accessors**: `getJobOverride`, `getSagaOverride`, `getTriggerOverride`,
  `getRuntimeTask`, and `isFeatureEnabled` resolve overrides by ID against a typed `RuntimeConfig`
  snapshot.
- **Caller-owned diagnostics**: `summarizeRuntimeConfig()` returns a structured
  `RuntimeConfigSummary` of active overrides without emitting any presentation output.

---

## 📖 Documentation

- **Reference**:
  [rickylabs.github.io/netscript/reference/runtime-config/](https://rickylabs.github.io/netscript/reference/runtime-config/)
- **Orchestration & Runtime**:
  [rickylabs.github.io/netscript/orchestration-runtime/](https://rickylabs.github.io/netscript/orchestration-runtime/)
- **How-to — Roll out runtime overrides**:
  [rickylabs.github.io/netscript/how-to/roll-out-runtime-overrides/](https://rickylabs.github.io/netscript/how-to/roll-out-runtime-overrides/)

---

## 📝 License

MIT — see [LICENSE](https://github.com/rickylabs/netscript/blob/main/LICENSE). Published to JSR with
cryptographically verified provenance.
