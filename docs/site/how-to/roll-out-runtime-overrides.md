---
layout: layouts/base.vto
title: Roll out runtime overrides
templateEngine: [vento, md]
prev: { label: "Deploy locally with Aspire", href: "/how-to/deploy-local-aspire/" }
next: { label: "Add a task runtime adapter", href: "/how-to/add-a-task-runtime-adapter/" }
---

# Roll out runtime overrides

Use runtime overrides when operations need to change a deployed behavior without rebuilding the
workspace. `watchRuntimeConfig(onChange, options)` watches the runtime config directory, reloads
after file changes settle, and passes the current `RuntimeConfig` to your callback.

## Prerequisites

- A writable runtime config directory.
- `NETSCRIPT_RUNTIME_CONFIG_DIR` set for the process that reads overrides.
- A `current` pointer file in that directory.
- A service or worker process that can call `watchRuntimeConfig(...)` during startup.

## Create an override topic

Runtime config files are versioned behind the `current` pointer. Stage the new version beside the
old one, then swap `current` atomically so readers either see the previous version or the next one.

```bash
export NETSCRIPT_RUNTIME_CONFIG_DIR=/etc/netscript/runtime-config
mkdir -p "$NETSCRIPT_RUNTIME_CONFIG_DIR"

cat > "$NETSCRIPT_RUNTIME_CONFIG_DIR/2026-06-22.json" <<'JSON'
{
  "features": {
    "workers.high-throughput": true
  }
}
JSON

tmp="$(mktemp "$NETSCRIPT_RUNTIME_CONFIG_DIR/current.XXXX")"
printf "2026-06-22.json\n" > "$tmp"
mv "$tmp" "$NETSCRIPT_RUNTIME_CONFIG_DIR/current"
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

Rollback is the same pointer swap in reverse:

```bash
tmp="$(mktemp "$NETSCRIPT_RUNTIME_CONFIG_DIR/current.XXXX")"
printf "2026-06-21.json\n" > "$tmp"
mv "$tmp" "$NETSCRIPT_RUNTIME_CONFIG_DIR/current"
```

The next watcher reload sees the previous version and calls `onChange` again.

## Failure modes

- Missing directory or missing files load as empty defaults so the process can start.
- A malformed pointed-to file is surfaced in the runtime config summary; publish that summary to
  logs or health output.
- A non-atomic edit can produce a partial read. Stage a complete version file and swap `current`.
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
