# Drift Log: Dev Dashboard E2E Claude Design prototype + design-sync system

Drift is append-only. Record facts that diverge from the plan, RFC, doctrine, or current-state
documentation.

## 2026-07-06 — DDX-15 scope expansion + DDX-0 dependency inversion

- **What:** Owner expanded the design pre-step from DDX-15's filed scope (design-sync artifact +
  Fresh panel-shell prototype) to a full E2E Claude Design prototype + production-grade reusable
  sync system, and inverted the filed DDX-0→DDX-15 edge: prototype pass 1 now validates/amends the
  DDX-0 L3 promote-set **before** DDX-0 is implemented (the eis-chat two-pass loop).
- **Source:** owner directives in session 2026-07-06 (five forks answered; see plan.md LD-1…LD-7).
- **Expected:** `.llm/runs/plan-roadmap-expansion--seed/design/A-dashboard/epic-and-issues.md` —
  DDX-15 depends on DDX-0, blocks DDX-5 + panels.
- **Actual:** This run supersedes #425 in execution; #425 stays open as the beta.6 tracking point
  and is closed by this run's PR when the artifacts land. New issue filed in Backlog / Triage.
- **Severity:** significant
- **Action:** rescope (owner-ratified); board comments on #400/#425 at bootstrap.
- **Evidence:** research.md F1/F11; session decision log.

## 2026-07-06 — Lane override: Tier-A implements repo tooling + drives the canvas

- **What:** Tier-A (Fable 5 supervisor) implements `tools/design-sync/` and orchestrates the
  Claude Design canvas via MCP, instead of routing implementation to Tier-D.
- **Source:** owner fork answers (fully-agentic canvas; sync home = tools/); supervisor.md
  § Recorded lane/eval overrides.
- **Expected:** lane-policy default — source slices → Tier D.
- **Actual:** deliverable is repo tooling (not `packages/`/`plugins/`) + a Claude-native cloud
  surface only Claude can drive; boundary not crossed.
- **Severity:** minor
- **Action:** accept (recorded).
- **Evidence:** supervisor.md lane table; AGENTS.md tooling tiers.

## 2026-07-06 — Canvas sync mechanism: native DesignSync tool, not raw MCP

- **What:** The sync lane runs on Claude Code's native `DesignSync` tool (+ `/design-sync` skill)
  instead of the raw `claude-design` MCP endpoint the plan assumed.
- **Expected:** plan/research OQ-1 assumed MCP tools (`mcp__claude-design__*`) with known 404/401
  flakiness and an owner-relay fallback.
- **Actual:** `DesignSync` is first-class in the harness: claude.ai-login auth (owner ran
  `/design-login`), read smoke PASS (`list_projects` → stale `eis-chat — NS One` visible,
  `ea3fa1b9-…`), `localPath` disk uploads that keep the 290KB registry / ~80KB CSS closure out of
  model context, and a finalize_plan write boundary. Strictly better; the MCP server stays
  registered as a secondary surface for canvas-driving if needed.
- **Severity:** minor (favorable; de-risks the top risk-register entry)
- **Action:** accept; slice 0 write half (`create_project` + round-trip) still gates after
  PLAN-EVAL PASS. Slice 1 targets the DesignSync bundle shape (`@dsCard` preview markers,
  256-file batches).
- **Evidence:** worklog.md § Runtime Gates.

## D3 — 2026-07-06 — slice 1 implementation vs Design-section wording (minor)

- Plan Design § said `RegistryUnit` joins manifest items with source embedded in
  `registry.generated.ts`; implementation reads `files[].source` from disk via
  `registry.manifest.ts` (cheaper, identical content, keeps the RegistrySource port).
- Plan Design § said `ClosureBuilder` compiles the Tailwind closure from a Fresh build
  (`apps/dashboard`, OQ-4). Verified the registry carries ZERO Tailwind utility classes, so the
  shipped builder is `RegistryConcatClosureBuilder` (deterministic concat: fonts → tokens → base →
  layouts → per-unit CSS). OQ-4 is moot; no Fresh build in the loop.
- Added beyond plan wording: `subpaths` module-graph fold-in for `@netscript/fresh-ui/interactive`
  (command-palette dependency; also surfaces the 8 interactive primitives on the canvas global).
- Severity: minor — same contract names/ports as the locked Design; mechanisms simplified.

## D4 — 2026-07-06 — `_ds_bundle.js` is a platform-reserved path (significant, fixed in-slice)

- **What:** After the slice-3 seed, the owner reported every canvas card failing with
  `⚠ no PascalCase exports in _preview/<X>.js` / `⚠ ReactDOM is not defined`.
- **Root cause:** claude.ai/design treats `_ds_bundle.js` as *its own* artifact name: it compiles
  the uploaded `.tsx` sources into a format-4 namespace bundle at that exact path
  (`window.NetScriptNSOne_ec262e` only; `React` expected as a host global; **no ReactDOM; no
  window.React/ReactDOM/NSOne assignments**), silently clobbering our 1.1MB self-contained runtime.
  Preview/`.html`/`.md` uploads are preserved verbatim (verified byte-equal via `get_file`) — only
  the reserved bundle path is rewritten. `_ds_manifest.json` + `_adherence.oxlintrc.json` are
  sibling platform artifacts.
- **Fix (slice 3.1):** runtime renamed to non-reserved `_ns_runtime.js` and CSS closure to
  `_ns_styles.css` across `tools/design-sync/` (mod.ts, bundle.ts, traps.ts, card + conventions
  templates); rebuilt (`design:sync check` PASS, idempotence `9998ab57ac70`); re-uploaded 47 files
  (runtime + closure + README + 44 cards) under `plan_ec262e10d4ad451f_4091c6c11b1a`; stale remote
  `_ds_bundle.css` deleted; remote `_ds_bundle.js`/`_ds_manifest.json` left as platform-owned.
- **Severity:** significant (canvas fully non-functional until fixed), resolved same-day.
- **Lesson for the reusable tool:** never emit runtime assets under `_ds_*` names; that prefix
  belongs to the platform. Encoded as a comment at the `bundleFiles.set` site in `mod.ts` and in
  the seeded README conventions.

## D5 — 2026-07-06 — 7 L3 blocks emit Tailwind utility classes that no stylesheet defines (significant, mitigated per-story; framework sync-back candidate)

- **What:** While authoring the 18 missing preview stories (slice 3.2), the Opus lane verified that
  `DataTable`, `StatsGrid`, `PageHeader`, `Pagination`, `DetailLayout`, `FilterForm`, and
  `EmptyState` style their layout with raw Tailwind utilities (`grid`, `gap-*`, `divide-y`, `flex`,
  `md:/xl:grid-cols-*`, `overflow-hidden`, `rounded-md`, `border-dashed`, `text-3xl`,
  `tabular-nums`, …) in their TSX `class` attributes. Those selectors are **0-match** in
  `_ns_styles.css` — the closure ships only `ns-*` classes + layout objects.
- **Why slice 1 missed it:** the "registry has ZERO Tailwind utility classes (verified)" decision
  checked the registry **CSS parts** (true: no utility definitions exist anywhere), not the TSX
  `class` attributes. The utilities are referenced but never defined — so the blocks are
  under-styled in *every* consumer that doesn't bring its own Tailwind, including scaffolded apps
  unless their app CSS generates utilities.
- **Mitigation (slice 3.2, canvas-side):** per-story inline structural styles / layout-object
  substitutions (`ns-grid--4`, `ns-cluster--between`, inline `display:grid` etc.) so the cards
  render faithfully.
- **Real fix (framework, routed to #509):** the 7 blocks should emit semantic `ns-*` classes per
  doctrine ("L2/L3 emit semantic `ns-*` classes"); also reconcile the divergent `DataTable`
  (Tailwind compound) vs `ResponsiveTable` (`ns-responsive-table`, declarative) table surfaces.
  Routed to the #509 fresh-ui pixel-polish lane + the slice-7 sync-back spec.
- **Severity:** significant (doctrine contradiction + real under-styling), canvas mitigated same-day.

## D6 — slice-3.2 overlay stages never rendered + missing preflight (2026-07-06, significant)

- **Symptom:** owner reported "most still looks ugly … you work in the dark". A local headless
  render loop (python http.server + Edge `--headless --screenshot`, byte-identical bundle) was
  built and all 48 canvas surfaces (44 cards + 4 screens) were screenshotted and triaged.
- **Finding 1 — the 3.2 stage fix never rendered:** the overlay stages (Toast, CommandPalette)
  and EmptyState's frame passed **string** `style` props. fresh-ui is Preact (strings fine); the
  canvas runtime is **React 19**, which throws `The 'style' prop expects a mapping…` and unmounts
  the whole story → blank cards. The 3.2 supervisor review was static-only (traps + code read);
  no render check existed, so the regression shipped as "fixed". Lesson: **screenshot loop is now
  the render gate** for every canvas-facing slice.
- **Finding 2 — missing box-sizing preflight:** zero `box-sizing` rules exist in the closure or in
  any `registry/**/*.css` — the registry silently depends on the host app's Tailwind preflight.
  On the canvas, `width:100%`+padding controls (Input/FormField/Textarea) bled past card padding.
  Framework-side: routed to #509 (declare or ship the dependency).
- **Fix (slice 3.3):** host-env equivalence layer in `closure.ts` (preflight subset + the closed
  ~60-utility set extracted from `_ns_runtime.js`, tokens-mapped, media variants included) —
  supersedes the per-story D5 mitigations at the closure level; 3 previews converted to object
  styles; ModelSelector OPEN staged; `proto.css` waterfall tick container-query + rail StatsGrid
  column cap. All re-shot locally and verified before upload.
- **Severity:** significant (false "fixed" state shipped in 3.2; render-gate process gap now closed).
