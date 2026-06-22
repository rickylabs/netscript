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
   tree in `ia-tree.md`. `@netscript/fresh` PROMOTED to a 10-page "Web Layer" section, each page
   grounded in a verified export subpath.
2. **Auth seam (user, 2026-06-22):** BUILD the `plugins`/`betterAuthOptions` passthrough on
   `createNetscriptBetterAuth` now (R0, IMPL-EVAL-gated Codex slice) AND record the full
   seamless-auth roadmap R1–R5 in `arch-debt.md` (done). Docs document the R0 factory path, state
   the R1 schema-generation requirement honestly, and carry the R2 interactive-flow caveat for
   magic-link/passkey.
3. **Diagram fix = real Mermaid pipeline.** Wire `_diagrams/render.ts` (mmdc) into `deno task
   build`; regenerate every SVG from its `.mmd` as real Mermaid output themed to the chrome; add a
   missing-asset build gate so `comp.diagram` can never soft-degrade to alt-text again (parity with
   the `xref` throw-on-missing behavior).
4. **Link fixes.** Fix the 2 `wrong_step` cards on `fresh-framework.md`. Author the genuinely
   missing **Track-D "build a Fresh page"** path (or repoint to live-dashboard) — decided in W1.
5. **Process gates (drift D1 remediation), all enforced in build/CI:**
   - **Caveat-harvest gate:** every authored caveat/limitation must carry a tracked reference
     (drift id, arch-debt id, or GH issue #); an untracked caveat fails review.
   - **Link-integrity build gate:** any nav/featureGrid/xref href to a missing or non-corresponding
     page fails the build.
   - **Seam-coverage discipline:** "documented/implied but unseamed" → arch-debt + backlog; the
     seam-coverage matrix is the source of truth.

## Workstreams

- **W0 — Mermaid pipeline + missing-asset gate** (Codex slice, docs/user-site). Real mmdc render
  wired into build; missing-asset gate. Independent; can land first.
- **W1 — Link integrity + Track-D tutorial decision** (authoring + gate). Fix 2 cards; resolve the
  build-a-page path; add the link-integrity build gate.
- **W2 — IA restructure** (`_data.ts` navSections + page moves to the 3-level tree). The structural
  core. No prose rewrite — moves + hub/landing pages + nav.
- **W3 — Web Layer section** (10 grounded Fresh pages, Claude authoring workflow). The promotion.
- **W4 — Auth pillar + R0 seam slice.** Codex builds the passthrough (R0); docs author the auth
  pillar incl. plugins leaf (R0 path + R1/R2 honesty); workspace tutorial reworked to the org
  plugin (per decision 2; gated on R0+R1 reality — if R1 not built this run, tutorial documents the
  schema-gen requirement rather than silently assuming tables).
- **W5 — Process gates** (caveat-harvest + seam-coverage discipline wired into CI/review).
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

## Open IA questions delegated to the PLAN gate (panel + PLAN-EVAL rule on these)

- Split Background Processing vs Durable Workflows (proposed: split) — or one pillar.
- Reference: pillar-local leaves + thin global index (proposed) vs global catalog only.
- Fresh "Examples/sandbox": prose now, live StackBlitz backlog.

## Out of scope (backlog, never silently dropped)

R1–R5 seamless-auth program (own run); P3-*/P4-* enhancement backlog; PR #63 capability-audit
refresh; #6 scorecard/publish; #35 W3b; #36 lock-hygiene; #44 doc-as-limitation; #67 plugin→package
registry. `reference/**` stays untouched.
