---
layout: layouts/base.vto
title: A CSV file-watch import job
templateEngine: [vento, md]
prev: { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" }
next: { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" }
---

# A CSV file-watch import job

In [Chapter 1](/tutorials/erp-sync/01-scaffold/) you stood up `my-erp/` with the workers and
triggers plugins running. Now you wire the first real piece of the pipeline: a **file-watch trigger**
that fires the moment a supplier drops a CSV into a watched folder, and a durable **background job**
that parses it. This is the ingest core of an ERP sync — an inbound file becomes durable background
work.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" },
  { label: "2 · Import job", href: "/tutorials/erp-sync/02-import-job/" },
  { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" },
  { label: "4 · Queue & cron", href: "/tutorials/erp-sync/04-queue-and-cron/" },
  { label: "5 · Deploy", href: "/tutorials/erp-sync/05-deploy/" }
] }) }}

## What you will build

By the end of this chapter, dropping a file named `products_*.csv` into
`my-erp/.data/incoming/products` will automatically enqueue and run a worker job that reads the file,
parses its rows, logs a summary, and returns a structured success result — all without any HTTP call.
You author two files: a **trigger** (`defineFileWatch`) and a **job** (`defineJobHandler`), then
register the job so the trigger can address it by `id`.

## Before you begin

You need the workspace from [Chapter 1](/tutorials/erp-sync/01-scaffold/) with **both** the workers
and triggers plugins installed, and `aspire start` healthy. Confirm the prior state from the project
root:

```sh
netscript plugin list
```

Expected: `workers` and `triggers` both appear. Also confirm Aspire is up — the file-watch processor
and the workers runtime both depend on it:

```sh
curl http://localhost:8091/health   # workers API, healthy JSON
curl http://localhost:8093/health   # triggers API, healthy JSON
```

If either is missing, return to Chapter 1 — do not start over.

## Step 1 — Create the watched folder

The trigger watches a directory; create it (and the staging path suppliers will write to) so the
watcher has something to attach to:

```sh
mkdir -p .data/incoming/products
```

This is just a local folder in your workspace. In production it would be a mounted share or sync
target the supplier writes to; the trigger does not care where the bytes come from, only that a
matching file appears.

## Step 2 — Author the import job

A NetScript job is a function wrapped by `defineJobHandler`, given a stable `id`, and exported as the
module default. Inside the handler you receive a `ctx` carrying the payload, do the work, and return
a result built with `createSuccessResult` / `createFailureResult`. Create the job under the workers
plugin:

```ts
// plugins/workers/jobs/import-products.ts
import {
  createFailureResult,
  createSuccessResult,
  defineJobHandler,
} from '@netscript/plugin-workers-core';
import { z } from 'zod';

// The file-watch trigger hands the job the path of the file that landed.
const ImportProductsPayloadSchema = z.object({
  filePath: z.string().min(1),
  fileName: z.string().min(1),
});

const handler = defineJobHandler(async (ctx) => {
  const { filePath, fileName } = ImportProductsPayloadSchema.parse(ctx.payload ?? {});

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

export default Object.assign(handler, { id: 'import-products' });
```

The two things to read off this: the handler is an `async`/arrow function (never a bare `function`),
and the stable `id` is attached with `Object.assign` so the runtime registry can address the job by a
predictable string rather than its filename.

{{ comp callout { type: "tip", title: "Jobs do one thing" } }}
This handler reads, parses, and reports — and stops. In a fuller ERP sync the next step (validate,
upsert into a service, publish a saga message) would be its own job or a saga, keeping each unit
small and independently retryable. The scaffold's <code>--samples</code> jobs show that fuller chain
under <code>plugins/workers/jobs/</code>; for this track one job is enough to prove the pipeline.
{{ /comp }}

## Step 3 — Author the file-watch trigger

Now the trigger. `defineFileWatch(handler, spec)` comes from
`@netscript/plugin-triggers-core/builders`. The handler returns an **array of effects**; the one you
want is `enqueueJob(jobRef, { payload })`, which hands a worker job the inbound event. The job is
referenced by a small typed object — its `id`, `name`, `topic`, and `entrypoint`.

```ts
// plugins/triggers/product-import.ts
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

Read the `spec` carefully — it is the whole behavior of the watcher:

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
A supplier copying a large file appears on disk before it is fully written. Without a stability
check the watcher would fire on the first byte and your job would read a truncated CSV. The
<code>checkIntervalMs: 1000, stableChecks: 2</code> here waits for the size to hold steady for two
one-second polls before enqueuing — set it generously for large files on slow shares.
{{ /comp }}

## Step 4 — Register the job

The trigger addresses the job by `id`, which means the workers runtime needs a generated registry
that maps each `id` to its handler. Generate the plugin registries:

```sh
netscript generate plugins
```

This scans `plugins/workers/jobs` (and the triggers plugin) and writes a registry the running
services load. After this, `import-products` is addressable, and `product-import-trigger` is loaded
by the file-watch processor.

{{ comp callout { type: "note", title: "Restart the processors after generating" } }}
If <code>aspire start</code> was up before you generated the registry, restart it (or let it
hot-reload) so the workers runtime and the file-watch processor pick up the new job and trigger.
{{ /comp }}

## Verify your progress

With Aspire up, drop a matching CSV into the watched folder and watch the pipeline run end to end.
First create a sample file:

```sh
cat > .data/incoming/products_2024.csv <<'CSV'
name,sku,price
Widget,WID-1,9.99
Gadget,GAD-2,19.99
CSV
mv .data/incoming/products_2024.csv .data/incoming/products/products_2024.csv
```

Moving the finished file into the watched folder fires a single `create` event (and avoids the
watcher seeing a half-written file). Now confirm both sides of the hand-off:

```sh
# 1. The trigger recorded the inbound file event (:8093).
curl 'http://localhost:8093/api/v1/events?limit=10'

# 2. The job it enqueued executed (:8091).
curl 'http://localhost:8091/api/v1/workers/executions?limit=10'
```

Expected: the events feed lists a `product-import-trigger` event, and the executions feed shows a
completed `import-products` run whose result is `{ "fileName": "products_2024.csv", "rowCount": 2,
"headers": ["name","sku","price"] }`. Open the `workers` resource logs in the
[Aspire dashboard](https://localhost:18888) to read the job's structured log lines.

- [ ] `.data/incoming/products/` exists and you dropped a `products_*.csv` into it.
- [ ] The triggers events feed shows a `product-import-trigger` event.
- [ ] The workers executions feed shows a completed `import-products` run with `rowCount: 2`.
- [ ] `deno task check` is clean.

{{ comp callout { type: "warning", title: "If the job never runs" } }}
<ul>
<li><strong>Aspire isn't up</strong> — the file-watch processor and the workers runtime are Aspire
resources. Start <code>aspire start</code> from <code>aspire/</code> and retry.</li>
<li><strong>The job isn't registered</strong> — re-run <code>netscript generate plugins</code> so
<code>import-products</code> is in the generated registry, then restart Aspire.</li>
<li><strong>Filename didn't match</strong> — the pattern is <code>products_*.csv</code>. A file
named <code>catalog.csv</code> in the same folder is ignored by design.</li>
<li><strong>Wrong folder</strong> — the file must land inside <code>.data/incoming/products</code>,
the directory in <code>paths</code>, not its parent.</li>
</ul>
{{ /comp }}

## What you built

A file-watch trigger (`defineFileWatch`) that fires on every `products_*.csv` landing in a watched
folder, and a durable background job (`defineJobHandler`) that parses it — wired together by
`enqueueJob` and made addressable with `netscript generate plugins`. An inbound file now becomes
durable background work with no HTTP in the loop. Next, you will see how a non-TypeScript step could
join this pipeline.

{{ comp.nextPrev({ prev: { label: "1 · Scaffold", href: "/tutorials/erp-sync/01-scaffold/" }, next: { label: "3 · Polyglot transform", href: "/tutorials/erp-sync/03-polyglot-transform/" } }) }}
