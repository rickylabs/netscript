---
layout: layouts/base.vto
title: Add a task runtime adapter
description: Add a custom runtime adapter to the built-in task executor.
templateEngine: [vento, md]
order: 103
oldUrl: /how-to/add-a-task-runtime-adapter/
---

# Add a task runtime adapter

This recipe adds a runtime adapter to the built-in task executor, so a task can run through a host
runtime that NetScript does not ship. `createDefaultTaskExecutor({ adapters, customAdapters })` keeps
the built-in adapters and adds yours.

## Prerequisites

- A `TaskRuntimeAdapterLike` implementation.
- A task `type` string reserved for your adapter.
- A clear sandbox story for the external runtime.
- A test task that exercises stdout, stderr, timeout and failure.

## Step 1 — Implement the adapter contract

The executor consumes `TaskRuntimeAdapterLike`: `id`, `runtime`, `supports(task)` and
`execute(task, options)`. This adapter runs `node` tasks; save it as `node-adapter.ts`.

```ts
import type {
  ResolvedTaskExecutionOptions,
  TaskDefinition,
  TaskResult,
  TaskRuntimeAdapterLike,
} from '@netscript/plugin-workers-core/executor';

export const nodeAdapter: TaskRuntimeAdapterLike = {
  id: 'node-runtime-adapter',
  runtime: null,

  supports(task: TaskDefinition): boolean {
    return task.type === 'node';
  },

  async execute(
    task: TaskDefinition,
    options: ResolvedTaskExecutionOptions,
  ): Promise<TaskResult> {
    const startedAt = new Date().toISOString();
    const started = performance.now();
    const command = new Deno.Command('node', {
      args: [task.entrypoint ?? '', ...(options.args ?? [])],
      cwd: options.cwd || undefined,
      env: options.env,
      stdout: 'piped',
      stderr: 'piped',
      signal: options.signal,
    });

    const output = await command.output();
    const duration = Math.round(performance.now() - started);
    const stdout = new TextDecoder().decode(output.stdout);
    const stderr = new TextDecoder().decode(output.stderr);

    options.onStdout?.(stdout);
    options.onStderr?.(stderr);

    return {
      taskId: task.id,
      status: output.success ? 'completed' : 'failed',
      exitCode: output.code,
      stdout,
      stderr,
      duration,
      success: output.success,
      error: output.success ? null : stderr || `node exited ${output.code}`,
      result: null,
      startedAt,
      completedAt: new Date().toISOString(),
      attempt: 1,
    };
  },
};
```

## Step 2 — Register the adapter

Pass the adapter in `customAdapters` when your task `type` is not one of the built-in `TaskType`
values. The default adapter map still covers `deno`, `python`, `dotnet`, `shell`, `powershell`,
`cmd` and `executable`. This file registers the adapter and executes one task:

```ts
// run-invoice.ts — register the adapter and execute one task
import { createDefaultTaskExecutor } from '@netscript/plugin-workers-core/executor';
import { nodeAdapter } from './node-adapter.ts';

const executor = createDefaultTaskExecutor({
  customAdapters: { node: nodeAdapter },
  defaults: { cwd: Deno.cwd(), timeout: 300_000 },
});

const result = await executor.execute(
  {
    id: 'render-invoice',
    type: 'node',
    entrypoint: './tasks/render-invoice.mjs',
    args: ['--invoice', 'inv_123'],
  },
  { correlationId: 'invoice.inv_123', onStdout: (line) => console.log(line) },
);

if (!result.success) throw new Error(result.error ?? 'task failed');
console.log('status', result.status, 'exit', result.exitCode);
```

## Step 3 — Add a test task

The adapter spawns this Node task:

```js
// tasks/render-invoice.mjs — the external Node task the adapter spawns
const idx = process.argv.indexOf('--invoice');
const invoice = idx >= 0 ? process.argv[idx + 1] : 'unknown';
console.log(`rendered ${invoice}`);
```

## Step 4 — Run it end to end

Run the script from the workspace root:

```bash
# From the workspace root. --allow-run=node lets the adapter spawn the Node
# binary; --allow-read lets it read the task file. Node must be on PATH.
deno run --allow-run=node --allow-read run-invoice.ts
#   rendered inv_123
#   status completed exit 0
```

`supports(task)` matches `task.type === 'node'`, so the executor routes `render-invoice` to your
adapter. The adapter spawns `node ./tasks/render-invoice.mjs --invoice inv_123`, streams stdout
through `onStdout` and returns a `TaskResult` with `status: 'completed'` and `exitCode: 0`.

## Troubleshooting

- **The executor returns a failed `TaskResult` for an unsupported runtime:** `supports(task)`
  returned `false` for the task's `type`.
- **The host binary is missing:** return a failed `TaskResult` with stderr or an error message.
- **A task never times out:** timeout handling is adapter-owned. Respect `options.timeout` and
  `options.signal` in your adapter.

## Production notes

> [!CAUTION]
> **Custom adapters are not sandboxed.** NetScript maps `.permissions(...)` to Deno `--allow-*`
> flags only for Deno tasks (`runtime("deno")`). Python, .NET, shell, PowerShell, cmd, executable and
> custom subprocess adapters run with the full OS permissions of the host worker process, because
> OS-level sandboxing of arbitrary binaries is outside the runtime's scope. To run untrusted code,
> sandbox it in the adapter (for example with container isolation or a restricted OS user) or
> configure OS-level process restrictions.

<!-- caveat: arch-debt:workers-non-deno-task-sandbox-boundary -->

## Next steps

Lock down Deno tasks with
[Restrict worker task permissions](/background-processing/how-to/restrict-worker-task-permissions/).

- [Run a polyglot task](/background-processing/how-to/run-a-polyglot-task/): built-in runtime
  behavior.
- [workers reference](/reference/workers/): the executor surface.
