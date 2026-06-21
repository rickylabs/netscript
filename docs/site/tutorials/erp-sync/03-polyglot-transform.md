---
layout: layouts/base.vto
title: A polyglot transform task
templateEngine: [vento, md]
prev: { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" }
next: { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" }
---

# A polyglot transform task

In [Chapter 2](/tutorials/erp-sync/02-import-job/) you parsed a CSV in TypeScript. That is the right
tool most of the time — but real ERP data sometimes needs a step that lives more naturally in another
language: a Python pandas transform, a shell pipeline through `jq`, a .NET statistics routine you
already own. NetScript runs those as **polyglot tasks**: a non-TypeScript script defined with the
same builder you already know, spawned as a subprocess, with its result captured.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" },
  { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" },
  { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" },
  { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" },
  { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" }
] }) }}

{{ comp callout { type: "note", title: "Read this chapter; do not run it end-to-end" } }}
This is a <strong>documented-capability</strong> chapter, not a hands-on one. The polyglot runtime
is real — the <code>defineTask</code> builder, the seven runtime types, and the six subprocess
adapters all ship today — and every shape below is grounded in that real surface. But running a
<code>python</code> or <code>shell</code> task to completion depends on the target interpreter being
installed and on your host OS, which is environment-specific. So this chapter teaches the
<strong>shape, the permission model, and the runtime matrix</strong> honestly, and points you at the
hands-on <a href="/how-to/run-a-polyglot-task/">Run a polyglot task</a> recipe to wire one up on
your own machine. The ERP sync's hands-on spine stays TypeScript jobs, queue, and cron.
{{ /comp }}

## What you will understand

By the end of this chapter you will be able to read and write a `defineTask().runtime('python')`
definition, know exactly which runtimes NetScript supports and which one is sandboxed, understand
how input crosses the process boundary (argv + env, never stdin) and how the result crosses back
(one JSON object on the last `stdout` line), and know the per-runtime permission rules well enough to
ship a task safely. The next step — actually executing one — is the
[Run a polyglot task](/how-to/run-a-polyglot-task/) recipe.

## Before you begin

You need the `my-erp/` workspace from [Chapter 2](/tutorials/erp-sync/02-import-job/) with the
workers plugin installed. Nothing new to provision for the reading; if you choose to follow the
hands-on recipe afterward, you will also need the target toolchain (for the Python example,
`python3` or a venv) on the worker host. Confirm the workers plugin is present:

```sh
netscript plugin list
```

Expected: `workers` appears. Polyglot tasks live in the same workers plugin as your jobs.

## Step 1 — The task builder, in one chain

A task is defined with `defineTask(id)` from `@netscript/plugin-workers-core/builders`. It returns a
typestate builder: the default `runtime` is `'deno'`, so you call `.runtime(type)` to target another
language, `.entrypoint(path)` to point at the script, and `.build()` once an entrypoint (or an
in-process `.handler`) is set. Input reaches the script as **argv** (`.args(...)`) and **environment
variables** (`.env({...})`).

```ts
// plugins/workers/tasks/transform-products.ts
import { defineTask } from '@netscript/plugin-workers-core/builders';

// A Python transform step: same builder as a TS task, different runtime.
export const transformProducts = defineTask('transform-products')
  .runtime('python')
  .entrypoint('./tasks/transform-products.py')
  .env({ TRANSFORM_MODE: 'normalize' })
  .args('--threshold', '0.8')
  .timeout(120_000) // ms; defaults to 300_000
  .build();

// Spawns (conceptually): python3 -u ./tasks/transform-products.py --threshold 0.8
```

The builder method is **`.runtime(type)`**, not `.type(...)` — it sets the `type` field on the
resulting definition. The same chain produces a `python`, `shell`, or `dotnet` task; only the
`.runtime(...)` argument and the entrypoint change.

{{ comp.apiTable({
  caption: "defineTask builder — the methods you reach for (@netscript/plugin-workers-core/builders)",
  rows: [
    { name: ".runtime(type)", type: "TaskType => builder", desc: "Selects the runtime: 'deno' | 'python' | 'shell' | 'powershell' | 'dotnet' | 'cmd' | 'executable'. Default 'deno'." },
    { name: ".entrypoint(path)", type: "string => builder", desc: "The script or executable to run, e.g. ./tasks/transform-products.py. Unlocks .build()." },
    { name: ".args(...args)", type: "...string[] => builder", desc: "Command-line arguments appended to the spawn. Input reaches the script as argv." },
    { name: ".env(vars)", type: "Record<string,string> => builder", desc: "Environment variables merged into the subprocess. The other half of task input." },
    { name: ".timeout(ms)", type: "number => builder", desc: "Execution timeout in milliseconds. Schema default 300000 (5 min)." },
    { name: ".permissions(perms)", type: "BuilderPermissions => builder", desc: "Deno --allow-* grants. Enforced ONLY for the 'deno' runtime (see Step 3)." },
    { name: ".build()", type: "=> TaskDefinition", desc: "Finalizes the definition. Only callable after .entrypoint(...) or .handler(...)." }
  ]
}) }}

## Step 2 — Crossing the process boundary

A subprocess task is a contract about two streams. Input goes **in** as argv and environment
variables — never stdin. The result comes **back** as exactly one JSON object printed as the **last
line of `stdout`**; everything else on `stdout`/`stderr` is captured as logs. Here is the Python side
of the example above:

```python
# plugins/workers/tasks/transform-products.py
import json, os, sys

# Input arrives as argv + env (NOT stdin).
threshold = float(sys.argv[sys.argv.index('--threshold') + 1])
mode = os.environ.get('TRANSFORM_MODE', 'normalize')

# ... do the transform ...
result = {'mode': mode, 'kept': 42, 'dropped': 3, 'threshold': threshold}

# Diagnostics go to stderr; the RESULT is the last stdout line and must be a
# single JSON OBJECT (not an array) to populate result.result.
print('transform complete', file=sys.stderr)
print(json.dumps(result))
```

{{ comp callout { type: "warning", title: "The result is the LAST stdout line — and only if it is a JSON object" } }}
A trailing log line, a pretty-print, a JSON <em>array</em>, or a stray newline after the payload all
make the parsed result <code>null</code> even when the task otherwise succeeds. Emit the JSON object
last, send everything else to <code>stderr</code>, and flush your output. The Python runtime runs
<code>python3 -u</code> (unbuffered) for exactly this reason; other runtimes are not unbuffered, so
flush manually. The full streaming and result contract is in
<a href="/how-to/run-a-polyglot-task/">Run a polyglot task</a>.
{{ /comp }}

## Step 3 — The permission model (and the one sandboxed runtime)

NetScript's per-task `.permissions({...})` set mirrors Deno's permission model — `net`, `read`,
`write`, `env`, `run`, `ffi`, `import`, each a `boolean` or a `string[]` allowlist. But there is a
sharp, important rule:

{{ comp callout { type: "danger", title: "Only the deno runtime is sandboxed" } }}
The <code>deno</code> runtime is the <strong>only</strong> one NetScript sandboxes: its
<code>.permissions({...})</code> set is compiled directly into <code>--allow-*</code> flags on the
<code>deno run</code> command. For <code>python</code>, <code>shell</code>, <code>powershell</code>,
<code>cmd</code>, <code>dotnet</code>, and <code>executable</code>, those permission keys are
<strong>ignored</strong> — the subprocess inherits the worker process's full OS-level access. A
non-Deno task is a trust boundary: pin the entrypoint to a known script, prefer a pinned interpreter
or venv over <code>$PATH</code> discovery, never interpolate untrusted input into <code>args</code>,
and gate access at the OS layer.
{{ /comp }}

For a `deno`-runtime task, permissions are real and you must set them — omitting `.permissions(...)`
on a `deno` task produces an `--allow-all` command line (full access). Scope them:

```ts
// plugins/workers/tasks/parse-feed.ts — a sandboxed deno task (least privilege)
import { defineTask } from '@netscript/plugin-workers-core/builders';

export const parseFeed = defineTask('parse-feed')
  .runtime('deno') // the default; shown for clarity
  .entrypoint('./tasks/parse-feed.ts')
  .permissions({
    net: ['api.example.com'], // -> --allow-net=api.example.com
    read: ['./feeds'],        // -> --allow-read=./feeds
    write: false,
    env: ['FEED_TOKEN'],      // -> --allow-env=FEED_TOKEN
  })
  .build();
```

The framework also ships named `permissions` presets (`minimal`, `none`, `network`, `filesystem`,
`readOnly`, `subprocess`, `full`, `allAccess`) so you do not hand-roll the object for common cases —
see [Tune the worker runtime](/how-to/tune-worker-runtime/) for the full preset list and the
job-vs-task default differences.

## Step 4 — The runtime support matrix

Seven runtime types ship today. Six of them (everything except `deno`) run through a dedicated
subprocess adapter; only `deno` is sandboxed. Pick by the row that matches your script:

{{ comp.apiTable({ caption: "Task runtimes (TASK_TYPES) and their adapters", columns: ["Runtime", "Spawns", "Sandboxed?", "Reach for it when"], rows: [
  ["<code>deno</code>", "<code>deno run</code> with compiled <code>--allow-*</code> flags", "<strong>Yes</strong> — per-task permissions enforced", "TypeScript/JS that should run with least privilege. The default and the only sandboxed runtime."],
  ["<code>python</code>", "<code>python3 -u &lt;script&gt;</code> (or a pinned venv/py)", "No — inherits worker OS access", "Data science, pandas/ML transforms, anything with a mature Python library."],
  ["<code>shell</code>", "<code>bash &lt;script&gt;</code>", "No", "POSIX pipelines, <code>jq</code> aggregation, glue between CLIs."],
  ["<code>powershell</code>", "<code>pwsh</code> / <code>powershell &lt;script&gt;</code>", "No", "Windows-centric automation and reporting; cross-platform via <code>pwsh</code>."],
  ["<code>dotnet</code>", "<code>dotnet run &lt;file.cs&gt;</code> (single-file C#)", "No", "Existing .NET logic — statistics, formatting, a library you already own."],
  ["<code>cmd</code>", "Windows <code>cmd.exe</code> batch", "No — Windows-only", "Legacy Windows batch steps. Platform-specific."],
  ["<code>executable</code>", "Any prebuilt binary directly", "No", "A compiled tool (Go, Rust, a vendor binary) you invoke by path."]
] }) }}

These are the literal members of the `TASK_TYPES` constant in `@netscript/plugin-workers-core`. The
showcase project ships a working example of each non-trivial one — a `python` transform, a `shell`
aggregation, a `powershell` report, and a `dotnet` stats task — as references you can adapt.

{{ comp callout { type: "important", title: "The runtime must exist on the worker host" } }}
A missing interpreter surfaces as a <em>failed task</em>, not a thrown error. Exit code
<code>127</code> is reported as <em>command not found</em> and <code>126</code> as
<em>command not executable</em>. <code>cmd</code> and (on most hosts) <code>powershell</code> are
platform-specific. Confirm <code>python3 --version</code> / <code>pwsh --version</code> /
<code>dotnet --version</code> on the actual worker host before you ship a task that depends on it.
{{ /comp }}

## How a task fits the ERP pipeline

A polyglot task is the natural home for the **transform** stage between the
[import job](/tutorials/erp-sync/02-import-job/) and the upsert: the TS job reads and stages the raw
rows, a `python` task normalizes or enriches them, and a follow-up job writes the cleaned records.
Tasks run through the same workers runtime as jobs and propagate W3C trace context
(`TRACEPARENT`/`TRACESTATE`) into the subprocess, so a cross-runtime span still stitches together in
the Aspire dashboard.

## Verify your understanding

There is no command to run here — this is a documented capability. Instead, confirm you can answer
each of these before moving on:

- [ ] You can write a `defineTask(id).runtime('python').entrypoint(...).build()` chain from memory.
- [ ] You know input crosses as **argv + env** and the result is the **last `stdout` line** (one JSON object).
- [ ] You know **only the `deno` runtime is sandboxed**; `python`/`shell`/etc. inherit OS access.
- [ ] You know a missing interpreter fails the task (exit `127`/`126`), it does not throw.
- [ ] You know where to go to actually run one: [Run a polyglot task](/how-to/run-a-polyglot-task/).

## What you built

An accurate mental model of the polyglot runtime: the `defineTask().runtime(...)` builder shape, the
argv/env-in + JSON-out boundary contract, the per-runtime permission rules (and the fact that only
`deno` is sandboxed), and the full runtime support matrix. You did not execute a non-TS task here —
that is the next step on your own host. Back on the hands-on spine, the next chapter scales the
import pipeline with a queue and a cron schedule.

## Where to go deeper

- **Run one for real** → [Run a polyglot task](/how-to/run-a-polyglot-task/) — the hands-on DO
  recipe: define, write the script, run it through `createDefaultTaskExecutor()`, read the result.
- **The capability** → [Polyglot tasks](/capabilities/polyglot-tasks/) — the WHY: what a task is, the
  subprocess seam, the full `TaskResult` shape.
- **Tune the runtime** → [Tune the worker runtime](/how-to/tune-worker-runtime/) — concurrency, the
  permission presets, and the per-task timeout/retry knobs.

{{ comp.nextPrev({ prev: { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" }, next: { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" } }) }}
