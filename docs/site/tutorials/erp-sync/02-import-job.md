---
layout: layouts/base.vto
title: A CSV file-watch import job
templateEngine: [vento, md]
prev: { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" }
next: { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" }
---

# A CSV file-watch import job

This chapter builds the ingest core of the pipeline: a **file-watch trigger** that fires when the
SAP export drops a CSV into the hand-off folder, and a durable **background job** that parses it.
A file the watcher misses is a day of catalog changes Dynamics never sees, and a file parsed twice
is a day counted twice; both failures start here.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" },
  { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" },
  { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" },
  { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" },
  { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" }
] }) }}

## What you will build

Dropping a file named `products_*.csv` into `my-erp/.data/incoming/products` enqueues and runs a
worker job that reads the file, parses its rows, logs a summary and returns a structured success
result, with no HTTP call. You author two files, a **trigger** (`defineFileWatch`) and a **job**
(`defineJobHandler`), and register the job so the trigger can address it by `id`.

## Before you begin

You need the workspace from [chapter 1](/tutorials/erp-sync/01-scaffold/) with the workers and
triggers plugins installed and `aspire start` healthy. If either check below fails, return to
chapter 1; you don't need to start over.

1. From the project root, confirm both plugins are installed:

   ```sh
   netscript plugin list
   ```

   `workers` and `triggers` should both appear.

2. Confirm Aspire is up. The file-watch processor and the workers runtime both depend on it:

   ```sh
   curl <workers-endpoint>/health    # workers API, healthy JSON
   curl <triggers-endpoint>/health   # triggers API, healthy JSON
   ```

3. Install the plugin CLI shorthands. `ns-workers` and `ns-triggers` are names *you* give the
   workers and triggers plugin CLIs; the scaffold does not create them. Install them once,
   globally, and every shorthand command in this track works as written:

   ```bash
   deno install -gArf -n ns-workers jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli
   deno install -gArf -n ns-triggers jsr:@netscript/plugin-triggers{{ releaseSpecifier }}/cli
   ```

   To skip the install, run the full form instead: each `ns-<plugin> <verb …>` is exactly
   `deno x -A jsr:@netscript/plugin-<plugin>{{ releaseSpecifier }}/cli <verb …>`.

## Step 1 — Create the watched folder

The trigger watches a directory. Create it, and with it the staging path suppliers write to, so
the watcher has something to attach to:

```sh
mkdir -p .data/incoming/products
```

This is a local folder in your workspace. In production it would be the mounted share the SAP
nightly export writes into. The trigger does not care where the bytes come from, only that a
matching file appears.

## Step 2 — Scaffold the import job

A NetScript job is a function wrapped by `defineJobHandler`, given a stable `id` and exported as
the module default. The handler receives a `ctx` carrying the payload, does the work and returns a
result built with `createSuccessResult` or `createFailureResult`. Let the workers CLI create the
payload schema, handler wrapper, stable export and registry entry:

```sh
ns-workers add job import-products
```

Open {{ comp.filePathChip({ path: "workers/jobs/import-products.ts" }) }}. Extend the generated
`PayloadSchema` with `filePath` and `fileName`, import `createFailureResult`, and replace only the
starter handler body with the CSV logic below:

```ts
const handler = defineJobHandler(async (ctx) => {
  const { filePath, fileName } = PayloadSchema.parse(ctx.payload ?? {});

  // 1. Read the staged file.
  let rawContent: string;
  try {
    rawContent = await Deno.readTextFile(filePath);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return createFailureResult(`Failed to read ${fileName}: ${message}`);
  }

  // 2. Parse a simple CSV (header row + data rows). No external lib needed.
  const lines = rawContent.trim().split('\n').filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return createFailureResult('CSV is empty or has no data rows');
  }
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => row[h] = values[i] ?? '');
    return row;
  });

  // 3. Return a structured result. The runtime records it on the execution.
  return createSuccessResult({ fileName, rowCount: rows.length, headers });
});
```

Two conventions matter here. The handler is an `async` arrow function, never a bare `function`.
The stable `id` is attached with `Object.assign`, so the runtime registry addresses the job by a
predictable string rather than its filename.

{{ comp callout { type: "tip", title: "Jobs do one thing" } }}
This handler reads, parses and reports, then stops. In a fuller ERP sync the next step (validate, upsert into a service, publish a saga message) would be its own job or a saga, so each unit stays small and independently retryable. The <code>--samples</code> jobs under <code>plugins/workers/jobs/</code> show that fuller chain; for this track one job is enough to prove the pipeline.
{{ /comp }}

## Step 3 — Scaffold the file-watch trigger

Scaffold the watcher with the triggers CLI. The `add-file-watch` verb is written with a space, as
`add file-watch`:

```sh
ns-triggers add file-watch product-import-trigger \
  --path=.data/incoming/products \
  --pattern=products_*.csv
```

The command writes `triggers/product-import-trigger.ts` and refreshes the trigger registry.

## Step 4 — Enqueue the job from the trigger

The file-watch command scaffolds a neutral handler. Open
{{ comp.filePathChip({ path: "triggers/product-import-trigger.ts" }) }} and replace the generated
handler with the enqueue effect below.

`defineFileWatch(handler, spec)` comes from `@netscript/plugin-triggers-core/builders`. The handler
returns an **array of effects**; the one you want is `enqueueJob(jobRef, { payload })`, which hands
the inbound event to a worker job. The job is referenced by a small typed object: its `id`, `name`,
`topic` and `entrypoint`.

```ts
import { defineFileWatch, enqueueJob } from '@netscript/plugin-triggers-core/builders';
import type { JobDefinition } from '@netscript/plugin-workers-core';

// A reference to the worker job authored in Step 2.
const importProductsJob = {
  id: 'import-products' as JobDefinition<'import-products'>['id'],
  name: 'Import Products',
  topic: 'default',
  entrypoint: './workers/jobs/import-products.ts',
} satisfies JobDefinition<'import-products'>;

export default defineFileWatch(
  // event.payload carries filePath / fileName for the matched file.
  (event) => Promise.resolve([enqueueJob(importProductsJob, { payload: event.payload })]),
  {
    id: 'product-import-trigger',
    paths: ['.data/incoming/products'],
    patterns: ['products_*.csv'],
    on: ['create'],
    stabilityThreshold: { checkIntervalMs: 1000, stableChecks: 2 },
    description: 'Watches for product CSV files and starts the import job.',
    tags: ['file-watch', 'product', 'import'],
  },
);
```

The `spec` defines the watcher's whole behavior:

{{ comp.apiTable({
  caption: "FileWatchSpec — the static fields you set on defineFileWatch",
  rows: [
    { name: "id", type: "string", desc: "Stable identifier for this trigger, used in logs and the events feed." },
    { name: "paths", type: "string[]", desc: "Directories to watch. Here, the .data/incoming/products folder you created in Step 1." },
    { name: "patterns", type: "string[]", desc: "Glob patterns a file must match to fire the handler. products_*.csv ignores everything else." },
    { name: "on", type: "('create' | 'modify' | 'remove')[]", desc: "Which filesystem events fire the trigger. 'create' = a new file landing." },
    { name: "stabilityThreshold", type: "{ checkIntervalMs, stableChecks }", desc: "Debounce: wait until the file size is unchanged across stableChecks polls before firing, so a half-written upload is never parsed." }
  ]
}) }}

{{ comp callout { type: "important", title: "stabilityThreshold is not optional polish" } }}
A supplier copying a large file creates it on disk before it is fully written. Without a stability check, the watcher fires on the first byte and your job reads a truncated CSV. <code>checkIntervalMs: 1000, stableChecks: 2</code> waits for the size to hold steady for two one-second polls before enqueuing. Set it generously for large files on slow shares.
{{ /comp }}

## Step 5 — Register the job

The trigger addresses the job by `id`, so the workers runtime needs a generated registry that maps
each `id` to its handler. Generate the plugin registries:

```sh
netscript generate plugins
```

For workers, the command scans the project's top-level `workers/jobs/*.ts` modules and skips
declared helpers such as `job-tools.ts`; it does not require an official sample filename. It also
discovers plugin-contributed jobs and triggers, then writes the generated registries the running
services load. `import-products` is now addressable, and the file-watch processor loads
`product-import-trigger`. Regenerate after adding or replacing a job, and never edit
`.netscript/generated/**` by hand.

{{ comp callout { type: "note", title: "Restart the processors after generating" } }}
If <code>aspire start</code> was up before you generated the registry, restart it (or let it hot-reload) so the workers runtime and the file-watch processor pick up the new job and trigger.
{{ /comp }}

## Verify your progress

With Aspire up, drop a matching CSV into the watched folder and watch the pipeline run.

1. Create a sample file in the SAP export shape (legacy column names, prices in integer cents) and
   move it into the watched folder. Chapter 3 transforms this exact file into Dynamics' shape.

   ```sh
   cat > .data/incoming/products_2024.csv <<'CSV'
   material_no,description,price_cents
   WID-1,Widget,999
   GAD-2,Gadget,1999
   CSV
   mv .data/incoming/products_2024.csv .data/incoming/products/products_2024.csv
   ```

   Moving the finished file in fires a single `create` event, and the watcher never sees a
   half-written file.

2. Confirm both sides of the hand-off:

   ```sh
   # 1. The trigger recorded the inbound file event.
   curl '<triggers-endpoint>/api/v1/events?limit=10'

   # 2. The job it enqueued executed.
   ns-workers executions --limit=10 --json
   ```

   The events feed lists a `product-import-trigger` event. The executions feed shows a completed
   `import-products` run whose result is `{ "fileName": "products_2024.csv", "rowCount": 2,
   "headers": ["material_no","description","price_cents"] }`.

3. Open the `workers` resource logs in the [Aspire dashboard](https://localhost:18888) to read the
   job's structured log lines.

- [ ] `.data/incoming/products/` exists and you dropped a `products_*.csv` into it.
- [ ] The triggers events feed shows a `product-import-trigger` event.
- [ ] The workers executions feed shows a completed `import-products` run with `rowCount: 2`.
- [ ] `deno task check` is clean.

{{ comp callout { type: "tip", title: "If the job never runs" } }}
<ul>
<li><strong>Aspire isn't up.</strong> The file-watch processor and the workers runtime are Aspire resources. Start <code>aspire start</code> from <code>aspire/</code> and retry.</li>
<li><strong>The job isn't registered.</strong> Re-run <code>netscript generate plugins</code> so <code>import-products</code> is in the generated registry, then restart Aspire.</li>
<li><strong>The filename didn't match.</strong> The pattern is <code>products_*.csv</code>; a file named <code>catalog.csv</code> in the same folder is ignored by design.</li>
<li><strong>Wrong folder.</strong> The file must land inside <code>.data/incoming/products</code>, the directory in <code>paths</code>, not its parent.</li>
</ul>
{{ /comp }}

## What you built

A file-watch trigger (`defineFileWatch`) that fires on every `products_*.csv` the SAP export drops
into the hand-off folder, and a durable background job (`defineJobHandler`) that parses it, wired
together by `enqueueJob` and made addressable with `netscript generate plugins`. The imported rows
are still in the legacy shape, with column names Dynamics does not use and prices in cents. Next,
you build and run the transform stage that fixes them.
