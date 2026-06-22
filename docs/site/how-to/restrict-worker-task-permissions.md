---
layout: layouts/base.vto
title: Restrict worker task permissions
templateEngine: [vento, md]
prev: { label: "Publish a durable stream", href: "/how-to/publish-a-durable-stream/" }
next: { label: "How-to guides", href: "/how-to/" }
---

# Restrict worker task permissions

Deno tasks are the worker runtime path that can receive Deno permission flags. Use `.permissions()`
or `permissions` presets for every Deno task you ship; an omitted permission object compiles to
`--allow-all`.

## Prerequisites

- A `deno` task definition.
- A list of hosts, files, env vars, and subprocesses the task actually needs.
- A production review step that rejects omitted permissions.

## Start from a restrictive preset

The public `permissions` constant exposes `minimal`, `none`, `network`, `filesystem`, `readOnly`,
`subprocess`, `full`, and `allAccess`.

```ts
import { defineTask, permissions } from '@netscript/plugin-workers-core';

export default defineTask('charge-customer')
  .runtime('deno')
  .entrypoint('./charge-customer.ts')
  .permissions({
    ...permissions.network,
    net: ['api.stripe.com'],
    read: ['./config'],
    env: ['STRIPE_KEY'],
  })
  .build();
```

## Know the emitted flags

The Deno adapter helper `buildDenoPermissionFlags(permissions?)` emits these flags:

| Permission field | Example value | Emitted flag |
| --- | --- | --- |
| omitted object | `undefined` | `--allow-all` |
| `net` | `true` | `--allow-net` |
| `net` | `['api.stripe.com']` | `--allow-net=api.stripe.com` |
| `read` | `['./config']` | `--allow-read=./config` |
| `write` | `['./out']` | `--allow-write=./out` |
| `env` | `['STRIPE_KEY']` | `--allow-env=STRIPE_KEY` |
| `run` | `['git']` | `--allow-run=git` |
| `ffi` | `true` | `--allow-ffi` |
| `import` | `['jsr.io']` | `--allow-import=jsr.io` |

The helper does not emit a flag for `false` or an empty allowlist. Deny by leaving the field false
or empty, not by passing a broad `true`.

## Runtime boundary

Only the `deno` task adapter converts `permissions` into Deno `--allow-*` flags. Python, .NET,
shell, PowerShell, cmd, executable, and custom task adapters inherit the worker process OS
permissions unless the adapter adds its own sandbox.

## Production checklist

- [ ] Every `deno` task has `.permissions(...)` or a declarative `permissions` object.
- [ ] `net`, `read`, `write`, `env`, and `run` use allowlists instead of `true` where possible.
- [ ] No task ships with `permissions.allAccess` unless it is explicitly accepted for that task.
- [ ] Non-Deno tasks are reviewed as OS-permission workloads, not Deno-sandboxed workloads.
- [ ] Timeout and retry settings are explicit for high-impact tasks.

## Failure modes

- Omitted permissions: the Deno adapter emits `--allow-all`.
- Missing required grant: the task fails at runtime with a Deno permission error.
- Overbroad `run`: the task can spawn any allowed command; prefer a command allowlist.
- Non-Deno runtime: `.permissions()` does not sandbox it.

## Next steps

- Tune process isolation with [Tune the worker runtime](/how-to/tune-worker-runtime/).
- Add a custom adapter with [Add a task runtime adapter](/how-to/add-a-task-runtime-adapter/).
- Look up worker symbols in [workers reference](/reference/workers/).

{{ comp.nextPrev({
  prev: { label: "Publish a durable stream", href: "/how-to/publish-a-durable-stream/" },
  next: { label: "How-to guides", href: "/how-to/" }
}) }}
