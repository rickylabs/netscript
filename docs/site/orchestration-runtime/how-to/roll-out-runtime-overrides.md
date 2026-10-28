---
layout: layouts/base.vto
title: Roll out runtime overrides
description: Change deployed behavior without rebuilding the workspace.
templateEngine: [vento, md]
order: 107
oldUrl: /how-to/roll-out-runtime-overrides/
prev: { label: "Detached start for agents and CI", href: "/orchestration-runtime/how-to/detached-start-agents-ci/" }
next: { label: "Add a task runtime adapter", href: "/background-processing/how-to/add-a-task-runtime-adapter/" }
---

# Roll out runtime overrides

This recipe publishes a runtime override, applies it in a running process and rolls it back, so
operators change deployed behavior without rebuilding the workspace.
`watchRuntimeConfig(onChange, options)` watches the runtime config directory, reloads after file
changes settle, and passes the current `RuntimeConfig` to your callback.

## Prerequisites

- A writable runtime config directory.
- `NETSCRIPT_RUNTIME_CONFIG_DIR` set for the process that reads overrides.
- The `netscript` CLI with write access to that directory. The CLI creates and atomically replaces
  the `current` pointer.
- A service or worker process that can call `watchRuntimeConfig(...)` during startup.

## Create an override topic

Runtime config files are versioned behind the `current` pointer. Author the topic payload locally,
then publish it. The CLI writes `runtime/<topic>/v<version>.json` before atomically replacing
`current`, so readers see either the previous version or the next one.

```bash
export NETSCRIPT_RUNTIME_CONFIG_DIR=/etc/netscript/runtime-config
cat > ./features-v2026-06-22.json <<'JSON'
{
  "flags": [
    { "id": "workers.high-throughput", "enabled": true }
  ]
}
JSON

netscript config override publish features ./features-v2026-06-22.json \
  --version 2026-06-22
```

For a single feature change, the CLI creates and activates the next snapshot directly:

```bash
netscript config override set flags.checkout-v2 --rollout 30
```

## Watch and apply changes

`watchRuntimeConfig(onChange, options)` returns `void`; use an `AbortController` to stop watching
during process shutdown.

```ts
import {
  isFeatureEnabled,
  summarizeRuntimeConfig,
  watchRuntimeConfig,
} from '@netscript/runtime-config';

const controller = new AbortController();

watchRuntimeConfig(
  async (config) => {
    const enabled = isFeatureEnabled(config, 'workers.high-throughput', false);
    const summary = summarizeRuntimeConfig(config);

    await publishRuntimeStatus({
      enabled,
      messages: summary.messages,
    });
  },
  {
    signal: controller.signal,
    prefix: 'runtime-config',
  },
);

addEventListener('unload', () => controller.abort());
```

The watcher debounces file churn before reloading. Keep rollout writes atomic anyway: write a new
version file first, then replace `current` in a single rename.

{{ comp callout { type: "warning", title: "Don't hand-edit the pointer" } }}
Hand-editing <code>current</code> can produce a partial read. Use <code>netscript config override publish</code> or <code>rollback</code>, which stage a complete pointer and replace it with one rename.
{{ /comp }}

## Roll back

Rollback checks that the requested topic version exists, keeps the other active topic pointers,
and atomically replaces `current`:

```bash
netscript config override rollback features 2026-06-21
```

The next watcher reload sees the previous version and calls `onChange` again.

## Failure modes

| Situation | What happens | What to do |
| --- | --- | --- |
| Missing directory or files | They load as empty defaults, so the process can start. | Check `NETSCRIPT_RUNTIME_CONFIG_DIR` if overrides never apply. |
| Malformed pointed-to file | The runtime config summary reports it. | Publish the summary to logs or health output. |
| Long-running `onChange` callback | It can lag later updates. | Keep the callback bounded and hand heavier work to a queue. |

## Next step

Use overrides to tune job behavior with
[Tune the worker runtime](/background-processing/how-to/tune-worker-runtime/). The
[runtime-config reference](/reference/runtime-config/) lists every override type.
