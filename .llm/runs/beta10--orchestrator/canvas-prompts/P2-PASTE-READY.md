# P2 — Investigation Spine: Correlation Journey + Run Inspector

**Revamp the Live Flow and Run Inspector surfaces of the NetScript Dev Dashboard using the
published "NS One" design system**, inside the P1 shell (sidebar, breadcrumbs, ⌘K, locked
routes). This prompt produces four screens: `/flow`, `/flow/:correlationId`, `/runs`,
`/runs/:correlationId` — plus the "Open correlation journey" affordance every entity screen
carries. FINAL product framing: no beta prose, no fidelity disclaimers (delete the current
"flow assembled by correlation join — boundary events land in …" notice entirely; the design
assumes full-fidelity seam events).

**DX thesis:** one correlation id is the product's investigation home. "What did this request
cause, and where did it stop?" has an ADDRESS: `/flow/ch_3QK9dR2eZ` is shareable, refreshable,
and reachable from every entity that carries the id.

---

## ⚠️ Read this first — verified against the live prototype

**1. There is a real, reproducible defect in the current prototype you must NOT carry forward.**

The Design Components runtime **does not fill `{{ }}` template holes inside SVG subtrees.** The
current prototype has literal `{{ k.fill }}`, `{{ k.line }}`, `{{ e.d }}`, `{{ e.lx }}`, `{{ e.ly }}`
surviving into the rendered DOM inside `<path d="…">` and `<text x="…" y="…">`, producing browser
console errors:

```
<path> attribute d: Expected moveto path command ('M' or 'm'), "{{ k.fill }}".
<text> attribute y: Expected length, "{{ e.ly }}".
```

**Rule: never put a `{{ }}` hole inside an SVG element or attribute.** If a value must be computed
for SVG, either build the whole SVG geometry post-mount in JS (`componentDidMount`, from measured
element rects) — or avoid SVG entirely (a token-driven `div` micro-column chart is a perfectly good
sparkline and has no holes). **Zero `{{ }}` may survive into the rendered DOM.** This is checked
mechanically on every screen, in both themes.

*Where this bites in P2:* `ns-journey` and `ns-step-timeline` are pure-CSS rails today (`::before`
gradients, no SVG) — **keep them that way.** If you reach for an SVG connector, a fan-out curve, or
a trend cell anywhere on these four screens, the rule above applies.

**2. The prototype renders raw `ns-*` CSS classes, not React components — keep it that way.**
Do not switch to `window.NSOne` React components. The class-based markup is deliberate: it
round-trips into the framework's Fresh/Preact source unchanged, which is the whole point of the
sync-back loop. Style **only** via `--ns-*` custom properties and `ns-*` classes. No raw hex — if a
shade is missing, derive it with `color-mix()`.

**3. The bound design system was stale and has been refreshed.** `_ds/` now carries the current NS
One runtime and style closure, synced from the framework's live component registry (45 component
units). Design against what is actually there.

**4. Retired — rendering any of these is a defect, not a style choice.**

| Unit | Why | Use instead |
| ---- | --- | ----------- |
| `ns-waterfall` | An OTLP trace waterfall / span gantt is Aspire's. The flow view is a **causal seam chain, never time-proportional.** | `ns-journey` |
| `ns-preview-tag` | Violates final-product framing. Build-status honesty lives in the tracker, never in the design. | — (delete it) |
| `ns-log-stream` | The follow-mode log tail (with its toolbar) is an owned structured-log surface — Aspire's job. | **`ns-logstrip`** (see below) |
| `ns-ai-summary` | Superseded. Its 135° gradient background is decoration, not data. | **`ns-assist`** |
| `McpUiWidget` | MCP is a data *source*, not a render target. Out of scope for dashboard screens. | — |
| `DataGrid` | Not a canvas block. | `DataTable` |

**`ns-logstrip` — the hard bounds** (this replaces `ns-log-stream` and P2 is the only screen that
uses it): read-only · bounded line count · **no follow mode, no filters, no search, no severity
facets** · an "Open in Aspire ↗" out-link is a **required** part. It is a *pointer*, not a tail. The
moment it needs any of those affordances, it is Aspire's structured-log view and must be a link.
Class contract: `ns-logstrip` / `__line` / `__ts` / `__resource` / `__severity` / `__msg` /
`__more`; line `data-severity="debug|info|warn|error"`.

---

## What P1 already locked — reuse it, do not redesign it

This is a **separate conversation** from P1, but it edits the **same project**. The shell is already
there. Reuse it exactly; if you find yourself re-deciding any of the following, stop — it is locked.

- **The route tree** (path params = identity; query params = filters/tabs/view state; nothing
  selectable is in-memory-only). Your four routes, verbatim:
  ```
  /flow                    ?route=<path>  ?status=running|halted|failed  ?follow=1
  /flow/:correlationId     ★ the causal journey
  /runs                    ?kind=saga|job|task|firing|delivery  ?status=  ?from=  ?to=  ?page=  ?sort=  ?order=
  /runs/:correlationId     ?view=all|compact|json
  ```
- **The sidebar** — four groups (Overview / Capabilities / Data / System), active state by **URL
  prefix**, derived-stat badges. Live Flow badge = **1** (in-flight flows, primary tone). Run
  Inspector badge = **9** (running, primary tone).
- **Breadcrumbs derive purely from the pathname.** No synthetic root crumb. A *collection segment*
  absorbs the id that follows it into one crumb. Your trails: `Live Flow / Journey ch_3QK9dR2eZ` and
  `Run Inspector / Run ch_3QK9dR2eZ`.
- **The address strip** in the topbar renders the live URL. Addressability is a product feature —
  keep it visible on every mock.
- **⌘K** — Navigate (routes **and** entities by name) / Act (mutations, each opening its confirm
  dialog with the exact CLI line) / Recent. Plugin-contributed actions carry a provenance chip.
- **`ns-confirm` — the five beats:** plan → diff → **exact CLI equivalent** → confirm → result
  (+ next step). **The CLI block is a REQUIRED slot. A confirm dialog without a populated CLI line
  is a defect, not a styling choice.**
- **`ns-assist` — the AI assist law:** an assist always shows its **grounding** (which live calls it
  read, each a deep-link) and always terminates in a **deep-link or a confirm+CLI action**. An
  assist that just talks is the failure mode. Class contract: `ns-assist` / `__head` / `__summary` /
  `__grounding` / `__ground` / `__actions` / `__meta`; `data-state="idle|thinking|ready|error"`.

---

## The canonical fixture — one incident, every screen, no contradictions

**Every number and id below is the single source of truth. A screen that contradicts this ledger is
a defect — including by omission (a stat that should reconcile and doesn't).**

```
POST /webhooks/stripe
  → trigger  webhook.payment      event      evt_2210
  → saga     PaymentWebhookSaga   instance   ch_3QK9dR2eZ   COMPENSATING, step 2 of 4
  → job      reserve-inventory    execution  job_4183       attempt 2 of 3, RETRYING
  → stream   payment-events       message    msg_88f        2/3 delivered · 1 failed (analytics)
```

- **`ch_3QK9dR2eZ` is THE journey id.** The saga correlates on the Stripe charge id. It is the id in
  `/flow/ch_3QK9dR2eZ`, `/runs/ch_3QK9dR2eZ`, `/sagas/PaymentWebhookSaga/ch_3QK9dR2eZ`, and on the AI
  run that investigated it. The trigger event `evt_2210` is a **node inside that journey**, not a
  rival address.
- **The execution id is `job_4183`.** ⚠️ Earlier drafts wrote `exec_4183` and `exec_88f` — both are
  wrong. `msg_88f` is the **stream message** id, not an execution id. Use `job_4183` for the job
  execution everywhere:
  `/workers/jobs/reserve-inventory/executions/job_4183`.
- Journey timing: **720 ms** end-to-end so far; **72 ms** queue wait before the job picked up. **No
  span-level timings anywhere** — those are an Aspire out-link (`/traces/detail/{traceId}`).

**The `/flow` list holds exactly three flows** (flows are correlations — there are no synthetic
`fl_*` ids):

| Correlation id | Route | Status |
| -------------- | ----- | ------ |
| `ch_3QK9dR2eZ` | `POST /webhooks/stripe` | **running** (the canonical incident) |
| `ch_9M2xB7pQr` | `POST /webhooks/stripe` | **halted** (design this one explicitly — it is the money shot) |
| `ch_5TzW1kL8v` | `POST /webhooks/stripe` | completed |

**Sidebar reconciliation:** the "Live Flow · 1" badge counts **running** flows only — the halted and
completed rows are recent history in the list, not in-flight work. The list holds 3; the badge reads
1. This is exactly the kind of pair that gets silently contradicted. Do not.

**Derived stats you must reconcile against** (they are computed from the framework's own primitives —
never an OTLP metric):

| Capability | Counts | successRate |
| ---------- | ------ | ----------- |
| Workers | executions **1,242** = running 4 · completed 1,201 · failed 31 · queued 6 · pending 0. Jobs **11** · Tasks **5** | 97 % |
| Sagas | definitions **4** · instances **87** = active 3 · compensating 1 · completed 79 · failed 4 | 91 % |
| Triggers | triggers **9** · events **3,412** = processing 2 · completed 3,389 · failed 21 | 99 % |
| Streams | streams **3** · subscribers **7** · deliveries (24 h) **2,904** · failed **31** | 99 % |

`/runs` "running · 9" = workers running (4) + sagas active (3) + triggers processing (2).

---

## When you finish this slice — write a completion report

**This is required, and it is how the build pipeline knows you are done.** As your final action,
write the file:

```
_reports/P2-complete.md
```

with exactly this shape:

```markdown
# P2 — complete

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

## `/flow` — live journey list

Three-zone console. Left rail: live flow list (SSE), newest first — method+route mono, primitive
count chips (⚡ trigger · ⛓ saga · ⚙ job · ≋ stream), status dot, relative time, correlation
short-id; `?route=`, `?status=running|halted|failed`, `?follow=1` all in the URL; paused
following shows the "N new flows" catch-up pill (`ns-newpill`). Selecting navigates to
`/flow/:correlationId` (**real navigation** — Back returns to the filtered list; selection is never
in-memory). Empty state: "Hit an endpoint to see its journey" with a mono `curl` example.

## `/flow/:correlationId` — ★ the causal journey (flagship)

**HARD CONSTRAINT — not a trace waterfall:** no span bars, no time-proportional widths, no log
tail. A causal, semantic seam chain; the moment raw timing matters, out-link "View raw trace in
Aspire ↗". That out-link is *prominent* — it is the honest boundary of the satellite.

- **Center — the seam chain** (`ns-journey`): `HTTP POST /webhooks/stripe · 200` → `TRIGGER
  webhook.payment · evt_2210 · PROCESSED · 2 actions` → `SAGA PaymentWebhookSaga ·
  COMPENSATING STEP 2` → `WORKER job reserve-inventory · ATTEMPT 2 OF 3 · RETRYING` → `STREAM
  payment-events · 2/3 DELIVERED · 1 FAILED`. Each node: primitive badge, mono name, status,
  expandable payload-at-seam (`<details>`), and a deep-link INTO the owning entity URL:
  - `/triggers/webhook.payment/events/evt_2210`
  - `/sagas/PaymentWebhookSaga/ch_3QK9dR2eZ`
  - `/workers/jobs/reserve-inventory/executions/job_4183`
  - `/streams/payment-events?tab=deliveries`

  The halted/failed variant visibly stops the chain at the failing node (dashed severed rail);
  the in-progress variant pulses the tail node (static badge under `prefers-reduced-motion`).
  The chain has **branch/fan-out structure** (one trigger event → saga + job + N deliveries) —
  a flat feed cannot express it, which is why `ns-journey` exists.
- **Right — seam detail rail:** selected node KV (primitive, owner plugin, queue/topic,
  attempt, correlation id) + out-links (Aspire trace; Scalar for the contract node) + an
  embedded **AI assist chip row**: "Explain this failure", "Draft a fix", "Compare with last
  success". Design the chips + the returned inline `ns-assist` card shape (grounding chips,
  then a deep-link or a confirm+CLI action — never a bare paragraph).
- **Header:** the correlation id (mono, copy affordance), origin route, started/elapsed,
  overall verdict pill, and a "Runs view" toggle linking to `/runs/ch_3QK9dR2eZ` (same id, two
  renderings — design them as visibly sibling views, e.g. a segmented Journey|Inspector switch
  (`ns-seg`) under the breadcrumb).

## `/runs` — cross-primitive run list

Professional list ergonomics (the URL owns everything): `?kind=saga|job|task|firing|delivery`,
`?status=`, time range, `?page/?sort/?order`, free-text search; column set incl. correlation
id, primitive, entity, status w/ attempt pill, duration, started. Saved-filter chips row
(e.g. "Failures · 24h"). Bulk selection with a compare affordance (select 2 runs → side-by-side
step timelines). Every row navigates to `/runs/:correlationId`.

## `/runs/:correlationId` — the inspector twin

The same id as `/flow/:id`, rendered as grouped execution detail: step timeline
(`ns-step-timeline`) with attempt pills and the compensation branch visually distinct (warning
rail, ⟲ tags, reverse direction cue); `?view=all|compact|json` altitude toggle (Compact
default — the JSON altitude is a composition swap to a `code-block`, not a stylesheet state);
inputs/results payload blocks; the correlated read-only **`ns-logstrip`** that deep-links to
Aspire logs (never an owned log tail — see the retired list); right rail: run events + context
KV + the same AI assist chips. Cross-links: "Journey view" ↔ `/flow/:id`; "Open originating
trigger event"; "Open saga instance".

## Writes on this spine

Both render as first-class buttons opening the standard `ns-confirm` — plan summary, from→to
diff, exact CLI line, Execute, then a result state + the new execution appearing live with a
link. No disabled/preview affordances.

⚠️ **CORRECTED CLI VERBS** — an earlier draft of this prompt printed
`netscript workers run reserve-inventory --from-step reserve`. That is **wrong on two counts**:
`workers run` is the legacy **in-process** import, which bypasses the durable queue and would
therefore *never appear in the executions feed* — the queue-backed verb is `workers trigger`. Use:

| Write | CLI line to print |
| ----- | ----------------- |
| "Re-run job" (from the execution / run detail) | `netscript workers trigger reserve-inventory` |
| "Reprocess failed delivery" (the analytics failure on `msg_88f`) | `netscript queue dlq reprocess --backend redis` |

**Do not invent a `--from-step` flag.** No shipped verb takes one. If the design genuinely needs
"re-run *from* a step", render the affordance and print the plain `netscript workers trigger
reserve-inventory` line, and **raise it in your completion report's Open questions** — do not print a
flag that does not exist. Inventing a CLI verb is a defect, and a worse one than omitting a button.

## CLI dependency map (epic #701 — SHIPPED in beta.9; use these exact verbs)

| Read/write surface | Shipped CLI verb |
|---|---|
| Run lists, executions tables, execution leaves | `netscript workers executions` |
| "Re-run job" (queue-backed; lands in the executions feed) | `netscript workers trigger <job>` |
| Saga instance rows on the run list | `netscript sagas instances` |
| Trigger firing rows on the run list | `netscript triggers events` |
| Stream delivery rows on the run list | `netscript streams inspect` · `streams stats` |
| "Reprocess failed delivery" | `netscript queue dlq reprocess --backend <backend>` |

**States:** loading skeleton chain; empty; live/in-progress (pulsing tail); completed calm;
halted/failed (severed chain — design this variant explicitly, it is the money shot); zero-match
filters.

**Reach for:** `ns-journey`, `ns-step-timeline`, `ns-flowrow`, `entity-rail`, `ns-activity-feed`,
`connector`/`ns-kv`, `code-block`, `ns-seg`, `ns-newpill`, `ns-livedot`, `ns-confirm`, `ns-assist`,
`ns-logstrip`, `badge`, `select`, `empty-state`, `skeleton`.

**Market bar:** Temporal's event history (three altitudes) and Inngest's timeline-left/
details-right are the ergonomic bar for the inspector; neither has an addressable cross-primitive
journey URL or a causal seam chain — that is this product's category lead. The design must make
the journey↔inspector duality obvious in one glance.

**Non-goals:** no waterfall/gantt, no owned logs/metrics, no OTLP jargon (NetScript vocabulary:
job, saga step, delivery, seam).

**Theme:** NS One tokens only (`--ns-*`), warm-cream light default + dark via `[data-theme='dark']`;
`STATUS_VARIANT` (`completed→success · running→primary · failed→destructive ·
retrying|degraded|compensating→warning · queued→muted`); mono for ids and paths; reduced-motion
fallbacks for every pulse/slide.
