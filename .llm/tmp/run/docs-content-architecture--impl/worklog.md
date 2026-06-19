# Worklog — docs/content-architecture implementation

## Step-6 item 1 — Watchers + config intent coverage — 2026-06-19

**Ground truth read before editing.** Loaded `AGENTS.md`, harness/PR/tools/doctrine skills,
`doc-architecture-v2.md` §4-§5, `ground-truth.md`, `ground-truth-project-anatomy.md`,
`docs/architecture/doctrine/{01,02}-*.md`, `deno doc --quiet packages/watchers/mod.ts`, and
`deno doc --quiet packages/config/mod.ts`.

**Change.** Added a grounded `File watchers` subsection to
`docs/site/capabilities/triggers.md` covering `createWatcher`, `FileWatcher.watch()`,
`WatchEvent`, strategy auto-selection, `forcePolling`, and the glob/stability/dedup filter
pipeline, with a link to `/reference/watchers/`. Added `Configuration records intent before
runtime wiring` to `docs/site/explanation/architecture.md`, explaining
`defineConfig`/`defineConfigAsync`, `loadConfig`/`initConfig`/`getConfig`, plugin partial
config contributions, appsettings/Aspire wiring, and runtime-config overrides.

**Build evidence.** `deno task --cwd docs/site build` exited 0 and generated 148 files.
Known pre-existing highlighter diagnostics for `no-highlight`/`prisma` remained; item 3 owns
that chrome fix. No `TemplateError` or `TransformError`.

## Step-6 item 2 — `--no-aspire` verification stopped for drift — 2026-06-19

**Verification commands.** Ran `deno run -A packages/cli/bin/netscript-dev.ts init --help` and a
throwaway scaffold:

```bash
deno run -A packages/cli/bin/netscript-dev.ts init no-aspire-app \
  --path .llm/tmp/step6-no-aspire-verify \
  --db postgres \
  --service --service-name users --service-port 3001 \
  --no-aspire --ci --yes --no-git --force --json
```

**Finding.** `--no-aspire` exists and the JSON result reports `aspire.enabled:false` with
`resourceCount:0`; the generated project has no `aspire/`, no root `aspire.config.json`, and no
`appsettings.json`. However the generated README and JSON `nextSteps` still claim Postgres is
provisioned by Aspire/appsettings. This contradicts the docs/plan assumption that no-Aspire scaffold
copy is coherent and verified.

**Steering + docs-site action.** Supervisor clarified item 2 is docs-site accuracy only and the
CLI/scaffold-template README/nextSteps bug is out of scope for PR #59. Scanned `docs/site/**` for
`--no-aspire`, no-Aspire, appsettings, and Postgres/Aspire passages. Most no-Aspire docs-site copy
was already accurate: without Aspire, the user provisions Postgres/cache and supplies
`POSTGRES_URI` / `DATABASE_URL`. One docs-site passage was wrong:
`docs/site/explanation/aspire.md` claimed the generated `--no-aspire` README was verified and
coherent. Removed that claim and narrowed the docs to the verified behavior: no `aspire/` AppHost,
no dashboard, no automatic infrastructure provisioning, start Deno processes directly and supply
your own connection strings.

**Build evidence.** `deno task --cwd docs/site build` exited 0 and generated 148 files. Known
pre-existing highlighter diagnostics for `no-highlight`/`prisma` remained; item 3 owns that chrome
fix. No `TemplateError` or `TransformError`.

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
