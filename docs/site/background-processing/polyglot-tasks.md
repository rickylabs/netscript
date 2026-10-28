---
layout: layouts/base.vto
title: Polyglot tasks
templateEngine: [vento, md]
prev: { label: "Typed SDK & client", href: "/services-sdk/sdk/" }
next: { label: "Runtime configuration", href: "/orchestration-runtime/runtime-config/" }
order: 2
---

# Polyglot tasks

This page explains how a polyglot task runs a non-TypeScript script on the worker runtime, how input
and output cross the process boundary, and what to check before you ship one.
{{ comp.badge({ status: "alpha" }) }}

A **polyglot task** runs a Python script, a .NET program, a shell or PowerShell script, or any
executable as a subprocess managed by the worker runtime. You declare it with `defineTask`; the
script itself does not change. NetScript passes input as arguments, environment variables or a
bounded stdin payload, captures `stdout` and `stderr`, parses a final JSON line into a structured
result and normalizes the exit code into a `TaskResult`.

{{ comp.diagram({ src: "/assets/diagrams/polyglot-task-execution.svg", alt: "The worker runtime resolves a TaskDefinition to a runtime adapter, which builds an argv and spawns a python/node/dotnet subprocess; input flows in as args, env, or bounded stdin, the subprocess streams stdout/stderr back, and the last JSON line of stdout becomes the structured result returned to the queue and database.", caption: "A task is dispatched to a runtime adapter that spawns a subprocess. Input arrives as argv, env, or bounded stdin; the last JSON line of stdout is parsed into the result; the exit code, captured logs, and duration become a TaskResult." }) }}

Use a task when the work must run in another runtime and you want it queued, retried, traced and
result-captured like any other step. Plain TypeScript work belongs in an in-process
[background job](/background-processing/workers/), which avoids the process spawn. The
[ERP Sync tutorial](/tutorials/erp-sync/03-polyglot-transform/) runs a Python legacy-data transform
inside a TypeScript import flow; trace context reaches the subprocess, so the Python span joins the
same trace.

## How a task runs

A job runs TypeScript in-process; a task runs a subprocess in another runtime. Both use the worker
plugin's queue, retry and telemetry. The `MultiRuntimeTaskExecutor` holds one **runtime adapter**
per `TaskType` and dispatches each `TaskDefinition` to the adapter that supports its `type`. The
adapter builds an `argv` for its runtime, such as `python3 -u script.py …` or
`pwsh -File script.ps1 …`, and runs it through a process runner built on `Deno.Command` that streams
output and enforces the timeout.

## Minimal example

Build a task with the `defineTask` builder and run it through the default multi-runtime executor.
The builder's default `runtime` is `'deno'`; call `.runtime(type)` for another language. The script
returns its result by writing one JSON object as the last line of `stdout`.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Define + run a python task",
    lang: "ts",
    code: "// workers/tasks/score-batch.ts\nimport { defineTask } from '@netscript/plugin-workers-core/builders';\nimport { createDefaultTaskExecutor } from '@netscript/plugin-workers-core/executor';\n\n// Build a task definition: python runtime, script entrypoint, explicit inputs.\nconst scoreBatch = defineTask('score-batch')\n  .runtime('python')\n  .entrypoint('./scripts/score.py')\n  .env({ MODEL_PATH: './models/scorer.pkl' })\n  .args('--threshold', '0.8')\n  .timeout(120_000) // ms; defaults to 300_000\n  .build();\n\n// The executor resolves the python adapter and spawns: python3 -u ./scripts/score.py --threshold 0.8\nconst executor = createDefaultTaskExecutor();\nconst result = await executor.execute(scoreBatch, {\n  onStdout: (line) => console.log('[score]', line),\n});\n\nif (result.success) {\n  // result.result is the parsed JSON object from the LAST stdout line, or null.\n  console.log('scored', result.result);\n} else {\n  console.error('task failed', result.exitCode, result.error);\n}"
  },
  {
    label: "score.py (the subprocess)",
    lang: "python",
    code: "# scripts/score.py\nimport json, os, sys\n\n# Input arrives as argv + env in this example.\nthreshold = float(sys.argv[sys.argv.index('--threshold') + 1])\nmodel_path = os.environ['MODEL_PATH']\n\n# ... do the work ...\nscored = {'kept': 42, 'dropped': 3, 'threshold': threshold}\n\n# Any prior prints become captured logs. The result is the LAST line of stdout,\n# and must be a single JSON object (not an array) to populate result.result.\nprint('scoring complete', file=sys.stderr)\nprint(json.dumps(scored))"
  }
] }) }}

## Input and output

Input reaches the subprocess as command-line arguments (`.args(...)`), environment variables
(`.env({...})`) or a bounded stdin payload (`.stdin(bytesOrJson)` or `options.stdin`). The runtime
merges `Deno.env`, the task's `env` and the call's `options.env`, in rising order of precedence.
It then sets `TRACEPARENT`,
`TRACESTATE` and `CORRELATION_ID` from `options.traceparent`, `options.tracestate` and
`options.correlationId`, each only when supplied.

When the worker runs a task from its task queue, or runs a non-Deno job, it supplies those trace
options itself. `CORRELATION_ID` is the message's `correlationId`. `TRACEPARENT` and `TRACESTATE`
come from the active span, so the subprocess continues the worker's trace; with no active span they
fall back to the message's `traceparent` and `tracestate`. A direct `executor.execute()` call gets
only the options you pass.

Output works in reverse. The runtime parses the last line of `stdout` into `result.result` when it
is one JSON object; otherwise `result.result` is `null`. Every other line is captured into `stdout`
or `stderr` and streamed to the `onStdout`, `onStderr` and `onLog` callbacks.

> [!WARNING]
> A trailing log line, a pretty-printed payload, a JSON array or a stray newline after the payload
> makes `result.result` `null` even though the task succeeded. Print diagnostics to `stderr` and emit
> the JSON object last. The runtime runs `python3 -u` (unbuffered) for this reason; flush your own
> output in other runtimes.

## `TaskResult`

Every task, whatever its runtime, resolves to one `TaskResult`. Read this shape before writing
per-runtime branches.

{{ comp.apiTable({
  caption: "TaskResult — returned by executor.execute()",
  rows: [
    { name: "taskId", type: "string", desc: "The TaskDefinition.id this result belongs to." },
    { name: "status", type: "string", desc: "Lifecycle status: 'completed' | 'failed' | 'timeout' | 'cancelled' (running/pending used in-flight)." },
    { name: "success", type: "boolean", desc: "True only when status is 'completed' (exit code 0). Branch on this." },
    { name: "exitCode", type: "number", desc: "Subprocess exit code; -1 when the process never started (spawn error, cancelled, timeout)." },
    { name: "stdout", type: "string", desc: "All captured stdout lines, joined by newlines." },
    { name: "stderr", type: "string", desc: "All captured stderr lines (and the error message on a spawn failure)." },
    { name: "result", type: "Record<string, unknown> | null", desc: "The JSON object parsed from the LAST line of stdout, or null if that line is not a JSON object." },
    { name: "error", type: "string | null", desc: "Human-readable failure message (includes exit code and first stderr line); null on success." },
    { name: "duration", type: "number", desc: "Wall-clock execution time in milliseconds." },
    { name: "startedAt / completedAt", type: "string", desc: "ISO-8601 timestamps bracketing the run." },
    { name: "attempt", type: "number", desc: "Attempt index for this execution (0 from the executor itself)." }
  ]
}) }}

## TaskDefinition & runtimes

`defineTask(id)` returns a typestate builder. `.build()` becomes callable once you set
`.entrypoint(path)` for a subprocess or `.handler(fn)` for in-process work. The resulting
`TaskDefinition` carries the runtime `type`, entrypoint, args, env, timeout and permissions.
`TaskType` has seven built-in runtimes:

{{ comp.apiTable({
  caption: "TaskType — built-in runtime adapters",
  rows: [
    { name: "deno", type: "default", desc: "Spawns `deno run` with permission flags built from .permissions(...). The only runtime that is sandboxed by per-task Deno permissions." },
    { name: "python", type: "subprocess", desc: "Spawns `python3 -u <entrypoint>` (or `py` on Windows); honors metadata.pythonConfig.venvPath / pythonPath and NETSCRIPT_PYTHON_PATH." },
    { name: "dotnet", type: "subprocess", desc: "Runs a .cs via `dotnet run`, a project via `dotnet run --project`, or a built executable directly; metadata.dotnetConfig.runtimeArgs/useDotnetRun." },
    { name: "shell", type: "subprocess", desc: "Runs the entrypoint under bash (metadata.shellConfig.shell / loginShell); resolves Git Bash util paths on Windows." },
    { name: "powershell", type: "subprocess", desc: "Spawns `powershell` (Windows) or `pwsh` with -NoProfile -NonInteractive -ExecutionPolicy Bypass -File." },
    { name: "cmd", type: "subprocess", desc: "Spawns `cmd.exe /c <entrypoint>` (Windows)." },
    { name: "executable", type: "subprocess", desc: "Runs the entrypoint directly as a prebuilt binary with the task's args." }
  ]
}) }}

`.permissions(...)` applies to the `deno` runtime only: its keys become `--allow-*` flags on the
`deno run` command line. Python, shell and the other external runtimes have no Deno sandbox and
inherit the worker process's OS access.
[Restrict worker task permissions](/background-processing/how-to/restrict-worker-task-permissions/)
lists every key, the flag it emits and the built-in presets.

> [!CAUTION]
> A `deno` task built without `.permissions(...)` runs with `--allow-all`. Pass an explicit,
> least-privilege set for untrusted or third-party Deno task code, and gate non-Deno runtimes at the
> OS level.

## Send private input on stdin

Use `.stdin(bytesOrJson)` for a fixed task payload or `options.stdin` for input supplied at
execution time; the execution option replaces the builder payload. JSON is encoded as UTF-8, and
`Uint8Array` values are sent unchanged. The runner writes the payload with backpressure and closes
stdin, so the script can read to EOF. Without input, the subprocess gets a null stdin and never
inherits input from the worker host.

```ts
import { defineTask } from '@netscript/plugin-workers-core/builders';
import { createDefaultTaskExecutor } from '@netscript/plugin-workers-core/executor';

const task = defineTask('private-input')
  .runtime('python')
  .entrypoint('./scripts/private-input.py')
  .stdin({ uid: 'service-operator', roots: ['workspace-root'] })
  .build();
const executor = createDefaultTaskExecutor();
const result = await executor.execute(task, {
  stdin: { uid: 'another-operator', roots: ['another-root'] },
  stdoutLimitBytes: 65_536,
  stderrLimitBytes: 65_536,
});
console.log(result.success);
```

```python
# scripts/private-input.py
import json, sys

payload = json.load(sys.stdin)
# Use private input without putting it in argv, env, or diagnostics.
print(json.dumps({'accepted': len(payload['roots'])}))
```

Stdin is capped at **1 MiB of encoded bytes**, including JSON punctuation and escaping. The builder
validates and snapshots its input when you call `.stdin()`; each `.build()` gets its own byte
buffer, which the adapter passes directly to the runner. Execution input is validated before the
spawn.

| Error | Cause |
| --- | --- |
| `StdinPayloadTooLarge` | The encoded payload exceeds 1 MiB. |
| `InvalidStdinPayload` | The JSON holds a cycle, an accessor or an unsupported value. JSON accepts finite numbers, strings, booleans, null, arrays and plain objects, nested at most 64 levels deep. |
| `StdinWriteFailed` | The subprocess closed stdin before accepting the payload. |
| `MissingStdinPayload` | An explicitly supplied payload is `undefined`. |

Builder `.stdin()` applies only to direct executor calls. KV task registration validates through a
schema that strips this runtime field, and queue dispatch does not carry it, so in a worker supply
private per-execution input in `options.stdin`. Stdin is not a CLI flag.

> [!CAUTION]
> Scripts control their own `stdout` and `stderr`. Never print the private payload.

## Output capture and limits

By default, `stdout` and `stderr` each keep only their **last 1 MiB** while the runner continues to
read and stream all output. A healthy task can print more than 1 MiB, and a final JSON object that
fits in the retained tail stays available. Lines longer than 1 MiB of characters reach the log
callbacks in bounded fragments.

To cap total output, set positive integer `stdoutLimitBytes` and `stderrLimitBytes` execution
options, or pass them to `new ExecutableRuntimeAdapter({ stdoutLimitBytes, stderrLimitBytes })`.
Exceeding an explicit cap terminates the process tree and returns `status: 'failed'`,
`success: false` and `StdoutLimitExceeded` or `StderrLimitExceeded`. Explicit caps also apply with
`streamLogs: false`.

Runtime validation and write errors return failed task results; builder validation throws before the
task is built. A running abort returns `cancelled` and a timeout returns `timeout`, both with exit
code `-1`. Subprocesses stay in the worker's process group, so terminal and supervisor signals also
reach active tasks.

## Production notes

- Each non-Deno runtime needs its toolchain on the **worker host**: a Python interpreter or a
  configured venv, the .NET SDK, `pwsh`/`powershell`, or `bash`. `cmd` and `powershell.exe` are
  Windows-only; `shell` uses bash and resolves Git Bash utility paths on Windows.
- A missing interpreter fails the task. Exit code `127` is reported as *command not found* and
  `126` as *command not executable*.
- A task that exceeds its `timeout` resolves with status `timeout` and exit code `-1`. Passing an
  already-aborted `signal` yields `cancelled`.

> [!CAUTION]
> **Tasks run external code with the worker's OS privileges.** Pin entrypoints to known scripts,
> prefer a pinned interpreter or venv (`pythonConfig.venvPath`) over `$PATH` discovery, and avoid
> interpolating untrusted input into `args` or the entrypoint path.

## Next steps

Define, run and sandbox a task step by step in
[Run a polyglot task](/background-processing/how-to/run-a-polyglot-task/).

- [ERP Sync, lesson 03](/tutorials/erp-sync/03-polyglot-transform/): a polyglot step inside a
  running app.
- [Background jobs](/background-processing/workers/): the queue, retry and shutdown machinery tasks
  share.
- {{ comp.xref({ key: "ref:workers", text: "workers reference" }) }}: `defineTask`, the executor,
  runtime adapters and option types.

{{ comp.nextPrev({ prev: { label: "Typed SDK & client", href: "/services-sdk/sdk/" }, next: { label: "Runtime configuration", href: "/orchestration-runtime/runtime-config/" } }) }}
