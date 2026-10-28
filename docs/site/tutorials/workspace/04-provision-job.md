---
layout: layouts/base.vto
title: Provision with a background job
templateEngine: [vento, md]
prev: { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" }
next: { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" }
---

# Provision with a background job

In this chapter you move member provisioning off the request path. You add the **workers** plugin,
write a `defineJobHandler` job that adds a member to the workspace database from chapter 3, and
trigger it through the Workers API. The caller that starts provisioning gets an immediate answer
while the membership write runs in the background.

{{ comp.learningPath({ steps: [
  { label: "1 · Scaffold", href: "/tutorials/workspace/01-scaffold/" },
  { label: "2 · Auth", href: "/tutorials/workspace/02-auth/" },
  { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" },
  { label: "4 · Provision job", href: "/tutorials/workspace/04-provision-job/" },
  { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" },
  { label: "6 · Deploy", href: "/tutorials/workspace/06-deploy/" }
] }) }}

## What you will build

A `provision-member` background job: a handler written with `defineJobHandler` that parses a
payload, creates a `Member` in the workspace datasource, and returns a success result. At the end you
trigger it through the Workers API and see its execution in the executions feed and its trace in the
Aspire dashboard.

## Before you begin

You need the workspace database from [chapter 3](/tutorials/workspace/03-workspace-data/) with
**`aspire start` running**. The workers plugin ships an API service and a background processor that
Aspire orchestrates, and the [dashboard on `:18888`](https://localhost:18888) is where you read job
traces. Keep Aspire running while you add the plugin and trigger the job. Check that the workspace
datasource is ready:

```sh
# In my-workspace/, with `aspire start` up in another terminal
netscript db status --db workspace   # the workspace datasource from chapter 3
```

## Step 1 — Add the workers plugin

Add the workers plugin with its sample jobs, so you have a working reference to read:

```sh
deno run -A packages/cli/bin/netscript-dev.ts plugin install worker --name workers --samples
netscript plugin list
```

The local-source contributor command installs the plugin at **`plugins/workers/`**, the canonical,
config-referenced location, and registers it in `netscript.config.ts`. On disk you get a `jobs/`
directory for job modules, a `services/src/` API, and `bin/combined.ts`, the background processor
entrypoint.

{{ comp callout { type: "note", title: "Author jobs in plugins/workers/" } }}
A scaffold may also create a slimmer top-level <code>workers/</code> directory that stages a subset of
files for the background processor. The config-referenced plugin lives at
<strong><code>plugins/workers/</code></strong>: <code>netscript.config.ts</code> points there, and
that is where you write jobs.
{{ /comp }}

## Step 2 — Read the job-authoring API

A job is a function wrapped by `defineJobHandler`, given a stable `id`, and exported as the module
default. The handler receives a `ctx`, does the work, and returns a result built with
`createSuccessResult` or `createFailureResult`. The sample `plugins/workers/jobs/health-check.ts`
shows the shape and the `createJobTools(ctx)` helpers:

{{ comp.tabbedCode({ tabs: [
  {
    label: "The job shape",
    lang: "ts",
    code: "import {\n  createSuccessResult,\n  createFailureResult,\n  defineJobHandler,\n} from '@netscript/plugin-workers-core';\nimport { createJobTools } from './job-tools.ts';\n\nconst handler = defineJobHandler(async (ctx) => {\n  const { log } = createJobTools(ctx);\n  log.info('doing work');\n\n  // ...do the work, return a result...\n  return createSuccessResult({ status: 'ok' });\n});\n\nexport default Object.assign(handler, { id: 'my-job' as const });"
  },
  {
    label: "The tool surface",
    lang: "ts",
    code: "// createJobTools(ctx) returns three helpers:\n//\n//   log.info / log.warn / log.error  — console-backed logging\n//   progress(percent, message)        — telemetry + runtime progress hook\n//   trace.addEvent / trace.withChildSpan — active-span event + real child span\n//\n// `id` is attached to the handler with Object.assign so the runtime\n// registry can address the job by a stable string."
  }
] }) }}

{{ comp callout { type: "tip", title: "How tracing works" } }}
The framework wraps each execution in OpenTelemetry spans, so dispatch, execution, duration and
status appear in the <a href="https://localhost:18888">Aspire dashboard</a> without extra code. The
<code>createJobTools(ctx)</code> helpers add detail to that trace: <code>trace.addEvent</code> records
events, <code>trace.withChildSpan</code> records timed child work, and <code>progress(...)</code>
records progress and forwards it to the workers runtime. <code>log.*</code> stays console-backed.
{{ /comp }}

## Step 3 — Scaffold the provision-member job

Generate the job module with the workers CLI rather than writing it by hand. The CLI's `add-job`
verb is written as `add job` on the command line.

{{ comp callout { type: "note", title: "ns-workers is a shorthand you install once" } }}
<code>ns-workers</code> is a name <em>you</em> give the workers plugin's CLI; the scaffold doesn't
create it. Install it once, globally, and every <code>ns-workers</code> command on this page works as
written:
<pre><code class="language-bash">deno install -gArf -n ns-workers jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli</code></pre>
To skip the install, run each <code>ns-workers &lt;verb …&gt;</code> as
<code>deno x -A jsr:@netscript/plugin-workers{{ releaseSpecifier }}/cli &lt;verb …&gt;</code>.
{{ /comp }}

```sh
ns-workers add job provision-member
```

The command writes `workers/jobs/provision-member.ts` with the stable export, the payload-schema
block and the handler wrapper in place, then refreshes the worker registry. Edit the generated file:

1. Extend the generated payload schema with `workspaceId`, `subject` and `role`.
2. Import `createFailureResult`.
3. Add the workspace Prisma import and client.
4. Replace the starter handler body with this logic:

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

That is the whole job. The membership write happens off the request path, so the caller that
triggered provisioning never waits for it.

{{ comp callout { type: "note", title: "Triggering a job from your own code" } }}
This chapter triggers the job with <code>ns-workers</code> (Step 5) so you can watch it run. Inside
another NetScript runtime, such as a trigger or a scheduled job, you enqueue work with the builder's
<code>enqueueJob(...)</code> step instead of an HTTP call. The
<a href="/tutorials/storefront/05-shipping-webhook/">webhook tutorial</a> and the
<a href="/capabilities/background-jobs/">background-jobs capability</a> cover that path.
{{ /comp }}

## Step 4 — Confirm the generated registry

The Workers API addresses jobs by `id`, and the scaffold command refreshed the generated registry
before it returned. `provision-member` is already discoverable; don't run a second generation step.

If `aspire start` was already up when you generated the registry, restart it (or let it hot-reload)
so the Workers API and its background processor pick up the new job.

## Step 5 — Trigger the job

The installer picked the Workers API host port, so copy the `workers-api` endpoint from the
[dashboard](/explanation/aspire/) resource list. Check the service is healthy and the job is
registered, then trigger it by its `id`. You need a real `workspaceId`: create a `Workspace` row
first, or use one your seed created, and pass its id:

```sh
# Health is still a plain liveness probe.
curl <workers-endpoint>/health

# Inspect metadata, then enqueue through the durable workers API.
ns-workers show-job provision-member --json
ns-workers trigger provision-member \
  --payload='{ "workspaceId": "ws-1", "subject": "user:alice", "role": "member" }'
```

## Verify your progress

A trigger returns quickly because the work runs in the background. Read the executions feed to
confirm it ran:

```sh
ns-workers executions --limit=10 --json
```

You see an execution record for `provision-member` with a succeeded status and a result payload
carrying the new `memberId`. The same run appears in the Aspire **Traces** view at
[https://localhost:18888](https://localhost:18888), where the framework emits the dispatch and
execution span.

{{ comp.apiTable({
  caption: "Workers API (endpoints used here)",
  rows: [
    { name: "GET /health", type: "HTTP", desc: "Liveness check for the Workers API service." },
    { name: "ns-workers show-job {id} --json", type: "CLI", desc: "Inspect local job metadata by id." },
    { name: "ns-workers trigger {id} --payload=…", type: "CLI", desc: "Enqueue an execution through the durable workers API." },
    { name: "ns-workers executions --limit=10 --json", type: "CLI", desc: "Recent executions and their result payloads." }
  ]
}) }}

- [ ] `netscript plugin list` shows the `workers` plugin.
- [ ] `plugins/workers/jobs/provision-member.ts` exists and exports an `id`.
- [ ] `ns-workers show-job provision-member --json` shows its metadata.
- [ ] `ns-workers trigger` returns quickly, and `ns-workers executions` shows it succeeded with a `memberId`.
- [ ] The job-dispatch trace appears in the Aspire Traces view.

{{ comp callout { type: "tip", title: "If the execution never appears" } }}
<ul>
<li><strong>Aspire isn't running.</strong> The background processor that drains the queue is an
Aspire resource. Run <code>aspire start</code> from <code>aspire/</code> and retry.</li>
<li><strong>The job isn't registered.</strong> Re-run <code>netscript generate plugins</code> so
<code>provision-member</code> is in the registry, then restart Aspire.</li>
<li><strong>Wrong id.</strong> The trigger uses the job's <code>id</code>
(<code>provision-member</code>), not its filename. Check <code>GET /api/v1/workers/jobs</code>.</li>
</ul>
{{ /comp }}

## What you built

A `provision-member` background job that writes a workspace membership off the request path,
triggered through the Workers API and visible in the Aspire dashboard. The `workspace` service itself
still answers anyone who asks. Next, you make its routes fail closed.

{{ comp.nextPrev({ prev: { label: "3 · Workspace data", href: "/tutorials/workspace/03-workspace-data/" }, next: { label: "5 · Route authz", href: "/tutorials/workspace/05-route-authz/" } }) }}
