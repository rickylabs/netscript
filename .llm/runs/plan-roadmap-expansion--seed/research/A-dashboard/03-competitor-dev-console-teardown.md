# Competitor Dev-Console Teardown — Topic A (NetScript Dev Dashboard)

**Slice:** Stage-B competitor dev-console IA teardown. Purpose: distill the panel/interaction
vocabulary of established local dev dashboards so the NetScript dashboard plugin's IA is grounded in
precedent, not invented. Feeds `matrix/A-dashboard/_draft-competitor-rows.md`.

**Method:** Read all in-repo competitor doc-teardowns under
`docs/site/_plan/research/competitors/*.md` (these are **documentation-IA** teardowns, not
dev-console teardowns — noted below), then extended with fresh web research (July 2026) on each
tool's actual dev-console/dashboard UI.

**Category caveat (important):** these tools span three different console categories. Treat them as
**reference vocabulary, not a single blueprint** —
- **Infra + observability consoles** (Encore dev-dash, Nitro devtools) — closest analog to what a
  NetScript dev dashboard is: a code-derived map of the running local stack.
- **Durable-execution / run consoles** (Temporal Web UI, Inngest dev server, Trigger.dev) — the
  run-list → run-detail → step-timeline pattern; directly relevant to NetScript's
  sagas/workers/triggers/streams plugins which each produce "runs".
- **Data-CRUD browsers** (Prisma Studio) — a *different category*: table/record browse+edit, not
  infra/observability. Relevant only as a "data" tab precedent, and NetScript already ships Aspire +
  the `db` surface here.

In-repo files are doc-site IA teardowns (sidebar model, Diátaxis usage, hero design), NOT dashboard
UI teardowns — they describe how each competitor *documents* itself. The dashboard-UI detail below
is from fresh web research. Both are cited.

---

## 1. Encore — Local Development Dashboard
**Refs:** [dev-dash docs](https://encore.dev/docs/ts/observability/dev-dash) ·
[Service Catalog](https://encore.dev/docs/ts/observability/service-catalog) ·
[Local Development feature](https://encore.dev/features/local-development) · in-repo
`docs/site/_plan/research/competitors/encore.md`

The gold-standard "code-as-infrastructure" local console and the **single closest analog** to what
NetScript's dashboard should be. Launches automatically on `encore run`, served at
**`localhost:9400`**, and every panel updates in real-time as source changes.

Panels / views:
- **Service Catalog** — auto-generated API documentation for every service, compiled directly from
  the TypeScript/Go source (Encore parses the AST). Lists endpoints, request/response types.
- **API Explorer** — call any endpoint directly from the browser; request params are **pre-filled
  from the type definitions**; responses formatted for readability. (The single highest-value
  interaction — turns the catalog from read-only docs into a live client.)
- **Encore Flow** — a live, interactive **architecture diagram** of the backend: API nodes wired to
  databases, pub/sub queues, cron jobs; updates in real-time as code changes. This is the
  "signature spark" element the in-repo teardown calls "legendary" — code compiled into a visual
  infra map.
- **Distributed Tracing** — per-request traces surfaced in a right-hand column; click a request to
  see the full **trace waterfall** with request/response payloads, DB queries, pub/sub publishes.

**Distillation for NetScript:** the Flow map ≈ an Aspire-resource / plugin-contribution graph;
Service Catalog + API Explorer ≈ an oRPC-contract explorer that calls live endpoints; trace column ≈
the OTEL/telemetry surface (Topic B). Encore proves the *auto-derived-from-code* console is the
differentiator, not hand-authored dashboards.

---

## 2. Temporal — Web UI
**Refs:** [Web UI docs](https://docs.temporal.io/web-ui) ·
[Events & Event History](https://docs.temporal.io/workflow-execution/event) ·
[Timeline View blog](https://temporal.io/blog/lets-visualize-a-workflow) · in-repo
`docs/site/_plan/research/competitors/temporal.md`

The canonical **durable-execution run console**. Directly relevant to NetScript sagas/workers
(NetScript's `@netscript/plugin-sagas-core` is the light local analog of Temporal workflows).

Panels / views:
- **Workflow List** — a searchable table of all Workflow Executions in the retention window per
  **namespace**. Filter by workflow type, status (Running / Completed / Failed / Timed Out /
  Terminated), time range; search by Workflow ID. The primary "what ran" entry point.
- **Workflow Execution Detail** — click a workflow to open: execution summary (type, Workflow ID,
  Run ID, status, timestamps), **inputs and results**, and the full event history.
- **Event History views** — three toggles:
  - *All* — every low-level History Event including Workflow Tasks.
  - *Compact* — logical grouping of Activities, Signals, Timers (the human-readable view).
  - *JSON* — full raw JSON of the workflow history.
  Rendered git-tree-style, connecting events in the same Event Group.
- **Timeline View** — chronological (or reverse) visualization of events with per-event summaries;
  click an event to expand all details.
- **Task Queue view** — shows the **Workers currently polling** a Task Queue with a live count;
  surfaces an error if no workers are polling; summarizes recently-active/pending Activity
  Executions.

**Distillation for NetScript:** run-list → run-detail → event-history is the exact IA for a
saga/worker/trigger run inspector. The "workers currently polling / count / error-if-none" view maps
cleanly onto NetScript worker health. The Compact-vs-All-vs-JSON history toggle is a strong pattern
for showing saga step history at multiple altitudes.

---

## 3. Inngest — Dev Server UI
**Refs:** [Inngest repo](https://github.com/inngest/inngest) ·
[Inspecting a Function run](https://www.inngest.com/docs/platform/monitor/inspecting-function-runs) ·
[Traces](https://www.inngest.com/docs/platform/monitor/traces)

Local **dev server** (`npx inngest-cli dev`) with a run-inspector UI. Very close to the NetScript
triggers/workers use-case (event-driven step functions).

Panels / views:
- **Function Runs list** — click a run to see which function was triggered, its payload, output, and
  timeline.
- **Trace / Timeline view** — a **two-panel layout with a resizable divider**:
  - *Left panel* — run-info header + an interactive **waterfall timeline** of execution bars. Each
    bar = a span (a step); bars positioned proportionally to start-time and duration relative to the
    whole run; time markers at 0/25/50/75/100%; each bar shows step name + icon + duration.
  - *Right panel* — contextual details for the selected step or the run.
- **Step details panel** — opens on selecting a step bar: shows an **Attempt badge** ("Attempt N"
  when retried, colored by status), the step's output, and a **"Rerun from step"** button to
  re-execute the function starting at that step.
- **Rerun / Cancel** — top-level "Rerun" (replay) and "Cancel" actions on a run; a replayed run
  appears as a second run in the list.

**Distillation for NetScript:** the resizable two-panel (timeline-left / details-right) is the
ergonomic standard for step-function inspection. **Rerun-from-step** and **Attempt badges** are
concrete interactions worth mirroring for saga compensation debugging.

---

## 4. Trigger.dev — Dashboard / Run Inspector
**Refs:** [Logging/tracing/metrics](https://trigger.dev/docs/logging) ·
[Observability & monitoring](https://trigger.dev/product/observability-and-monitoring) ·
[Run inspector improvements](https://trigger.dev/changelog/run-page-inspector) ·
[Realtime](https://trigger.dev/product/realtime)

A **managed** run console (not purely local) but the run-list/run-detail IA is the reference. Built
on **OpenTelemetry** end-to-end — relevant because NetScript's telemetry story (Topic B) is
OTEL-based too.

Panels / views:
- **Runs list** — filter by status, name, environment, and more to isolate queued / errored /
  waiting tasks. Updates **in place**: statuses change live, a banner flags new runs, parent
  tooltips show child-run breakdowns.
- **Run page / trace view** — a real-time **hierarchical trace** (OTel-powered) of each task as it
  executes, showing span timing, logs inline, and any subtasks/child runs triggered. Logs stream
  live into the trace.
- **Run inspector tabs:**
  - *Detail* tab — full list of run data (tags, usage/cost data).
  - *Context* tab — the run context accessible inside the run function.
- **Deployment / build logs** — server/build logs surfaced in the dashboard.

**Distillation for NetScript:** live-updating run list + OTel hierarchical trace + inline logs is
the modern bar. The Detail/Context tab split is a clean way to separate "what the platform recorded"
from "what userland sees". Confirms OTel as the substrate for the trace surface.

---

## 5. Prisma Studio — Data Browser *(different category — data-CRUD, not infra/observability)*
**Refs:** [Prisma Studio](https://www.prisma.io/studio) ·
[Studio docs](https://www.prisma.io/docs/orm/tools/prisma-studio) ·
[CLI studio](https://www.prisma.io/docs/cli/studio)

**Category note:** this is a **data browser/editor**, not an infra or run console. Included per brief
as the "data tab" precedent. NetScript already covers this ground via Aspire + the CLI `db` surface,
so the dashboard should *borrow the browse pattern*, not rebuild a Studio.

Panels / views:
- Launches via `prisma studio` at **`localhost:5555`**, zero-config, opens in default browser.
- **Model sidebar (left)** — lists all Prisma models; click a model to view its table of records.
- **Data table** — browse records with filters and search; no SQL required. Add / remove / update
  rows inline.
- **Relation navigation** — clickable, model-aware navigation to jump across related records.
- **Record editor (right sidebar)** — open a record in a right-hand sidebar to edit in place.
- Supports PostgreSQL, MySQL, SQLite.

**Distillation for NetScript:** if the dashboard grows a "data" tab, the left-model-sidebar +
center-table + right-record-editor is the expected shape. But this is out-of-core for a v1
dev-console; NetScript's DB layer (Prisma-Next migration) already owns this.

---

## 6. Nitro — Dev Server Devtools
**Refs:** [Nitro tasks guide](https://nitro.build/guide/tasks) · [Nitro](https://nitro.build/) ·
[LogRocket: Nitro.js](https://blog.logrocket.com/nitro-js-revolutionizing-server-side-javascript/)

The **server-engine devtools** analog — file-convention-derived route/task introspection, closest
in spirit to NetScript's scaffold-derived plugin/route surface.

Panels / endpoints:
- Nitro scans `api/`, `routes/`, `plugins/`, `utils/`, `middleware/`, `assets/`, `tasks/` and
  exposes them for dev-time introspection.
- **Routes** — dev server auto-exposes route handlers for testing/debugging (configurable
  `routesDir`).
- **Tasks explorer** — tasks defined in `server/tasks/[name].ts` (nested dirs → colon-joined names)
  are exposed by the dev server for one-click execution without programmatic wiring. The
  **`/_nitro/tasks`** endpoint returns available task names + meta (descriptions, scheduled-task
  info).

**Distillation for NetScript:** the "scan conventional directories → expose an introspection
endpoint → render a task/route list you can invoke" loop is exactly how a NetScript dashboard would
surface scaffolded plugins, routes, and background jobs. The `/_nitro/tasks`-style
machine-readable endpoint is a good pattern for a NetScript `/_netscript/*` introspection API that
the Fresh dashboard consumes.

---

## Cross-Tool Synthesis — the recurring IA vocabulary

Five patterns recur across the infra + run consoles and are the distilled candidate resources for
the NetScript dashboard:

1. **Architecture/resource map** (Encore Flow; Nitro route scan) — a live, code-derived graph of the
   running stack. NetScript analog: Aspire-resource + plugin-contribution graph.
2. **Service/contract catalog + live API explorer** (Encore Service Catalog + API Explorer) —
   auto-generated endpoint docs you can *call*. NetScript analog: oRPC-contract explorer.
3. **Run list → run detail → step timeline** (Temporal, Inngest, Trigger.dev) — the durable-execution
   inspector. NetScript analog: saga/worker/trigger/stream run inspector.
4. **Trace waterfall + inline logs** (Encore tracing, Inngest timeline, Trigger.dev OTel trace) —
   OTel-backed span timeline with logs. NetScript analog: Topic B telemetry surface.
5. **Machine-readable introspection endpoint** (Nitro `/_nitro/tasks`) — a JSON API the console UI
   consumes. NetScript analog: a `/_netscript/*` dev endpoint the Fresh dashboard reads.

**Common conventions worth copying:** auto-launch on the dev "run" command; fixed local port;
real-time updates (no manual refresh); everything derived from source/scaffold (no hand-authored
config); two-panel timeline-left/details-right ergonomics; status-based filtering; rerun/replay
actions.
