# IMPL-EVAL — docs/content-architecture (PR #59)

## Verdict

**FAIL_FIX** (one minor item — a known-stale orphan scheduled for deletion in the
plan but still present with a contradicted install line.)

## Build gate

- Command: `deno task --cwd docs/site build`
- Exit: **0**
- Files generated: **150**
- Final Lume line: `🍾 Site built into _site  150 files generated in 3.25 seconds`
- No `TemplateError` / `TransformError`.
- Non-fatal `Unknown language: "no-highlight"` warning is the known highlighter
  backlog item flagged in `commits.md` — build still green, not a fail.

## Findings (per zone)

### Build gate — PASS
- Lume build is clean and deterministic. 150 files matches the expected count.

### Start here — PASS
- `index.vto`, `quickstart.vto`, `why.vto` install line `deno install --global
  --allow-all --name netscript jsr:@netscript/cli/bin/netscript.ts` is correct.
- `quickstart.vto` step ordering: install → `netscript init ...` → `cd aspire &&
  aspire restore && aspire run` (dashboard :18888) → `netscript db init/generate/seed`
  → hit users :3001 — Aspire is step 2, before any `netscript db` (hard rule 1–2
  satisfied).

### Tutorials ladder — FAIL_FIX (single finding)
- `first-workspace`, `build-a-service`, `background-jobs`, `durable-workflow`,
  `ingest-webhook` are all substantive, prev/next chained, and form one
  continuous app narrative (worker `create-user-settings` publishes
  `UserSettingsCreated` → saga handles it + emits `sagaComplete` → trigger
  `enqueueJob`s a worker job). Port citations (:8091, :8092, :8093) correct;
  code shapes (`defineJobHandler`+`createJobTools`, `defineSaga(...).durability()
  .state().on().build()`, `defineWebhook` on raw Hono routes — NOT oRPC) all
  verified. Worker `trace`/`progress` no-op stub disclosure present in
  `add-opentelemetry.md` and `capabilities/background-jobs.md`. ✅
- **`tutorials/getting-started.md:32` STILL EXISTS** with contradicted install
  line: `deno install --global --allow-all --name netscript jsr:@netscript/cli/bin`
  (bare, missing `netscript.ts` suffix). Every other page in the tree uses the
  canonical full path. The plan §4 explicitly scheduled this file for deletion
  ("DELETE `tutorials/getting-started.md` — stale; content split into
  quickstart + first-workspace"). `commits.md` tail lists it in the IMPL-EVAL
  backlog (`tutorials/getting-started.md retirement + tutorials/index.md
  relink`). The file is **not** in `_data.ts` `navSections` (so it has no
  breadcrumb), but it **is** still linked from `tutorials/index.md:14`.
  → **Required fix**: delete `docs/site/tutorials/getting-started.md` AND remove
  the link at `docs/site/tutorials/index.md:14-15` to `/tutorials/getting-started/`.
    (Alternative, if kept: fix line 32 install path to the canonical
    `jsr:@netscript/cli/bin/netscript.ts` AND remove the orphan link from
    `tutorials/index.md`.)

### How-to — PASS
- All 8 pages (`add-a-plugin`, `add-a-service`, `database-migration`,
  `queue-kv-cron`, `add-opentelemetry`, `customize-fresh-ui`, `deploy`,
  `author-a-plugin`) are substantive, prev/next chained, and ground-truth
  accurate. `database-migration.md` correctly requires `aspire run` first.
  `add-opentelemetry.md` honestly discloses `createJobTools` trace/progress
  stub status. `customize-fresh-ui.md` correctly states UI is copied source
  under `apps/dashboard/components/ui/`. `add-a-plugin.md` has no
  `templateEngine: [vento, md]` front matter but uses no comp blocks (Markdown
  tables only), so the build is correct without it.

### Explanation — PASS
- `contracts`, `durable-workflows`, `observability`, `aspire` all present,
  substantive, accurate to ground-truth. `@orpc/{contract,server,client,zod,
  tanstack-query}` ^1.14.6 + zod ^4.x called out in `contracts.md`.
  `aspire.md` correctly identifies `aspire/apphost.mts` as the generated
  Node/TS AppHost (not dotnet), names `aspire.config.json` keys
  (`appHost.path="apphost.mts"`, `typescript/nodejs`, SDK 13.4.4,
  `Aspire.Hosting.PostgreSQL`), and flags the `netscript.config.ts`
  `aspire.appHost:'dotnet/AppHost'` divergence honestly per the plan §4 AM.

### Capabilities — PASS
- All 9 hubs (`services`, `background-jobs`, `durable-sagas`, `triggers`,
  `streams`, `database`, `kv-queues-cron`, `telemetry`, `fresh-ui`) plus
  `capabilities/index.md` capability matrix grid. Ports cited correctly
  (services :3001, workers :8091, sagas :8092, triggers :8093, streams :4437).
  `services.md` correctly distinguishes the two-API split
  (`defineService(router, options)` one-call vs the plugin fluent
  `createService(...).withCors().withRPC().serve()` builder). `triggers.md`
  correctly states Hono, not oRPC. `streams.md` honestly frames producer/consumer
  as stubs with deferred runtime. `database.md` correctly cites Prisma 7.8
  `runtime="deno"` and per-plugin schema aggregation under
  `database/postgres/schema/plugins/<plugin>/`.

### Resources — PASS
- `glossary.md` and `cli-reference.md` both present, substantive, and grouped
  with `apiTable` instances. Install lines correct.

### Chrome/wayfinding — PASS
- `_data.ts` `navSections` is updated: each zone index precedes its children so
  breadcrumb deepest-prefix match resolves. Every authored body page is a
  `navSections` item (verified). `index.vto`/`why.vto`/`quickstart.vto` dead
  links fixed per the supervisor's pre-commit reconciliation.

### Scope discipline — PASS
- `docs/site/reference/**` untouched (22 generated units intact).
- `docs/site/_includes/layouts/base.vto`, `styles/`, `_components/*.vto` source
  files NOT edited (build diff confirms only authored Markdown + `_data.ts`).
- Catalog / version pins / `packages/**` / `plugins/**` not edited.

### Comp-tag rigor — PASS
- Build green implicitly verifies no `{{ comp.callout({...}) }}` paired with
  `{{ /comp }}` build-breaker exists. Spot-check: every paired comp opener in
  the authored wave uses the tag form `{{ comp callout { type, title } }}`.
  The 158 function-form `comp.NAME(args)` openers in the tree are all
  no-slot components (`breadcrumb`, `tabbedCode`, `apiTable`, `card`,
  `featureGrid`, `nextPrev`, `learningPath`, `hero`) — explicitly permitted
  by §5.
- The 3 prose `function` keyword hits in
  `capabilities/background-jobs.md:16,53`,
  `explanation/contracts.md:95`, `explanation/durable-workflows.md:43,101`,
  `tutorials/background-jobs.md:102`, `tutorials/durable-workflow.md:141`,
  `tutorials/ingest-webhook.md:94`, `explanation/architecture.md:42` are all
  inside inline HTML body text of tag-form callouts, NOT in comp-tag args, so
  the Vento `function`-keyword landmine is not triggered (and the green build
  confirms it).

### Fil d'Ariane — PASS
- Tutorial ladder chain: `first-workspace → build-a-service → background-jobs
  → durable-workflow → ingest-webhook → how-to/index` all resolve via
  `prev`/`next` front matter. The cross-plugin choreography (worker publishes
  `UserSettingsCreated` → saga handles → emits `sagaComplete` → trigger
  `enqueueJob`s) is real and consistent across the four plugin-rung pages and
  the anatomy ground-truth.

## Required fix (the WSL Codex iteration backlog item)

**Delete `docs/site/tutorials/getting-started.md` AND remove its link from
`docs/site/tutorials/index.md:14-15`.** This is the plan §4 scheduled deletion
that was carried in the IMPL-EVAL backlog but not yet executed; leaving the
file in place preserves a contradicted install path on line 32.

No other fixes required. Build is green; the remaining 26/27 authored pages
are accurate, well-chained, scope-respecting, and the wave is otherwise ready.
