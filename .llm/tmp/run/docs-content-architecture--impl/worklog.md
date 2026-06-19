# Worklog — docs/content-architecture implementation

## Phase 0a — chrome + components + landing (GREEN build) — 2026-06-19

**Generator:** Stage-4 wave-1 dynamic workflow (5 agents: components, chrome, index,
why, quickstart). Supervisor persisted outputs (agents returned content as text;
extracted + written via `parse_stage4.py`). why/quickstart staged to `_drafts/` (see
drift.md). Supervisor corrected index.vto to the verified `comp` tag syntax in-lane.

**Files landed (docs lane only — no packages/plugins):**
- Components (7): `_components/{callout,card,featureGrid,hero,learningPath,apiTable,tabbedCode}.vto`
- Chrome (4): `_data.ts`, `_includes/layouts/base.vto`, `_components/{breadcrumb,nextPrev}.vto`
- Landing: `index.vto` (replaces `index.md`, removed via `git rm`)
- B2 worklogs: `_plan/worklog/{index,why,quickstart}.md`
- Staged for Phase-0b rework: `_drafts/{why,quickstart}.vto`

**Build evidence.** `deno task --cwd docs/site build` → **80 files generated, 0 errors.**
`index.html` renders: 17 `ns-hero`, 13 `ns-callout` (2 with `__title`), 21 `ns-tabbed`,
6 `ns-feature`, 17 `ns-learning`, 3 real `<h2>` section headings. Literal-markdown
leak check (`## `, `{{ /comp`, `comp.callout`, `**bold`): **empty**. Callout body text
present.

**Component CSS** keys off existing fresh-ui `--ns-*` tokens (verified against
`docs/site/styles/{docs,tokens}.css`), auto-collected by Lume, emitted only on pages
that use each component.

**Lume `comp` syntax — authoritative (verified empirically):**
- body: `{{ comp NAME { args } }}` … `{{ /comp }}` (body injected as `content`)
- self-close: `{{ comp NAME { args } /}}`
- no-body string form: `{{ comp.NAME({...}) }}`

**Gate status.** Phase-0a build gate: PASS. Markdown/prose pages: deferred to Phase 0b
(engine) + wave-1b (re-author) — see drift.md. IMPL-EVAL deferred until front door renders.
