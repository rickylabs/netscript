---
layout: layouts/base.vto
title: Polyglot tasks
templateEngine: [vento, md]
prev: { label: "Typed SDK & client", href: "/capabilities/sdk/" }
next: { label: "Runtime configuration", href: "/capabilities/runtime-config/" }
---

# Polyglot tasks

A **polyglot task** runs non-TypeScript work — a Python script, a .NET program, a
shell or PowerShell script, or any executable — as a **managed subprocess** spawned by the
worker runtime. NetScript hands the task its input as command-line arguments and
environment variables, captures every line of `stdout`/`stderr`, parses a final JSON line
into a structured result, and normalizes the exit code into a `TaskResult`. It is the
escape hatch for the moments your platform is otherwise all-TypeScript: an ML model in
Python, a legacy .NET DLL, a system `pwsh` script. {{ comp.badge({ status: "alpha" }) }}

{{ comp.diagram({ src: "/assets/diagrams/polyglot-task-execution.svg", alt: "The worker runtime resolves a TaskDefinition to a runtime adapter, which builds an argv and spawns a python/node/dotnet subprocess; input flows in as args and env, the subprocess streams stdout/stderr back, and the last JSON line of stdout becomes the structured result returned to the queue and database.", caption: "A task is dispatched to a runtime adapter that spawns a subprocess. Input arrives as argv + env; the last JSON line of stdout is parsed into the result; the exit code, captured logs, and duration become a TaskResult." }) }}

## What it is

A **job** runs in-process TypeScript on a worker; a **task** runs a *subprocess* in
another runtime. Tasks share the worker plugin's queue, retry, and telemetry machinery
with [background jobs](/capabilities/background-jobs/) — the difference is purely the
execution surface. The `MultiRuntimeTaskExecutor` keeps a map of **runtime adapters**
(one per `TaskType`) and dispatches a `TaskDefinition` to the adapter that supports its
`type`. Each adapter builds an `argv` for its runtime (e.g. `python3 -u script.py …`,
`pwsh -File script.ps1 …`) and runs it through a Dax-backed process runner that streams
output and times the process out. This page covers that subprocess seam; for in-process
TS handlers, runtime modes, and the queue lifecycle, start at
[background jobs](/capabilities/background-jobs/).

{{ comp callout { type: "tip", title: "Use this when" } }}
Reach for a polyglot task when the work <strong>must</strong> run in another runtime — a
Python data/ML script, a .NET tool, an existing shell or PowerShell automation, or a
prebuilt binary — and you want it queued, retried, traced, and result-captured like any
other unit of work. If the work is plain TypeScript, use an in-process
<a href="/capabilities/background-jobs/">background job</a> instead — it avoids a process
spawn entirely.
{{ /comp }}

## Learn → / Do →

{{ comp.featureGrid({ items: [
  {
    title: "Learn — Workers track",
    body: "Tutorial Track C builds the worker plugin end to end; lesson 03 adds a polyglot task with explicit permissions.",
    href: "/tutorials/erp-sync/",
    icon: "→"
  },
  {
    title: "Do — Run a polyglot task",
    body: "Task recipe: define a python (or shell) task, wire its entrypoint and permissions, and execute it through the runtime.",
    href: "/how-to/run-a-polyglot-task/",
    icon: "◆"
  },
  {
    title: "Understand — Background jobs",
    body: "The queue, worker-runtime modes, retry, and shutdown machinery that polyglot tasks share with in-process jobs.",
    href: "/capabilities/background-jobs/",
    icon: "◎"
  }
] }) }}

## Minimal example

A task is authored with the `defineTask` typestate builder, then run through the default
multi-runtime executor. The builder's default `runtime` is `'deno'`; call `.runtime(type)`
to target another language. Input reaches the script as **argv** (`.args(...)`) and
**environment variables** (`.env({...})`); the script returns a result by writing a single
JSON object as the **last line of `stdout`**.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Define + run a python task",
    lang: "ts",
    code: "// workers/tasks/score-batch.ts\nimport { defineTask } from '@netscript/plugin-workers-core/builders';\nimport { createDefaultTaskExecutor } from '@netscript/plugin-workers-core/executor';\n\n// Build a task definition: python runtime, script entrypoint, explicit inputs.\nconst scoreBatch = defineTask('score-batch')\n  .runtime('python')\n  .entrypoint('./scripts/score.py')\n  .env({ MODEL_PATH: './models/scorer.pkl' })\n  .args('--threshold', '0.8')\n  .timeout(120_000) // ms; defaults to 300_000\n  .build();\n\n// The executor resolves the python adapter and spawns: python3 -u ./scripts/score.py --threshold 0.8\nconst executor = createDefaultTaskExecutor();\nconst result = await executor.execute(scoreBatch, {\n  onStdout: (line) => console.log('[score]', line),\n});\n\nif (result.success) {\n  // result.result is the parsed JSON object from the LAST stdout line, or null.\n  console.log('scored', result.result);\n} else {\n  console.error('task failed', result.exitCode, result.error);\n}"
  },
  {
    label: "score.py (the subprocess)",
    lang: "python",
    code: "# scripts/score.py\nimport json, os, sys\n\n# Input arrives as argv + env (NOT stdin).\nthreshold = float(sys.argv[sys.argv.index('--threshold') + 1])\nmodel_path = os.environ['MODEL_PATH']\n\n# ... do the work ...\nscored = {'kept': 42, 'dropped': 3, 'threshold': threshold}\n\n# Any prior prints become captured logs. The result is the LAST line of stdout,\n# and must be a single JSON object (not an array) to populate result.result.\nprint('scoring complete', file=sys.stderr)\nprint(json.dumps(scored))"
  }
] }) }}

{{ comp callout { type: "important", title: "How input and output cross the process boundary" } }}
Input is passed as <strong>command-line arguments</strong> (<code>args</code>) and
<strong>environment variables</strong> (<code>env</code>) — there is no JSON-over-stdin
channel. The runtime merges <code>Deno.env</code>, the task's <code>env</code>, and the
call's <code>options.env</code>, and injects <code>TRACEPARENT</code>,
<code>TRACESTATE</code>, and <code>CORRELATION_ID</code> for trace propagation. Output is
the reverse: the subprocess returns a structured value by printing <strong>one JSON object
as the final line of <code>stdout</code></strong>; the runtime parses that line into
<code>result.result</code> (a non-object or non-final-line value yields <code>null</code>).
All other lines are captured into <code>stdout</code>/<code>stderr</code> and streamed to
the <code>onStdout</code>/<code>onStderr</code>/<code>onLog</code> callbacks.
{{ /comp }}

## Key types first — TaskResult

Every task — whatever its runtime — resolves to one `TaskResult`. This is the shape your
calling code reads; check it before writing per-runtime branches.

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

`defineTask(id)` returns a typestate builder; `.build()` is only callable once an
`.entrypoint(path)` (subprocess) or `.handler(fn)` (in-process) is set. The resulting
`TaskDefinition` carries the runtime `type`, entrypoint, args, env, timeout, and
permissions. The seven supported runtimes (`TaskType`) and how each is launched:

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

The per-task permission set passed to `.permissions(...)` mirrors the Deno permission
model. **It is enforced only for the `deno` runtime** — those keys are translated into
`--allow-*` flags on the `deno run` command line. For `python`, `shell`, and the other
external runtimes there is no Deno sandbox; the subprocess inherits the OS-level access of
the worker process.

{{ comp.apiTable({
  caption: "permissions() options — applied to the deno runtime",
  rows: [
    { name: "net", type: "boolean | string[]", desc: "--allow-net (true) or --allow-net=HOSTS (array). Network access." },
    { name: "read", type: "boolean | string[]", desc: "--allow-read or --allow-read=PATHS. Filesystem read." },
    { name: "write", type: "boolean | string[]", desc: "--allow-write or --allow-write=PATHS. Filesystem write." },
    { name: "env", type: "boolean | string[]", desc: "--allow-env or --allow-env=VARS. Environment-variable access." },
    { name: "run", type: "boolean | string[]", desc: "--allow-run or --allow-run=CMDS. Subprocess spawn." },
    { name: "ffi", type: "boolean", desc: "--allow-ffi. FFI access to native libraries." },
    { name: "import", type: "string[]", desc: "--allow-import=SPECIFIERS. Allowed dynamic-import sources." }
  ]
}) }}

{{ comp callout { type: "note", title: "Omitting permissions widens the Deno sandbox" } }}
For a <code>deno</code> task, calling <code>.build()</code> <em>without</em>
<code>.permissions(...)</code> produces an <code>--allow-all</code> command line. Always
pass an explicit, least-privilege permission set for untrusted or third-party Deno task
code. Non-Deno runtimes ignore these keys entirely — gate those at the OS level instead.
{{ /comp }}

## Production notes

{{ comp callout { type: "warning", title: "The result contract is the LAST stdout line" } }}
A subprocess returns structured data <strong>only</strong> by printing a single JSON
<em>object</em> as its final <code>stdout</code> line. A trailing log line, a pretty-print,
a JSON <em>array</em>, or a stray newline after the payload all cause
<code>result.result</code> to be <code>null</code> even though the task
<code>succeeded</code>. Print diagnostics to <code>stderr</code>, and emit the JSON result
last with no trailing output. Buffering can also reorder this — for Python the runtime runs
<code>python3 -u</code> (unbuffered) for exactly this reason; flush your own output in other
runtimes.
{{ /comp }}

{{ comp callout { type: "important", title: "Runtimes must exist on the host; exit codes are diagnostic" } }}
Each non-Deno runtime requires its toolchain on the <strong>worker host</strong>: a Python
interpreter (or a configured venv), the .NET SDK, <code>pwsh</code>/<code>powershell</code>,
or <code>bash</code>. A missing interpreter surfaces as a failed task — exit code
<code>127</code> is reported as <em>command not found</em> and <code>126</code> as
<em>command not executable</em>. <code>cmd</code> and <code>powershell.exe</code> are
Windows-only; <code>shell</code> uses bash and resolves Git Bash utility paths on Windows.
A task that exceeds its <code>timeout</code> resolves with status <code>timeout</code> and
exit code <code>-1</code>; passing an already-aborted <code>signal</code> yields
<code>cancelled</code>.
{{ /comp }}

{{ comp callout { type: "note", title: "Tasks run external code — treat them as a trust boundary" } }}
Polyglot tasks spawn arbitrary processes with the worker's OS privileges. Pin entrypoints
to known scripts, prefer a pinned interpreter / venv (<code>pythonConfig.venvPath</code>)
over <code>$PATH</code> discovery, and avoid interpolating untrusted input into
<code>args</code> or the entrypoint path. Trace context
(<code>TRACEPARENT</code>/<code>CORRELATION_ID</code>) is injected into the subprocess
environment so cross-runtime spans stitch together in telemetry.
{{ /comp }}

## Reference →

The full generated API — `defineTask`, `MultiRuntimeTaskExecutor`,
`createDefaultTaskExecutor`, every runtime adapter, and the executor option types — lives
in the workers reference.

{{ comp.xref({ key: "ref:workers" }) }}

{{ comp.featureGrid({ items: [
  {
    title: "Look up — Workers reference",
    body: "defineTask, the multi-runtime executor, runtime adapters, TaskDefinition / TaskResult / TaskExecutionOptions, and permission types.",
    href: "/reference/workers/",
    icon: "≡"
  },
  {
    title: "Do — Run a polyglot task",
    body: "Step-by-step recipe for a python and a shell task with explicit permissions and result capture.",
    href: "/how-to/run-a-polyglot-task/",
    icon: "◆"
  },
  {
    title: "Understand — Background jobs",
    body: "The queue, worker-runtime modes, retry, and graceful-shutdown drain shared with in-process jobs.",
    href: "/capabilities/background-jobs/",
    icon: "◎"
  },
  {
    title: "Next — Runtime configuration",
    body: "How worker, service, and adapter settings resolve from schema defaults, config files, env vars, and overrides.",
    href: "/capabilities/runtime-config/",
    icon: "→"
  }
] }) }}

{{ comp.nextPrev({ prev: { label: "Typed SDK & client", href: "/capabilities/sdk/" }, next: { label: "Runtime configuration", href: "/capabilities/runtime-config/" } }) }}
