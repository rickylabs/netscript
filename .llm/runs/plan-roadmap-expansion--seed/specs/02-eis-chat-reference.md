# 02 — eis-chat: the working reference for A/B/C/D/E

**Repo:** `github.com/rickylabs/eis-chat` — **PRIVATE**, branch `master`. Owner granted token
access; read via authenticated WSL `gh` (`gh api repos/rickylabs/eis-chat/...`).

**What it is:** *"Self-hosted desktop context-accumulator (Deno desktop + Fresh + TanStack AI)
grounding ad-hoc context against the legacy-archeo graph via MCP. MVP reusing eiskap seams."* A
prior Fable agent already produced, in this repo, the **Claude design-sync + a NetScript-seam
prototype + a concrete tutorial use-case**. It is a live integration test of the whole NetScript
stack and the first real target for the dashboard and the tutorials.

## Per-topic reading map

### A — dashboard UI
- `.design-sync/conventions.md` — the **"NS One"** design system: layered **L0 platform contract →
  L1 runtime behavior → L2 registry components → L3 blocks → L4 routes**; `window.NSOne.*` plain
  React components; semantic `--ns-*` token vocabulary (roles/scales/fonts DM Sans+Mono); layout
  objects (`.ns-stack/.ns-cluster/.ns-grid--3/.ns-split/.ns-toolbar/.ns-shell/.ns-sidebar/
  .ns-topbar`); BEM variant families (`ns-btn--{…}`, `ns-badge--{…}`, `ns-alert--{…}`); state via
  `data-part`/`data-state`/`aria-*` (native-first: `<select>`/`<dialog>`/popover); theme-blind,
  dark-default, `data-theme="light"` switch; truth in `styles.css`→`_ds_bundle.css`; each component
  ships `*.prompt.md` (usage) + `*.d.ts` (shape).
- `.design-sync/previews/*` — ~30 built components (Button, Card, DataTable, SidebarShell,
  StatsGrid, PageHeader, FilterForm, DetailLayout, Pagination, Panel, EmptyState, Skeleton,
  Spinner, Progress, …).
- `.design-sync/{config.json,NOTES.md}`.
- Prior art in NetScript: `#218` (CLOSED) — Aspire browser-logs captured in the dashboard.

### C/D — real-project story
- `docs/PRODUCT.md` — the story: context-accumulator for an ops team; **Project > Channel >
  Session** hierarchy; the **VIF → CSB ERP migration**; PROSCO/Prolabel incident diagnosis; SigNoz
  telemetry join; MCP grounding; manual context-promotion gradient; inline charts (MCP-UI).
- `docs/ARCHITECTURE.md`, `docs/SKILL.md`, `docs/PHASE-1..7-*.md`, `docs/HANDOVER.md`,
  `docs/INDEX.md`.
- `docs/assets/01-home.png … 05-mcp-grounding.png` — real screenshots.
- Writing bar for C = "Medusa-inspired"; the eis-chat docs are the tone/structure reference too.

### E — desktop + single-process
- `docs/DESKTOP-SHELL.md` — **the spike is already done** (#118, PR #125): verified ~88MB
  `deno desktop` Windows binary (`.dll` runtime + embedded `_fresh/` VFS + `laufey_webview.exe`);
  tray + gated auto-update (`apps/dashboard/lib/desktop-chrome.ts`, lint-clean via a **local
  structural type — no `any`, no ambient global aug**); per-user data dir; Aspire dev-stack resource
  POC (`aspire/PROPOSED-desktop-resource.md`, `register-apps.mts`, `AddTaskBackedApp` pattern).
- **The load-bearing constraint for E:** S1 concludes true single-process (option c) requires
  "refactoring the oRPC router to export a fetch handler the dashboard mounts **in-process** + moving
  the tursodb single-writer in-process — a genuine architecture change + upstream **`@netscript/sdk`
  link-mode** feature." The tursodb native driver holds an **exclusive OS file lock per DB** (os
  error 33 on double-open) → single-writer architecture is load-bearing. **This is the 172a-2
  service-base-seam dependency.** Windows `Deno.autoUpdate()` STAGES but does not APPLY (macOS/Linux
  only) → ship a manual-update fallback + release server.

### B + E — infra references (reusable)
- `.agents/skills/aspire-deployment/` (aws/azure/k8s/docker-compose/cicd/preflight references)
- `.agents/skills/aspire-monitoring/` (diagnostics-bridge, monitoring, playwright-handoff)
- `.agents/skills/aspireify/references/opentelemetry.md`
- `.agents/skills/aspire-orchestration/` (app-commands, resource-management, safety-guardrails)

### Seam dogfooding (integration proof for all topics)
`services/eischat` (oRPC, **sole DB writer**), `streams` (durable-streams live-query),
`workers`+`workers-api` (KB embedding / vision jobs), `plugins`, `contracts`, `database`, `aspire`,
`.netscript/generated/plugin-workers/job-registry.ts`.
