# NetScript Dev Dashboard — Proposed Components

> Companion to `CLAUDE-DESIGN-BRIEF.md` (the contract) and `SCREEN-SPEC.md` (the screens).
> **Audience:** the canvas sub-agent (what may I use? what must I declare before I draw it?) and the
> fresh-ui sync-back author (what becomes framework source?).
>
> **Rule one — compose before inventing.** §1 is the palette. A candidate in §3 exists only because
> composition was **tried and named** before it was rejected. A component drawn on a screen without a
> declared contract here is sync-back rework, not a candidate.

**Headline count.** Existing: **52 units** — 44 synced NS One components (30 general · 11 blocks ·
3 islands) + 8 interactive primitives. New: **20 components** (6 from the DDX-0 promote-set +
14 dashboard-specific) plus **5 non-component additions** (3 variants/skins, 1 layout object, 1
DataTable row mode). **Retired: 2** (`ns-waterfall`, `ns-preview-tag`) and **1 rescoped**
(`ns-log-stream` → `ns-logstrip`).

Every `new` unit is fresh-ui sync-back work (DDX-0 / #410 scope amendment — see `OPEN-QUESTIONS.md`
OQ-10).

---

## 1. What the seeded system already ships (compose from this first)

Verified against `packages/fresh-ui/registry.manifest.ts`.

### 1.1 `general/` — 30 L2 components

| Group | Components |
| ----- | ---------- |
| Form | `Button` `IconButton` `Input` `Textarea` `Checkbox` `Switch` `Label` `Select` `FormField` `Search` `Dropzone` |
| Surface | `Card` `Panel` (dense secondary surface; tones muted/raised) `Separator` |
| Status / feedback | `Badge` (intent variants) `Alert` `InlineNotice` `Spinner` `Progress` `Skeleton` `Avatar` |
| Data / code | `CodeBlock` `ChartBlock` (token-driven bar/column, `data-tone` intents) `Donut` `CitationChip` |
| Command | `CommandPalette` |
| Chat-flavored (usable, not dashboard-core) | `Message` `PromptInput` `ModelSelector` `ToolCallCard` |

`ToolCallCard` is the exception in that last row: it is **exactly right** for the AI console's tool-call
transparency (`/ai/runs/:runId`) — use it, don't reinvent it.

### 1.2 `blocks/` — 11 L3 blocks

`Breadcrumb` · `SidebarShell` · `PageHeader` · `FilterForm` · `StatsGrid` · `DetailLayout` ·
`DataTable` (header/body/footer seam; `grid-template-columns` per row) · `ResponsiveTable` ·
`Pagination` · `EmptyState` · `SectionDivider`

### 1.3 `islands/` — 3

`ThemeToggle` · `SidebarToggle` · `Toast`

> After the D-1 converter fix, the re-synced registry also carries **`McpUiWidget`** (a 4th island).
> It is **out of scope for dashboard screens** — the panel IA renders typed NetScript data; MCP is a
> data source, not a render target (ratified proposal §5.1).

### 1.4 Interactive primitives — 8, on the `NSOne` global

`Dialog` · `Tabs` · `Popover` · `Drawer` · `Sheet` · `Combobox` · `Accordion` · `Tooltip`

Native-first. **Never** invent overlay or disclosure behavior. Note: **`Tabs` is headless** — it emits
`data-state`/`data-part` and ships no CSS (see §4.1).

### 1.5 Layout objects (`layouts.css`)

`ns-stack` · `ns-cluster` · `ns-grid--*` · `ns-split` · `ns-toolbar` · `ns-switcher` · `ns-shell` ·
`ns-section` · `ns-sidebar` · `ns-topbar`

### 1.6 Two locked negative verdicts

- **`DataGrid` is not a block.** fresh-ui ships a real typed `DataGrid<T>` export
  (`src/presentation/data-grid.tsx`, excluded from the canvas sync by design). Canvas tables use
  `DataTable`; Fresh source uses the typed export. **Do not design a third table.**
- **MCP components are out for beta.6** (§1.3 note).

---

## 2. The DDX-0 promote-set (7 blocks — 1 shipped, 6 new)

The ratified proposal (§5.1) promotes seven prior-art L3 blocks into fresh-ui. The prototype is
their **validation vehicle**: *validated = used in ≥1 screen without fighting it* (no layout overrides,
no semantic mismatch, props express what the screen needs). Pass-1 verdicts (all seven validated, with
amendments) are recorded in `DECISIONS.md` and folded into the contracts below.

| Block | Status | Contract (as amended by pass 1) | Exercised by |
| ----- | ------ | ------------------------------- | ------------ |
| `breadcrumbs` | **exists** (`Breadcrumb`) | `items` → topbar slot; derived from the pathname (never per-route config) | every screen |
| `context-rail` | **new** | `.ns-content-rail`, `.ns-app[data-rail]`; nests as the *inner* grid of `ns-rail-grid` (§4.4) — three-zone consoles fall out of composing the two | `/config` node detail, `/runs/:id`, `/flow/:id` seam detail |
| `plugin-gated-view` | **new** | `__title` / `__desc` / `__cmd`; `data-state='not-installed'`. **Legal as a full-region swap** (it replaces main *and* rail, not one panel) | `/catalog` (crons group), any capability nav entry for an uninstalled plugin |
| `activity-feed` | **new** | `__item` (+ `data-tone='success\|warning\|destructive\|primary'` → colors `__marker`) / `__marker` / `__body` / `__text` / `__time`; rail line drawn by `__item::before` | Home "just happened", `/runs/:id` events, `/auth/sessions/:id` |
| `connector` | **new** | `__row` (`data-state='ok\|degraded\|failed'` → colors `__dot`) / `__dot` / `__probe` / `__result`. **Broader than proposed:** `__probe`/`__result` double as the console's generic key/value row pair — keep the wide reading when syncing back | `/config` node probes + rail health, `/flow` seam detail, `/runs` context |
| `entity-rail` | **new** | `__item` / `__title` (carries an inline status `Badge`) / `__meta`. Selection expressed **twice by design**: `data-state='selected'` (styling) **and** `aria-selected` on `role='option'` buttons inside a `role='listbox'` (semantics) | `/flow` flow list, `/runs` run list, `/ai` agent-run rail |
| `tree-nav` | **new** | Built on native `<details>`: `__group` = details; summary hosts label + `__count` (or an `available` Badge); `__items` = indented button list; `__item[data-state='selected']`. Gated plugins → `data-state='gated'` on `__group`, whose summary routes to the gated view instead of toggling | `/config` declared-intent tree, `/catalog` contract tree, sidebar sub-trees |

---

## 3. Dashboard-specific new components (14)

Tags: **new-component** = genuinely new leaf with its own CSS. **new-block** = an L3 composition of
existing L2s. Every one of these is a sync-back candidate: token-driven, theme-blind, real typed props,
`class` not `className`.

### 3.1 `ns-journey` — new-component · **the flagship** (`/flow`, `/flow/:correlationId`)

The causal seam chain. **This is the component that replaces the retired `ns-waterfall`** (§5). It is
*not* a timeline: no time-proportional axis, no span bars, no gantt. It renders **framework primitives
in causal order**, each with its status and its payload at the seam.

- **Composition tried:** `activity-feed` + `connector`. Fails: a seam node is a *typed primitive* with a
  primitive-specific status vocabulary, a payload disclosure, an entity deep-link **and** an Aspire
  out-link; and the chain has branch/fan-out structure (one trigger event → saga + job + N deliveries)
  that a flat feed cannot express.
- **Props:** `nodes: SeamNode[]` (`id`, `primitive: 'http'|'trigger'|'saga'|'job'|'task'|'stream'`,
  `label`, `status`, `detail` (e.g. `attempt 2/3`, `2/3 delivered · 1 failed`), `payload?: unknown`,
  `href` (entity route), `traceHref?` (Aspire out-link), `parentId?`), `selectedId?`, `onSelect?`.
- **Classes:** `ns-journey`, `__node`, `__primitive`, `__label`, `__status`, `__detail`, `__payload`
  (native `<details>`), `__link`, `__branch` (the fan-out connector), `__rail`.
- **State:** node `data-primitive="<primitive>"`, `data-state="running|completed|failed|retrying|compensating|halted"`.
  Selection = `aria-selected` on `role='option'` rows in a `role='listbox'` (status and selection are
  independent — never fold selection into `data-state`).
- **Tokens:** primitive hue derived from semantic tokens via `color-mix()` (never a per-primitive
  palette); `failed` overrides to `--ns-destructive`; `running` pulses (reduced-motion fallback).

### 3.2 `ns-stackmap` — new-component (`/config`)

The capability/topology graph: declared intent vs running reality.

- **Composition tried:** `ns-grid` of Cards + `connector`. Fails: edges between nodes (an SVG edge
  layer), placement by dependency topology, single-selection that drives a URL and filters other views.
- **Props:** `nodes: StackNode[]` (`id`, `name`,
  `kind: 'service'|'worker'|'saga'|'trigger'|'stream'|'topic'|'database'|'cache'`, `status`,
  `endpoints?`, `telemetry: 'ok'|'unwired'`), `edges: Array<{from,to,flavor?:'call'|'pubsub'}>`,
  `selectedId?`, `onSelect?`.
- **Classes:** `ns-stackmap`, `__canvas`, `__node`, `__node-title`, `__node-icon`, `__node-state`,
  `__node-meta`, `__edge-layer`, `__edge`.
- **State:** node = `<button aria-pressed>` (a standalone toggle — **`aria-selected` is invalid ARIA
  here**), with `data-state` (status) + `data-kind`. Edges touching the pressed node get
  `data-state='active'`.
- **Edges are measured, not declared:** `__edge-layer` is an absolutely-positioned SVG sized to
  `__canvas`; paths computed post-mount from `[data-node-id]` bounding rects, recomputed on resize,
  hidden ≤860 px where the canvas stacks to one column.
- Node interiors compose `Badge` + one `connector` row (the primary probe). The component owns
  **placement, edges, selection** — nothing else.

### 3.3 `ns-step-timeline` — new-block (`/runs/:id`, job/task execution, saga history)

- **Composition tried:** `activity-feed`. Covers a flat event feed; fails at run structure — per-step
  status + duration + **attempt count** as first-class parts, expandable I/O payloads, and the
  compensation branch.
- **Composes:** `Badge` (status + attempt pill), native `<details>` / `Accordion` (payload disclosure),
  `CodeBlock` (I/O JSON).
- **Props:** `steps: RunStep[]` (`name`, `status`, `durationMs`, `attempts`, `startedAt`, `input?`,
  `output?`, `compensation?: boolean`), `view: 'all'|'compact'`.
- **Classes:** `ns-step-timeline`, `__step`, `__marker`, `__main`, `__title`, `__attempts`, `__meta`,
  `__body`, `__io`. Step `data-state="queued|running|completed|failed|retrying|compensating"`;
  compensation branch gets a warning rail + `⟲` marker.
- **`data-view` is `all|compact` only.** The JSON altitude is a **composition-level swap** (render a
  `CodeBlock` of the run record via `Tabs`) — a stylesheet cannot serialize a run.

### 3.4 `ns-achain` — new-block (`/triggers/:id/events/:eventId`)

The trigger **action chain**: one event fans out into the entities it produced.

- **Composition tried:** `activity-feed`. Fails: each action carries an `actionType`, a status, a
  duration, **the entity it produced** (a deep-link), and the **plugin that contributed it** (Axis 6).
- **Composes:** `Badge` (action type + status), `Button` ghost (the entity link), `CodeBlock` (result).
- **Props:** `actions: ActionResult[]` (`actionType: 'enqueueJob'|'publishSaga'|'executeTask'|'executeBatch'`,
  `status: 'success'|'failure'|'skipped'|'pending'`, `durationMs?`, `href?`, `providedBy?`, `error?`).
- **Classes:** `ns-achain`, `__action`, `__type`, `__status`, `__meta`, `__outcome`, `__provenance`.
  `data-state="<status>"`, `data-action="<actionType>"`.

### 3.5 `ns-axismap` — new-component (`/plugins/:id?tab=axes`)

The contribution-axis map — **live navigation**, not a diagram (Axis 6).

- **Composition tried:** `StatsGrid` of Badges. Fails: axes are *wired or not*, they carry a target
  surface, and clicking one **navigates** to the surface that plugin contributes.
- **Props:** `axes: ContributionAxis[]` (`axis: 'service'|'aspire'|'dashboard-panel'|'commands'|'db'|'streams'|'scaffold'`,
  `wired: boolean`, `href?`, `summary?`).
- **Classes:** `ns-axismap`, `__axis`, `__axis-label`, `__axis-state`, `__axis-summary`.
  `data-state="wired|unwired"`; wired axes are `<a>`/`<button>`, unwired are inert.

### 3.6 `ns-verchain` + `ns-diff` — new-block ×2 (`/runtime`, `/migrations/:id`)

- **`ns-verchain`** — the config version chain `v41 → v42 → v43 (current)`. Each version is a link
  (`/runtime/versions/:version`). Classes: `ns-verchain`, `__version` (`data-state="current|past"`),
  `__arrow`, `__meta`.
- **`ns-diff`** — a token-driven diff (config diffs in `/runtime`; schema introspect diffs in
  `/migrations`). Classes: `ns-diff`, `__line` (`data-change="add|remove|context"`), `__gutter`,
  `__code`. **Colors from intent tokens** (`--ns-success` / `--ns-destructive`), never a diff palette.
  Reused **inside `ns-confirm`** to show what a mutation will change before it is confirmed.

### 3.7 `ns-confirm` — new-block · **the product signature** (every mutation, every screen)

The CLI-transparency confirm dialog. **A confirm without a populated CLI line is a defect, not a
styling choice** — the CLI block is a *required slot*.

- **Composes:** `Dialog` (primitive) + `ns-diff` (the plan/impact) + `CodeBlock` (the CLI line) +
  `Button`.
- **Props:** `title`, `plan: string` (what will happen), `diff?` (what will change), `cli: string`
  (**required** — the exact `netscript …` / `aspire …` line), `confirmLabel`, `destructive?: boolean`,
  `result?: { status, message, nextHref? }`.
- **Classes:** `ns-confirm`, `__plan`, `__diff`, `__cli`, `__actions`, `__result`.
- **The five-beat pattern it encodes:** plan → diff → **exact CLI equivalent** → confirm → result
  (+ undo/next-step where meaningful).
- **The verb must ship.** CLI verbs come from
  `.llm/runs/dashboard-design--orchestrator/reference/cli-correlation-report.md`. Inventing a verb is a
  defect.

### 3.8 Shell furniture — 4 small new components

| Component | Where | Contract |
| --------- | ----- | -------- |
| `ns-envbar` | topbar, every screen | The environment identity pill: `local · my-app · aspire`. Parts `__env` / `__app` (`data-part='app'`, emphasized) / `__host` / `__dot`. `data-state="ok\|degraded"`. |
| `ns-livedot` | topbar + every live surface | SSE liveness. `ns-livedot`, `data-state="live\|paused\|stale"`; pulses when live (reduced-motion fallback); pairs with a "N new" catch-up pill (`__catchup`). |
| `ns-kpi` | Home | KPI card with **sparkline**. Parts `__label` / `__value` / `__delta` / `__spark` (the sparkline is a part, not a separate component — `ChartBlock` is bar/column and does not cover it). `data-tone` from intent tokens. Clicks through **with the matching filter in the URL**. |
| `ns-statlink` | Home | The deep-linking wiring-fact card: `__value` / `__label` / `__target`. `data-tone="success\|warning\|destructive\|muted"`. It is a **link**, always — a stat you can't click through to its owning screen is not a wiring fact. |

### 3.9 `ns-logstrip` — new-block (`/runs/:id`) · **rescoped from `ns-log-stream`**

A **read-only, bounded, correlated** log strip that **out-links to Aspire**. It is a pointer, not a
tail.

- **Hard bounds (satellite doctrine, acceptance line 1):** no follow mode, no filters, no search, no
  severity facets, bounded line count. The moment it needs any of those, it is Aspire's structured-log
  view and must be a link. (Boundary confirmation: `OPEN-QUESTIONS.md` OQ-9.)
- **Props:** `lines: LogLine[]` (`ts`, `resource`, `severity`, `message`), `aspireHref` (**required**),
  `max?: number`.
- **Classes:** `ns-logstrip`, `__line`, `__ts`, `__resource`, `__severity`, `__msg`, `__more` (the
  out-link). Line `data-severity="debug|info|warn|error"`.

### 3.10 `ns-assist` — new-block (Axis 5, on many screens)

The embedded AI assist slot. **Not a chat bubble** — a grounded, inline diagnosis that **produces an
action**.

- **Composes:** `Panel` + `Badge` (grounding chips) + `CodeBlock` (the suggested command) + `Button`
  (→ opens `ns-confirm`).
- **Props:** `summary` (the diagnosis), `grounding: GroundingRef[]` (which live calls/entities it read —
  each a deep-link), `suggestion?: { cli: string; label: string }`, `state: 'idle'|'thinking'|'ready'|'error'`.
- **Classes:** `ns-assist`, `__summary`, `__grounding`, `__suggestion`, `__actions`.
  `data-state="<state>"`.
- **Law:** an assist always shows its **grounding** and always terminates in a **confirm+CLI** action or
  a deep-link. An assist that just talks is the Axis-5 failure mode.

---

## 4. Non-component additions (5)

These are variants, skins, and layout objects — **not** new components. They still sync back.

1. **`ns-tabs` skin** — the `Tabs` primitive is headless (emits `data-state`/`data-part`, ships no CSS).
   Every console surface with tabs needs the same segmented-control skin: `ns-tabs__list`,
   `__trigger`, `__content`. **Sync-back candidate — this is a gap in the DS, not a screen-local hack.**
2. **`ns-page-header--console`** — a real `PageHeader` **variant**: `text-2xl` heading + tighter block
   padding. `PageHeader`'s display-scale `h1` (`text-4xl`) is wrong for a dense console.
3. **`ns-badge--dot`** — a dot-only `Badge` variant for dense rows. A variant on existing Badge CSS, not
   a component.
4. **`ns-rail-grid` / `ns-rail-grid--sm`** — a layout object: left rail (18 rem / 15 rem) +
   `minmax(0,1fr)` at ≥1024 px. The mirror of `ns-content-rail`'s right rail; composing the two gives
   the three-zone console (`/flow`, `/runs`, `/config`).
5. **`DataTable` interactive row mode** — selectable rows (hover bg, `aria-selected` → inset primary
   edge). Fold this into `DataTable` as a documented row mode; **do not** create a new row block (that
   would re-open the `data-grid` negative verdict by the back door).

---

## 5. Retired — drawing these is a defect

| Unit | Why |
| ---- | --- |
| **`ns-waterfall`** | Violates the satellite doctrine (acceptance lines 1 and 3): an OTLP trace waterfall / span gantt is **Aspire's**, and the flow view is a **causal seam chain, never time-proportional**. The pass-1 verdict in `DECISIONS.md` §2 that "`ns-waterfall` works" is **superseded**. Its replacement is `ns-journey` (§3.1). Raw span timing = an out-link to `/traces/detail/{traceId}`. |
| **`ns-preview-tag`** | Violates Axis 1 (zero future-beta prose). The design shows the final product; build-status honesty lives in the tracker. |
| **`ns-log-stream`** (follow-mode tail) | An owned structured/console log tail is Aspire's (acceptance line 1). Rescoped to the bounded, read-only, out-linking `ns-logstrip` (§3.9). |

---

## 6. Sync-back contract

A new unit is promotable to `@netscript/fresh-ui` source only if its **canvas markup and CSS already
obey the rules** — otherwise it is rework, not a candidate:

- **Tokens only.** Every color / space / radius / type size is `--ns-*`. No hex, no raw gray steps;
  missing shades via `color-mix()`. Chart and graph colors from intent tokens. (The `raw-hex` trap check
  **fails** the sync on hex literals in generated files.)
- **Light is the unthemed default; dark is `[data-theme='dark']`.** Both themes, theme-blind CSS.
- **Class contract** `ns-<block>` / `ns-<block>--<variant>` / `ns-<block>__<part>`; state via
  `data-state` / `data-part` / `aria-*`; native elements before invented JS state.
- **`class`, not `className`.**
- **Real typed props** plus a `*.prompt.md` card. Per the Directus precedent (proposal §5.1) these are
  **contribution-author-facing contracts**, not internal docs — a third party writes a
  `DashboardPanelContribution` against them. `{ [k]: unknown }` props are a `weak-dts` trap WARN and are
  not acceptable for a promoted unit.
- **Blocks declare their `registryDependencies`** (the L2 components they compose) in the manifest, per
  the copy-source registry model.
