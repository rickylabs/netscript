---
layout: layouts/base.vto
title: A polyglot transform task
templateEngine: [vento, md]
prev: { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" }
next: { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" }
---

# A polyglot transform task

In [Chapter 2](/tutorials/erp-sync/02-import-job/) you imported a VIF export as-is. But VIF's
export is not CSB's import: the legacy system writes `art_no` where CSB wants `sku`,
`designation` where CSB wants `name`, and — the one that really hurts — prices as **integer
centimes** where CSB wants decimals. Load a VIF row into CSB untransformed and every price in the
new system is wrong by a factor of one hundred. The pipeline needs a **transform stage**, and in
NetScript that stage is a **task**: a standalone script defined with a builder, spawned as a
subprocess, its result captured. In this chapter you build one and **run it**, using the `deno`
runtime — the one task runtime NetScript sandboxes.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" },
  { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" },
  { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" },
  { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" },
  { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" }
] }) }}

## What you will build

By the end of this chapter you will have a runnable **`normalize-vif`** task: a transform script
that reads the VIF export you dropped in Chapter 2, rewrites its legacy columns into CSB's shape,
and writes the normalized file to a staging folder — executed through the workers task executor as
a **sandboxed subprocess** whose filesystem access you granted explicitly. You will watch its
output stream into your terminal, read its structured JSON result, and `cat` the normalized file
it produced. You will also see how the **same builder chain** targets Python or shell when a
transform belongs in another language — as a clearly-marked forward step for your own host, since
those runtimes are not sandboxed and need their interpreter installed.

## Before you begin

You need the `my-erp/` workspace from [Chapter 2](/tutorials/erp-sync/02-import-job/) with the
workers plugin installed and the VIF export still on disk from that chapter's file drop:

```sh
netscript plugin list
cat .data/incoming/products/products_2024.csv
```

Expected: `workers` appears in the plugin list, and the CSV prints VIF's legacy shape —
`art_no,designation,price_centimes` and two rows. If the file is missing, re-create it exactly as
in Chapter 2's [verify step](/tutorials/erp-sync/02-import-job/). Aspire does not need to be
running for this chapter — the task executor runs the transform directly.

## Step 1 — Write the transform script

A subprocess task is a contract about two streams. Input goes **in** as argv and environment
variables — never stdin. The result comes **back** as exactly one JSON object printed as the
**last line of `stdout`**; everything else on `stdout`/`stderr` is captured as logs. Write the
transform as a plain Deno script honoring that contract:

```ts
// plugins/workers/scripts/normalize-vif.ts
// VIF export rows in -> CSB-shaped rows out. Runs as a sandboxed subprocess.

// Input arrives as argv + env (NOT stdin).
const input = Deno.args[Deno.args.indexOf('--input') + 1];
const outDir = Deno.env.get('STAGING_DIR') ?? '.data/staging';

const raw = await Deno.readTextFile(input);
const lines = raw.trim().split('\n').filter((line) => line.trim().length > 0);
const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
const col = (name: string) => headers.indexOf(name);

// VIF -> CSB: art_no -> sku, designation -> name, price_centimes -> price (decimal).
const out: string[] = ['sku,name,price'];
let skipped = 0;
for (const line of lines.slice(1)) {
  const values = line.split(',').map((v) => v.trim());
  const sku = values[col('art_no')] ?? '';
  const name = values[col('designation')] ?? '';
  const centimes = Number.parseInt(values[col('price_centimes')] ?? '', 10);
  if (sku === '' || Number.isNaN(centimes)) {
    skipped++;
    continue;
  }
  out.push(`${sku},${name},${(centimes / 100).toFixed(2)}`);
}

await Deno.mkdir(outDir, { recursive: true });
const fileName = input.split('/').pop() ?? 'export.csv';
const output = `${outDir}/${fileName.replace(/\.csv$/, '')}.normalized.csv`;
await Deno.writeTextFile(output, out.join('\n') + '\n');

// Diagnostics go to stderr; the RESULT is the last stdout line and must be a
// single JSON OBJECT (not an array) to populate result.result.
console.error(`normalize-vif: ${lines.length - 1} rows in, ${out.length - 1} written`);
console.log(JSON.stringify({ input, output, read: lines.length - 1, written: out.length - 1, skipped }));
```

Nothing here imports NetScript — that is the point. The script is an ordinary program with a
narrow I/O contract, which is what lets the same execution model run TypeScript today and Python
tomorrow.

{{ comp callout { type: "warning", title: "The result is the LAST stdout line — and only if it is a JSON object" } }}
A trailing log line, a pretty-print, a JSON <em>array</em>, or a stray newline after the payload
all make the parsed result <code>null</code> even when the task otherwise succeeds. Emit the JSON
object last and send everything else to <code>stderr</code>, as the script above does.
{{ /comp }}

## Step 2 — Define the task, permissions included

Now wrap the script in a task definition. `defineTask(id)` from
`@netscript/plugin-workers-core/builders` returns a typestate builder: `.runtime(type)` selects
the runtime (default `'deno'`), `.entrypoint(path)` points at the script and unlocks `.build()`,
and input crosses as `.args(...)` plus `.env({...})`. For a `deno` task, `.permissions({...})` is
the sandbox — each key compiles directly into an `--allow-*` flag on the spawned `deno run`
command line:

```ts
// plugins/workers/tasks/normalize-vif.ts
import { defineTask } from '@netscript/plugin-workers-core/builders';

export const normalizeVif = defineTask('normalize-vif')
  .runtime('deno') // the default — and the only sandboxed runtime
  .entrypoint('./plugins/workers/scripts/normalize-vif.ts')
  .args('--input', '.data/incoming/products/products_2024.csv')
  .env({ STAGING_DIR: '.data/staging' })
  .permissions({
    read: ['.data'],           // -> --allow-read=.data
    write: ['.data/staging'],  // -> --allow-write=.data/staging
    env: ['STAGING_DIR'],      // -> --allow-env=STAGING_DIR
  })
  .timeout(30_000) // ms; defaults to 300_000
  .build();

export default normalizeVif;
```

Read the permission set as a statement about the transform: it may read the incoming drop folder,
write only to staging, and see one environment variable — nothing else. If the script ever tries
to phone home or touch a file outside those grants, the Deno sandbox refuses at the subprocess
boundary, not in your code review.

{{ comp callout { type: "danger", title: "Omitting .permissions() on a deno task means --allow-all" } }}
Calling <code>.build()</code> on a <code>deno</code> task <em>without</em>
<code>.permissions(...)</code> produces an <code>--allow-all</code> command line — full access.
Always pass an explicit, least-privilege set. The framework also ships named
<code>permissions</code> presets (<code>minimal</code>, <code>readOnly</code>,
<code>network</code>, …) so you do not hand-roll the object for common cases — see
<a href="/how-to/tune-worker-runtime/">Tune the worker runtime</a>.
{{ /comp }}

## Step 3 — Run it through the executor

`createDefaultTaskExecutor()` from `@netscript/plugin-workers-core/executor` builds the
multi-runtime executor wired with every built-in runtime adapter. `executor.execute(task)`
resolves the adapter for the task's runtime, spawns the subprocess, streams its output, and
returns one `TaskResult`. Write a small runner:

```ts
// plugins/workers/run-normalize.ts
import { createDefaultTaskExecutor } from '@netscript/plugin-workers-core/executor';
import { normalizeVif } from './tasks/normalize-vif.ts';

const executor = createDefaultTaskExecutor();

const result = await executor.execute(normalizeVif, {
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

Run it from the **workspace root** (the task's relative paths — entrypoint, input, staging —
resolve from where you launch the runner):

```sh
deno run -A plugins/workers/run-normalize.ts
```

The runner itself is trusted host code, so `-A` is fine here — the sandbox that matters is the
**subprocess**: the executor spawns
`deno run --allow-read=.data --allow-write=.data/staging --allow-env=STAGING_DIR …` with exactly
the flags your permission set compiled to. You should see:

```
[normalize:err] normalize-vif: 2 rows in, 2 written
[normalize] {"input":".data/incoming/products/products_2024.csv","output":".data/staging/products_2024.normalized.csv","read":2,"written":2,"skipped":0}
normalized {
  input: ".data/incoming/products/products_2024.csv",
  output: ".data/staging/products_2024.normalized.csv",
  read: 2,
  written: 2,
  skipped: 0
} in 187ms
```

(Your duration will differ.) Now read the file the task produced:

```sh
cat .data/staging/products_2024.normalized.csv
```

```
sku,name,price
WID-1,Widget,9.99
GAD-2,Gadget,19.99
```

The centimes are decimals, the legacy columns are CSB's names, and the off-by-100 price bug never
gets a chance to exist. This is the transform stage of the pipeline: the
[import job](/tutorials/erp-sync/02-import-job/) stages the raw VIF rows, `normalize-vif` rewrites
them for CSB, and a follow-up job would upsert the staged file. Tasks run through the same workers
runtime as jobs and propagate W3C trace context (`TRACEPARENT`/`TRACESTATE`) into the subprocess,
so a cross-runtime span still stitches together in the Aspire dashboard.

## Step 4 — The same chain in another language

`normalize-vif` is TypeScript because a column rename needs nothing more. But some transforms
live more naturally elsewhere — a pandas dedupe across historical VIF exports, a shell pipeline
through `jq`, a .NET routine you already own. The builder chain is identical; only the
`.runtime(...)` argument and the entrypoint change:

```ts
// The Python variant of the same stage — a forward step for your own host.
export const dedupeVif = defineTask('dedupe-vif')
  .runtime('python')
  .entrypoint('./plugins/workers/scripts/dedupe_vif.py')
  .args('--input', '.data/staging')
  .timeout(120_000)
  .build();

// Spawns: python3 -u ./plugins/workers/scripts/dedupe_vif.py --input .data/staging
```

The process contract is unchanged — argv + env in, one JSON object on the last `stdout` line out
(the Python runtime runs `python3 -u`, unbuffered, for exactly that reason). Two things do change,
and they are why this step is a **read-now, run-on-your-own-host** capability rather than part of
this chapter's checkpoint:

{{ comp callout { type: "danger", title: "Only the deno runtime is sandboxed" } }}
For <code>python</code>, <code>shell</code>, <code>powershell</code>, <code>cmd</code>,
<code>dotnet</code>, and <code>executable</code> tasks, the <code>.permissions({...})</code> keys
are <strong>ignored</strong> — the subprocess inherits the worker process's full OS-level access.
A non-Deno task is a trust boundary: pin the entrypoint to a known script, prefer a pinned
interpreter or venv (<code>pythonConfig.venvPath</code>) over <code>$PATH</code> discovery, never
interpolate untrusted input into <code>args</code>, and gate access at the OS layer.
<!-- caveat: arch-debt:workers-non-deno-task-sandbox-boundary -->
{{ /comp }}

{{ comp callout { type: "important", title: "The runtime must exist on the worker host" } }}
A missing interpreter surfaces as a <em>failed task</em>, not a thrown error: exit code
<code>127</code> is reported as <em>command not found</em> and <code>126</code> as <em>command not
executable</em>. Confirm <code>python3 --version</code> / <code>pwsh --version</code> /
<code>dotnet --version</code> on the actual worker host before you ship a task that depends on it.
When yours is ready, <a href="/how-to/run-a-polyglot-task/">Run a polyglot task</a> walks the
Python and shell variants end to end, including interpreter pinning.
{{ /comp }}

Seven runtime types ship today — the literal members of the `TASK_TYPES` constant in
`@netscript/plugin-workers-core`:

{{ comp.apiTable({ caption: "Task runtimes (TASK_TYPES) and their adapters", columns: ["Runtime", "Spawns", "Sandboxed?", "Reach for it when"], rows: [
  ["<code>deno</code>", "<code>deno run</code> with compiled <code>--allow-*</code> flags", "<strong>Yes</strong> — per-task permissions enforced", "TypeScript/JS that should run with least privilege. The default, and what you just ran."],
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
Read <code>result.status</code> and <code>result.exitCode</code> from the runner's error line. A
Deno permission error on <code>stderr</code> means the script touched a path outside the grants in
Step 2 — that is the sandbox working; widen the specific permission, not to
<code>--allow-all</code>. A <code>NotFound</code> read error means the Chapter 2 CSV is missing —
re-create it and rerun. A <code>timeout</code> status means the 30s budget elapsed; raise
<code>.timeout(...)</code>.
{{ /comp }}

## What you built

A runnable transform stage for the VIF→CSB pipeline: a plain-Deno script honoring the argv/env-in
+ JSON-out process contract, a `defineTask` definition whose `.permissions(...)` compile into real
`--allow-*` flags on the spawned subprocess, and an executor run you observed end to end — plus
the shape of the same stage in Python, clearly marked with the two rules that govern non-Deno
runtimes (no sandbox, interpreter must exist). Next, the pipeline learns to absorb bursts and run
on a schedule.

## Where to go deeper

- **Run the Python/shell variants for real** → [Run a polyglot task](/how-to/run-a-polyglot-task/)
  — the hands-on recipe: define, write the script, pin the interpreter, read the result.
- **The capability** → [Polyglot tasks](/background-processing/polyglot-tasks/) — the WHY: what a
  task is, the subprocess seam, the full `TaskResult` shape.
- **Tune the runtime** → [Tune the worker runtime](/how-to/tune-worker-runtime/) — concurrency,
  the permission presets, and the per-task timeout/retry knobs.

{{ comp.nextPrev({ prev: { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" }, next: { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" } }) }}
