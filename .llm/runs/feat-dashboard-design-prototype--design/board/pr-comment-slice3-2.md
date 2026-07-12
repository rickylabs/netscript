# Slice 3.2 — Full authored-story coverage + overlay containing-block fixes

**Commit:** (see this push)

**Symptom (owner-reported):** 18 cards rendered name-only ("miss default values / render weirdly / lack css"); CommandPalette's OPEN story clipped to a sliver; Toast invisible; SidebarToggle showed no sidebar.

**Root causes:**

1. 18 of 44 units had no authored story — the generated *floor* preview renders the component with its own name as children (passes the render-blank trap, useless for structured components).
2. `.ds-cell { overflow: hidden; transform: translateZ(0) }` is a containing block that clips `position: fixed` overlays (CommandPalette dialog, Toast viewport, SidebarToggle's drawer).

**Fix (Opus 4.8 delegated lane, supervisor-reviewed):**

- 18 new `tools/design-sync/previews/*.preview.js` (alert, badge, button, card, checkbox, data-table, detail-layout, dropzone, empty-state, filter-form, inline-notice, label, page-header, pagination, panel, stats-grid, switch, theme-toggle) — real props read from the converted TSX/prompt contracts; run-status vocabulary mapped to Badge intents per PROPOSED-COMPONENTS §3.5.
- 3 overlay stories wrapped in `position:relative; transform:translateZ(0)` stages; SidebarToggle recomposed as **MobileTopbar** (toggle controlling a real nav panel) + **Standalone**.
- Gate: `design:sync check` **PASS** — render-blank **44 authored / 0 floor**, idempotence `760154a732e6`, parity 44/44; `deno fmt --check` clean. Re-run independently by the supervisor.
- 44 `_preview/*.js` re-uploaded (planId `plan_ec262e10d4ad451f_41e3d1bcfd4d`); remote tree verified.

**Also answered from the owner's report:**

- **CodeBlock syntax highlighting** — absent **by design** in fresh-ui ("highlighting is layered at L4 if desired"); recorded as a sync-back/L4 enhancement candidate (slice 7 + #509), not hacked into the runtime.
- **Everything renders dark** — the Design System pane stamps your claude.ai theme; the closure's `[data-theme='dark']` override is responding correctly.

**Drift D5 (significant, new):** 7 L3 blocks (DataTable, StatsGrid, PageHeader, Pagination, DetailLayout, FilterForm, EmptyState) emit raw Tailwind utility classes (`grid`, `gap-*`, `divide-y`, `md:grid-cols-*`, …) that **no stylesheet defines** — 0-match in the closure *and* undefined in any registry CSS. Slice 1's "zero Tailwind" verification covered CSS parts, not TSX `class` attributes. Canvas mitigated per-story; the doctrine-conformant fix (blocks emit `ns-*` classes; reconcile DataTable↔ResponsiveTable) is routed to **#509**.

Owner: please refresh the pane — every card should now show real dashboard-flavored content; CommandPalette/Toast/SidebarToggle render inside visible stages.
