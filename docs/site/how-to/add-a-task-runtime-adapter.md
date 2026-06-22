---
layout: layouts/base.vto
title: Add a task runtime adapter
templateEngine: [vento, md]
prev: { label: "Roll out runtime overrides", href: "/how-to/roll-out-runtime-overrides/" }
next: { label: "Build a server-validated form", href: "/how-to/build-a-server-validated-form/" }
---

# Add a task runtime adapter

`createDefaultTaskExecutor({ adapters, customAdapters })` lets you keep the built-in task executor
while adding a controlled runtime adapter. Use this when a task must run through a host runtime that
NetScript does not ship by default.

## Prerequisites

- A `TaskRuntimeAdapterLike` implementation.
- A task `type` string reserved for your adapter.
- A clear sandbox story for the external runtime.
- A test task that exercises stdout, stderr, timeout, and failure.

## Start from the real adapter contract

The executor consumes `TaskRuntimeAdapterLike`: `id`, `runtime`, `supports(task)`, and
`execute(task, options)`.

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

## Register the adapter

Use `customAdapters` when your task type is not one of the built-in `TaskType` values. The default
adapter map still covers `deno`, `python`, `dotnet`, `shell`, `powershell`, `cmd`, and
`executable`.

```ts
import { createDefaultTaskExecutor } from '@netscript/plugin-workers-core/executor';
import { nodeAdapter } from './node-adapter.ts';

const executor = createDefaultTaskExecutor({
  customAdapters: {
    node: nodeAdapter,
  },
  defaults: {
    cwd: Deno.cwd(),
    timeout: 300_000,
  },
});

const result = await executor.execute(
  {
    id: 'render-invoice',
    type: 'node',
    entrypoint: './tasks/render-invoice.mjs',
    args: ['--invoice', 'inv_123'],
  },
  {
    correlationId: 'invoice.inv_123',
    onStdout: (line) => console.log(line),
    onStderr: (line) => console.error(line),
  },
);

if (!result.success) {
  throw new Error(result.error ?? 'task failed');
}
```

## Failure modes

- `supports(task)` returns `false`: the executor returns a failed `TaskResult` for unsupported
  runtimes.
- The host binary is missing: return a failed `TaskResult` with stderr or an error message.
- Timeout handling is adapter-owned. Respect `options.timeout` and `options.signal` in your adapter.
- Permission sandboxing is Deno-specific. Python, .NET, shell, PowerShell, cmd, executable, and
  custom adapters inherit the worker process OS permissions unless your adapter adds its own
  sandbox.
<!-- caveat: arch-debt:workers-non-deno-task-sandbox-boundary -->

## Next steps

- Restrict Deno task permissions with [Restrict worker task permissions](/how-to/restrict-worker-task-permissions/).
- See built-in runtime behavior in [Run a polyglot task](/how-to/run-a-polyglot-task/).
- Look up the executor surface in [workers reference](/reference/workers/).

{{ comp.nextPrev({
  prev: { label: "Roll out runtime overrides", href: "/how-to/roll-out-runtime-overrides/" },
  next: { label: "Build a server-validated form", href: "/how-to/build-a-server-validated-form/" }
}) }}
