# P6 — Extension Platform: Plugin Registry + Contribution Lifecycle + Scaffold-from-UI

**Revamp the plugin/extension surfaces of the NetScript Dev Dashboard using the published
"NS One" design system**, inside the P1 shell and locked routes. This prompt makes the
long-awaited frontend-contribution story VISIBLE: a contributor writes a NetScript plugin and
wires it into the dashboard (panels, routes, ⌘K actions, AI tools, nav items, entity tabs,
home cards) — and a plugin can contribute into the user's own apps (generate files, wire
config, add deps). FINAL product: the whole lifecycle renders shipped and operable.

Screens: `/plugins` (?tab=installed|available|contributions) → `/plugins/:pluginId`
(?tab=overview|axes|doctor|config) and `/extensions` (?tab=panels|actions|available) →
`/extensions/:extensionId`.

---

## ⚠️ Read this first — verified against the live prototype

**1. The SVG defect.** The Design Components runtime **does not fill `{{ }}` template holes inside
SVG subtrees.** Literal `{{ k.fill }}` / `{{ e.lx }}` strings survive into the DOM and throw browser
console errors (`<path> attribute d: Expected moveto path command…`). **Never put a `{{ }}` hole
inside an SVG element or attribute.** Either build the geometry post-mount in JS, or avoid SVG.
**Zero `{{ }}` may survive into the rendered DOM** — checked mechanically, in both themes.

*Where this bites in P6:* `ns-axismap` is a CSS grid today (no SVG) — **keep it that way.** If you
give the contribution-axis map a connector/graph treatment, or draw the injection-zone overlay with
SVG outlines, the rule above applies: compute geometry post-mount from measured rects, never from
template holes.

**2. The prototype renders raw `ns-*` CSS classes, not React components — keep it that way.**
Do not switch to `window.NSOne` React components. The class-based markup is deliberate: it
round-trips into the framework's Fresh/Preact source unchanged, which is the whole point of the
sync-back loop. Style **only** via `--ns-*` custom properties and `ns-*` classes. No raw hex —
derive missing shades with `color-mix()`.

**3. The bound design system was stale and has been refreshed.** `_ds/` now carries the current NS
One runtime and style closure (45 component units).

**4. Retired — rendering any of these is a defect, not a style choice.**

| Unit | Why | Use instead |
| ---- | --- | ----------- |
| `ns-waterfall` | An OTLP trace waterfall / span gantt is Aspire's. | — |
| **`ns-preview-tag`** | Violates final-product framing. **Do not repurpose it as quarantine or trust-tier chrome** — a quarantined panel is a real, shipped product state, not a preview badge; give it its own contract. | a `Badge` variant, or a declared new chrome |
| `ns-log-stream` | The follow-mode log tail is Aspire's. | `ns-logstrip` |
| `ns-ai-summary` | Superseded. Its gradient background is decoration, not data. | `ns-assist` |
| `McpUiWidget` | MCP is a data *source*, not a render target. | — |
| `DataGrid` | Not a canvas block. | `DataTable` |

`plugin-gated-view` is **not** retired: a not-installed plugin genuinely has no data, and an empty
state teaching `netscript plugin install crons` is a real product state. The source brief suggests
repurposing it as quarantine chrome — that is fine **as a composition**, but a quarantined extension
is a distinct state (installed, held, updatable) from a not-installed one (absent, installable).
**Do not let them look the same**, and declare whatever new chrome you build in your completion
report.

---

## What P1 already locked — reuse it, do not redesign it

This is a **separate conversation** from P1, but it edits the **same project**. The shell is already
there. Reuse it exactly.

- **The route tree.** Yours:
  ```
  /plugins                  ?tab=installed|available|contributions  ?search=
  /plugins/:pluginId        ?tab=overview|axes|doctor|config
  /extensions               ?tab=panels|actions|available
  /extensions/:extensionId
  ```
- **The sidebar** — four groups (Overview / Capabilities / Data / System), active by **URL prefix**.
  Your badges: **Plugins 1** (doctor warnings, warning tone) · **Extensions 6** (contributed panels,
  muted tone). **These must equal your screens' totals.**
- **Breadcrumbs derive purely from the pathname.** `Plugins / triggers` · `Extensions / triggers.dlq`.
- **The address strip** renders the live URL.
- **⌘K** — Navigate / Act / Recent. **Plugin-contributed actions already carry a provenance chip in
  the palette** — P6 is where that chip's source of truth lives, so make them agree.
- **`ns-confirm` — the five beats:** plan → diff → **exact CLI equivalent** → confirm → result.
  **The CLI block is a REQUIRED slot.** P6's install / update / create-from-template writes are the
  richest instances of this pattern — the "diff" beat here is a **generated-file tree + config diff**,
  which is the Axis-3 scaffold-from-UI showcase.
- **`ns-assist`** — grounding always shown, always terminates in a deep-link or a confirm+CLI action.

**`DashboardPanelContribution` — the seam vocabulary. Use these exact nouns; do not invent a rival
taxonomy.** A contribution declares:

```
id · title · icon · capability · component · slots (options | sidebar | actions) · setup() · commands
```

These are the fields `/extensions`, `/plugins/:pluginId?tab=axes`, and Home's contributed-panels row
must render. **The four first-party capability consoles ARE contributions** — showing them here as
ordinary contributions is the proof the extension API is real and not a second-class citizen.

---

## The canonical fixture — and the one number you must reconcile with Home

**Installed plugins: 5** — `workers` · `sagas` · `triggers` · `streams` · `auth`.
(`auth` has an update available: **v0.9.1 → v1.0.0**.) The **dashboard plugin itself** also appears
in the installed list — that is the dogfood point.

**Contributed panels: 6.** All six come from the five installed plugins — note `triggers` contributes
**two**:

| plugin | id | title | capability | mount target | slots | commands |
| ------ | -- | ----- | ---------- | ------------ | ----- | -------- |
| workers | `workers.console` | Workers | workers | `capabilities/workers` | options, actions | 3 |
| sagas | `sagas.console` | Sagas | sagas | `capabilities/sagas` | options, sidebar | 2 |
| triggers | `triggers.console` | Triggers | triggers | `capabilities/triggers` | options, actions | 4 |
| triggers | `triggers.dlq` | Dead-Letter Queues | triggers | `data/dlq` | actions | 2 |
| streams | `streams.console` | Streams | streams | `capabilities/streams` | options | 2 |
| auth | `auth.sessions` | Auth Sessions | auth | `data/auth` | sidebar | 1 |

> **⚠️ Fixture note — read this, it is the one place the source brief contradicted itself.**
> An earlier ledger said *"6 contributed panels = 4 first-party + 2 third-party"* **and**
> *"5 plugins installed"*. Those cannot both be true: a contribution comes from a plugin, so two
> third-party panels would require two more installed plugins. The table above is the resolution —
> **6 panels, 5 installed plugins, zero invented entities, and it reconciles exactly with Home.**
>
> **The third-party story therefore lives in the LIFECYCLE, not in the installed count** — and it is
> a stronger demo for it. Third-party contributions appear as:
> - **`/extensions?tab=available`** and **`/plugins?tab=available`** — marketplace-lite cards with a
>   real **Install write** (this is the Axis-3 scaffold-from-UI showcase: the confirm previews the
>   generated file tree + config diff + deps);
> - the **permission prompt** shown when a newly installed extension first activates;
> - the **quarantine state** — an extension held because it was built for contract v1 while the host
>   is at v2;
> - the **sandboxed-panel chrome** with its persistent provenance chip.
>
> If you conclude the design genuinely needs installed third-party plugins, say so in your completion
> report's **Open questions** — do not silently change the count, because Home renders it too.

**`crons`** is the available-not-installed plugin (the one `plugin-gated-view` teaches).

**Other facts you will render:** 1 doctor warning = the **triggers** plugin's **DLQ port degraded**
(that is the check with the remediation write) · the contribution-axis map's targets are the real
routes (`/catalog`, `/workers`, `/extensions`, `/runtime/overrides/:key`) · config chain
`v41 → v42 → v43 (current)`.

**The correlation spine** (every other screen renders it; P6 links into it, so the ids must match):

```
POST /webhooks/stripe
  → trigger  webhook.payment      event      evt_2210
  → saga     PaymentWebhookSaga   instance   ch_3QK9dR2eZ   COMPENSATING, step 2 of 4
  → job      reserve-inventory    execution  job_4183       attempt 2 of 3, RETRYING
  → stream   payment-events       message    msg_88f        2/3 delivered · 1 failed (analytics)
```

`ch_3QK9dR2eZ` is THE journey id. The `triggers` DLQ-port warning on the Doctor tab is *why* that
failed `analytics` delivery is stuck — the remediation write on that check is the one place P6
touches the incident. The execution id is `job_4183` (not `exec_4183`); `msg_88f` is the stream
*message* id.

---

## When you finish this slice — write a completion report

**This is required, and it is how the build pipeline knows you are done.** As your final action,
write the file:

```
_reports/P6-complete.md
```

with exactly this shape:

```markdown
# P6 — complete

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
- [ ] the contributed-panel count matches Home (6) and the installed-plugin count matches Home (5)
- [ ] `DashboardPanelContribution` fields rendered with their real names (id · title · icon · capability · component · slots · setup · commands)
- [ ] sandbox / quarantine chrome never reads as an error state

## New components I introduced
<name, class contract (`ns-<block>` / `ns-<block>--<variant>` / `ns-<block>__<part>`), and what it does — these get synced back into framework source, so the class contract matters>

## Decisions / deviations
<anything you changed from this prompt, and why>

## Open questions
<anything you could not resolve from the brief>
```

Write it **last**, after the design is done and self-checked. Do not write it early.

---

## `/plugins` — the registry/host (dogfood centerpiece)

- **Installed tab:** plugin table — status, version with a **three-fact drift indicator** (package
  version · contract version · peer compatibility), doctor summary, and a **contribution footprint**
  column (a mini axis-glyph row: routes / db / workers / streams / triggers / telemetry / config /
  CLI / dashboard). **The dashboard plugin itself appears in the list** — the tool that controls your
  plugins is itself a plugin.
- **Available tab:** installable plugins (registry cards) with an **Install write**: the confirm
  shows **what will be generated and wired into the project** (file tree, config diff, deps) + the
  CLI (`netscript plugin install crons`), Execute → progress → success with a "what got wired"
  summary and links. **This is the Axis-3 scaffold-from-UI showcase — design the file-diff preview
  properly; it is the beat that makes "one generator, two callers" legible.**
- **Contributions tab:** a flat list of every UI contribution in the app (panel / action / tool /
  tab / card), each row: kind icon, title, contributing plugin, mount target, status.

## `/plugins/:pluginId` — plugin detail

- **Overview:** identity card (version, publisher, JSR link), health, update write
  (`netscript plugin update auth` — confirm with a changelog diff; `auth` is the one at
  v0.9.1 → v1.0.0).
- **Axes tab — the contribution-axis map as NAVIGATION** (`ns-axismap`): the axis grid where every
  **wired** axis is a live deep-link (Routes → `/catalog?plugin=…`, Workers → `/workers?plugin=…`,
  Dashboard → `/extensions?plugin=…`, Config → `/runtime/overrides/:key`, …). Unwired axes render
  quiet and inert. **This map is the architecture made tangible — give it hero treatment.** It is
  not a diagram; it is navigation.
- **Doctor tab:** check rows (ok / degraded / failed) with **per-check remediation writes**
  ("Fix: bind contract route…" → confirm+CLI) and the raw `netscript plugin doctor triggers` line
  printed. The triggers **DLQ-port** warning lives here.
- **Config tab:** the plugin's runtime-config topics, linking into `/runtime/overrides/:key`.
- **Create-from-template:** a first-class "New plugin…" flow (from the `/plugins` header **and** ⌘K):
  pick archetype template → name/options typed form → **generated-file tree preview + config diff** →
  confirm+CLI (`netscript plugin new my-plugin`) → success state with "develop your panel" pointers.

## `/extensions` — the extension manager (Axis-6 flagship, NEW surface)

- **Panels tab:** every contributed dashboard panel (the 6 above): preview thumbnail, name,
  contributing plugin (**provenance chip**), mount target (which route/zone), **trust tier badge**
  (first-party / verified / sandboxed), enable/disable switch (confirm-gated), version-compat state.
  A **quarantined panel** state: incompatible contract version → the panel card renders quarantine
  chrome ("held: built for contract v1, host at v2") with an update write. **Quarantine is a shipped
  product state, not an error and not a preview** — it must not look like either.
- **Actions tab:** contributed ⌘K commands and per-entity contextual actions + **contributed AI
  tools** (ties directly to P5's tool registry), each with provenance + a **permission summary**
  ("reads: executions · writes: via confirm only"). That permission line is what makes a third-party
  contribution safe to read at a glance.
- **Available tab:** discoverable third-party extensions (marketplace-lite cards) with the same
  install-write pattern.
- **Injection-zone inspector** (the DX loveletter): an overlay toggle — "Show zones" — that, when on,
  renders **every extension mount point in the CURRENT app chrome** as an annotated outline (zone id,
  accepted contribution kinds, current occupant). **Design the overlay state on the Home screen as
  the demo.** This is the single clearest way to show a contributor where their panel can go.
- **Permission prompt:** the dialog shown when a newly installed extension first activates — what it
  can read, which zones it mounts, what it may propose to write; allow/deny **per capability**.
  Sandboxed (third-party) panels render inside a visibly framed container with the provenance chip
  persistent.

## `/extensions/:extensionId` — extension detail

Manifest view (kinds contributed, zones, contract version, permissions — using the
`DashboardPanelContribution` field names), provenance + signature, per-contribution status,
changelog, disable/remove writes, and a **"Develop" panel**: the local dev loop — hot-reload status
dot, "open source", contract-version handshake state — designed as a real DX surface (**the "write a
panel in an afternoon" story**).

## Dogfood proof everywhere

The first-party capability consoles (P3) carry tiny provenance chips ("contributed by the `workers`
plugin") in their headers; Home's contributed-panels row links here; the ⌘K palette marks contributed
commands. **The platform is not a settings page — it is visible throughout the product.**

## CLI dependency map (epic #701 — SHIPPED in beta.9; use these exact verbs)

| Surface | Shipped CLI verb |
|---|---|
| Available-tab Install write | `netscript plugin install <kind>` |
| Plugin update with changelog diff (re-pin semantics) | `netscript plugin update <name>` |
| Create-from-template | `netscript plugin new <name>` (dual-tier generator) · `plugin scaffold <name>` |
| Remove / enable / disable an extension | `netscript plugin remove\|enable\|disable <name>` |
| Doctor tab + per-check remediation | `netscript plugin doctor` (+ the auth/contract verbs from P4) |
| Contribution sync (contributed panels/actions registry) | `netscript plugin sync` |
| Extension quarantine ("built for contract v1, host at v2") | `netscript contract version add` |
| Scaffold-from-UI web layer ("New page / island…") | `netscript ui:add <kind> [name]` · `ui:list` · `ui:update` · `ui:remove` |
| Marketplace-lite discovery | `netscript marketplace` |

**Do not invent verbs.** Note in particular: the shipped verbs are **`plugin install`** (not
`plugin add`) and **`plugin new`** (not `plugin create --template`) — older drafts of the design
corpus used the wrong names. If a write you want to design has no verb in this table, design the
affordance, print the closest shipped verb, and raise it in your completion report's Open questions.

**States:** empty (no third-party extensions — a teaching state with the create-from-template CTA),
install in-flight, quarantined, permission-pending, disabled, drifted, healthy-full.

**Reach for:** `data-table`, `ns-axismap` (as navigation), `ns-confirm`, `ns-diff` (file/config
previews), `ns-assist`, `badge`, `ns-chip`, `switch`, `code-block`, `ns-kv`, `plugin-gated-view`,
`empty-state`, `Card` grid for the marketplace.

**Market bar:** the best extension ecosystems (Directus's typed extension taxonomy, Nuxt DevTools'
contributed tabs, Medusa's admin widgets/zones, VS Code's provenance + permission model) each own a
piece; none render the contribution system **inside the product** with zone inspection, trust tiers,
AND scaffold-into-your-app writes. Combining those into one visible platform surface is the category
move.

**Non-goals:** no code editor; no npm-style browsing beyond the curated cards; **extension sandboxing
chrome must never look like an error state.**

**Theme:** NS One tokens only (`--ns-*`), warm-cream light default + dark via `[data-theme='dark']`;
provenance chips use **muted** tone (they must never compete with status); mono for ids and paths;
reduced-motion fallbacks.
