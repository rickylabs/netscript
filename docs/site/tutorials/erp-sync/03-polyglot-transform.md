---
layout: layouts/base.vto
title: A polyglot transform task
templateEngine: [vento, md]
prev: { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" }
next: { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" }
---

# A polyglot transform task

This chapter builds the transform stage that turns SAP rows into Dynamics rows. The SAP export
writes `material_no` where Dynamics wants `sku`, `description` where it wants `name`, and prices
as **integer cents** where Dynamics wants decimals; loaded untransformed, every price in Dynamics
is wrong by a factor of one hundred. In NetScript the transform is a **task**: a standalone script
defined with a builder and spawned as a subprocess, with its result captured. You build one and
run it on the `deno` runtime, the one task runtime NetScript sandboxes.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" },
  { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" },
  { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" },
  { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" },
  { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" }
] }) }}

## What you will build

A runnable **`normalize-sap`** task. It reads the SAP export you dropped in chapter 2, rewrites its
legacy columns into Dynamics' shape, and writes the normalized file to a staging folder. The
workers task executor runs it as a **sandboxed subprocess** with only the filesystem access you
grant. You watch its output stream into your terminal, read its JSON result, and `cat` the file it
produced. You also see how the **same builder chain** targets Python or shell, as a step for your
own host: those runtimes are not sandboxed and need their interpreter installed.

## Before you begin

You need the `my-erp/` workspace from [chapter 2](/tutorials/erp-sync/02-import-job/) with the
workers plugin installed and the SAP export still on disk from that chapter's file drop:

```sh
netscript plugin list
cat .data/incoming/products/products_2024.csv
```

`workers` should appear in the plugin list, and the CSV should print the SAP legacy shape:
`material_no,description,price_cents` and two rows. If the file is missing, re-create it as in
chapter 2's [verify step](/tutorials/erp-sync/02-import-job/). Aspire does not need to be running
for this chapter; the task executor runs the transform directly.

## Step 1 — Write the transform script

A subprocess task is a contract about two streams. Input goes **in** as argv and environment
variables, never stdin. The result comes **back** as exactly one JSON object printed as the
**last line of `stdout`**; everything else on `stdout` and `stderr` is captured as logs. Write the
transform as a plain Deno script that follows that contract:

```ts
// plugins/workers/scripts/normalize-sap.ts
// Legacy SAP export rows in -> Microsoft Dynamics-shaped rows out. Runs as a sandboxed subprocess.

// Input arrives as argv + env (NOT stdin).
const input = Deno.args[Deno.args.indexOf('--input') + 1];
const outDir = Deno.env.get('STAGING_DIR') ?? '.data/staging';

const raw = await Deno.readTextFile(input);
const lines = raw.trim().split('\n').filter((line) => line.trim().length > 0);
const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
const col = (name: string) => headers.indexOf(name);

// legacy -> target: material_no -> sku, description -> name, price_cents -> price (decimal).
const out: string[] = ['sku,name,price'];
let skipped = 0;
for (const line of lines.slice(1)) {
  const values = line.split(',').map((v) => v.trim());
  const sku = values[col('material_no')] ?? '';
  const name = values[col('description')] ?? '';
  const cents = Number.parseInt(values[col('price_cents')] ?? '', 10);
  if (sku === '' || Number.isNaN(cents)) {
    skipped++;
    continue;
  }
  out.push(`${sku},${name},${(cents / 100).toFixed(2)}`);
}

await Deno.mkdir(outDir, { recursive: true });
const fileName = input.split('/').pop() ?? 'export.csv';
const output = `${outDir}/${fileName.replace(/\.csv$/, '')}.normalized.csv`;
await Deno.writeTextFile(output, out.join('\n') + '\n');

// Diagnostics go to stderr; the RESULT is the last stdout line and must be a
// single JSON OBJECT (not an array) to populate result.result.
console.error(`normalize-sap: ${lines.length - 1} rows in, ${out.length - 1} written`);
console.log(JSON.stringify({ input, output, read: lines.length - 1, written: out.length - 1, skipped }));
```

The script imports nothing from NetScript. It is an ordinary program with a narrow I/O contract,
which lets the same execution model run a TypeScript script or a Python one.

{{ comp callout { type: "warning", title: "The result is the LAST stdout line — and only if it is a JSON object" } }}
A trailing log line, a pretty-print, a JSON <em>array</em> or a stray newline after the payload makes the parsed result <code>null</code>, even when the task otherwise succeeds. Emit the JSON object last and send everything else to <code>stderr</code>, as the script above does.
{{ /comp }}

## Step 2 — Define the task, permissions included

Wrap the script in a task definition. `defineTask(id)` from `@netscript/plugin-workers-core/builders`
returns a typestate builder:

- `.runtime(type)` selects the runtime (default `'deno'`);
- `.entrypoint(path)` points at the script and unlocks `.build()`;
- input crosses as `.args(...)` plus `.env({...})`;
- for a `deno` task, `.permissions({...})` is the sandbox: each key compiles into an `--allow-*`
  flag on the spawned `deno run` command line.

```ts
// plugins/workers/tasks/normalize-sap.ts
import { defineTask } from '@netscript/plugin-workers-core/builders';

export const normalizeSap = defineTask('normalize-sap')
  .runtime('deno') // the default — and the only sandboxed runtime
  .entrypoint('./plugins/workers/scripts/normalize-sap.ts')
  .args('--input', '.data/incoming/products/products_2024.csv')
  .env({ STAGING_DIR: '.data/staging' })
  .permissions({
    read: ['.data'],           // -> --allow-read=.data
    write: ['.data/staging'],  // -> --allow-write=.data/staging
    env: ['STAGING_DIR'],      // -> --allow-env=STAGING_DIR
  })
  .timeout(30_000) // ms; defaults to 300_000
  .build();

export default normalizeSap;
```

The permission set describes the transform: it may read the incoming drop folder, write only to
staging, and see one environment variable. If the script tries to reach the network or touch a
file outside those grants, the Deno sandbox refuses at the subprocess boundary.

{{ comp callout { type: "caution", title: "Omitting .permissions() on a deno task means --allow-all" } }}
Calling <code>.build()</code> on a <code>deno</code> task <em>without</em> <code>.permissions(...)</code> produces an <code>--allow-all</code> command line: full access. Always pass an explicit, least-privilege set. Named <code>permissions</code> presets (<code>minimal</code>, <code>readOnly</code>, <code>network</code>, …) cover common cases, so you don't hand-write the object; see <a href="/background-processing/how-to/tune-worker-runtime/">Tune the worker runtime</a>.
{{ /comp }}

## Step 3 — Write the runner

`createDefaultTaskExecutor()` from `@netscript/plugin-workers-core/executor` builds the
multi-runtime executor with every built-in runtime adapter. `executor.execute(task)` resolves the
adapter for the task's runtime, spawns the subprocess, streams its output and returns one
`TaskResult`. Write a small runner:

```ts
// plugins/workers/run-normalize.ts
import { createDefaultTaskExecutor } from '@netscript/plugin-workers-core/executor';
import { normalizeSap } from './tasks/normalize-sap.ts';

const executor = createDefaultTaskExecutor();

const result = await executor.execute(normalizeSap, {
  onStdout: (line) => console.log('[normalize]', line),
  onStderr: (line) => console.warn('[normalize:err]', line),
});

if (result.success) {
  // result.result is the parsed JSON object from the LAST stdout line, or null.
  console.log('normalized', result.result, `in ${result.duration}ms`);
} else {
  // status is 'failed' | 'timeout' | 'cancelled'; exitCode is -1 when the process never ran.
  console.error('task failed', result.status, result.exitCode, result.error);
  Deno.exit(1);
}
```

## Step 4 — Run the transform

1. Run the runner from the **workspace root**. The task's relative paths (entrypoint, input,
   staging) resolve from where you launch it:

   ```sh
   deno run -A plugins/workers/run-normalize.ts
   ```

   The runner is trusted host code, so `-A` is fine here. The sandbox that matters is the
   **subprocess**: the executor spawns
   `deno run --allow-read=.data --allow-write=.data/staging --allow-env=STAGING_DIR …` with exactly
   the flags your permission set compiled to. You should see (your duration will differ):

   ```text
   [normalize:err] normalize-sap: 2 rows in, 2 written
   [normalize] {"input":".data/incoming/products/products_2024.csv","output":".data/staging/products_2024.normalized.csv","read":2,"written":2,"skipped":0}
   normalized {
     input: ".data/incoming/products/products_2024.csv",
     output: ".data/staging/products_2024.normalized.csv",
     read: 2,
     written: 2,
     skipped: 0
   } in 187ms
   ```

2. Read the file the task produced:

   ```sh
   cat .data/staging/products_2024.normalized.csv
   ```

   ```text
   sku,name,price
   WID-1,Widget,9.99
   GAD-2,Gadget,19.99
   ```

The cents are decimals and the legacy columns carry Dynamics' names. In the full pipeline, the
[import job](/tutorials/erp-sync/02-import-job/) stages the raw SAP rows, `normalize-sap` rewrites
them for Dynamics, and a follow-up job would upsert the staged file. Tasks run through the same
workers runtime as jobs and propagate W3C trace context (`TRACEPARENT`/`TRACESTATE`) into the
subprocess, so a cross-runtime span still joins its trace in the Aspire dashboard.

## Step 5 — The same chain in another language

`normalize-sap` is TypeScript because a column rename needs nothing more. Some transforms fit
another language better: a pandas dedupe across historical SAP exports, a shell pipeline through
`jq`, a .NET routine you already own. The builder chain is identical; only the `.runtime(...)`
argument and the entrypoint change. [Polyglot tasks](/background-processing/polyglot-tasks/)
explains the subprocess seam and the full `TaskResult` shape.

```ts
// The Python variant of the same stage — a forward step for your own host.
export const dedupeSap = defineTask('dedupe-sap')
  .runtime('python')
  .entrypoint('./plugins/workers/scripts/dedupe_sap.py')
  .args('--input', '.data/staging')
  .timeout(120_000)
  .build();

// Spawns: python3 -u ./plugins/workers/scripts/dedupe_sap.py --input .data/staging
```

The process contract is unchanged: argv and env in, one JSON object on the last `stdout` line out.
The Python runtime runs `python3 -u`, unbuffered, for exactly that reason. Two rules change, and
they are why you read this step now and run it on your own host rather than in this chapter's
checkpoint:

{{ comp callout { type: "caution", title: "Non-Deno Runtime Sandboxing Boundary" } }}
For non-Deno task runtimes (including <code>python</code>, <code>shell</code>, <code>powershell</code>, <code>cmd</code>, <code>dotnet</code> and <code>executable</code>), NetScript ignores the <code>.permissions({...})</code> keys, and subprocesses inherit the worker host's full OS-level permissions. NetScript does not provide OS-level process isolation for these runtimes. Treat them as a trust boundary: pin entrypoints to known local scripts, prefer a pinned interpreter or venv (<code>pythonConfig.venvPath</code>), and apply OS-level containerization or process-group restrictions.
<!-- caveat: arch-debt:workers-non-deno-task-sandbox-boundary -->
{{ /comp }}

{{ comp callout { type: "important", title: "The runtime must exist on the worker host" } }}
A missing interpreter surfaces as a <em>failed task</em>, not a thrown error: exit code <code>127</code> is reported as <em>command not found</em> and <code>126</code> as <em>command not executable</em>. Confirm <code>python3 --version</code>, <code>pwsh --version</code> or <code>dotnet --version</code> on the actual worker host before you ship a task that depends on it. <a href="/background-processing/how-to/run-a-polyglot-task/">Run a polyglot task</a> walks through the Python and shell variants end to end, including interpreter pinning.
{{ /comp }}

Seven runtime types ship, the members of the `TASK_TYPES` constant in
`@netscript/plugin-workers-core`:

{{ comp.apiTable({ caption: "Task runtimes (TASK_TYPES) and their adapters", columns: ["Runtime", "Spawns", "Sandboxed?", "Reach for it when"], rows: [
  ["<code>deno</code>", "<code>deno run</code> with compiled <code>--allow-*</code> flags", "<strong>Yes</strong> — per-task permissions enforced", "TypeScript/JS that should run with least privilege. The default, and the runtime this chapter runs."],
  ["<code>python</code>", "<code>python3 -u &lt;script&gt;</code> (or a pinned venv/py)", "No — inherits worker OS access", "Data science, pandas/ML transforms, anything with a mature Python library."],
  ["<code>shell</code>", "<code>bash &lt;script&gt;</code>", "No", "POSIX pipelines, <code>jq</code> aggregation, glue between CLIs."],
  ["<code>powershell</code>", "<code>pwsh</code> / <code>powershell &lt;script&gt;</code>", "No", "Windows-centric automation and reporting; cross-platform via <code>pwsh</code>."],
  ["<code>dotnet</code>", "<code>dotnet run &lt;file.cs&gt;</code> (single-file C#)", "No", "Existing .NET logic — statistics, formatting, a library you already own."],
  ["<code>cmd</code>", "Windows <code>cmd.exe</code> batch", "No — Windows-only", "Legacy Windows batch steps. Platform-specific."],
  ["<code>executable</code>", "Any prebuilt binary directly", "No", "A compiled tool (Go, Rust, a vendor binary) you invoke by path."]
] }) }}

## Verify your progress

Confirm the transform ran and the workspace still type-checks:

```sh
cat .data/staging/products_2024.normalized.csv   # sku,name,price + 2 decimal-priced rows
deno task check                                  # clean
```

- [ ] `deno run -A plugins/workers/run-normalize.ts` exits 0 and prints `normalized { … written: 2 … }`.
- [ ] `.data/staging/products_2024.normalized.csv` exists with headers `sku,name,price` and prices `9.99` / `19.99`.
- [ ] The `[normalize:err]` diagnostic line and the JSON result line both appeared — logs and result travel on separate streams.
- [ ] `deno task check` is clean.

{{ comp callout { type: "tip", title: "If the task fails instead" } }}
Read <code>result.status</code> and <code>result.exitCode</code> from the runner's error line. A Deno permission error on <code>stderr</code> means the script touched a path outside the grants in Step 2: the sandbox is working, so widen that specific permission, not to <code>--allow-all</code>. A <code>NotFound</code> read error means the chapter 2 CSV is missing; re-create it and rerun. A <code>timeout</code> status means the 30s budget elapsed; raise <code>.timeout(...)</code>.
{{ /comp }}

## What you built

The transform stage of the SAP→Dynamics pipeline: a plain Deno script that follows the argv/env-in,
JSON-out process contract, a `defineTask` definition whose `.permissions(...)` compile into
`--allow-*` flags on the spawned subprocess, and an executor run you observed end to end. You also
saw the same stage in Python and the two rules for non-Deno runtimes: no sandbox, and the
interpreter must exist. Next, the pipeline learns to absorb bursts and run on a schedule.

{{ comp.nextPrev({ prev: { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" }, next: { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" } }) }}
