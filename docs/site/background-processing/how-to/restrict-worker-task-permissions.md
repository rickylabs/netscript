---
layout: layouts/base.vto
title: Restrict worker task permissions
description: Give every Deno task explicit permissions, because an omitted permission object compiles to allow-all.
templateEngine: [vento, md]
order: 104
oldUrl: /how-to/restrict-worker-task-permissions/
---

# Restrict worker task permissions

This recipe gives every Deno worker task the narrowest permission set it needs. Deno tasks are the
only worker runtime path that receives Deno permission flags, and an omitted permission object
compiles to `--allow-all`.

## Prerequisites

- A `deno` task definition.
- The hosts, files, environment variables and subprocesses the task actually needs.
- A production review step that rejects omitted permissions.

## Step 1 — Start from a restrictive preset

The public `permissions` constant exposes the presets `minimal`, `none`, `network`, `filesystem`,
`readOnly`, `subprocess`, `full` and `allAccess`. Spread one and narrow each field to an allowlist:

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

## Step 2 — Check the emitted flags

The Deno adapter helper `buildDenoPermissionFlags(permissions?)` turns each field into a flag:

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

The helper emits no flag for `false` or an empty allowlist. Deny by leaving a field `false` or
empty, not by passing a broad `true`.

> [!CAUTION]
> Only the `deno` task adapter turns `permissions` into `--allow-*` flags. Python, .NET, shell,
> PowerShell, cmd, executable and custom task adapters inherit the worker process's OS permissions
> unless the adapter adds its own sandbox.

## Troubleshooting

- **The task can reach everything:** its permission object is omitted, so the Deno adapter emits
  `--allow-all`.
- **The task fails with a Deno permission error:** a required grant is missing from the allowlist.
- **The task spawns commands it should not:** `run` is too broad; use a command allowlist.
- **`.permissions()` has no effect:** the task uses a non-Deno runtime, which it does not sandbox.

## Production notes

Before you ship, check that:

- every `deno` task has `.permissions(...)` or a declarative `permissions` object;
- `net`, `read`, `write`, `env` and `run` use allowlists instead of `true` where possible;
- no task ships with `permissions.allAccess` unless it is explicitly accepted for that task;
- non-Deno tasks are reviewed as OS-permission workloads, not Deno-sandboxed ones;
- timeout and retry settings are explicit for high-impact tasks.

## Next steps

Set timeouts, retries and concurrency next in
[Tune the worker runtime](/background-processing/how-to/tune-worker-runtime/).

- [Add a task runtime adapter](/background-processing/how-to/add-a-task-runtime-adapter/): add a
  runtime with its own sandbox.
- [workers reference](/reference/workers/): worker symbols and types.

{{ comp.nextPrev({
  prev: { label: "Publish a durable stream", href: "/durable-workflows/how-to/publish-a-durable-stream/" },
  next: { label: "How-to guides", href: "/how-to/" }
}) }}
