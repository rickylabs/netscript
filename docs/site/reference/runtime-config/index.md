---
layout: layouts/base.vto
title: "@netscript/runtime-config"
---

# `@netscript/runtime-config`

Hot-reloadable runtime overrides for NetScript jobs, sagas, triggers, feature flags and tasks. Use
it to change runtime behavior from versioned JSON files without redeploying a service.

## Sub-path exports

| Export | Entrypoint | Purpose |
| --- | --- | --- |
| `@netscript/runtime-config` | `./mod.ts` | [Loaders and watchers](#loaders-and-watchers), [override accessors](#override-accessors), [diagnostics](#diagnostics) and the configuration types. The package has no other entrypoints. |

Runtime config files live under the configured runtime directory and are loaded through a version
pointer named `current`. Missing files produce empty defaults, so service startup continues while
operators roll out runtime overrides independently.

## Loaders and watchers

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `loadRuntimeConfig` | function | `async function loadRuntimeConfig(): Promise<RuntimeConfig>` | Load runtime overrides from the configured runtime config directory. Returns empty defaults when the directory, pointer file, or topic files are missing. |
| `watchRuntimeConfig` | function | `function watchRuntimeConfig(onChange: (config: RuntimeConfig) => Promise<void>, options: { signal?: AbortSignal; prefix?: string }): void` | Watch runtime config files and invoke `onChange` after debounced reloads. |

## Override accessors

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `getJobOverride` | function | `function getJobOverride(config: RuntimeConfig, jobId: string): JobOverride \| undefined` | Get the override for a specific job ID. |
| `getSagaOverride` | function | `function getSagaOverride(config: RuntimeConfig, sagaId: string): SagaOverride \| undefined` | Get the override for a specific saga ID. |
| `getTriggerOverride` | function | `function getTriggerOverride(config: RuntimeConfig, triggerId: string): TriggerOverride \| undefined` | Get the override for a specific trigger ID. |
| `getRuntimeTask` | function | `function getRuntimeTask(config: RuntimeConfig, taskId: string): RuntimeTask \| undefined` | Get a runtime task definition by ID. |
| `isFeatureEnabled` | function | `function isFeatureEnabled(config: RuntimeConfig, flagId: string, defaultValue: boolean): boolean` | Check whether a feature flag is enabled, falling back when the flag is absent. |

## Diagnostics

| Symbol | Kind | Signature | Description |
| --- | --- | --- | --- |
| `summarizeRuntimeConfig` | function | `function summarizeRuntimeConfig(config: RuntimeConfig, prefix: string): RuntimeConfigSummary` | Summarize active runtime overrides without emitting presentation output. |

## Configuration types

| Symbol | Kind | Description |
| --- | --- | --- |
| `RuntimeConfig` | interface | Complete runtime override snapshot (jobs, sagas, triggers, features, tasks). |
| `JobOverride` | interface | Job-level runtime override loaded from `runtime/jobs/*.json`. |
| `SagaOverride` | interface | Saga-level runtime override loaded from `runtime/sagas/*.json`. |
| `TriggerOverride` | interface | Trigger-level runtime override loaded from `runtime/triggers/*.json`. |
| `FeatureFlag` | interface | Feature flag loaded from `runtime/features/*.json`. |
| `RuntimeTask` | interface | Task definition that can be added or overridden at runtime. |

## Diagnostics types

| Symbol | Kind | Description |
| --- | --- | --- |
| `RuntimeConfigSummary` | interface | Structured summary of active runtime overrides. |
| `RuntimeConfigTriggerPathOverride` | interface | Trigger path override included in a runtime config summary. |

## Topic constants and aliases

| Symbol | Kind | Description |
| --- | --- | --- |
| `RUNTIME_CONFIG_TOPICS` | const | Runtime config topic names backed by versioned JSON files (`jobs`, `sagas`, `triggers`, `features`, `tasks`). |
| `RUNTIME_TASK_RUNTIMES` | const | Supported runtime task execution kinds (`deno`, `python`, `dotnet`, `cmd`, `powershell`, `shell`, `executable`). |
| `RuntimeConfigTopic` | type alias | Runtime config topic name (a member of `RUNTIME_CONFIG_TOPICS`). |
| `RuntimeTaskRuntime` | type alias | Runtime task execution kind (a member of `RUNTIME_TASK_RUNTIMES`). |
