# P3 — Capability Consoles: Workers · Sagas · Triggers · Streams (list → detail → leaf, full writes)

**Revamp the four capability consoles of the NetScript Dev Dashboard using the published
"NS One" design system**, inside the P1 shell and the locked route tree. Every console follows
the same shape — capability root → entity detail → sub-entity leaf, everything addressable —
and every console is a MANAGEMENT surface (create/configure/monitor), not a read-only pane.
FINAL product: all writes render live and operable; every mutation opens the standard confirm
dialog (plan → from→to diff → exact CLI line → Execute → result + undo/next step).

---

## ⚠️ Read this first — verified against the live prototype

**1. There is a real, reproducible defect in the current prototype you must NOT carry forward.**

The Design Components runtime **does not fill `{{ }}` template holes inside SVG subtrees.** The
current prototype has literal `{{ k.fill }}`, `{{ k.line }}`, `{{ e.d }}`, `{{ e.lx }}`, `{{ e.ly }}`
surviving into the rendered DOM inside `<path d="…">` and `<text x="…" y="…">`, producing browser
console errors:

```
<path> attribute d: Expected moveto path command ('M' or 'm'), "{{ k.fill }}".
```

**Rule: never put a `{{ }}` hole inside an SVG element or attribute.** Either build the SVG geometry
post-mount in JS (`componentDidMount`), or avoid SVG entirely. **Zero `{{ }}` may survive into the
rendered DOM.** Checked mechanically on every screen, in both themes.

*Where this bites in P3 — two places, both of which you will reach for:*
- **`ns-trend`** — the inline table sparkline cell (the "success-rate trend" column on the sagas
  and streams lists). It is an SVG `<path data-part='line' d="…">` today. **Render the trend as a
  token-driven `div` micro-column strip instead** — same `ns-trend` part name, `data-tone` intents,
  no SVG, no holes. It reads better in a dense table row anyway.
- **`ns-kpi`** — the derived-stat strip on the Workers root. Same fix: `__spark` becomes a flex row
  of `__bar` divs whose heights come from the fixture. (P1 has already done this; reuse it.)

**2. The prototype renders raw `ns-*` CSS classes, not React components — keep it that way.**
Do not switch to `window.NSOne` React components. The class-based markup is deliberate: it
round-trips into the framework's Fresh/Preact source unchanged, which is the whole point of the
sync-back loop. Style **only** via `--ns-*` custom properties and `ns-*` classes. No raw hex — if a
shade is missing, derive it with `color-mix()`.

**3. The bound design system was stale and has been refreshed.** `_ds/` now carries the current NS
One runtime and style closure (45 component units). Design against what is actually there.

**4. Retired — rendering any of these is a defect, not a style choice.**

| Unit | Why | Use instead |
| ---- | --- | ----------- |
| `ns-waterfall` | An OTLP trace waterfall / span gantt is Aspire's. | `ns-journey` fragments |
| `ns-preview-tag` | Violates final-product framing. Build-status honesty lives in the tracker. | — (delete it) |
| `ns-log-stream` | The follow-mode log tail is an owned structured-log surface — Aspire's job. | `ns-logstrip` (bounded, read-only, no follow/filter/search, Aspire out-link required) |
| `ns-ai-summary` | Superseded. Its gradient background is decoration, not data. | `ns-assist` |
| `McpUiWidget` | MCP is a data *source*, not a render target. | — |
| `DataGrid` | Not a canvas block. | `DataTable` |

---

## What P1 already locked — reuse it, do not redesign it

This is a **separate conversation** from P1, but it edits the **same project**. The shell is already
there. Reuse it exactly.

- **The route tree** (path params = identity; query params = filters/tabs/view state; **nothing
  selectable is in-memory-only**). Your routes, verbatim:
  ```
  /workers
  /workers/jobs                                   ?status= ?triggeredBy= ?page= ?sort= ?order=
  /workers/jobs/:jobId
  /workers/jobs/:jobId/executions/:executionId
  /workers/tasks                                  ?runtime=deno|python|shell|powershell|dotnet ?status= ?page=
  /workers/tasks/:taskId
  /workers/tasks/:taskId/executions/:executionId
  /sagas                                          ?status=active|completed|failed|pending|compensating ?topic= ?page=
  /sagas/:sagaName
  /sagas/:sagaName/:correlationId                 ?tab=history|executions|payload
  /triggers                                       ?type=file|webhook|schedule|cron|kv|polling|composite|manual ?status=enabled|disabled ?page=
  /triggers/:triggerId                            ?tab=events|schedule|config
  /triggers/:triggerId/events/:eventId
  /streams                                        ?status= ?page=
  /streams/:streamId                              ?tab=deliveries|subscribers|wiring
  /streams/:streamId/subscribers/:subscriberId
  ```
- **The sidebar** — four groups (Overview / Capabilities / Data / System), active state by **URL
  prefix** (`/workers/jobs/reserve-inventory/executions/job_4183` keeps **Workers** lit). Your
  badges: Workers **4** (running executions, primary) · Sagas **1** (compensating, warning) ·
  Triggers **21** (failed events, warning) · Streams **31** (failed deliveries, warning).
  **These must equal your list totals.**
- **Breadcrumbs derive purely from the pathname.** No synthetic root crumb. A *collection segment*
  (`executions`, `events`, `subscribers`) absorbs the id that follows it into one crumb. Your trails:
  `Workers / Jobs / reserve-inventory / Execution job_4183` ·
  `Triggers / webhook.payment / Event evt_2210` ·
  `Sagas / PaymentWebhookSaga / ch_3QK9dR2eZ` ·
  `Streams / payment-events / Subscriber analytics`.
- **The address strip** in the topbar renders the live URL. Keep it visible on every mock.
- **⌘K** — Navigate / Act / Recent; plugin-contributed actions carry a provenance chip.
- **`ns-confirm` — the five beats:** plan → diff → **exact CLI equivalent** → confirm → result.
  **The CLI block is a REQUIRED slot. A confirm dialog without a populated CLI line is a defect.**
- **`ns-assist` — the AI assist law:** always shows its **grounding** (deep-linked), always
  terminates in a **deep-link or a confirm+CLI action**. Never a bare paragraph.

---

## The canonical fixture — one incident, every screen, no contradictions

**Every number and id below is the single source of truth. Two screens showing different values for
the same fact is a defect.**

```
POST /webhooks/stripe
  → trigger  webhook.payment      event      evt_2210
  → saga     PaymentWebhookSaga   instance   ch_3QK9dR2eZ   COMPENSATING, step 2 of 4
  → job      reserve-inventory    execution  job_4183       attempt 2 of 3, RETRYING
  → stream   payment-events       message    msg_88f        2/3 delivered · 1 failed (analytics)
```

⚠️ **The execution id is `job_4183`.** Earlier drafts wrote `exec_4183` / `exec_88f` — both wrong.
`msg_88f` is the **stream message** id, not an execution id.

⚠️ **The trigger id is `webhook.payment`.** An earlier draft of this prompt printed
`netscript triggers disable payment-webhook` — that id does not exist. Use `webhook.payment`
everywhere, including in the CLI line.

**Derived stats — every count on your four consoles traces back to this table:**

| Capability | Counts | successRate |
| ---------- | ------ | ----------- |
| **Workers** | executions **1,242** = running 4 · completed 1,201 · failed 31 · queued 6 · pending 0. **Jobs 11** (compiled Deno) · **Tasks 5** (polyglot) | **97 %** |
| **Sagas** | definitions **4** · instances **87** = active 3 · compensating 1 · completed 79 · failed 4 | **91 %** |
| **Triggers** | triggers **9** (all eight types represented) · events **3,412** = processing 2 · completed 3,389 · failed 21 | **99 %** |
| **Streams** | streams **3** · subscribers **7** · deliveries (24 h) **2,904** · failed **31** | **99 %** |

**Supporting facts:**
- Scheduler drift: **1** — job `nightly-reconcile`, **caused by runtime-config override `v43`**
  (`/runtime/versions/v43`). The config chain is `v41 → v42 → v43 (current)`.
- Doctor warning: **1** — the **triggers** plugin reports its **DLQ port degraded**. That is where
  the failed `analytics` delivery is queued. DLQ depth **18** (KV 4 · Redis 11 · Postgres 3).
- Plugins installed: **5** — workers, sagas, triggers, streams, auth. `crons` is available, not
  installed.

---

## When you finish this slice — write a completion report

**This is required, and it is how the build pipeline knows you are done.** As your final action,
write the file:

```
_reports/P3-complete.md
```

with exactly this shape:

```markdown
# P3 — complete

**File:** <the .dc.html you produced>
**Routes covered:** <list the routes/screens now implemented>

## Self-check
- [ ] zero `{{ }}` in the rendered DOM (light AND dark)
- [ ] zero browser console errors
- [ ] zero 404'd subresources
- [ ] every screen designed in both light and `[data-theme='dark']`
- [ ] no raw hex — only `--ns-*` tokens
- [ ] no "coming soon" / preview / beta copy anywhere
- [ ] no owned waterfall, log tail, metrics chart, or resource start/stop
- [ ] every confirm dialog carries a populated CLI-equivalent line
- [ ] every number reconciles with the canonical fixture ledger

## New components I introduced
<name, class contract (`ns-<block>` / `ns-<block>--<variant>` / `ns-<block>__<part>`), and what it does — these get synced back into framework source, so the class contract matters>

## Decisions / deviations
<anything you changed from this prompt, and why>

## Open questions
<anything you could not resolve from the brief>
```

Write it **last**, after the design is done and self-checked. Do not write it early.

---

## Workers `/workers` → `/workers/jobs|tasks` → `:id` → `/executions/:executionId`

- **Root:** overview landing fronting two real sub-routes — **Jobs** (compiled Deno units, 11) and
  **Tasks** (polyglot units, 5). Derived stat strip (jobs, tasks, running, failed, success rate —
  numbers consistent with Home and the ledger above).
- **Jobs list:** columns name (mono) · schedule (humanized cron + raw) · triggeredBy icon
  (schedule/cron/manual/trigger/saga) · last status w/ attempt pill · runtime badge Deno.
  A disabled-by-override row reads as **CAUSED, not broken**: "disabled by runtime-config override
  v43 → `/runtime/versions/v43`". That row is `nightly-reconcile`.
- **Tasks list:** the polyglot showpiece — **runtime badges per row: Deno · Python · Shell ·
  PowerShell · .NET** with a `?runtime=` filter chip row. Design at least one row per runtime.
  No competitor console shows polyglot task runtimes — make the column visually loud. *(Judgment
  call left to you: the source brief suggested emoji glyphs per runtime. NS One is a typographic
  system — a mono runtime label with a distinct tone will almost certainly read better and
  round-trip cleaner than emoji. Pick whichever is genuinely stronger and say which in your
  report.)*
- **Job/task detail:** definition card (entrypoint, schedule, queue, retry policy), recent
  executions table (each row → the execution leaf), **worker-pool liveness line**
  ("reserve-inventory queue · 2 workers polling · heartbeat 1 s ago" — error state when zero
  polling), scheduler-vs-config drift panel that names its cause and links to override `v43`, with
  an `ns-assist` that explains the drift and offers the override fix.
  Writes: "Run now", "Pause schedule", "Edit retry policy" — each confirm+CLI. **"Run now" is the
  queue-backed `netscript workers trigger reserve-inventory`** (it lands in the executions feed —
  **do not use the legacy in-process `workers run`**); pause/edit print `netscript workers
  update-job`.
- **Execution leaf:** step timeline w/ attempt pills, I/O payloads, correlated **`ns-logstrip`**
  (bounded, read-only, out-link to Aspire — never an owned log tail), "Open correlation journey →
  `/flow/ch_3QK9dR2eZ`", "Open originating trigger event" back-link, "Re-run" write.
  `job_4183` lives here: attempt 2 of 3, RETRYING.
- **The manage loop:** create (scaffold a job — `netscript workers add-job <name>`) → configure
  (tabs: schedule, retry, concurrency) → monitor (the execution feed) → act (run now / cancel).

## Sagas `/sagas` → `/sagas/:sagaName` → `/sagas/:sagaName/:correlationId`

- **List:** definitions (4) with instance counts by status (`active|completed|failed|pending|
  compensating` — the real enum), durability tier chips, success-rate trend cell (`ns-trend` — **no
  SVG holes**, see the defect note).
- **Definition detail:** instances table filtered via URL; state-machine summary of the
  definition (steps + compensation pairs).
- **Instance leaf (`?tab=history|executions|payload`):** the hero is the **compensation
  branch** — forward steps then the visibly distinct rollback track (warning rail, reverse
  arrows, ⟲ tags): `pending → charged → reserving → reserve FAILED → compensating: charged →
  refunded`. "Step 3 of 5 · compensating step 2 · retried once" verdict line. History tab is
  the instance-history stream; executions tab lists the correlated worker runs (each → its
  execution leaf — the join is real: `job_4183` appears here); "Open correlation journey" always
  present. `ns-assist` on the compensation branch explains *why* compensation triggered, from the
  transition history. Writes: "Retry failed step", "Force-complete compensation" — confirm+CLI,
  destructive styling on force actions.

## Triggers `/triggers` → `/triggers/:triggerId` → `/events/:eventId`

- **List:** ALL EIGHT trigger types (file · webhook · schedule · cron · kv · polling ·
  composite · manual) as filterable type chips with per-type icons; per-row enable/disable
  switch (operable, confirm+CLI **`netscript triggers disable webhook.payment`** — the
  authoritative runtime-backed toggle), next-fire preview inline for scheduled kinds (backed by
  `netscript triggers preview`).
- **Trigger detail (`?tab=events|schedule|config`):** headline the **future-fire preview**
  ("Next: 02:00 · 03:00 · 04:00 (Europe/Zurich) · backfill on") — nobody else computes forward
  schedules; events tab = firing feed where each event expands its **action chain** (`ns-achain`:
  `enqueueJob ✓ → job_4183`, `publishSaga ✓ → PaymentWebhookSaga`), each action deep-linking
  to the entity it produced **and naming the plugin that contributed it**; config tab = definition
  + a **trigger builder** (edit schedule/filter/actions with a typed form, sample-event simulation
  preview showing the would-be action chain, confirm+CLI on save).
- **Event leaf:** payload, per-action results with durations/errors, "Open correlation journey".
  `evt_2210` is a **node inside** journey `ch_3QK9dR2eZ` — it fans out to the saga instance and the
  job execution. One trigger event is the whole journey in miniature. Webhook triggers carry a
  test-delivery form (ingress simulation, clearly **not** an API try-it — that is Scalar's).

## Streams `/streams` → `/streams/:streamId` → `/subscribers/:subscriberId`

- **List:** 3 streams with subscriber counts (7 total), delivery success trend (`ns-trend` — no SVG
  holes), failed-delivery badge (31).
- **Stream detail (`?tab=deliveries|subscribers|wiring`):** fan-out is the hero — per-message
  verdict line ("`msg_88f`: 2/3 delivered · 1 failed") above the per-subscriber timeline
  (attempt pills); the failing subscriber is **`analytics`**; subscribers tab lists bindings with
  owner links; wiring tab reuses the topology fragment (out-link to `/config`). Writes:
  "Redeliver to failed subscriber", "Pause subscriber" — confirm+CLI.
- **Subscriber leaf:** that subscriber's delivery history for the stream, retry curve, dead-letter
  link into `/dlq` **with the failed messages pre-selected in the URL** (`/dlq/redis-main?selected=…`).

## Cross-console consistency

One list-ergonomics kit everywhere (URL-owned filters/sort/page, saved-filter chips, bulk select,
column density toggle); one confirm dialog component; one "Open correlation journey" placement
(header, right-aligned); breadcrumbs resolve ids to names; **sidebar badge counts match the list
totals**; the canonical Stripe fixture appears in all four consoles with the same ids.

**Dogfood chrome (ties to P6):** each console header carries a tiny provenance chip — "contributed
by the `workers` plugin" — because these four consoles *are* `DashboardPanelContribution`s. The
dashboard is itself a plugin, and that is visible, not asserted.

## States per screen

Loading skeletons, empty (fresh project — **with the CLI line that creates the first entity**),
zero-match filter, live-updating, degraded (a failing entity), and the full-data default. Design
empty states as **teaching moments** (show the scaffold command), never as gated previews.

## CLI dependency map (epic #701 — SHIPPED in beta.9; use these exact verbs)

| Write/read surface | Shipped CLI verb |
|---|---|
| Workers "Run now" (queue-backed; lands in the executions feed) | `netscript workers trigger <job>` |
| Executions tables + execution leaves | `netscript workers executions` |
| Polyglot Tasks (run + runtime metadata for `?runtime=`) | `netscript workers run-task` · `workers show-task` |
| Jobs/Tasks lists | `netscript workers list-jobs` · `workers list-tasks` |
| Pause schedule / edit retry policy | `netscript workers update-job` |
| Teaching empty states (create the first job/task) | `netscript workers add-job` · `workers add-task` |
| Saga instance tables + instance leaves | `netscript sagas instances` (+ `sagas list`) |
| Publish message / drive an instance | `netscript sagas publish` |
| Trigger enable/disable switch (authoritative) | `netscript triggers enable\|disable <id>` |
| Future-fire preview | `netscript triggers preview` |
| Events tab + event leaves (action chains) | `netscript triggers events` |
| Trigger-builder save · AI-drafted automations | `netscript triggers update` · `triggers add` |
| Webhook test-delivery (ingress simulation) | `netscript triggers fire` · `triggers test` |
| Streams feeds / topic detail / stats | `netscript streams list-topics` · `streams inspect` · `streams stats` · `streams subscribe` |
| Streams writes + teaching empty state | `netscript streams publish` · `streams add-schema\|add-producer\|add-consumer` |

**Do not invent verbs.** If a write you want to design has no verb in this table, design the
affordance, print the closest shipped verb, and raise it in your completion report's Open questions.

**Reach for:** `data-table`, `entity-rail`, `ns-step-timeline`, `ns-achain`, `ns-journey`
(fragments), `ns-activity-feed`, `ns-kpi`, `ns-trend`, `connector`/`ns-kv`, `switch`,
`ns-confirm`, `ns-assist`, `ns-logstrip`, `code-block`, `badge`, `ns-seg`, `ns-tabs`,
`empty-state`, `skeleton`.

**Market bar:** Temporal (worker liveness, event-history altitudes), Inngest/Trigger.dev
(run feeds, rerun-from-step) set the console bar; none render polyglot task runtimes, forward
fire schedules, per-event action chains, compensation state machines, or per-subscriber
fan-out. Those five are this product's leads — each must be visually unmissable, not a
footnote.

**Non-goals:** no owned logs/metrics/waterfalls; no generic CRUD edit forms (writes are
domain actions with CLI transparency); no schema/data browsing (DB stays in Aspire/DB tools).

**Theme:** NS One tokens only (`--ns-*`), warm-cream light default + dark via `[data-theme='dark']`;
`STATUS_VARIANT` (`completed→success · running→primary · failed→destructive ·
retrying|degraded|compensating→warning · queued→muted`); mono for ids and paths; reduced-motion
fallbacks.
