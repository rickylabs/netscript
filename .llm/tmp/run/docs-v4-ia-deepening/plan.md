# Plan — docs-v4-ia-deepening

**Run-id:** docs-v4-ia-deepening · **Supervisor:** Claude · **Eval:** OpenHands (minimax-M3 PLAN,
qwen3.7-max IMPL) · **Heavy lifting:** Claude authoring workflow (prose) + WSL Codex (build wiring,
seam slice, tutorial rework). **Scope overlay:** SCOPE-docs + a single ARCHETYPE code slice
(auth-better-auth R0). **Trigger:** user review of merged v3 docs (PR #106) — 4 defects + structural
critique + a process failure. See `research.md`, `seam-coverage.md`, `ia-tree.md`, `drift.md` (D1).

## Locked decisions

1. **IA = full 3-level Capability-Hub regroup.** Zone → Product-area pillar → Leaf, max 3 authored
   levels (tutorials get a 3rd step level). Diátaxis modes run UNIFORMLY inside each pillar
   (Concepts → Quickstart → How-To → Reference). Single global sidebar; NO parallel per-pillar
   sidebars. Polyglot/runtime axis = code-switcher TAB inside leaves, not a folder level. Concrete
   tree in `ia-tree.md`. `@netscript/fresh` PROMOTED to a multi-page "Web Layer" section: **10
   export-backed pages** (each grounded in a verified `@netscript/fresh` export subpath) **plus one
   non-export "Examples / sandbox" showcase leaf** (prose now, StackBlitz backlog — NOT counted as
   an export-grounded reference page; see `ia-tree.md` and open-question 3).
2. **Auth seam (user, 2026-06-22):** BUILD the `plugins`/`betterAuthOptions` passthrough on
   `createNetscriptBetterAuth` now (R0, IMPL-EVAL-gated Codex slice) AND record the full
   seamless-auth roadmap R1–R5 in `arch-debt.md` (done). Docs document the R0 factory path, state
   the R1 schema-generation requirement honestly, and carry the R2 interactive-flow caveat for
   magic-link/passkey.
3. **Diagram fix = real Mermaid pipeline.** Wire `_diagrams/render.ts` (mmdc) into `deno task
   build`; regenerate every SVG from its `.mmd` as real Mermaid output themed to the chrome; add a
   missing-asset build gate so `comp.diagram` can never soft-degrade to alt-text again (parity with
   the `xref` throw-on-missing behavior).
4. **Link fixes.** Fix the 2 `wrong_step` cards on `fresh-framework.md` by **repointing** them:
   `/tutorials/` → `/tutorials/live-dashboard/`, and the QueryIsland card →
   `/tutorials/live-dashboard/04-definePage-QueryIsland/`. `research.md` confirms all four tutorials
   already exist, so the DEFAULT is repoint-only — do NOT author a new Track-D tutorial unless a W1
   implementation audit proves the existing `live-dashboard` track cannot serve the "build a Fresh
   page" need (which would be its own scoped decision, not assumed here).
5. **Process gates (drift D1 remediation) — each MECHANICALLY enforceable, not policy prose.** W5
   defines the exact marker grammar + a checked-in script + the build/CI hook for each:
   - **Caveat-harvest gate.** Authored caveats/limitations MUST carry a machine-parseable marker
     adjacent to the prose: HTML-comment grammar `<!-- caveat: <ref> -->` where `<ref>` ∈
     `drift:D<n>` | `arch-debt:<entry-id>` | `gh:#<issue>`. A new script
     `.llm/tools/docs/check-caveat-harvest.ts` scans `docs/site/**/*.md{,x}`, flags any caveat-class
     phrase (alpha/preview/"not supported"/"does not cover"/"limitation"/"shipping in") that lacks a
     valid adjacent marker, and exits non-zero. Wired into the docs build + CI.
   - **Link-integrity build gate.** Any nav/`featureGrid`/`xref`/`diagram` href to a missing or
     non-corresponding page or asset fails the build (xref already throws; extend the same
     throw-on-missing to `featureGrid` and `diagram`, removing soft-degrade).
   - **Seam-coverage gate.** `seam-coverage.md` is the machine-readable source of truth (each row
     gets a stable `seam:<row-id>`). A docs page that documents a capability marked
     "absent/unseamed" MUST carry `<!-- seam: seam-coverage:<row-id> -->` linking the limitation;
     `.llm/tools/docs/check-seam-coverage.ts` exits non-zero on an unseamed-capability claim with no
     marker. "Documented/implied but unseamed" features are recorded as arch-debt + backlog.

## Workstreams

- **W0 — Mermaid pipeline + missing-asset gate** (Codex slice, docs/user-site). Real mmdc render
  wired into build; missing-asset gate. Independent; can land first. **Determinism + rollback gate:**
  render every `.mmd` into a temp dir and diff against the committed `.svg` (fail on drift or missing
  asset), and document the local + CI `mmdc` install path. Rollback rule: if `mmdc` cannot run
  reproducibly in CI, KEEP the missing-asset gate but DEFER live rendering (commit pre-rendered SVGs)
  rather than merge a build that depends on a non-reproducible renderer — W0 must never become a
  hard blocker on all docs builds.
- **W1 — Link integrity + Track-D tutorial decision** (authoring + gate). Fix 2 cards; resolve the
  build-a-page path; add the link-integrity build gate.
- **W2 — IA restructure** (`_data.ts` navSections + page moves to the 3-level tree). The structural
  core. No prose rewrite — moves + hub/landing pages + nav.
- **W3 — Web Layer section** (10 export-grounded Fresh pages + 1 non-export "Examples / sandbox"
  showcase leaf, Claude authoring workflow). The promotion. The query/data leaf names BOTH `./query`
  AND the root `@netscript/fresh` `.` cache helpers (`hasAllCacheEntries`, `minCachedAt`,
  `projectCachedItemFromList`) so the page does not miss the root-export imports.
- **W4 — Auth pillar + R0 seam slice.** Codex builds the passthrough (R0); docs author the auth
  pillar incl. plugins leaf (R0 path + R1/R2 honesty); workspace tutorial reworked to the org
  plugin (per decision 2; gated on R0+R1 reality — if R1 not built this run, tutorial documents the
  schema-gen requirement rather than silently assuming tables). If R0 ships without R1, the
  auth-pillar **Plugins leaf** carries the R1 schema-gen caveat at the PAGE level (not only inside
  the tutorial) — see risk `RR-2` in `drift.md`. The Durable-Workflows pillar (W6) cites
  `createSagaRuntime` imported from the **`@netscript/plugin-sagas-core/runtime`** subpath (NOT root
  `.` and NOT the legacy `createDurableSagaRuntime`) — see drift `D2`.
- **W5 — Process gates** — implement the three mechanically-enforceable gates from locked
  decision 5: ship `.llm/tools/docs/check-caveat-harvest.ts` + `.llm/tools/docs/check-seam-coverage.ts`
  (marker grammar `<!-- caveat: <ref> -->` / `<!-- seam: seam-coverage:<row-id> -->`, scanning
  `docs/site/**/*.md{,x}`, exit non-zero on an untracked caveat / unseamed-capability claim), extend
  the existing xref throw-on-missing to `featureGrid` + `diagram`, and wire all three into the docs
  build + CI.
- **W6 — Pillar hub/landing pages + uniform internal sets** for the other pillars (Services & SDK,
  Background Processing, Durable Workflows, Data & Persistence, Orchestration & Runtime,
  Observability).

## Build / eval / merge flow

1. Lock plan → **layered PLAN gate**: (a) WSL Codex adversarial panel on this plan + IA tree;
   (b) OpenHands minimax-M3 PLAN-EVAL (hard stop). No authoring/build before PASS.
2. On PASS: open the docs-v4 build branch + draft PR. Implement W0–W6 as tracked slices
   (Claude authoring workflow for prose; WSL Codex for build wiring + R0 seam). Commit-by-slice,
   push, PR comment, append `commits.md`.
3. **Pre-IMPL-EVAL Codex adversarial impl review** of the built site (caveat sweep + non-enterprise
   prose + enhancements/features hunt) → fix every caveat → THEN OpenHands qwen3.7-max IMPL-EVAL.
4. Reconcile lock → merge docs to `docs/user-site` → dispatch Pages deploy → verify live.
5. R0 seam slice rides its own framework PR (auth-better-auth) → IMPL-EVAL → merge before docs that
   document the R0 path go live (ordering: seam green first, or docs state "shipping in <ref>").
   This ordering hazard is tracked as risk `RR-1` in `drift.md`; IMPL-EVAL verifies mitigation
   (a) hold-merge or (b) explicit "shipping in <ref>" callout before docs go live.

## Open IA questions delegated to the PLAN gate (panel + PLAN-EVAL rule on these)

- Split Background Processing vs Durable Workflows (proposed: split) — or one pillar.
- Reference: pillar-local leaves + thin global index (proposed) vs global catalog only.
- Fresh "Examples/sandbox": prose now, live StackBlitz backlog.

## Out of scope (backlog, never silently dropped)

R1–R5 seamless-auth program (own run); P3-*/P4-* enhancement backlog; PR #63 capability-audit
refresh; #6 scorecard/publish; #35 W3b; #36 lock-hygiene; #44 doc-as-limitation; #67 plugin→package
registry. `reference/**` stays untouched.
