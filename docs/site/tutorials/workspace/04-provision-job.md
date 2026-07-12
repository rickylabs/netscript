---
layout: layouts/base.vto
title: Provision with a background job
templateEngine: [vento, md]
prev: { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" }
next: { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" }
---

# Provision with a background job

Think about when a team actually adds a member. Often it is the worst possible moment: something is
broken, and the one person who understands the failing subsystem is not in the workspace yet. The
admin who pages them should get an instant "done" — not sit on a request that is writing a
membership row, warming a cache, and sending a welcome email before it answers. Provisioning is real
work, and none of it should block the request that triggered it. This chapter moves that work off
the request path: you add the **workers** plugin and author a `defineJobHandler` job that provisions
a member into the workspace database from chapter 3, then trigger it over the Workers API on
`:8091`. This is the same background-work seam a real NetScript app leans on — a production chat
application built on NetScript runs its embedding and vision jobs through the same `workers` plugin.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" },
  { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" },
  { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" },
  { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" },
  { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" },
  { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
] }) }}

## What you will build

A `provision-member` background job: a handler authored with `defineJobHandler` that parses a payload,
creates a `Member` in the workspace datasource, and returns a success result. By the end you trigger
it over the Workers API and watch its execution appear in the executions feed and its trace in the
Aspire dashboard.

## Before you begin

You need the workspace database from [chapter 3](/tutorials/workspace/03-workspace-data/) with
**Aspire running**. The workers plugin ships an API service and a background processor that Aspire
orchestrates. Confirm the workspace datasource is ready:

```sh
# In my-workspace/, with `aspire start` up in another terminal
netscript db status --db workspace   # the workspace datasource from chapter 3
```

{{ comp callout { type: "important", title: "Aspire first, then everything else" } }}
The Workers API on <code>:8091</code> and its background processor are resources in the Aspire graph,
and so is the <a href="https://localhost:18888">dashboard on <code>:18888</code></a> where you read job
traces. Start <code>aspire start</code> from <code>aspire/</code> <strong>before</strong> you add the
plugin or trigger a job, and leave it running.
{{ /comp }}

## Step 1 — Add the workers plugin

Add the workers plugin with its sample jobs so you have a working reference to read and adapt:

```sh
deno run -A packages/cli/bin/netscript-dev.ts plugin install worker --name workers --samples
netscript plugin list
```

The local-source contributor command lands the plugin at **`plugins/workers/`** — the canonical, config-referenced install location —
and registers it in `netscript.config.ts`. On disk you get a `jobs/` directory (the job-authoring
surface), a `services/src/` API on `:8091`, and `bin/combined.ts` (the background processor
entrypoint).

{{ comp callout { type: "note", title: "Author jobs in plugins/workers/" } }}
A scaffold may also create a slimmer top-level <code>workers/</code> directory that stages a subset of
files for the background processor. The real, config-referenced plugin lives at
<strong><code>plugins/workers/</code></strong> — that is what <code>netscript.config.ts</code> points
at and where you author jobs.
{{ /comp }}

## Step 2 — Read the job-authoring API

A job is a function wrapped by `defineJobHandler`, given a stable `id`, and exported as the module
default. Inside the handler you receive a `ctx`, do the work, and return a result built with
`createSuccessResult` or `createFailureResult`. The sample `plugins/workers/jobs/health-check.ts`
shows the shape and the `createJobTools(ctx)` helper surface:

{{ comp.tabbedCode({ tabs: [
  {
    label: "The job shape",
    lang: "ts",
    code: "import {\n  createSuccessResult,\n  createFailureResult,\n  defineJobHandler,\n} from '@netscript/plugin-workers-core';\nimport { createJobTools } from './job-tools.ts';\n\nconst handler = defineJobHandler(async (ctx) => {\n  const { log } = createJobTools(ctx);\n  log.info('doing work');\n\n  // ...do the work, return a result...\n  return createSuccessResult({ status: 'ok' });\n});\n\nexport default Object.assign(handler, { id: 'my-job' as const });"
  },
  {
    label: "The tool surface",
    lang: "ts",
    code: "// createJobTools(ctx) returns three helpers:\n//\n//   log.info / log.warn / log.error  — structured logging (REAL)\n//   progress(percent, message)        — handler-side progress hook\n//   trace.addEvent / trace.withChildSpan\n//\n// `id` is attached to the handler with Object.assign so the runtime\n// registry can address the job by a stable string."
  }
] }) }}

{{ comp callout { type: "tip", title: "How tracing actually works here (read this once)" } }}
Two layers, and they behave differently. <strong>The framework instruments the job for you.</strong>
When the background processor dispatches your handler it wraps the whole execution in real
OpenTelemetry spans — dispatch, execution, duration, status — which show up in the
<a href="https://localhost:18888">Aspire dashboard</a> automatically. What is <em>not</em> yet wired are
the <code>createJobTools(ctx)</code> helpers you call <em>inside</em> the handler:
<code>trace.addEvent</code>, <code>trace.withChildSpan</code>, and <code>progress(...)</code> are
currently no-op stubs in the scaffold (tracked debt). They will not throw and your code keeps working;
they just do not yet add custom spans. <code>log.*</code> emits real structured logs in every case. For
custom spans today, import from <code>@netscript/telemetry</code> directly.
{{ /comp }}

## Step 3 — Scaffold the provision-member job

Start from the workers scaffold instead of creating the module by hand:

The workers CLI calls this the `add-job` verb; its shell syntax uses the spaced `add job` form:

```sh
ns-workers add job provision-member
```

The command writes `workers/jobs/provision-member.ts` with the stable export, payload-schema block,
and handler wrapper already in place, then refreshes the worker registry. Extend the generated
payload schema with `workspaceId`, `subject`, and `role`; import `createFailureResult`; add the
workspace Prisma import and client; then replace only the starter handler body with this application
logic:

```ts
const handler = defineJobHandler(async (ctx) => {
  const parsed = PayloadSchema.safeParse(ctx.payload ?? {});
  if (!parsed.success) {
    return createFailureResult('invalid provision-member payload');
  }

  const { workspaceId, subject, role } = parsed.data;

  const member = await workspaceDb.member.create({
    data: { workspaceId, subject, role },
  });

  return createSuccessResult({ memberId: member.id, workspaceId, subject });
});
```

This is the whole job — small on purpose. The membership write happens off the request path, so the
caller that triggered provisioning never waits for it.

{{ comp callout { type: "note", title: "Triggering a job from your own code" } }}
This chapter triggers the job through <code>ns-workers</code> (Step 5) so you can watch it run. From inside another NetScript
runtime — a trigger or a scheduled job — you enqueue work with the builder's
<code>enqueueJob(...)</code> step rather than an HTTP call; that path is covered in the
<a href="/tutorials/storefront/05-shipping-webhook/">webhook tutorial</a> and the
<a href="/capabilities/background-jobs/">background-jobs capability</a>. For this track, the
runtime-backed CLI trigger is the clearest way to prove the job ran.
{{ /comp }}

## Step 4 — Confirm the generated registry

The Workers API addresses jobs by `id`, so the scaffold command refreshes the generated registry
before it returns. `provision-member` is already discoverable; do not run a second generation step.

{{ comp callout { type: "note", title: "Restart the processor if it was already running" } }}
If <code>aspire start</code> was up before you generated the registry, restart it (or let it hot-reload)
so the Workers API and its background processor pick up the new job.
{{ /comp }}

## Step 5 — Trigger the job

With Aspire up, the Workers API is live on **`:8091`**. Confirm the service is healthy and the job is
registered, then trigger it by its `id`. You need a real `workspaceId` — create a `Workspace` row
first (or use one your seed created) and pass its id:

```sh
# Health is still a plain liveness probe.
curl http://localhost:8091/health

# Inspect metadata, then enqueue through the durable workers API.
ns-workers show-job provision-member --json
ns-workers trigger provision-member \
  --payload='{ "workspaceId": "ws-1", "subject": "user:alice", "role": "member" }'
```

## Verify your progress

A trigger returns quickly because the work runs in the background. Confirm it actually executed by
reading the executions feed:

```sh
ns-workers executions --limit=10 --json
```

You should see an execution record for `provision-member` with a succeeded status and a result payload
carrying the new `memberId`. Then watch the same run in the Aspire **Traces** view at
[https://localhost:18888](https://localhost:18888) — the framework emits the dispatch/execution span
automatically.

{{ comp.apiTable({
  caption: "Workers API · :8091 (endpoints used here)",
  rows: [
    { name: "GET /health", type: "HTTP", desc: "Liveness check for the Workers API service." },
    { name: "ns-workers show-job {id} --json", type: "CLI", desc: "Inspect local job metadata by id." },
    { name: "ns-workers trigger {id} --payload=…", type: "CLI → :8091", desc: "Enqueue an execution through the durable workers API." },
    { name: "ns-workers executions --limit=10 --json", type: "CLI → :8091", desc: "Recent executions and their result payloads." }
  ]
}) }}

- [ ] `netscript plugin list` shows the `workers` plugin.
- [ ] `plugins/workers/jobs/provision-member.ts` exists and exports an `id`.
- [ ] `ns-workers show-job provision-member --json` shows its metadata.
- [ ] `ns-workers trigger` returns quickly, and `ns-workers executions` shows it succeeded with a `memberId`.
- [ ] The job-dispatch trace appears in the Aspire Traces view.

{{ comp callout { type: "important", title: "If the execution never appears" } }}
<ul>
<li><strong>Aspire isn't running</strong> — the background processor that drains the queue is an Aspire
resource. Start <code>aspire start</code> from <code>aspire/</code> and retry.</li>
<li><strong>The job isn't registered</strong> — re-run <code>netscript generate plugins</code> so
<code>provision-member</code> is in the registry, then restart Aspire.</li>
<li><strong>Wrong id</strong> — the trigger path uses the job's <code>id</code>
(<code>provision-member</code>), not its filename. Check <code>GET /api/v1/workers/jobs</code>.</li>
</ul>
{{ /comp }}

## What you built

A `provision-member` background job that writes a workspace membership off the request path, triggered
over the Workers API on `:8091` and observable in the Aspire dashboard. The caller gets an instant
acknowledgment; the membership write happens reliably in the background. One gap remains, and it is
the serious one: the `workspace` service itself still answers anyone who asks. Next you close the
loop and make its routes fail closed.

{{ comp.nextPrev({ prev: { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" }, next: { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" } }) }}
</content>
