# NetScript Dev Dashboard — Claude Design Revamp Brief

> **Audience:** the Opus 4.8 canvas sub-agent executing against the Claude Design project
> **NetScript — NS One** (`ec262e10-d4ad-451f-9aeb-e51955db3634`).
> **Status:** authoring complete; **orchestrator review pending** — no canvas turn is spent until the
> orchestrator has checked this brief against the ratified IA (§4) and answered the blocking items in
> `OPEN-QUESTIONS.md`.
> **Companions:** `SCREEN-SPEC.md` (per-screen content spec — the *what to draw*),
> `PROPOSED-COMPONENTS.md` (component contract — the *what to build with*),
> `OPEN-QUESTIONS.md` (unresolved; do not guess these).

This brief is the **execution contract**. §1 and §2 are correctness rules: violating them produces
output that is silently broken (§1) or unmergeable into `@netscript/fresh-ui` (§2). §3–§6 are the
product: what the dashboard is, its locked IA, and the content law. §7–§9 are how the work is staged
and judged.

---

## 0. Authority chain (read this before you read anything else)

Design corpus for this dashboard accumulated across four runs. Where they conflict, **later
owner-ratified artifacts win.** The order, newest first:

| # | Artifact | Status |
| - | -------- | ------ |
| A1 | `.llm/runs/dashboard-design--orchestrator/` — improvement-brief (six owner axes, "binding for all passes"), `analysis/routing-resort.md` (LOCKED route tree), `design-prompts/00–06` (v3 prompts), `screen-catalog.md` | **live** (2026-07-12) |
| A2 | `.llm/runs/dashboard-rescope--seed/` — owner-ratified 2026-07-06 ("yes to all, proceed"; 32 board mutations landed), `epic-rewrite.md` = the rewritten epic #400 body | **live** |
| A3 | `.llm/runs/plan-roadmap-expansion--seed/design/A-dashboard/proposal.md` | **live except §3** — §9.1 (manage loop) and §9.2 (`DashboardPanelContribution` seam) stand and are embedded verbatim below; **§3's 7-panel table is superseded** by A2's authoritative screen set |
| A4 | `.llm/runs/feat-dashboard-design-prototype--design/plan.md` — LD-1…LD-7 | **live except LD-1's breadth clause** — LD-1 named "shell + 7 panels + 4 capability sections"; three of those seven panels (Trace Waterfall, Logs, Resource Control) were **killed by A2** and are now acceptance-line violations. LD-2…LD-7 stand. |

**What A2 killed, and why it matters to you.** The owner closed #421 (Logs panel) and #422 (Resource
Control panel) as *not planned*, and rewrote #418 from "trace waterfall" to "S13 Live Flow — causal
seam chain". If you draw an OTLP trace waterfall, a span gantt, a log tail, a metrics chart, or a
resource start/stop panel, the screen is **rejected on sight** — not restyled, rejected. See §5.

The divergence between A4's LD-1 and A2/A1 is recorded as drift **D-4** in
`.llm/runs/beta10--orchestrator/drift.md`.

---

## 1. The runtime contract (HARD — this overrides the platform's own instructions)

Claude Design's generic design-system context will tell you to load `_ds/<folder>/_ds_bundle.js` and
destructure `window.NetScriptNSOne_ec262e`. **That instruction is wrong for NS One. Ignore it.** Both
instructions arrive in the same system prompt; this one wins.

**Why** (verified twice — from NS One's own `README.md`, and from `tools/design-sync/mod.ts:59-62`):
`_ds_bundle.js` is **platform-reserved**. The canvas compiles the uploaded `.tsx` sources into its own
bundle at that path — a bundle that contains **no ReactDOM** and sets **no window globals** — and it
**clobbers anything uploaded there**. A screen that follows the platform default loads a bundle that
mounts nothing. The failure is silent at author time and only appears at render.

The real contract:

| File | What it gives you |
| ---- | ----------------- |
| `_ns_runtime.js` | `window.React`, `window.ReactDOM`, `window.NSOne` — **every component is `NSOne.<Name>`** (e.g. `NSOne.Badge`, `NSOne.DataTable`, `NSOne.Dialog`) |
| `_ns_styles.css` | the full style closure: tokens, base rules, layout objects, every component's CSS |
| `styles.css` | DM Sans / DM Mono font faces |

Rules that follow from it:

1. **Never** reference `_ds_bundle.js` or `_ds_bundle.css`. Never read a `window.NetScriptNSOne_*`
   global. There is exactly one global: `NSOne`.
2. Components take **`class`**, not `className`. They are Preact-authored; React passes `class`
   straight to the DOM. This is not a style preference — it is what lets your markup round-trip into
   Fresh source unchanged. `className` in a screen is a defect.
3. **Render smoke — mandatory, per screen, before the screen is submitted.** Load the screen and
   assert, in this order:
   - `typeof window.NSOne !== 'undefined'` and `Object.keys(window.NSOne).length > 40`;
   - `window.React` and `window.ReactDOM` are defined;
   - the root mounts (a non-empty `#root`/mount node) in **both** `light` and `[data-theme='dark']`;
   - zero console errors.
   A screen that has not passed this smoke is not done, however good it looks. `window.NSOne`
   undefined is the D-2 foot-gun firing.
4. **Read one existing screen before authoring your first one.** The project already contains
   `screens/` files. Open one, copy its file convention exactly (extension, script/link tags, relative
   depth to `_ns_runtime.js` / `_ns_styles.css` / `styles.css`), and only then write new screens. Do
   not infer the convention from this brief — it is deliberately not restated here (see
   `OPEN-QUESTIONS.md` OQ-3).

---

## 2. NS One hard rules (from the design system's own README — non-negotiable)

Everything you draw is destined for `@netscript/fresh-ui` source: **new components are synced back
into the framework from your markup and CSS.** These rules are what makes that possible.

1. **Theme-blind components.** Style only via `--ns-*` custom properties and `ns-*` classes. **Never a
   raw hex value**, never a gray-ramp step. If a shade is missing, derive it with `color-mix()`. The
   sync tooling has a `raw-hex` trap check that **fails** on hex literals in generated files.
2. **Light is the unthemed default** (the warm-cream brand look). Dark is `[data-theme='dark']` on the
   root. **Every screen is designed and shipped in both.** Not "light, and dark falls out" — both.
3. **State via attributes, native elements first.** `data-part` / `data-state` / `aria-*` on native
   elements (`<select>`, `<dialog>`, `<details>`, `<button>`) before any invented JS state. The DS's
   eight interactive primitives (Dialog, Tabs, Popover, Drawer, Sheet, Combobox, Accordion, Tooltip)
   are real and on the `NSOne` global — use them; do not re-implement overlay or disclosure behavior.
4. **The class contract.** Any new component follows `ns-<block>` / `ns-<block>--<variant>` /
   `ns-<block>__<part>`, with real typed props. This is the sync-back contract:
   `PROPOSED-COMPONENTS.md` is where each new component's contract is declared **before** you draw it.
5. **Charts and data-viz: token-driven colors only.** `var(--ns-primary)`, intent tokens, `color-mix()`
   derivations. Never a hardcoded palette.
6. **Compose before inventing.** The 44-component inventory + 8 primitives is the palette. A new
   component is legitimate only when composition was **tried and named** before it was rejected — and
   then it goes in `PROPOSED-COMPONENTS.md` with its class contract, not straight onto a screen.

Two component-level laws carried from the ratified corpus, so they don't get re-litigated on the
canvas:

- **`DataGrid` is not a block.** fresh-ui ships a real typed `DataGrid<T>` export. On the canvas,
  tabular surfaces use the seeded **`DataTable`** block. Do not design a third table.
- **MCP components are out.** `mcp-ui-widget` may appear in the re-synced inventory (it is a new
  fresh-ui island). It is **not** for dashboard screens — the panel IA renders typed NetScript data;
  MCP is a data *source*, not a render target (A3 §5.1).

---

## 3. What you are designing

NetScript is a Deno-native full-stack framework: apps are composed from plugins (workers, sagas,
triggers, streams, auth, …), orchestrated locally by an Aspire apphost, and driven by one CLI. The
**Dev Dashboard** ships as `plugins/dashboard` — *the tool that controls your plugins is itself a
plugin* — and it is the DX console for the whole stack: auto-launched, live, derived entirely from the
developer's own code and scaffold output.

**Three pillars** (epic #400, verbatim):

> **Observe** (only-NetScript state) · **Manage** (Appwrite-style per-capability console mirroring the
> CLI — one generator, two callers) · **Follow** (Encore-model live seam-flow, never re-rendered OTLP).

**DX thesis** (epic #400, verbatim):

> Answer the questions no existing tool can: *"is my NetScript app wired the way I declared it, what is
> my runtime doing right now at the primitive level, what did this request actually cause, and let me
> act on it without leaving the browser."*
>
> - **Aspire owns:** resources, console/structured logs, raw traces, metrics, health, process lifecycle.
> - **Scalar owns:** API reference, schemas, try-it, code samples.
> - **The dashboard owns:** primitive run-state (executions/attempts, saga instances incl.
>   `compensating`, trigger firings, stream deliveries), the runtime override/config layer **including
>   gated write-back**, plugin-registry wiring + doctor + contribution axes, contract
>   provenance/coverage/duality, route→contract binding, codegen/scaffold state (migrations, drift),
>   **the per-capability management loop (create → configure(tabs) → monitor)**, and **the live request
>   journey across framework seams (S13)**.

The reference class is Temporal, Inngest, Encore, Appwrite, Supabase Studio, and the new Aspire
dashboard. Match their navigation ergonomics (URL-first, back/forward-safe, everything shareable), then
beat them on wiring-truth density and the correlation spine — which none of them have.

---

## 4. The locked IA (verbatim — do not re-derive)

### 4.1 Authoritative screen set (epic #400, verbatim — *supersedes the pass-1 DDX panel list*)

> - **S1 Shell & Wiring Home** — #415 (+ quick-action strip mirroring top CLI verbs)
> - **S2 Config Resolution & Topology Hand-off** — #416 (+ live-traffic edge overlay, Encore Flow model)
> - **S3 Runtime-Config Monitor & Control** ⚑ flagship — DDX-20 (+ gated write-back)
> - **S4 Service & Contract Catalog** — #417 (provenance/coverage/duality only; no try-it)
> - **S5 Plugin Control** (dogfood centerpiece) — #420 (+ install/scaffold entry points, marketplace-lite)
> - **S6 Run Inspector + NetScript run-overlay** — #419 (run-centric)
> - **S7–S10 Workers / Sagas / Triggers / Streams consoles** — #428 #429 #430 #431 (each completes the
>   create→configure→monitor→act management loop)
> - **S11 DB Migrations & Drift** — DDX-21
> - **S12 Dead-Letter Queues** — DDX-22
> - **S13 Live Flow — request journey** ⚑ flagship #2 — #418 (the seam-event causal chain — request →
>   payload → job → saga → fan-out — with per-node Aspire out-links)

Plus, from A1: **`/ai`** (AI console + distributed assists, Axis 5) and **`/extensions`** (the
extension-platform surface, Axis 6). The full route tree — every route, every param — is
`SCREEN-SPEC.md` §1, taken verbatim from the LOCKED hierarchy in
`.llm/runs/dashboard-design--orchestrator/analysis/routing-resort.md`.

### 4.2 The three acceptance lines (epic #400, verbatim — they gate every screen)

> 1. **Non-duplication.** No dashboard screen may render, as an owned surface: an OTLP trace waterfall /
>    span-bar gantt, a structured/console log tail, a metrics chart, a resource start/stop/restart
>    panel, or an OpenAPI operation list / try-it console. Each is Aspire's or Scalar's job and MUST be
>    a deep-link out. Every merged panel must pass **"why can't this just deep-link to
>    Aspire/Scalar?"** with a NetScript-only answer — only-NetScript *state*, only-NetScript *action*
>    (CLI-mirroring), or framework-*seam semantics* raw OTLP cannot express.
> 2. **One generator, two callers.** Every dashboard mutation invokes the same contract route / CLI
>    scaffolder the terminal does and renders its CLI-equivalent line (`netscript …` CodeBlock). No
>    dashboard-only write paths, no forked codegen.
> 3. **Flow ≠ waterfall.** S13 renders a primitive-grouped causal chain with payloads at seams,
>    assembled from NetScript's own seam events; the moment raw timing/span detail is needed it
>    out-links to Aspire `/traces/detail/{id}`. No span bars, no time-proportional gantt, no log tails
>    in S13 — ever.

**The one distinction people get wrong:** a **derived NetScript stat** (executions/hr, saga success
rate, pending-migration count, failed-delivery count) is *ours* — the framework computes it from its
own primitives and nothing else can. An **OTLP resource metric** (CPU, memory, request histograms) is
*Aspire's* and is a link, never a chart. Home's KPI row is legal; a resource-metrics chart is not.

### 4.3 Per-capability manage loop (A3 §9.1, verbatim)

> Appwrite proves the differentiator is **per-capability first-class sections** … each with (1) its own
> nav entry named after the primitive, (2) a fastest-path create action (form or template gallery),
> (3) a **tabbed settings area** distinct from the create form (permissions/security/config as separate
> tabs, not inlined), and (4) — where the primitive produces activity — a **dedicated monitor view with
> its own status vocabulary**.
>
> - **Per-capability plugin sections** (one per **installed** plugin category, following the
>   create→configure(tabs)→monitor loop): **workers · sagas · triggers · streams** at beta.6;
>   **auth · db · kv · storage-shaped** at stable. Each section's monitor view **deep-links into the
>   cross-cutting Run Inspector / Flow panel** filtered to that capability (no duplicated trace
>   rendering — the cross-cutting panels stay the single render surface).
> - **Plugin Control** = the **host + registry/overview + doctor** — installed-vs-available plugins,
>   health, and the mount point that renders the contributed per-capability sections. It is no longer
>   "the panel that lists actions"; the actions live in each capability section.

### 4.4 `DashboardPanelContribution` — the seam vocabulary (A3 §9.2, verbatim)

> **Verdict: ADOPT, as a contribution-CONTRACT seam owned by `plugin-dashboard-core`, not a new core
> `definePlugin` axis.** … the exact precedent for making the NetScript dashboard a **panel/L3-block
> registry consumer**, not just an author.
>
> - Define a **`DashboardPanelContribution` contract** in `plugin-dashboard-core/contracts/v1`
>   (Standard-Schema-shaped: `id`, `title`, `icon`, `capability` (which plugin category), `component`
>   (the island entrypoint), `slots` (options/sidebar/actions), `setup()` (data-source wiring to the
>   core ports), `commands` (withCommand refs)).
> - **Discover contributions the way Aspire contributions are discovered** — a plugin that wants a
>   dashboard section depends on `@netscript/plugin-dashboard-core` and exports a contribution the
>   registry-generation step collects (parallel to `AspireNSPluginContribution.contribute()`). **This
>   deliberately keeps `@netscript/plugin` dashboard-agnostic.**
> - **Optional `.withDashboardPanel()` sugar** — a thin helper that *produces* the same contribution
>   contract, NOT coupling in the core builder.

**This vocabulary is load-bearing on the canvas, not just in the code.** These exact nouns — `id`,
`title`, `icon`, `capability`, `component`, `slots` (options/sidebar/actions), `setup()`, `commands` —
are what `/extensions`, `/plugins/:pluginId?tab=axes`, and Home's contributed-panels row must render.
The four first-party sections (workers/sagas/triggers/streams) **are themselves contributions** and
must be shown as such: the dashboard dogfoods its own extension API. Do not invent a rival extension
taxonomy on the canvas.

---

## 5. The six owner axes (binding for every pass)

Condensed from `.llm/runs/dashboard-design--orchestrator/improvement-brief.md`. Each is an acceptance
bar, not an aspiration.

| Axis | Bar |
| ---- | --- |
| **1 — Zero future-beta prose** | The design shows the **final product**. No "coming soon", no "lands in beta.N", no "preview — routes pending", no beta version string in the footer. Every planned capability renders fully implemented and operable. Honesty about build status lives in the tracker, never in the design. *(Legitimate exception: a **not-installed plugin** genuinely has no data — its empty state teaching `netscript plugin add crons` is a real product state, not future-beta prose.)* |
| **2 — Complete routing hierarchy** | Capability group → list → entity detail → sub-entity detail. Path params = identity; query params = filters/tabs/view state. **Nothing selectable is in-memory-only.** Breadcrumbs derived from the pathname; sidebar mirrors the tree; one correlation id resolves to a journey URL. Show realistic URLs in the mocks — addressability must be *visible*. |
| **3 — All features implemented, including writes** | The dashboard mirrors CLI capability, not read-only panes: plugin add, resource scaffold, db migrate, config override set/unset, trigger enable/disable, DLQ reprocess, saga replay, plugin update. Writes are **first-class flows** (create → configure → monitor), not buried buttons. Every mutation: **plan → diff → exact CLI equivalent → confirm → result**. |
| **4 — Beta.10 cross-coverage** | Every screen maps to a beta.10/DDX issue and vice-versa (`.llm/runs/dashboard-design--orchestrator/coverage-matrix.md`). Gaps get flagged, not invented around. |
| **5 — AI as a distributed capability, not a chat pane** | AI shows up as: contextual actions (explain-this-failure, fix-this), embedded assists (inline diagnosis on failed runs, override suggestions, migration explanations), context augmentation (any panel can feed its state to the assistant), durable agent runs **joined to the correlation spine**, and tool-call transparency (contract procedures rendered as tools). One generic chat pane is the failure mode. |
| **6 — Dynamic plugin/extension system** | The contribution story is **visible**: third-party contributed panels, an extension-management surface, and the contribution-axis map as **live navigation**. A plugin contributes panels, seams, actions — and the dashboard shows it. |

**The CLI-transparency invariant (hard):** a confirm dialog without a populated CLI-equivalent line is
a **defect**, not a styling choice. The `netscript …` CodeBlock is a **required slot** on every
mutation dialog. Every verb printed must be one that **actually ships** — the CLI-features epic (#701)
landed in beta.9; the verified verb strings are in
`.llm/runs/dashboard-design--orchestrator/reference/cli-correlation-report.md`. **Do not invent CLI
verbs.**

---

## 6. Content law — no filler, ever

The dashboard's content is NetScript's own domain. Filler is the fastest way to make a prototype
worthless as a decision-locking artifact.

1. **No `[RENDER_BLANK]`, no lorem, no placeholder rows, no empty panels.** Every panel renders real,
   plausible, *internally consistent* content.
2. **No invented benchmark claims, no superlatives, no marketing tone.** Numbers look measured. UI copy
   is terse and instrumental. No candor-announcing phrasing ("honestly", "to be transparent").
3. **One canonical fixture across every screen.** The Stripe-webhook incident (`SCREEN-SPEC.md` §3) is
   the spine: the same correlation id, the same job id, the same message id, the same counts, on every
   screen that touches them. **Two screens showing different values for the same fact is a defect.**
4. **The data model is real, and it is richer than you think.** Eight trigger types; the job (compiled
   Deno) vs task (polyglot: Python/Shell/PowerShell/.NET) split with runtime badges; the trigger
   **action chain** (`enqueueJob` / `publishSaga` / `executeTask` / `executeBatch`, each deep-linking
   to the entity it produced); the saga history stream with `compensating` as a real status; derived
   stats (counts + successRate) computed from list totals. Ground truth:
   `.llm/runs/dashboard-design--orchestrator/design-project/feedback/POC-ground-truth.md`. Use it.
5. **If a panel needs data you cannot ground, say so.** Add it to `OPEN-QUESTIONS.md` and leave the
   panel out of the pass. Do **not** invent a data source, an endpoint, a CLI verb, or a stat.
6. **Never name internal reference applications or internal process artifacts** in screen copy. AI
   fixtures use neutral model labels (e.g. `ops-model-large`), never real vendor model ids.

---

## 7. Visual direction

The bar is "an operator console a senior developer would choose to keep open next to their editor".
Concretely, for this system:

- **Density with calm.** The audience is glancing between editor and console while their stack runs.
  Information-dense, quiet, no decoration that isn't carrying data. Whitespace is used to group, not to
  breathe for its own sake.
- **The warm-cream default is the brand.** Resist the reflex to make a dev tool dark-first-and-gray.
  Light is the designed default and must look *deliberate*, not like an inverted dark theme. Dark is
  designed with equal care — dense tables and state pills need contrast validation, not a filter.
- **Monospace is semantic.** Ids, paths, CLI lines, correlation keys, durations — `--ns-font-mono`.
  Prose is DM Sans. Ids render as `job_4183` (mono), never `#4183`.
- **Status is one vocabulary, everywhere.** `completed → success` · `running → primary` ·
  `failed → destructive` · `retrying | degraded | compensating → warning` · `queued → muted`. One word
  per state, one variant per word, used identically on every screen.
- **The URL is part of the design.** Show it. Addressability is a feature; render it as one.
- **Motion is meaning.** A pulse means *live*, not *pretty*. Everything with motion has a
  `prefers-reduced-motion` fallback.
- **Charts:** token-driven only, and only for NetScript-derived stats (§4.2).

---

## 8. Execution — passes, and what gates each one

Full breadth is ~16 screen roots + ~22 entity/sub-entity levels, **each in light and dark**. That does
not fit one canvas sitting, and the plan's two-pass staging (LD-1) predates the routing resort. The
staging below is a **recommendation pending orchestrator ratification** (`OPEN-QUESTIONS.md` OQ-2) — do
not start until it is confirmed.

| Pass | Scope | Gates the next pass by proving |
| ---- | ----- | ------------------------------ |
| **P0 — Frame** | Shell (sidebar/topbar/breadcrumb/⌘K/env pill/theme), the route tree made visible, `/` Home | The runtime contract renders (§1 smoke); the component contract holds; the IA is navigable |
| **P1 — Investigation spine** | `/flow`, `/flow/:correlationId` ★, `/runs`, `/runs/:correlationId` | The two flagships. The causal seam chain reads clearly **without** being a waterfall; the correlation spine resolves |
| **P2 — Capability consoles** | `/workers/*` (jobs + polyglot tasks), `/sagas/*`, `/triggers/*`, `/streams/*` | The create→configure→monitor loop ×4, rendered **through the contribution seam** |
| **P3 — Control plane + data** | `/runtime/*` ⚑, `/config/*`, `/catalog/*`, `/plugins/*`, `/migrations/*`, `/dlq/*`, `/auth/*` | Writes as first-class flows; the plan→diff→CLI→confirm→result pattern at scale |
| **P4 — AI + extensions** | `/ai`, `/ai/runs/:runId`, the distributed assist slots retro-fitted across P1–P3 screens, `/extensions/*` | Axis 5 and Axis 6 |

Per-pass discipline:

1. **Re-sync first.** `deno task design:sync check` (not `build` — `check` is the verdict: it builds
   twice and gates on idempotence + parity + the trap checks) must be green, and the bundle uploaded,
   before a pass that depends on a component change.
2. **New components are declared before they are drawn.** Add the contract to
   `PROPOSED-COMPONENTS.md` first. A component that appears on a screen without a declared contract is
   sync-back rework, not a candidate.
3. **Every screen: light + dark + the §1 render smoke.** No exceptions.
4. **Numbers reconcile against the fixture ledger** (`SCREEN-SPEC.md` §3) before the screen is
   submitted.
5. **You do not self-certify.** The orchestrator reviews each pass against the IA (§4) and the axes
   (§5) before the next pass is authorized. A GLM 5.2 adversarial design pass is a separate,
   pre-merge gate (`OPEN-QUESTIONS.md` OQ-8).

---

## 9. Auto-reject list (any one of these fails the screen)

| # | Defect | Source rule |
| - | ------ | ----------- |
| 1 | `_ds_bundle.js` referenced, or `window.NSOne` undefined at render | §1 (drift D-2) |
| 2 | `className` instead of `class` | §1.2 |
| 3 | A raw hex literal in authored CSS or TSX | §2.1 (`raw-hex` trap) |
| 4 | Screen exists in light only (or dark only) | §2.2 |
| 5 | An owned trace waterfall / span gantt / time-proportional timeline of spans | §4.2 line 1 & 3 (`ns-waterfall` is **retired** — it is a defect, not a component) |
| 6 | An owned log tail / metrics chart / resource start-stop panel / API try-it console | §4.2 line 1 |
| 7 | Future-beta prose, preview banners, gated "coming soon", a beta version string | §5 Axis 1 (`ns-preview-tag` is **retired**) |
| 8 | A mutation dialog with no CLI-equivalent line — or an invented CLI verb | §5 (CLI invariant) |
| 9 | In-memory selection: an entity a user can select that has no URL | §5 Axis 2 |
| 10 | `[RENDER_BLANK]`, lorem, placeholder rows, or a number that contradicts another screen | §6 |
| 11 | A new component drawn without a declared contract in `PROPOSED-COMPONENTS.md` | §2.6 |
| 12 | An internal reference-app name or internal process artifact in screen copy | §6.6 |

---

## 10. Where to read (ground truth, in order)

| Need | Read |
| ---- | ---- |
| The runtime + rules | NS One's own `README.md` **in the canvas project** (it is correct; the platform context around it is not) |
| The IA, per screen, with the fixture | `SCREEN-SPEC.md` (this directory) |
| The component contract | `PROPOSED-COMPONENTS.md` (this directory) |
| The full locked route tree, guards, breadcrumb rules | `.llm/runs/dashboard-design--orchestrator/analysis/routing-resort.md` |
| Long-form per-area prompts (source for `SCREEN-SPEC.md`; **this brief wins where they conflict** — they target the retired project and predate the runtime contract) | `.llm/runs/dashboard-design--orchestrator/design-prompts/00–06` |
| The real data model (enums, joins, derived stats) | `.llm/runs/dashboard-design--orchestrator/design-project/feedback/POC-ground-truth.md` |
| Shipped CLI verbs | `.llm/runs/dashboard-design--orchestrator/reference/cli-correlation-report.md` |
| What the current prototype already does (and its known defects) | `.llm/runs/dashboard-design--orchestrator/screen-catalog.md` |
| Issue ↔ screen coverage | `.llm/runs/dashboard-design--orchestrator/coverage-matrix.md` |
| Pass-1 component verdicts (historical; its `ns-waterfall` / `ns-log-stream` verdicts are **superseded**) | `DECISIONS.md` (this directory) |
