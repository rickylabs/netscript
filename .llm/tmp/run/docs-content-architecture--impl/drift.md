# Drift — docs/content-architecture implementation

Append-only. Severity: minor | significant | architectural.

## 2026-06-19 — Stage-4 wave-1 page authoring model divergence (significant)

**What diverged.** The Stage-4 wave-1 workflow generated 7 components + 4 chrome
files + 3 front-door pages (index, why, quickstart). The 11 component/chrome files
are correct. The 3 pages were authored against an **incorrect Lume mental model**
with two systematic defects:

1. **Wrong `comp` invocation syntax for body components.** Pages opened body
   components with the function-call form `{{ comp.callout({...}) }}` but closed
   with the tag-form `{{ /comp }}`. Lume's `comp` Vento tag
   (`lume@v2.5.4/plugins/vento.ts` line 158, regex line 209, body injection line
   234) only pairs `{{ /comp }}` with a **tag-form opener** `{{ comp NAME { args } }}`.
   The mismatch left `{{ /comp }}` orphaned → Vento parsed `/comp` as a regex →
   `TransformError: Unterminated regular expression`. Build aborted at index.vto:15.
   - **Verified fix syntax (empirically, isolated build):**
     - body: `{{ comp NAME { args } }}` … body … `{{ /comp }}`
     - self-close: `{{ comp NAME { args } /}}`
     - no-body function form `{{ comp.NAME({...}) }}` still works (returns a string).

2. **Raw markdown prose inside `.vto`.** why.vto and quickstart.vto are ~80% raw
   markdown (`## headings`, `1. **bold**` lists, `[links](url)`, fenced code).
   Lume does **not** markdown-process `.vto` output (verified: a `.vto` with
   `## A heading` emits the literal text `## A heading`). These pages cannot render
   correctly until Phase-0b markdown support exists. This is the planned hybrid
   model (prose = `.md` + callout shim; marketing/hubs = `.vto`) — the wave-1
   agents jumped ahead and authored Phase-1 prose pages before the Phase-0b engine
   that renders them.

**Resolution taken (Phase 0a landed tonight, supervisor, docs lane).**
- Fixed `index.vto` to the correct model in-lane: callout → tag form; the 3 section
  `## headings` → `<h2>` (index is a marketing/landing `.vto`, almost entirely
  `comp.*` calls + 3 headings, so it is correctly a `.vto` page). Build is GREEN
  (80 files); index.html renders hero/callout/tabbedCode/featureGrid/learningPath
  with zero literal-markdown leak.
- Relocated why.vto + quickstart.vto to `docs/site/_drafts/` (Lume ignores
  `_`-prefixed dirs) to preserve the authored content for Phase-0b rework without
  breaking the build. Their B2 worklogs remain at `docs/site/_plan/worklog/`.

**Follow-up required (does NOT block the Phase-0a merge gate).**
- **Phase 0b engine config (Codex slice):** add markdown rendering for prose pages.
  Either (a) configure Lume so prose pages are `.md` processed by [vento, markdown]
  so they can still call `{{ comp ... }}`, or (b) keep prose pages `.vto` and pipe
  prose blocks through an `md` filter. Plus the GitHub-callout shim (`> [!TIP]`),
  Shiki, toc, sitemap, and `api-cite.ts` per the locked plan. Touches
  `docs/site/_config.ts` only — NOT packages/plugins.
- **Wave-1b re-author:** once 0b lands, re-home `_drafts/why.vto` and
  `_drafts/quickstart.vto` as correctly-rendering prose pages (the prose CONTENT and
  the B2 accuracy worklogs are good — the quickstart worklog verified every CLI
  command/flag/port/route against source; why has its own).
- **Soft packaging note (NOT a hard blocker), from the quickstart accuracy pass:**
  `@netscript/cli` ships `bin/netscript.ts` but does not expose it in the JSR
  `exports` map (only `.`, `./scaffolding`, `./testing`). The documented install is
  `deno add jsr:@netscript/cli`. The global-install / ad-hoc-run commands resolve
  against the raw published file path but are not a formal `exports` entry. A future
  CLI packaging slice (Codex, packages/cli — separate from docs) could add a `./bin`
  export + document the global install. The quickstart page is accurate against
  today's surface.

**IMPL-EVAL (Stage 5) sequencing note.** Benchmarking doc quality vs competitors is
premature while the front door is only the landing page. Recommend dispatching
Stage-5 IMPL-EVAL only after Phase 0b + wave-1b make why/quickstart render.
