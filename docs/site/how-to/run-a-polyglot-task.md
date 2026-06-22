---
layout: layouts/base.vto
title: Run a polyglot task
templateEngine: [vento, md]
prev: { label: "Tune the worker runtime", href: "/how-to/tune-worker-runtime/" }
next: { label: "Graceful shutdown", href: "/how-to/graceful-shutdown/" }
---

# Run a polyglot task

Define a non-TypeScript script — a Python program, a shell script, a .NET tool, or any
executable — as a NetScript task, give it a permission sandbox, and run it through the
multi-runtime executor with its `stdout`/`stderr` captured and its result parsed.
{{ comp.badge({ status: "alpha" }) }}

This is the task-focused **DO** companion to the [polyglot tasks](/capabilities/polyglot-tasks/)
hub — read that first for the WHY (what a task is, how the subprocess seam works, the full
`TaskResult` shape). This page wires one up.

## Prerequisites

{{ comp.apiTable({
  caption: "What you need before defining a task",
  rows: [
    { name: "@netscript/plugin-workers-core", type: "package (alpha)", desc: "Provides defineTask (./builders) and createDefaultTaskExecutor (./executor)." },
    { name: "The target toolchain", type: "host binary", desc: "The interpreter the task spawns must exist on the worker HOST: python3 (or a venv / py on Windows), bash, pwsh/powershell, the .NET SDK, or your prebuilt binary." },
    { name: "An entrypoint script", type: "file path", desc: "The script or executable to run, e.g. ./scripts/score.py. The task passes it input as argv + env, never stdin." },
    { name: "(deno tasks only) a permission set", type: "BuilderPermissions", desc: "net/read/write/env/run/ffi/import. Enforced ONLY for the deno runtime — see the sandbox note below." }
  ]
}) }}

## Steps

### 1. Define the task

`defineTask(id)` returns a typestate builder; the default `runtime` is `'deno'`, so call
`.runtime(type)` to target another language. Input reaches the script as **argv**
(`.args(...)`) and **environment variables** (`.env({...})`). `.build()` is only callable
once an `.entrypoint(path)` (subprocess) or `.handler(fn)` (in-process) has been set.

{{ comp.tabbedCode({ tabs: [
  {
    label: "Python task",
    lang: "ts",
    code: "// workers/tasks/score-batch.ts\nimport { defineTask } from '@netscript/plugin-workers-core/builders';\n\n// python runtime, script entrypoint, explicit inputs.\nexport const scoreBatch = defineTask('score-batch')\n  .runtime('python')\n  .entrypoint('./scripts/score.py')\n  .env({ MODEL_PATH: './models/scorer.pkl' })\n  .args('--threshold', '0.8')\n  .timeout(120_000) // ms; defaults to 300_000\n  .build();\n\n// Spawns: python3 -u ./scripts/score.py --threshold 0.8"
  },
  {
    label: "Shell task",
    lang: "ts",
    code: "// workers/tasks/rotate-logs.ts\nimport { defineTask } from '@netscript/plugin-workers-core/builders';\n\n// shell runtime runs the entrypoint under bash (no -c).\nexport const rotateLogs = defineTask('rotate-logs')\n  .runtime('shell')\n  .entrypoint('./scripts/rotate-logs.sh')\n  .args('--keep', '7')\n  .timeout(30_000)\n  .build();\n\n// Spawns: bash ./scripts/rotate-logs.sh --keep 7"
  },
  {
    label: "Pin a Python interpreter",
    lang: "ts",
    code: "// workers/tasks/score-batch.ts — prefer a pinned venv over $PATH discovery\nimport { defineTask } from '@netscript/plugin-workers-core/builders';\n\nexport const scoreBatch = defineTask('score-batch')\n  .runtime('python')\n  .entrypoint('./scripts/score.py')\n  // Resolution order: pythonConfig.pythonPath -> venvPath -> NETSCRIPT_PYTHON_PATH -> python3/py\n  .metadata({ pythonConfig: { venvPath: './.venv' } })\n  .build();"
  }
] }) }}

### 2. Write the script so its result crosses the process boundary

The subprocess returns structured data by printing **one JSON object as the last line of
`stdout`**. Everything else on `stdout`/`stderr` is captured as logs. Print diagnostics to
`stderr`; emit the JSON result last, with no trailing output.

{{ comp.tabbedCode({ tabs: [
  {
    label: "score.py",
    lang: "python",
    code: "# scripts/score.py\nimport json, os, sys\n\n# Input arrives as argv + env (NOT stdin).\nthreshold = float(sys.argv[sys.argv.index('--threshold') + 1])\nmodel_path = os.environ['MODEL_PATH']\n\n# ... do the work ...\nscored = {'kept': 42, 'dropped': 3, 'threshold': threshold}\n\n# Diagnostics go to stderr; the result is the LAST stdout line and must be a\n# single JSON OBJECT (not an array) to populate result.result.\nprint('scoring complete', file=sys.stderr)\nprint(json.dumps(scored))"
  },
  {
    label: "rotate-logs.sh",
    lang: "bash",
    code: "#!/usr/bin/env bash\n# scripts/rotate-logs.sh\nset -euo pipefail\n\nkeep=\"${2:-7}\"\n# ... rotate ...\necho \"rotated logs, keeping ${keep}\" >&2   # diagnostics -> stderr\n\n# Last stdout line = JSON object result. Non-python runtimes are not -u'd, so\n# flush by emitting the JSON as the final write with nothing after it.\nprintf '{\"rotated\": true, \"kept\": %s}\\n' \"$keep\""
  }
] }) }}

### 3. Run it through the executor

`createDefaultTaskExecutor()` builds a `MultiRuntimeTaskExecutor` wired with every built-in
runtime adapter. Call `executor.execute(task, options?)` to resolve the matching adapter,
spawn the subprocess, and get back one `TaskResult`. Per-call `options` (a
`TaskExecutionOptions`) can add `args`, `env`, a `timeout`, an `AbortSignal`, a
`correlationId`, and the `onStdout`/`onStderr`/`onLog` streaming callbacks.

```ts
// workers/run-score.ts
import { createDefaultTaskExecutor } from '@netscript/plugin-workers-core/executor';
import { scoreBatch } from './tasks/score-batch.ts';

const executor = createDefaultTaskExecutor();

const result = await executor.execute(scoreBatch, {
  // options.env merges OVER the task's env; trace headers are injected automatically.
  onStdout: (line) => console.log('[score]', line),
  onStderr: (line) => console.warn('[score:err]', line),
});

if (result.success) {
  // result.result is the parsed JSON object from the LAST stdout line, or null.
  console.log('scored', result.result, `in ${result.duration}ms`);
} else {
  // status is 'failed' | 'timeout' | 'cancelled'; exitCode is -1 when the process never ran.
  console.error('task failed', result.status, result.exitCode, result.error);
}
```

### 4. Sandbox a `deno` task with explicit permissions

The `deno` runtime is the **only** one NetScript sandboxes: the `.permissions({...})` set is
translated into `--allow-*` flags on the `deno run` command line. For `python`, `shell`,
`powershell`, `cmd`, `dotnet`, and `executable`, those keys are ignored — the subprocess
inherits the worker process's OS-level access. Gate those at the OS layer instead.

```ts
// workers/tasks/parse-feed.ts — a sandboxed deno task (least privilege)
import { defineTask } from '@netscript/plugin-workers-core/builders';

export const parseFeed = defineTask('parse-feed')
  .runtime('deno') // the default; shown here for clarity
  .entrypoint('./scripts/parse-feed.ts')
  .permissions({
    net: ['api.example.com'], // -> --allow-net=api.example.com
    read: ['./feeds'],        // -> --allow-read=./feeds
    write: false,
    env: ['FEED_TOKEN'],      // -> --allow-env=FEED_TOKEN
  })
  .build();

// Spawns: deno run --allow-net=api.example.com --allow-read=./feeds --allow-env=FEED_TOKEN ./scripts/parse-feed.ts
```

{{ comp callout { type: "warning", title: "Omitting permissions on a deno task widens the sandbox to --allow-all" } }}
Calling <code>.build()</code> on a <code>deno</code> task <em>without</em>
<code>.permissions(...)</code> produces an <code>--allow-all</code> command line — full
access. Always pass an explicit, least-privilege permission set for untrusted or third-party
Deno task code. The <code>permissions</code> preset export
(<code>permissions.readOnly</code>, <code>.network</code>, <code>.none</code>, …) gives you
ready-made starting points.
{{ /comp }}

## In-production pitfalls

{{ comp callout { type: "warning", title: "The result is the LAST stdout line — and only if it is a JSON object" } }}
A trailing log line, a pretty-print, a JSON <em>array</em>, or a stray newline after the
payload all make <code>result.result</code> <code>null</code> even though
<code>result.success</code> is <code>true</code>. Emit the JSON object last, send everything
else to <code>stderr</code>, and flush your own output — for Python the runtime runs
<code>python3 -u</code> (unbuffered) for exactly this reason; other runtimes are not unbuffered.
{{ /comp }}

{{ comp callout { type: "important", title: "The runtime must exist on the worker host; read the exit code" } }}
A missing interpreter surfaces as a failed task, not a thrown error. Exit code
<code>127</code> is reported as <em>command not found</em> and <code>126</code> as
<em>command not executable</em>; both land in <code>result.error</code> with the first
<code>stderr</code> line appended. <code>cmd</code> and (on Windows) <code>powershell</code>
are platform-specific. A task that exceeds its <code>timeout</code> resolves with status
<code>timeout</code> and exit code <code>-1</code>; passing an already-aborted
<code>signal</code> yields status <code>cancelled</code> before any process starts.
{{ /comp }}

{{ comp callout { type: "important", title: "Non-Deno runtimes are a trust boundary — there is no per-task sandbox" } }}
A <code>python</code>/<code>shell</code>/<code>executable</code> task spawns an arbitrary
process with the worker's OS privileges; <code>.permissions(...)</code> does nothing there.
Pin entrypoints to known scripts, prefer a pinned interpreter or venv
(<code>pythonConfig.venvPath</code>) over <code>$PATH</code> discovery, and never interpolate
untrusted input into <code>args</code> or the entrypoint path. Trace context
(<code>TRACEPARENT</code>/<code>TRACESTATE</code>/<code>CORRELATION_ID</code>) is injected
into the subprocess environment so cross-runtime spans stitch together; env precedence is
<code>Deno.env</code> &lt; task <code>env</code> &lt; call <code>options.env</code>.
<!-- caveat: arch-debt:workers-non-deno-task-sandbox-boundary -->
{{ /comp }}

{{ comp callout { type: "note", title: "Alpha surface" } }}
NetScript is in alpha; the polyglot task API can still shift. Treat the import subpaths
(<code>/builders</code>, <code>/executor</code>) and the runtime-specific
<code>metadata</code> configs as the current shape, and pin the version you build against.
{{ /comp }}

## See also

{{ comp.xref({ key: "cap:polyglot-tasks" }) }}

{{ comp.xref({ key: "cap:background-jobs" }) }}

{{ comp.xref({ key: "ref:workers" }) }}

{{ comp.nextPrev({ prev: { label: "Tune the worker runtime", href: "/how-to/tune-worker-runtime/" }, next: { label: "Graceful shutdown", href: "/how-to/graceful-shutdown/" } }) }}
