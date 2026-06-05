# @netscript/runtime-config

Hot-reloadable runtime override contracts for NetScript deployments.

This package loads versioned runtime configuration files from a deployment runtime directory and
returns typed override snapshots for jobs, sagas, triggers, feature flags, and runtime tasks.

It is intentionally small. It does not own persistence, scheduling, logging, or process lifecycle.
Those concerns stay with the runtime that calls it.

## Install

```ts
import {
  isFeatureEnabled,
  loadRuntimeConfig,
  summarizeRuntimeConfig,
  watchRuntimeConfig,
} from 'jsr:@netscript/runtime-config';
```

Inside this workspace, packages import the local workspace package:

```ts
import { loadRuntimeConfig } from '@netscript/runtime-config';
```

## What It Does

`@netscript/runtime-config` answers one question:

Can a deployed NetScript process load and reload operational overrides without changing its
compiled code?

The answer is a `RuntimeConfig` snapshot:

```ts
const config = await loadRuntimeConfig();
```

The snapshot contains five topics:

| Topic | File directory | Shape |
| ----- | -------------- | ----- |
| Jobs | `runtime/jobs/` | `JobOverride[]` |
| Sagas | `runtime/sagas/` | `SagaOverride[]` |
| Triggers | `runtime/triggers/` | `TriggerOverride[]` |
| Features | `runtime/features/` | `FeatureFlag[]` |
| Tasks | `runtime/tasks/` | `RuntimeTask[]` |

## Runtime Directory Resolution

The loader resolves the runtime directory in this order:

1. `NETSCRIPT_RUNTIME_CONFIG_DIR`
2. Parent directory of `NETSCRIPT_TASKS_DIR`
3. `./runtime` relative to the current working directory

This lets compiled Windows services, local development, and test runs use the same API.

## File Layout

The runtime directory contains a `current` pointer file.

The preferred pointer format is JSON:

```json
{
  "version": "1.0.0",
  "jobs": "jobs/v1.0.0.json",
  "sagas": "sagas/v1.0.0.json",
  "tasks": "tasks/v1.0.0.json",
  "triggers": "triggers/v1.0.0.json",
  "features": "features/v1.0.0.json"
}
```

A plain text pointer such as `1.0.0` is also accepted. In that mode the loader derives topic paths
by convention:

```text
jobs/v1.0.0.json
sagas/v1.0.0.json
tasks/v1.0.0.json
triggers/v1.0.0.json
features/v1.0.0.json
```

## Quick Start

```ts
import {
  getJobOverride,
  isFeatureEnabled,
  loadRuntimeConfig,
} from '@netscript/runtime-config';

const config = await loadRuntimeConfig();

if (!isFeatureEnabled(config, 'email-worker', true)) {
  await stopEmailWorker();
}

const cleanup = getJobOverride(config, 'cleanup');
if (cleanup?.enabled === false) {
  await disableScheduledJob('cleanup');
}
```

Missing files return empty defaults. A process can start with no runtime directory and later begin
using overrides when the directory is created by deployment tooling.

## Watching For Changes

Use `watchRuntimeConfig()` when a runtime should reload after a JSON file changes.

```ts
const controller = new AbortController();

watchRuntimeConfig(
  async (config) => {
    await applyRuntimeOverrides(config);
  },
  { signal: controller.signal },
);

addEventListener('unload', () => controller.abort());
```

The watcher uses `Deno.watchFs()` and debounces rapid file events before reloading the snapshot.

The package does not log watcher events. Presentation surfaces decide how to emit operational
messages.

## Structured Diagnostics

Use `summarizeRuntimeConfig()` to get caller-owned diagnostics.

```ts
import {
  loadRuntimeConfig,
  summarizeRuntimeConfig,
} from '@netscript/runtime-config';

const config = await loadRuntimeConfig();
const summary = summarizeRuntimeConfig(config, '[workers]');

for (const line of summary.messages) {
  console.log(line);
}
```

The summary also exposes structured fields:

```ts
summary.disabledJobs;
summary.disabledSagas;
summary.disabledTriggers;
summary.disabledFeatures;
summary.triggerPathOverrides;
```

## Public Functions

| Function | Purpose |
| -------- | ------- |
| `loadRuntimeConfig()` | Load the active runtime override snapshot. |
| `isFeatureEnabled(config, flagId, defaultValue?)` | Resolve a feature flag with a default fallback. |
| `getJobOverride(config, jobId)` | Find a job override by ID. |
| `getSagaOverride(config, sagaId)` | Find a saga override by ID. |
| `getTriggerOverride(config, triggerId)` | Find a trigger override by ID. |
| `getRuntimeTask(config, taskId)` | Find a runtime task definition by ID. |
| `watchRuntimeConfig(onChange, options?)` | Watch runtime config files and call the consumer on reload. |
| `summarizeRuntimeConfig(config, prefix?)` | Return structured diagnostics for the snapshot. |

## Public Types

| Type | Meaning |
| ---- | ------- |
| `RuntimeConfig` | Complete loaded snapshot. |
| `JobOverride` | Job-level runtime override. |
| `SagaOverride` | Saga-level runtime override. |
| `TriggerOverride` | Trigger-level runtime override. |
| `FeatureFlag` | Runtime feature flag. |
| `RuntimeTask` | Task definition provided at runtime. |
| `RuntimeConfigSummary` | Structured diagnostic summary. |
| `RuntimeTaskRuntime` | Supported task execution runtime. |
| `RuntimeConfigTopic` | Supported runtime config topic name. |

## Permissions

The loader and watcher use Deno runtime APIs.

| Permission | Needed for |
| ---------- | ---------- |
| `--allow-env=NETSCRIPT_RUNTIME_CONFIG_DIR,NETSCRIPT_TASKS_DIR` | Runtime directory discovery. |
| `--allow-read=<runtime-dir>` | Reading the pointer and topic JSON files. |
| `--allow-read=<runtime-dir>` | Watching the directory with `Deno.watchFs()`. |

Development tests use `--allow-all` in this repository because temporary directories and environment
variables are created inside the test process.

## Error Handling

The loader is deliberately forgiving:

- missing runtime directory means an empty snapshot;
- missing `current` pointer means an empty snapshot;
- malformed `current` pointer means an empty snapshot;
- missing topic files produce empty arrays for that topic;
- malformed topic files produce empty arrays for that topic.

Consumer code should treat the snapshot as operational input, not as a validated project
configuration.

## Job Overrides

```json
{
  "overrides": [
    {
      "id": "cleanup",
      "enabled": true,
      "schedule": "0 */6 * * *",
      "timeout": 30000,
      "maxRetries": 3,
      "timezone": "UTC"
    }
  ]
}
```

## Saga Overrides

```json
{
  "overrides": [
    {
      "id": "user-registration",
      "enabled": true,
      "timeout": 120000,
      "compensationTimeout": 30000
    }
  ]
}
```

## Trigger Overrides

```json
{
  "overrides": [
    {
      "id": "inbox-files",
      "enabled": true,
      "paths": ["./incoming", "./retry"]
    }
  ]
}
```

## Feature Flags

```json
{
  "flags": [
    {
      "id": "new-worker-routing",
      "enabled": false,
      "description": "Switch workers to the new routing policy",
      "rolloutPercentage": 0
    }
  ]
}
```

## Runtime Tasks

```json
{
  "tasks": [
    {
      "id": "daily-report",
      "name": "Daily report",
      "runtime": "deno",
      "entrypoint": "./tasks/daily-report.ts",
      "enabled": true,
      "schedule": "0 8 * * *"
    }
  ]
}
```

## Testing Pattern

Tests usually create a temporary runtime directory, write a `current` pointer, set
`NETSCRIPT_RUNTIME_CONFIG_DIR`, and call `loadRuntimeConfig()`.

```ts
const dir = await Deno.makeTempDir();
Deno.env.set('NETSCRIPT_RUNTIME_CONFIG_DIR', dir);

try {
  const config = await loadRuntimeConfig();
  assertEquals(config.jobs, []);
} finally {
  Deno.env.delete('NETSCRIPT_RUNTIME_CONFIG_DIR');
  await Deno.remove(dir, { recursive: true });
}
```

## Compatibility

This package targets Deno and JSR.

It uses Web Platform APIs and Deno APIs directly:

- `Deno.env.get()`
- `Deno.readTextFile()`
- `Deno.stat()`
- `Deno.watchFs()`

No Node.js compatibility layer is provided.

## Stability

The package is alpha. Public names are documented and tested, but runtime task and plugin-specific
override fields may expand as official plugins stabilize their contracts.

The five top-level topics are stable for S1:

- `jobs`
- `sagas`
- `triggers`
- `features`
- `tasks`

## See Also

- `@netscript/config` for project-level configuration authoring and loading.
- `@netscript/contracts` for shared schema and contract primitives.
- `@netscript/plugin-workers-core` for worker task runtime semantics.

## License

MIT
