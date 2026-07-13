# P4 — Control Plane: Runtime Config · Topology · Catalog · Data Group

**Revamp the configuration/data surfaces of the NetScript Dev Dashboard using the published
"NS One" design system**, inside the P1 shell and locked routes. FINAL product: every write
operable (no read-only gating, no preview banners); the DLQ renders as a fully shipped
surface; the standard confirm dialog (plan → diff → exact CLI → Execute → result) gates every
mutation.

---

## ⚠️ Read this first — verified against the live prototype

### 1. The SVG defect — and P4 is where it bites hardest

The Design Components runtime **does not fill `{{ }}` template holes inside SVG subtrees.** The
literal string survives into the DOM and the browser rejects the attribute:

```
<path> attribute d: Expected moveto path command ('M' or 'm'), "{{ e.d }}".
<text> attribute y: Expected length, "{{ e.ly }}".
```

**The worst offender in the whole prototype is `ns-stackmap`'s edge layer** — the very component
this prompt makes a hero of. Its `<path d="{{ e.d }}">` and `<text x="{{ e.lx }}" y="{{ e.ly }}">`
edge labels are all broken today.

**The fix is not a workaround — it is what the component contract already says.** `ns-stackmap`'s
own spec reads: *"edges are measured, not declared."* Build it that way:

> `__edge-layer` is an absolutely-positioned `<svg>` sized to `__canvas`. Emit it **empty** in the
> template. **After mount**, compute every edge path and label position in JS from the measured
> `getBoundingClientRect()` of each `[data-node-id]`, and write them into the SVG imperatively.
> Recompute on resize. Hide the edge layer below ~860 px, where the canvas stacks to one column.

**Rule, everywhere: never put a `{{ }}` hole inside an SVG element or attribute.** **Zero `{{ }}`
may survive into the rendered DOM.** This is checked mechanically on every screen, in both themes.

Other SVG sites you will touch in P4: `ns-kpi`'s sparkline (`__spark` → a flex row of `__bar` divs,
already fixed in P1 — reuse it) and any trend cell in the migrations/DLQ tables.

### 2. The prototype renders raw `ns-*` CSS classes, not React components — keep it that way.

Do not switch to `window.NSOne` React components. The class-based markup is deliberate: it
round-trips into the framework's Fresh/Preact source unchanged, which is the whole point of the
sync-back loop. Style **only** via `--ns-*` custom properties and `ns-*` classes. No raw hex — if a
shade is missing, derive it with `color-mix()`.

### 3. The bound design system was stale and has been refreshed.

`_ds/` now carries the current NS One runtime and style closure (45 component units). Design against
what is actually there.

### 4. Retired — rendering any of these is a defect, not a style choice.

| Unit | Why | Use instead |
| ---- | --- | ----------- |
| `ns-waterfall` | An OTLP trace waterfall / span gantt is Aspire's. | — |
| `ns-preview-tag` | Violates final-product framing. **The DLQ's "Preview — contract routes pending" chrome is exactly this: delete it.** Build-status honesty lives in the tracker, never in the design. | — |
| `ns-log-stream` | The follow-mode log tail is an owned structured-log surface — Aspire's job. | `ns-logstrip` |
| `ns-ai-summary` | Superseded. Its gradient background is decoration, not data. | `ns-assist` |
| `McpUiWidget` | MCP is a data *source*, not a render target. | — |
| `DataGrid` | Not a canvas block. | `DataTable` |

Note `plugin-gated-view` is **not** retired — a not-installed plugin genuinely has no data, and an
empty state teaching `netscript plugin install crons` is a real product state, not a preview gate.
That is the one legitimate "this isn't here" surface in the whole product.

---

## What P1 already locked — reuse it, do not redesign it

This is a **separate conversation** from P1, but it edits the **same project**. The shell is already
there. Reuse it exactly.

- **The route tree** (path params = identity; query params = filters/tabs/view state; **nothing
  selectable is in-memory-only**). Your routes, verbatim:
  ```
  /runtime                          ?follow=1  ?scope=flags|jobs|sagas|triggers|tasks
  /runtime/overrides/:overrideKey
  /runtime/versions/:version
  /config                           ?node=<nodeId>
  /config/nodes/:nodeId             ?tab=wiring|telemetry
  /catalog                          ?tab=procedures|routes ?coverage=complete|thin ?duality=rest|rpc|sdk ?search=
  /catalog/procedures/:procedureId
  /migrations                       ?status=pending|applied
  /migrations/:migrationId
  /dlq                              ?tab=queue|trigger ?backend=kv|redis|postgres
  /dlq/:queueId                     ?selected=<messageId,…>
  /dlq/:queueId/messages/:messageId
  /auth                             ?provider=oidc|password|api-key ?state=active|revoked
  /auth/sessions/:sessionId
  ```
- **The sidebar** — four groups (Overview / Capabilities / Data / System), active by **URL prefix**.
  Your badges: Config **2** (unwired nodes, warning) · Runtime **2** (disabled overrides, warning) ·
  Catalog **2** (unbound routes, warning) · Migrations **1** (pending, warning) · Dead-Letter **18**
  (total depth, warning) · Auth **24** (active sessions, muted). **These must equal your screens'
  totals.**
- **Breadcrumbs derive purely from the pathname.** No synthetic root crumb. A *collection segment*
  (`versions`, `overrides`, `nodes`, `procedures`, `messages`, `sessions`) absorbs the id that
  follows it into one crumb: `Runtime / Version v43` · `Config / Node redis` ·
  `Dead-Letter / redis-main / Message msg_88f` · `Auth Sessions / Session s_912`.
- **The address strip** in the topbar renders the live URL. Keep it visible on every mock.
- **⌘K** — Navigate / Act / Recent; plugin-contributed actions carry a provenance chip.
- **`ns-confirm` — the five beats:** plan → diff → **exact CLI equivalent** → confirm → result.
  **The CLI block is a REQUIRED slot. A confirm dialog without a populated CLI line is a defect.**
  P4 is where this pattern is exercised at scale — it is the product's signature, and this is its
  showcase.
- **`ns-assist` — the AI assist law:** always shows its **grounding** (deep-linked), always
  terminates in a **deep-link or a confirm+CLI action**. On this prompt it appears on the drift
  alert and the thin-coverage rows.

---

## The canonical fixture — one incident, every screen, no contradictions

**Every number below is the single source of truth. Two screens showing different values for the
same fact is a defect.**

```
POST /webhooks/stripe
  → trigger  webhook.payment      event      evt_2210
  → saga     PaymentWebhookSaga   instance   ch_3QK9dR2eZ   COMPENSATING, step 2 of 4
  → job      reserve-inventory    execution  job_4183       attempt 2 of 3, RETRYING
  → stream   payment-events       message    msg_88f        2/3 delivered · 1 failed (analytics)
```

| Fact | Value |
| ---- | ----- |
| Config version chain | `v41 → v42 → v43 (current)` |
| Override changes (24 h) | **3** · **disabled overrides 2** (scope: jobs) |
| **The causal spine of this whole prompt** | **Override `v43` disabled the schedule on job `nightly-reconcile`.** The scheduler drift on that job is *explained, not broken*. This cross-link is the point of `/runtime`. |
| Topology nodes | **14**, of which **2 unwired** (telemetry coverage); `redis` is **degraded** |
| Contract procedures | **38** across 5 plugins — coverage **31 complete / 7 thin** |
| Unbound routes | **2** |
| Migrations | **4 total · 3 applied · 1 pending** = `20260711_add_delivery_attempts` |
| DLQ depth | **18** = KV **4** · Redis **11** · Postgres **3** |
| The failed `analytics` delivery of `msg_88f` | sits in the **Redis** queue — and the **triggers** plugin's **DLQ port is degraded**, which is the one open doctor warning |
| Auth sessions | **24 active**, 3 revoked (7 d); providers oidc / password / api-key |
| Plugins installed | **5** — workers, sagas, triggers, streams, auth. `crons` available, not installed |

⚠️ The catalog headline in an earlier draft read *"4 of 17 procedures thin"*. The ledger says
**38 procedures, 7 thin**. Use the ledger: **"7 of 38 procedures thin · 2 routes unbound"**.

---

## When you finish this slice — write a completion report

**This is required, and it is how the build pipeline knows you are done.** As your final action,
write the file:

```
_reports/P4-complete.md
```

with exactly this shape:

```markdown
# P4 — complete

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
- [ ] `ns-stackmap` edges are computed post-mount in JS — no SVG template holes

## New components I introduced
<name, class contract (`ns-<block>` / `ns-<block>--<variant>` / `ns-<block>__<part>`), and what it does — these get synced back into framework source, so the class contract matters>

## Decisions / deviations
<anything you changed from this prompt, and why>

## Open questions
<anything you could not resolve from the brief>
```

Write it **last**, after the design is done and self-checked. Do not write it early.

---

## Runtime Config `/runtime` → `/runtime/overrides/:key` · `/runtime/versions/:version`

The flagship becomes a full **audit + control workspace**:
- **Root:** live override feed (follow toggle + catch-up pill; `?scope=flags|jobs|sagas|
  triggers|tasks` chips), current-state stat grid per scope, and the **version chain**
  (`ns-verchain`) `v41 → v42 → v43 (current)` where any two versions can be selected and compared
  (side-by-side `ns-diff`), each version step showing author/source ("set via dashboard" / "set via
  CLI") and impacted capabilities ("disabled job nightly-reconcile → Workers").
- **Override detail `/overrides/:key`:** current value, full history of that key across
  versions, impacted-entity links, and controls: set/adjust (typed editor per value kind:
  switch, rollout slider, enum), **Clear override**, **Rollback to version…** — all
  confirm+CLI. **Write-back is LIVE — no gating, no tooltips about when it will work.**
  After Execute, the feed, stat grid, and version chain all visibly update as one causal state
  (**the demo IS the coherence**).
- **Version detail `/versions/:version`:** snapshot + diff vs previous, "Restore this
  version" write. `v43` is the version that caused the drift — its impacted-capabilities list is the
  cross-link that makes the whole product feel joined up.
- **`ns-assist`:** where drift is detected, an inline suggested override that **pre-fills the confirm
  dialog**. It is a suggestion with visible grounding, never an auto-apply. AI never mutates
  directly; it fills in the same confirm a human would.

## Config Topology `/config` → `/config/nodes/:nodeId`

- The capability wiring graph (**`ns-stackmap`** — **read the SVG rule above before you write a
  single edge**) with **labeled edges** (queue/topic/payload on every edge; pub/sub dashed), a
  coverage overlay toggle (tints the **2 unwired** nodes), a freshness line ("resolved 14:02:31 ·
  re-resolves on dev reload") + a "Re-resolve" action. `redis` renders **degraded**.
- Selecting a node updates `?node=` (**shareable selection — never in-memory**); "Open node detail"
  → `/config/nodes/:nodeId` with wiring + telemetry tabs, declaring-file link, "Open in Aspire" per
  node.
- **Write:** an `unwired` node offers **"Wire telemetry"** → confirm + CLI.
- **Filter by contributing plugin** to see one plugin's footprint on the map (ties to P6).
- **Never a metrics chart here.** Infra metrics are an Aspire out-link, always.
- **Zero contradictions:** the streams-telemetry maturity story is ONE sentence, reused verbatim
  wherever it appears (here, on `/streams`, on Home).

## Catalog `/catalog` (?tab=procedures|routes) → `/catalog/procedures/:procedureId`

**Provenance / coverage / duality only. There is no try-it console here — that is Scalar's.**

- **Root:** coverage summary headline (**"7 of 38 procedures thin · 2 routes unbound"**),
  procedure table (provenance plugin badge, method, coverage, duality chips REST/RPC/SDK —
  **VARIED per row**: design an RPC-only internal proc, an SDK-excluded admin op, a REST-only
  webhook receiver), routes tab with bound/unbound rows where UNBOUND carries the inline fix
  hint (sidecar vs inline authoring) and a "Bind route…" scaffold write (confirm+CLI).
- **Not-installed plugin group** — gated with `plugin-gated-view`, teaching
  `netscript plugin install crons`. That install action is **live** and confirm-gated.
- **Procedure detail `/procedures/:procedureId`:** the duality made visible — one shared
  schema block, generated surfaces list (REST path, RPC name, SDK method with generated-code
  snippets), consumers, coverage explanation ("thin: missing `.describe()` on 2 fields" with an
  "Add descriptions…" scaffold write), provenance (contributing plugin + contract version),
  "Open in Scalar ↗" out-link.

## Migrations `/migrations` → `/migrations/:migrationId`

- Migration table (**4 total, 3 applied, 1 pending** — the pending count equals Home's number),
  drift alert + introspect diff (`ns-diff`) describing the **same** drift, **"Apply migrations"
  write** (confirm shows the plan: which migrations, the schema diff, `netscript db migrate`, then a
  success state with the applied rows flipping). Detail page per migration: full SQL/diff,
  applied-at, origin.
- Keep the operator-empathy note for the transient engine flake **in the error state only** — it is
  an error explanation, not a disclaimer about the product.
- **`ns-assist`:** explain the drift in plain language, grounded, terminating in the apply confirm.

## Dead-Letter Queues `/dlq` → `/dlq/:queueId` → `/messages/:messageId`

**Fully shipped surface. No "preview", no "pending contract routes" banner, no gating** — the old
prototype's preview chrome here is an auto-reject and must be deleted, not restyled.

- **Root (`?tab=queue|trigger`):** the two DLQ families with genuinely different data shapes
  (queue side: per-backend depth grid **KV 4 · Redis 11 · Postgres 3 = 18**; trigger side: per-trigger
  dead events). Depth numbers and table row counts always consistent; drained state = friendly
  empty state.
- **Queue detail:** message table (**multi-select in the URL** `?selected=msg_1,msg_2` — the
  reprocess selection is shareable and reloadable), reason + error-code badges, expandable payloads.
  **Reprocess selected** is the showcase destructive write: the confirm names backend + count
  ("Reprocess 3 messages from redis?") + the CLI (`netscript queue dlq reprocess --backend redis`),
  then a result state with per-message outcomes and links to the new runs. "Open original run" per
  message → `/runs/:correlationId`.
- **Message leaf:** payload, death history (attempts), "Reprocess this message" +
  "Delete permanently" (double-confirm destructive).
- **`ns-assist`:** cluster messages by failure similarity ("12 failures: schema mismatch") — a
  **view**, not an action.

## Auth Sessions `/auth` → `/auth/sessions/:sessionId`

Reframe as a **durable projection debugger**, not a user table: sessions list (provider/state
filters in the URL) + live `auth.*` event stream; session detail = the projection story (source
events that built this session, checkpoint/lag indicator, policy decisions, revocation propagation
timeline) + writes: "Revoke session", "Revoke all for user" — confirm+CLI, destructive styling.
Where an `auth.*` event triggers downstream work, it links into `/flow/:correlationId`.

**States everywhere:** loading / empty / live / degraded / error / post-write success; design
**write in-flight** (button spinner + optimistic row) and **write failure** (inline error + retry)
states explicitly. A write that has no in-flight and no failure state is only half-designed.

## CLI dependency map (epic #701 — SHIPPED in beta.9; use these exact verbs)

| Write/read surface | Shipped CLI verb |
|---|---|
| Override set / clear / enable / disable (the `/runtime` flagship confirms) | `netscript config override set <path> <value>` · `override clear\|enable\|disable` |
| Version publish + rollback ("Restore this version") | `netscript config override publish <topic> <file>` · `override rollback <topic> <version>` |
| Override + version listing / reads | `netscript config override list` · `override get <path>` |
| Config topology provenance, "Re-resolve", node detail | `netscript config inspect` · `config get <path>` |
| Generated appsettings writes | `netscript config set <path> <value>` |
| Catalog "Bind route…" | `netscript contract add-route` |
| Procedure detail (schema / duality / coverage / provenance) | `netscript contract inspect` (+ `contract list`) |
| Contract v2 (powers the extension quarantine story in P6) | `netscript contract version add` |
| Catalog retire / decommission | `netscript contract remove` |
| Migrations apply + status | `netscript db migrate` · `db status` |
| Not-installed plugin group ("Install crons") | `netscript plugin install crons` |
| Auth "Revoke session" / "Revoke all for user" | `netscript plugin auth session` (inspect + revoke) |
| Auth configure tabs (backend / provider / secrets) | `netscript plugin auth backend\|provider\|secret` |
| DLQ "Reprocess selected" | `netscript queue dlq reprocess --backend <backend>` |

**Do not invent verbs.** If a write you want to design has no verb in this table, design the
affordance, print the closest shipped verb, and raise it in your completion report's Open questions.

**Reach for:** `ns-stackmap`, `ns-verchain`, `ns-diff`, `ns-activity-feed`, `stats-grid`,
`data-table`, `ns-confirm`, `ns-assist`, `code-block`, `connector`/`ns-kv`, `badge`, `ns-tabs`,
`ns-seg`, `switch`, `plugin-gated-view`, `empty-state`, `alert`, `inline-notice`, `ns-toaster`.

**Market bar:** Appwrite's create→configure→monitor loop and Supabase Studio's polish set the
management bar; neither shows config *version causality*, contract *coverage/provenance*,
migration *drift*, or DLQ *replay with CLI transparency*. Encore's Flow is the topology bar —
beat it with labeled edges + coverage overlay. **Every write here must feel safer than a CLI
because it shows the CLI.**

**Non-goals:** no query console/data browser; no owned telemetry; no free-form JSON config
editing (typed domain controls only).

**Theme:** NS One tokens only (`--ns-*`), warm-cream light default + dark via `[data-theme='dark']`;
`STATUS_VARIANT`; mono for ids, paths and versions; reduced-motion fallbacks.
