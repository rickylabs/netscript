# NetScript Dev Dashboard — Proposed Components

> Companion to `CLAUDE-DESIGN-BRIEF.md` (does not restate it). Audience: the Claude Design canvas
> pass 1 and the slice-7 sync-back spec author. Grounded in the ratified proposal
> (`.llm/runs/plan-roadmap-expansion--seed/design/A-dashboard/proposal.md` §3, §5.1, §9.1) and the
> synced `.ds-sync/bundle/` (44 cards + 8 primitives).

## 1. What the seeded system already ships

Rule one: **compose from this inventory first.** A candidate below exists only because composition
was tried and named before it was rejected.

- **`general/` — 30 L2 components.**
  - Form: Button, IconButton, Input, Textarea, Checkbox, Switch, Label, Select, FormField, Search,
    Dropzone.
  - Surface: Card, Panel (dense secondary surface — tones muted/raised), Separator.
  - Status/feedback: Badge (intent variants), Alert, InlineNotice, Spinner, Progress, Skeleton,
    Avatar.
  - Data/code: CodeBlock, ChartBlock (token-driven bar/column, `data-tone` intents), Donut,
    CitationChip.
  - Command: CommandPalette.
  - Chat-flavored (usable but not dashboard-core): Message, PromptInput, ModelSelector,
    ToolCallCard.
- **`blocks/` — 11 L3 blocks:** Breadcrumb, DataTable (header/body/footer seam,
  `grid-template-columns` per row), DetailLayout, EmptyState, FilterForm, PageHeader, Pagination,
  ResponsiveTable, SectionDivider, SidebarShell, StatsGrid.
- **`islands/` — 3:** SidebarToggle, ThemeToggle, Toast.
- **8 interactive primitives on `NSOne`:** Dialog, Tabs, Popover, Drawer, Sheet, Combobox,
  Accordion, Tooltip. Native-first — never invent overlay/disclosure behavior.
- **Layout objects** (`layouts.css`): `ns-stack`, `ns-cluster`, `ns-grid--*`, `ns-split`,
  `ns-toolbar`, `ns-switcher`, `ns-shell`, `ns-section`, `ns-sidebar`, `ns-topbar`.

## 2. The promote-set to validate (DDX-0)

The proposal (§5.1) promotes seven eis-chat L3 blocks into fresh-ui. The prototype is their
validation vehicle: **validated = used in ≥1 screen without fighting it** (no layout overrides, no
semantic mismatch, props express what the panel needs). Only Breadcrumb is in the current 44-card
sync; the canvas composes the other six to the block contract below, and they sync back to source.

| Block | What it is | Exercised by | Validated when |
|---|---|---|---|
| `breadcrumbs` | Shell breadcrumb trail (already seeded as `Breadcrumb`) | every screen | trail renders on every screen from route state alone |
| `context-rail` | Selection-detail rail on wide viewports (`.ns-content-rail`, `.ns-app[data-rail]`) | Stack Map node detail, Run Inspector run detail | carries selection detail without custom layout CSS |
| `plugin-gated-view` | Gates a view on an installed plugin; empty state teaches the install command | capability nav entries (pass 1), per-capability sections (pass 2) | wraps ≥1 section with both installed and not-installed states |
| `activity-feed` | Generic event feed/timeline | Run Inspector event list; Logs (pass 2) | renders run events without chat semantics leaking |
| `connector` | Connection/integration-status unit | Stack Map node status/health | expresses node health inside a map node |
| `entity-rail` | Generic list rail (generalized from eis-chat `member-rail`) | run list (Run Inspector), resource list | lists non-member entities with no member-flavored props |
| `tree-nav` | Collapsible tree navigation (generalized from `channel-tree`) | sidebar plugin/resource tree; Service Catalog contract tree | two-level plugin → endpoint/resource tree collapses cleanly |

Two negative verdicts, locked (§5.1 / §8.3–8.4):

- **`data-grid` is NOT a block.** fresh-ui ships a real typed `DataGrid<T>` export
  (`src/presentation/data-grid.tsx`); promoting a block would duplicate it. On the canvas, tabular
  panels use the seeded `DataTable` block; in Fresh source they use the typed export. Do not
  design a third table.
- **MCP components (`html-block`, `mcp-widget`, `ui-block`, `icon`) are OUT for beta.6.** The
  panel IA renders typed data; MCP is a data source, not a render target.

## 3. Net-new dashboard component candidates

Derived from the panel IA. Tags: `compose` (existing units cover it — no sync-back),
`new-block` (L3 composition of existing L2s), `new-component` (genuinely new leaf with own CSS).
Verdict: **4 compose · 2 new-block · 2 new-component.** Everything `new-*` is a sync-back
candidate destined for fresh-ui source: token-driven, theme-blind, real typed props.

### 3.1 `trace-waterfall` — new-component (`ns-waterfall`)

- Composition tried: DataTable rows + Progress bars. Fails: proportional time-axis placement
  (per-span offset + width against a shared axis), parent/child depth indentation, axis ticks,
  row-selection sync with the detail pane.
- Props: `spans: WaterfallSpan[]` (`spanId, parentSpanId, name, service, startOffsetMs,
  durationMs, status`), `selectedId?`, `onSelect?`, `totalMs`.
- Classes: `ns-waterfall`, `__axis`, `__tick`, `__row`, `__label`, `__track`, `__bar`. Row
  `data-state="selected|running|completed|failed|retrying"`, `data-depth="<n>"`.
- Bar colors from intent tokens per service via `color-mix()`; failed = `--ns-destructive`.
- Panel: Flow/Trace Waterfall (the hero). The right-hand span-detail pane is NOT part of this
  component — it composes `context-rail` + CodeBlock + Badge.

### 3.2 `stack-map` — new-component (`ns-stackmap`)

- Composition tried: `ns-grid` of Cards + `connector` blocks. Fails: edges between nodes (an SVG
  edge layer), placement by dependency topology, single-selection state that filters other panels.
- Props: `nodes: StackNode[]` (`id, name, kind: 'service'|'worker'|'container'|'database'|'cache',
  status, endpoints?`), `edges: Array<{ from: string; to: string }>`, `selectedId?`, `onSelect?`.
- Classes: `ns-stackmap`, `__canvas`, `__node`, `__node-title`, `__node-meta`, `__edge`. Node
  `data-state="running|degraded|failed|starting|stopped"`, `data-kind="<kind>"`.
- Node interiors compose Badge + `connector`; the component owns only placement, edges, and
  selection.
- Panel: Stack Map.

### 3.3 `step-timeline` — new-block (`ns-step-timeline`)

- Composition tried: `activity-feed`. Covers a flat event feed; fails at run structure — per-step
  status + duration + attempt count as first-class parts, expandable input/output payloads, and
  the All/Compact/JSON view toggle.
- Composes: Badge (status + attempt count), Accordion/`<details>` (payload disclosure), CodeBlock
  (I/O JSON).
- Props: `steps: RunStep[]` (`name, status, durationMs, attempts, startedAt, input?, output?`),
  `view: 'all'|'compact'|'json'`.
- Classes: `ns-step-timeline`, `__step`, `__marker`, `__title`, `__meta`, `__attempts`, `__body`.
  Step `data-state="queued|running|completed|failed|retrying"`.
- Panel: Run Inspector run detail.

### 3.4 `log-stream` — new-block (`ns-log-stream`)

- Composition tried: DataTable + CodeBlock. Fails: append-only tail with follow-mode scroll
  pinning, per-line severity intent, dense mono columnar lines at log volume.
- Composes: Badge (severity), `ns-toolbar` (filters), Switch (follow toggle).
- Props: `lines: LogLine[]` (`ts, resource, severity, message`), `follow: boolean`.
- Classes: `ns-log-stream`, `__line`, `__ts`, `__resource`, `__severity`, `__msg`. Root
  `data-state="following|paused"`; line `data-severity="debug|info|warn|error"`.
- Panels: Logs (pass 2); the inline-logs strip in trace detail (pass 1) reuses `__line`.

### 3.5 Status vocabulary — compose

Badge already carries it. Fixed mapping, used identically everywhere: `completed → success` ·
`running → primary` · `failed → destructive` · `retrying → warning` · `degraded → warning` ·
`queued → default/muted`. If dense rows need a dot-only indicator, that is a `ns-badge--dot`
variant on the existing Badge CSS — a variant, not a component.

### 3.6 API-explorer call form — compose

Schema-to-field mapping is logic, not a component: each Standard Schema field renders FormField +
Input/Select/Switch/Textarea; Panel groups sections; Tabs (primitive) split params/headers/
response; CodeBlock renders the typed response; nested objects/arrays fall back to a CodeBlock
JSON editor. Endpoint list = DataTable + Badge (method). Panel: Service Catalog + API Explorer.

### 3.7 Resource command bar — compose

`ns-toolbar` + Button/IconButton per command; Dialog (primitive) generated from the command's
typed arguments + confirmation message; Tooltip carries the CLI-equivalent affordance (a mono
`aspire resource <name> <cmd>` line via CodeBlock). Panels: Resource Control, Stack Map node
quick actions.

### 3.8 Section-nav — compose

SidebarShell + `tree-nav` (promote-set) for capability navigation; Tabs (primitive) for the
configure area; PageHeader per section; EmptyState for the create fastest-path. Panels: the four
per-capability sections (pass 2).

## 4. Sync-back contract

A `new-*` candidate is promoted to fresh-ui source only if its canvas markup and CSS already obey
the seeded README's hard rules — otherwise it is rework, not a candidate:

- Tokens only: every color/space/radius/type size is `--ns-*`; no hex, no raw gray steps; missing
  shades via `color-mix()`. Chart/graph colors from intent tokens.
- Light is the unthemed default; dark is `[data-theme='dark']`. Both themes, theme-blind CSS.
- Class contract `ns-<block>` / `ns-<block>--<variant>` / `ns-<block>__<part>`; state via
  `data-state`/`data-part`/`aria-*`; native elements before invented JS state.
- `class`, not `className`.
- Real typed props plus a `*.prompt.md` card — these are contribution-author-facing contracts
  (§5.1 Directus note), not internal docs.
