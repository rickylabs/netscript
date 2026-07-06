# Worklog: Dev Dashboard E2E Claude Design prototype + design-sync system

## Run Metadata

| Field          | Value                                     |
| -------------- | ----------------------------------------- |
| Run ID         | `feat-dashboard-design-prototype--design` |
| Branch         | `feat/dashboard-design-prototype`         |
| Archetype      | N/A (repo tooling + design artifacts)     |
| Scope overlays | none                                      |

## Design

### Public Surface

- `deno task design:sync` — root task delegating to `tools/design-sync/mod.ts` (build | check |
  clean subcommands).
- `tools/design-sync/mod.ts` — CLI entry: reads `resources/design/dashboard/.design-sync/config.json`,
  emits the synthetic package bundle to a gitignored scratch dir, prints a parity + trap-check
  report.
- `resources/design/dashboard/` — the design artifact set (brief, proposed components, sync-back
  spec, shots, decisions).

### Domain Vocabulary

- `SyncConfig` — parsed `config.json` (projectId, pkg, globalName, srcMap, cssEntry, readmeHeader).
- `RegistryUnit` — one manifest item (kind: component | block | island | lib | support | style |
  theme) joined with its embedded source from `registry.generated.ts`.
- `ConversionResult` — per-unit outcome: emitted React source, skipped-with-reason, or shimmed
  (islands).
- `ParityReport` — manifest units vs emitted exports vs preview cards; the fitness-gate artifact.
- `TrapCheck` — one of the six encoded eis-chat traps (theme-default, token-closure, compiled-css,
  weak-dts, render-blank, raw-hex) with PASS/FAIL + evidence.

### Ports

- `RegistrySource` — reads fresh-ui's manifest + generated source (seam so the tool later works
  against any NetScript app's copied registry — the CLI-promotion path).
- `ClosureBuilder` — produces the compiled Tailwind CSS closure from a Fresh build (default:
  `apps/dashboard`); seam for the kitchen-sink fallback (OQ-4).

### Constants

- `TRAP_IDS` — `theme-default | token-closure | compiled-css | weak-dts | render-blank | raw-hex`.
- `UNIT_KINDS` — mirrors `registry.schema.ts` kinds; imported (type-only) not restated.
- `PARITY_EXCLUSIONS` — units excluded from the canvas parity set with reasons (e.g. `chat-render`
  parser internals; `f-client-nav` behavior noted inert).

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| 0 | Canvas pre-flight: MCP connect + round-trip smoke | manual: create/read scratch design; evidence in worklog | run dir only |
| 1 | design-sync v1: converter + closure + conventions + previews + trap checks + idempotence | wrappers (check/lint/fmt) + `design:sync --check` self-test | `tools/design-sync/**`, root `deno.json` task, `.gitignore` scratch entry |
| 2 | Dashboard design brief + proposed components distilled from seed corpus | supervisor review vs proposal §IA + voice rules | `resources/design/dashboard/{CLAUDE-DESIGN-BRIEF.md,PROPOSED-COMPONENTS.md}` |
| 3 | New Claude Design project seeded (design system + brief imported) | ParityReport green; canvas renders seeded system | `.design-sync/config.json` (+ run-dir evidence) |
| 4 | Prototype pass 1: shell + Stack Map + Flow/Trace Waterfall + Service Catalog/API Explorer + Run Inspector ×light/dark | shot-vs-IA review + owner steering; DDX-0 promote-set verdict | `resources/design/dashboard/prototype-shots/`, `DECISIONS.md` |
| 5 | Re-sync checkpoint: pass-1 components fed back; idempotence + trap checks re-run | `design:sync --check` green on updated inputs | sync-back deltas + run dir |
| 6 | Prototype pass 2: Plugin Control, Logs, Resource Control + workers/sagas/triggers/streams sections | shot-vs-IA review + owner steering | shots + `DECISIONS.md` |
| 7 | Sync-back spec + final shots + board comments (#400/#425) + handoff notes | IMPL-EVAL (separate session) | `resources/design/dashboard/NS-ONE-ADDITIONS.md`, run dir |

### Deferred Scope

- fresh-ui implementation of prototyped components — downstream WSL Codex lanes (DDX-0 amendment +
  new issues from the sync-back spec).
- `netscript ui:design-sync` CLI productization — separate framework issue.
- `plugins/dashboard/.design-sync/` placement — migrates when DDX-2/4 create the plugin.
- AI/chat collection parity on the canvas — not needed for dashboard surfaces.

### Contributor Path

A developer re-syncing after registry changes runs `deno task design:sync`, reads the printed
ParityReport + TrapCheck table, and re-imports the bundle into the Claude Design project (or lets
the MCP lane do it). To add a new prototyped component to source, they read one sync-back spec
entry (class contract + props + CSS) and implement it in fresh-ui following an existing registry
unit of the same kind.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-07-06 | — | Bootstrap | Worktree `.llm/tmp/design-proto-wt` @ `317e4b50`; run dir scaffolded; four-lane research complete (see research.md) |
| 2026-07-06 | 1 | `tools/design-sync/` v1 | 11 TS modules + 2 templates + `.design-sync/config.json` + root `design:sync` task + `.ds-sync/` gitignore. Gate `design:sync check` **PASS**: parity green (44/44 cards = 30 components + 11 blocks + 3 islands), idempotence PASS (`dfac420b48f8`), 180-file bundle, traps 4×PASS + 2 by-design WARN (weak-dts: theme-toggle; render-blank: 26 floor cards pending authored stories → slice 2/3). Scoped check/lint/fmt clean. Commit `4b31f44b`, PR comment 4892015865 |
| 2026-07-06 | 2 | Design brief + proposed components | `resources/design/dashboard/{CLAUDE-DESIGN-BRIEF.md,PROPOSED-COMPONENTS.md}`. Lanes per owner directive: supervisor drafted brief, **Fable-5 medium sub-agent** authored PROPOSED-COMPONENTS + tightened brief (2 factual fixes: flagship-trace composition per Flow B; A2 command-arguments dialog constraint). Supervisor slice review **PASS** vs proposal §3/§5.1/§9.1 + voice rules (0 banned framings). Net-new verdicts: 4 compose · 2 new-block (step-timeline, log-stream) · 2 new-component (trace-waterfall `ns-waterfall`, stack-map `ns-stackmap`); data-grid + MCP negative verdicts recorded. 6/7 promote-set blocks absent from sync = the recorded DDX-0↔DDX-15 inversion (canvas authors them → sync-back feeds DDX-0) |
| 2026-07-06 | 1.1 | 26 authored preview stories | **Opus 4.8 sub-agent** (delegated lane) authored `tools/design-sync/previews/*.preview.js` for all 26 predicted-blank floor cards — dashboard-flavored data, tokens/`ns-*` only, `class` not `className`, status→Badge mapping matches PROPOSED-COMPONENTS §3.5. Supervisor slice review **PASS** (independent `design:sync check` re-run: render-blank **PASS** 26 authored/0 blank, idempotence PASS `98be0c4a39b7`, parity 44/44, no FAIL traps). weak-dts stays WARN by verdict: theme-toggle is a true zero-prop component — benign true positive, no src change |
| 2026-07-06 | 3 | Canvas project seeded | Project `NetScript — NS One` (`ec262e10-…`) seeded via native DesignSync: `finalize_plan` (planId `plan_ec262e10d4ad451f_52521883d287`, localDir `.ds-sync/bundle`, deletes none) → single `write_files` call, **180/180 written via `localPath`** (contents never entered supervisor context). Verify: remote `list_files` == local bundle tree exactly (44 units ×3 + 44 previews + `_ds_bundle.js/.css` + README + styles.css). Canvas-side fitness gate now green; prototype pass 1 (slice 4) unblocked |
| 2026-07-06 | 3.1 | Reserved-path hotfix (`_ds_bundle.js` → `_ns_runtime.js`) | Owner reported all cards failing (`no PascalCase exports` / `ReactDOM is not defined`). Root cause: the platform compiles uploaded `.tsx` into ITS OWN `_ds_bundle.js` (format-4 namespace bundle, no ReactDOM, no window globals), clobbering our runtime — that path is reserved (drift **D4**). Fix: runtime → `_ns_runtime.js`, CSS closure → `_ns_styles.css` across mod.ts/bundle.ts/traps.ts/card+conventions templates; rebuild `design:sync check` **PASS** (idempotence `9998ab57ac70`, parity 44/44, traps unchanged); re-upload 47 files (planId `plan_ec262e10d4ad451f_4091c6c11b1a`) + remote `_ds_bundle.css` deleted; remote tree verified (`_ns_*` live, platform artifacts `_ds_bundle.js`/`_ds_manifest.json` left alone). Slice-4 agent re-briefed mid-flight to load `../_ns_runtime.js` + `../_ns_styles.css` |
| 2026-07-06 | 3.2 | Full authored-story coverage + overlay fixes | Owner reported 18 cards rendering name-only (floor previews) + CommandPalette/Toast/SidebarToggle overlays clipped by `.ds-cell` (overflow:hidden + translateZ containing block). **Opus 4.8 sub-agent** authored 18 stories (real props read from converted TSX/prompt.md; status vocabulary → Badge intents per §3.5) and wrapped the 3 overlay stories in `position:relative;transform:translateZ(0)` stages (SidebarToggle recomposed as MobileTopbar + Standalone). Supervisor slice review **PASS** (spot-checks + independent `design:sync check` re-run: render-blank **44 authored / 0 floor**, idempotence `760154a732e6`, parity 44/44, fmt clean). 44 `_preview/*.js` re-uploaded (planId `plan_ec262e10d4ad451f_41e3d1bcfd4d`). Agent surfaced drift **D5** (7 L3 blocks emit undefined Tailwind utilities — mitigated per-story; framework fix routed to #509). CodeBlock highlighting confirmed absent-by-design in fresh-ui ("layered at L4 if desired") → sync-back candidate, not a sync defect |
| 2026-07-06 | 4 | Prototype pass 1 — 4 composed screens | **Fable-5 medium sub-agent** authored `resources/design/dashboard/screens/{01-stack-map,02-flow-trace,03-service-catalog,04-run-inspector}.html` + `proto.css` (~1090 lines net-new, sync-back candidates separated from screen glue) + `DECISIONS.md` (DDX-0 verdict table: all 7 promote-set blocks validated; net-new contract deltas for ns-waterfall/ns-stackmap/ns-step-timeline/ns-log-stream). One coherent incident narrated across all four screens (import job_4183, redis degraded, eis-chat retry 2/5). Supervisor slice review **PASS**: all screens load `../_ns_runtime.js` + `../_ns_styles.css` (0 `_ds_bundle` refs), hex 0 / className 0 / voice 0, 55 tokens all defined in the 162-token closure, inline scripts parse-clean, NSOne exports verified. 5 files uploaded to canvas `screens/*` (planId `plan_ec262e10d4ad451f_703d39e2ee7c`); remote tree verified. Owner review of pass-1 screens = next steering point |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| LD-1…LD-7 | see plan.md § Locked Decisions | owner (session 2026-07-06) + research |
| Closure = deterministic registry concat, no Fresh build | registry has ZERO Tailwind utility classes (verified) — closure is fonts→tokens→base→layouts→per-unit CSS; kills OQ-4 dependency on building apps/dashboard | slice-1 verification |
| `cn` shim drops clsx + tailwind-merge | no Tailwind utils ⇒ merge is a no-op; React becomes the ONLY npm dep of the synthetic package | slice-1 |
| `subpaths` module-graph fold-in | `command-palette` imports `@netscript/fresh-ui/interactive`; loader walks the 35-file `src/runtime` graph into the pkg and exposes Dialog/Tabs/Popover/Drawer/Sheet/Combobox/Accordion/Tooltip on the canvas global — interactive primitives now first-class on canvas | slice-1 |
| `markdown` unit excluded | template-sourced (`.tsx.template`) chat renderer on the npm remark/rehype stack — belongs to the deferred AI/chat collection | slice-1 |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| DDX-0↔DDX-15 dependency inversion | significant | yes |
| #425 superseded-in-execution | significant | yes |
| D4 `_ds_bundle.js` platform-reserved path (canvas render failure, fixed in slice 3.1) | significant | yes |
| D5 7 L3 blocks emit undefined Tailwind utilities (doctrine contradiction; canvas mitigated, framework fix → #509) | significant | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| check/lint/fmt (tools) | scoped wrappers `--root tools/design-sync --ext ts` | **PASS** 2026-07-06 | 11 files, 0 findings each |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Sync idempotence | **PASS** 2026-07-06 | `design:sync check` double-build tree hash `dfac420b48f8` (slice 1) → `98be0c4a39b7` (slice 1.1, authored stories folded) | re-run at slice 5 |
| Parity checklist | **PASS** (build-side) 2026-07-06 | ParityReport green: 44/44 card-bearing units emitted (30 component + 11 block + 3 island); 2 recorded exclusions (markdown, chat-render); style/theme/support/lib all consumed | canvas-side re-verify at slice 3 |
| Trap checks a–f | **PASS** 2026-07-06 | theme-default PASS (`:root` light + `[data-theme='dark']` in closure) · token-closure PASS (162 defined; fallback-less refs all resolved incl. runtime inline-style tokens) · compiled-css PASS (37 parts, 88 KiB) · weak-dts WARN (theme-toggle — verified zero-prop component, benign true positive) · render-blank **PASS** after slice 1.1 (26 authored stories, 0 predicted blank) · raw-hex PASS (0 hex anywhere) | authored stories landed slice 1.1 |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Canvas connectivity smoke (read half) | **PASS** 2026-07-06 | `DesignSync list_projects` returned the writable set: 1 project, the stale `eis-chat — NS One` (`ea3fa1b9-906c-4b8a-8ef7-421b460e5c15`), after owner ran `claude mcp add claude-design …` + `/design-login` | OQ-1 resolved GREEN — via a better mechanism than planned: Claude Code's **native `DesignSync` tool** (localPath disk uploads that bypass model context, plan-boundary enforcement, claude.ai-login auth) rather than the raw MCP. Write half (`create_project` + round-trip) runs in slice 0 proper, after PLAN-EVAL PASS |
| Canvas round-trip smoke (write half, slice 0) | **PASS** 2026-07-06 (post PLAN-EVAL PASS) | `create_project` → **`NetScript — NS One`**, projectId `ec262e10-d4ad-451f-9aeb-e51955db3634` · `finalize_plan` (`_smoke/roundtrip.html`, localDir = worktree) → `write_files` (inline, `@dsCard` marker) → `get_file` read back **byte-identical** → `delete_files` cleanup. Full CRUD cycle green | Slice 0 complete. New project is empty by design until slice 3 seeding. Stale eis-chat project untouched (LD-2). `projectId` is the slice-3 target and belongs in `.design-sync/config.json` at slice 1 |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| N/A | — | — | no package surface changes |

## Handoff Notes

- Evaluator: start with plan.md § Locked Decisions + research.md findings F4–F11, then the
  ParityReport/TrapCheck evidence, then DECISIONS.md vs the ratified proposal IA.

## Slice 3.3 — Local render gate + host-env equivalence layer (2026-07-06)

**Trigger:** owner: "most still looks ugly … you really need to find a way to preview the output
otherwise you work in the dark" (defect classes: overflow, missing props/styles, padding, layout/
responsiveness, islands).

**Preview loop (new, the render gate from now on):** `python -m http.server 8321` on
`.ds-sync/bundle` + `8322` on `resources/design/dashboard`; Edge headless
`--headless --screenshot --window-size=920,720|1440,900 --virtual-time-budget=4000..5000`;
diagnostics via `--dump-dom` + `--enable-logging=stderr`. All 48 surfaces triaged.

**Root causes found (full triage in the PR comment):**

1. React string-`style` throw → EmptyState/Toast/CommandPalette stories unmounted **blank**
   (slice 3.2's stages never actually rendered — see drift D6).
2. Missing box-sizing preflight → Input/FormField/Textarea right-edge bleed (registry silently
   depends on host Tailwind preflight; framework half → #509).
3. D5 utility gap is a **closed set**: ~60 non-`ns-*` classes extracted from `_ns_runtime.js`.

**Fixes landed:**

- `tools/design-sync/src/closure.ts`: `HOST_ENV_RULES` — Tailwind preflight subset + all ~60
  utilities (tokens-mapped, `sm:/md:/xl:` media variants, `divide-y` sibling selector, escaped
  arbitrary-value classes, hover/sr-only) appended after `BASE_RULES`. Marked "remove once #509
  converts the blocks to semantic ns-* classes".
- Previews: `empty-state`/`toast`/`command-palette` string→object styles; `model-selector` OPEN
  story staged (280px).
- `screens/proto.css`: waterfall = `container: ns-waterfall / inline-size` + `@container ≤46rem`
  (endpoint-only ticks, 11rem label col — fixes garbled axis at any panel width);
  `.ns-rail-grid [class~='xl:grid-cols-4']` capped to 2 columns (StatsGrid viewport-breakpoint
  overshoot inside the inspector rail).

**Gate:** `design:sync build` + `check` **PASS** — idempotence `628396f31065`, parity 44/44,
raw-hex 0/0, render-blank 44 authored/0 floor.

**Render verification (24 cards + 3 screens × 2 widths re-shot):** EmptyState/Toast(4 intents)/
CommandPalette/ModelSelector all render fully; DataTable = real table (dividers, badges, footer);
StatsGrid = proper grid; Input/FormField/Textarea bleed gone; screen-02 axis clean (`0 ms … 1.12 s`);
screen-03 endpoint table columnar; screen-04 stats 2×2 readable. No preflight regressions in
sentinels (Button/Checkbox/Select/Message/ResponsiveTable/Alert/SidebarShell/FilterForm).

**Canvas:** 6 files uploaded — `_ns_styles.css` + 4 `_preview/*.js`
(`plan_ec262e10d4ad451f_cedc9c41c89e`) + `screens/proto.css` (`plan_…_1186fca9a929`).

**#509 handoff:** findings 1–7 (box-sizing, D5 ns-* conversion, StatsGrid container queries,
Skeleton rebuild, ThemeToggle default theme, SectionDivider rule, CodeBlock clip) messaged to the
running fresh-ui agent with an explicit no-overlap reconciliation contract (it owns
`packages/fresh-ui`; this run owns `tools/design-sync` + `resources/design/dashboard`; on its land,
re-run `design:sync build` and delete the host-env layer once blocks are semantic).

**Still open (islands):** ThemeToggle default-dark on empty localStorage reproduces headless;
scripted interaction checks (toggle/drawer/toast timers) remain for slice 5.
