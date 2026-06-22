# Research — docs-v4-ia-deepening

Scope overlay: SCOPE-docs + a capability-seam audit that may surface ARCHETYPE code debt.
Supervisor: Claude. Eval: OpenHands (minimax-M3 plan / qwen3.7-max impl). Heavy lifting:
Claude authoring workflow (prose) + WSL Codex (build wiring, tutorial rework, any seam slices).

## Trigger

User review of merged v3 docs (PR #106) found four defects + a structural critique:
1. Fresh-page diagram renders alt-text, not the SVG (diagram pipeline broken).
2. Fresh "Build a page (Track D)" card → `/tutorials/` (no such tutorial exists).
3. Fresh "TanStack Query in islands" card → `live-dashboard/03-sdk-cache-first-query/`
   (mismatch; real QueryIsland step is `04-definePage-QueryIsland`).
4. FLAT IA: 15 flat capabilities / 24 flat how-tos / 28 flat reference units; @netscript/fresh
   (the TanStack-Start / Next.js-equivalent web container) gets ONE page.
Bonus: sidebar lists 4 tutorials, only 2 exist on disk (storefront, erp-sync are dead entries).
Process: caveats never tracked (see drift D1) — the deeper failure.

## Verified facts (from origin/docs/user-site)

- Diagram component `_components/diagram.vto` is correct (`src |> url`). The render step
  (`_diagrams/render.ts`, `.mmd → .svg`) is **NOT wired into `deno task build`** (per the
  component's own comment) → SVGs stale/empty or not shipped → `<img>` 404 → alt text shows.
- Fresh hub (`capabilities/fresh-framework.md`) featureGrid hrefs: `/tutorials/` (no track) and
  `/tutorials/live-dashboard/03-sdk-cache-first-query/` (wrong step).
- `_data.ts` navSections: flat Capabilities (15), How-to (24), Reference units (28). Header
  comment admits capability hubs / tutorial sub-pages "land in later phases" — i.e. flat by design.
- Tutorials on disk: only `workspace/` (6 steps) and `live-dashboard/` (6 steps). `storefront`
  and `erp-sync` are sidebar entries with no directory.
- Package source present in worktree for `deno doc`: 26 packages incl. auth-better-auth,
  plugin-auth-core, plus plugins/auth. Competitor research at
  `docs/site/_plan/research/competitors/*.md` + `doc-architecture-patterns.md`.

## User decisions (locked 2026-06-22)

- **IA:** full 3-level pillar regroup (Zone → Pillar → Leaf) across capabilities + how-to +
  reference; @netscript/fresh promoted to its own multi-page **Web Layer** section.
- **Auth seams:** AUDIT FIRST → user decides build-vs-flag per better-auth plugin once the
  seam-coverage matrix lands. No seam code committed before that.
- **Audit breadth:** sweep EVERY capability for "documented/implied but unseamed", not just auth.

## Phase-0 grounding scouts (workflow wf_090ee054-3d5 — IN FLIGHT)

- scout:links — full internal-link gap matrix
- scout:seams — capability seam-coverage matrix (+ better-auth plugin deep dive)
- scout:diagrams — diagram pipeline root cause + concrete build-wiring fix
- scout:competitors — hierarchy-depth benchmark + Fresh-zone precedents (Next/TanStack/Astro)

## Findings (Phase-0 scouts landed — wf_090ee054-3d5, 4 agents)

### Links — 2 real defects only (my earlier "dead tutorials" suspicion was WRONG)
99 pages scanned; 87 nav hrefs + 112 body hrefs all resolve. **All 4 tutorials exist on disk**
(storefront, workspace, erp-sync, live-dashboard) — correct the research-trigger note above.
Only 2 `wrong_step` mismatches, both in `capabilities/fresh-framework.md`:
- "Learn — Build a page (Track D)" → `/tutorials/` should be `/tutorials/live-dashboard/`.
- "Do — TanStack Query in islands" → `/tutorials/live-dashboard/03-sdk-cache-first-query/`
  should be `/tutorials/live-dashboard/04-definePage-QueryIsland/`.

### Diagram — transient 404 at screenshot time + structurally fragile pipeline
Live check (2026-06-22): the SVG, sibling SVGs, and the page all return **200** now; the emitted
`<img src="/netscript/assets/diagrams/fresh-page-model.svg">` is correct and base-path-prefixed.
The alt-text screenshot was a **deploy-propagation blip** (asset 404'd for the seconds right after
the dispatch deploy). BUT the structural defect is real: every committed SVG is a **hand-authored
placeholder** (720×260 viewBox, mid-tone strokes, NO Mermaid signature) decoupled from its `.mmd`
source; `_diagrams/render.ts` (mmdc) is **not wired into `deno task build`**; `comp.diagram` emits
a plain `<img>` that **soft-degrades to alt text** on a missing asset (unlike `xref`, which throws).
Fix = wire mmdc render into build (real Mermaid output, themed to chrome) + add a missing-asset
build gate so a 404 can never silently degrade again. This is exactly the user's "use a tool to
parse mermaid" demand.

### Seams — exactly ONE build-seam gap in the whole framework (see seam-coverage.md)
better-auth plugins (all 9) are mountable today only via the **undocumented** escape hatch
`createBetterAuthBackend({ auth: betterAuth({ plugins: [...] }) })`. The documented
`createNetscriptBetterAuth` factory has a closed `NetscriptBetterAuthOptions` (no `plugins`), so the
documented path can enable none. Principal mapper already consumes org output. Every OTHER pillar is
honestly seamed or honestly documented-as-limitation. → user decides build-vs-doc (drift D1).

### Competitors — 3-level cap is the consensus; Fresh deserves its own section
Zone (Diátaxis) → Product Area (Capability Hub) → Leaf, max 3 levels; tutorials get a 3rd step
sub-level. Each hub gets a UNIFORM page set (Concepts → Quickstart → How-To → Reference) — the
repo's own `doc-architecture-patterns.md` prescribes exactly this. NO parallel per-area sidebars
(Medusa's failure mode). Polyglot/runtime = horizontal code-switcher TAB, not a folder level. Fresh
"Web Layer" section grounded in verified `@netscript/fresh` export subpaths (./server, ./builders,
./route, ./query, ./form, ./defer, ./streams, ./interactive, ./vite, ./error, ./testing).
