---
layout: layouts/base.vto
title: Roll out runtime overrides
templateEngine: [vento, md]
order: 104
oldUrl: /how-to/roll-out-runtime-overrides/
---

# Roll out runtime overrides

Use runtime overrides when operations need to change a deployed behavior without rebuilding the
workspace. `watchRuntimeConfig(onChange, options)` watches the runtime config directory, reloads
after file changes settle, and passes the current `RuntimeConfig` to your callback.

## Prerequisites

- A writable runtime config directory.
- `NETSCRIPT_RUNTIME_CONFIG_DIR` set for the process that reads overrides.
- The `netscript` CLI with write access to that directory. The CLI creates and atomically replaces
  the `current` pointer.
- A service or worker process that can call `watchRuntimeConfig(...)` during startup.

## Create an override topic

Runtime config files are versioned behind the `current` pointer. Author the topic payload locally,
then publish it; the CLI writes `runtime/<topic>/v<version>.json` before atomically replacing
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

For a single dashboard-style feature change, the CLI can create and activate the next snapshot
directly:

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

## Roll back

Rollback validates that the requested topic version exists, preserves the other active topic
pointers, and atomically replaces `current`:

```bash
netscript config override rollback features 2026-06-21
```

The next watcher reload sees the previous version and calls `onChange` again.

## Failure modes

- Missing directory or missing files load as empty defaults so the process can start.
- A malformed pointed-to file is surfaced in the runtime config summary; publish that summary to
  logs or health output.
- Hand-editing `current` can produce a partial read. Use `config override publish|rollback`, which
  stage a complete pointer and replace it with one rename.
- A long-running `onChange` callback can lag later updates. Keep the callback bounded and hand off
  heavier work to a queue.

## Next steps

- Tune worker behavior with [Tune the worker runtime](/how-to/tune-worker-runtime/).
- Deploy the process with [Deploy](/how-to/deploy/).
- Look up the package surface in [runtime-config reference](/reference/runtime-config/).

{{ comp.nextPrev({
  prev: { label: "Deploy locally with Aspire", href: "/how-to/deploy-local-aspire/" },
  next: { label: "Add a task runtime adapter", href: "/how-to/add-a-task-runtime-adapter/" }
}) }}
