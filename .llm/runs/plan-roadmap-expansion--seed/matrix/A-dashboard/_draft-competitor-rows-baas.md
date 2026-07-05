# Draft Competitor Rows — BaaS/Admin-Console Matrix (Topic A Dashboard)

Owner-expanded companion to `_draft-competitor-rows.md`. That file distilled the **dev/run-console**
category (Encore, Temporal, Inngest, Trigger.dev, Prisma Studio, Nitro) from
`research/A-dashboard/03-competitor-dev-console-teardown.md`. This file adds the **BaaS/admin-console**
category — Appwrite Console, Directus, Strapi — distilled from
`research/A-dashboard/04-baas-admin-console-teardown.md`, which targets Topic A's core thesis
("the dashboard IS how you drive the framework") more directly than any tool in the first pass.
Same row schema; four new `kind` values introduced (see legend).

`kind` legend (extends the file-03 legend: `map` · `catalog` · `run-inspector` · `trace` · `data` ·
`introspection` · `(convention)`):
- `manage` = a per-capability management surface (create → configure(tabs) → monitor loop) for a
  single framework/platform primitive.
- `extensibility` = a plugin/extension-contributes-a-panel model (named extension shapes + SDK
  contract + install path).
- `codegen-ui` = a dashboard action that generates the same on-disk artifacts a CLI scaffolder would.
- `ai-iterate` = in-dashboard AI applied to codegen/schema authoring for fast iteration.

| resource | kind | why it matters (NetScript) | where distilled |
| --- | --- | --- | --- |
| Per-capability nav + create + tabbed-settings + monitor loop (Databases/Auth/Storage/Functions/Messaging) | manage | Appwrite proves every backend primitive — not just "runs" — earns its own first-class panel with create/configure/monitor; this generalizes file 03's run-inspector pattern to *all* NetScript plugin categories (workers/sagas/triggers/streams/auth/db/kv) | [04#1-appwrite](../../research/A-dashboard/04-baas-admin-console-teardown.md#1-appwrite-console--the-north-star-per-capability-manage-through-ui) |
| Databases: create db/collection → Columns(Attributes) panel → Indexes tab → Settings/Permissions tab, sticky-ID + quick-action-menu UX | manage | Direct precedent for a NetScript `db` panel: schema/columns editing, index management, and permissions as sibling tabs rather than one crowded form | [04#1-appwrite](../../research/A-dashboard/04-baas-admin-console-teardown.md#1-appwrite-console--the-north-star-per-capability-manage-through-ui) |
| Auth: Users list + Security tab (session limits/alerts) + Mock Phone Numbers dev aid | manage | Users panel + a "dev auth" mock-provider panel is a concrete shape for NetScript auth-core/adapters dashboard integration; Mock Phone Numbers shows dashboards can ship dev-only ergonomics, not just prod controls | [04#1-appwrite](../../research/A-dashboard/04-baas-admin-console-teardown.md#1-appwrite-console--the-north-star-per-capability-manage-through-ui) |
| Storage: bucket-create form with size/extension/compression/encryption sub-panels, zero-permission-by-default | manage | Explicit-grant-by-default and sub-panel-per-concern (not one giant form) are reusable defaults for any future NetScript storage-shaped plugin | [04#1-appwrite](../../research/A-dashboard/04-baas-admin-console-teardown.md#1-appwrite-console--the-north-star-per-capability-manage-through-ui) |
| Functions: template-gallery create entry point + Git/build Settings→Configuration + separate Executions vs Deployments views | manage | Executions-vs-Deployments split maps directly onto worker job-run history vs. scaffold/deploy history for `plugin-workers`; template gallery is a strong "fastest path to a working instance" pattern for any NetScript "Create X" action | [04#1-appwrite](../../research/A-dashboard/04-baas-admin-console-teardown.md#1-appwrite-console--the-north-star-per-capability-manage-through-ui) |
| Messaging: channel-adaptive compose form (push/email/SMS) + topics/targets + status lifecycle (draft→scheduled→processing→success/failed) | manage | "One composer, fields adapt to selected type" generalizes to any multi-adapter NetScript panel (multi-provider KV/queue config, multi-adapter auth); status lifecycle is a reusable run/message-state vocabulary | [04#1-appwrite](../../research/A-dashboard/04-baas-admin-console-teardown.md#1-appwrite-console--the-north-star-per-capability-manage-through-ui) |
| Project Overview → API keys (scopes grouped by service, mirrors nav taxonomy) + Dev Keys (short-lived, rotate-in-place, local-only) | manage | Scopes-mirror-nav is a design rule: a NetScript dashboard "tokens" panel should group scopes by plugin/contribution-axis, same as its own nav; Dev Keys is a directly reusable local-dev-token feature for the Aspire dev loop | [04#1-appwrite](../../research/A-dashboard/04-baas-admin-console-teardown.md#1-appwrite-console--the-north-star-per-capability-manage-through-ui) |
| Extension taxonomy: Interface / Display / Layout / Panel / Module / Theme (+ API Hook/Endpoint/Operation), each with a documented SDK contract | extensibility | Directus's own Insights dashboard is built on the same Panel primitive it exposes to third parties — direct precedent for a NetScript `.withDashboardPanel(...)` plugin-contribution axis, contract-shaped like Directus's id/name/icon/component/slots/setup() exports; sharpens D-NSONE's extensibility call | [04#2-directus](../../research/A-dashboard/04-baas-admin-console-teardown.md#a-the-extensibility-model--extension-types-sdk-marketplace) |
| Interface vs. Display as separate extension concerns (edit-shape vs. show-shape) | extensibility | A named split fresh-ui/NS One currently lacks (form-field vs. read-only/badge component taxonomy); worth adopting as vocabulary in the L3-blocks design | [04#2-directus](../../research/A-dashboard/04-baas-admin-console-teardown.md#a-the-extensibility-model--extension-types-sdk-marketplace) |
| In-app Marketplace (search/filter/install extensions from Settings, no leaving the app) | extensibility | Longer-term evolution target for NetScript's CLI-only `plugin add` flow — an in-dashboard plugin marketplace | [04#2-directus](../../research/A-dashboard/04-baas-admin-console-teardown.md#a-the-extensibility-model--extension-types-sdk-marketplace) |
| Data Model UI (create collection → fields+interfaces → auto-generated Content-module CRUD + item-detail page, zero hand-written admin UI) | codegen-ui | Strongest available precedent for a NetScript `db` tab that renders directly off the Prisma-Next schema — model → auto CRUD screen, field type → auto-selected interface, override seam preserved | [04#2-directus](../../research/A-dashboard/04-baas-admin-console-teardown.md#b-schemadata-model-driven-ui-generation) |
| Content-Type Builder saves generate identical on-disk artifacts (`schema.json` + controller/route/service under `src/api/<name>/`) to `strapi generate` CLI output | codegen-ui | Direct, almost literal precedent for extending NetScript's #157 typesafe-codegen mandate to a dashboard-triggered "Add resource" action calling the exact same adapter/resource-scaffolder the CLI installer already uses (`createPluginAdapter(...).toScaffold()`) — no new codegen engine, a second caller of the existing one | [04#3-strapi](../../research/A-dashboard/04-baas-admin-console-teardown.md#a-dashboard-driven-codegen-mirrors-cli-driven-codegen) |
| `strapi generate` interactive CLI menu prompts for the same inputs the dashboard form collects, writes to the same paths | codegen-ui | Confirms dashboard-and-CLI-as-two-callers-of-one-generator is bidirectionally consistent, not just UI→disk; validates the pattern is safe to mirror in NetScript (CLI-first, dashboard second caller) | [04#3-strapi](../../research/A-dashboard/04-baas-admin-console-teardown.md#a-dashboard-driven-codegen-mirrors-cli-driven-codegen) |
| Strapi AI chat assistant in Content-Type Builder (context-aware schema explain/edit, conversational iteration) | ai-iterate | Direct precedent for the flagship AI plugin (#238) converging with the dashboard: a chat panel that drives the same typesafe scaffolder, landing identical CLI-reproducible artifacts | [04#3-strapi](../../research/A-dashboard/04-baas-admin-console-teardown.md#b-in-dashboard-ai-combined-with-that-codegen-for-fast-iteration) |
| Strapi AI Design Import (Figma link / screenshot → inferred content structure) | ai-iterate | Reusable taxonomy entry for a NetScript dashboard-AI panel: screenshot/Figma-driven UI-block scaffolding, relevant to fresh-ui/NS One L3 blocks | [04#3-strapi](../../research/A-dashboard/04-baas-admin-console-teardown.md#b-in-dashboard-ai-combined-with-that-codegen-for-fast-iteration) |
| Strapi AI Code Analysis (existing Next.js/Nuxt/Astro app → reverse-engineered schema) | ai-iterate | Reusable taxonomy entry: point the AI plugin at an existing Prisma schema or oRPC contract to scaffold a matching plugin resource | [04#3-strapi](../../research/A-dashboard/04-baas-admin-console-teardown.md#b-in-dashboard-ai-combined-with-that-codegen-for-fast-iteration) |

## Notes for matrix consolidation

- **Core v1 candidates added by this category** (highest precedent + closest NetScript fit):
  per-capability manage loop (generalizes file 03's run-inspector to every plugin category),
  scopes-mirror-nav for a tokens/API-keys panel, and the `.withDashboardPanel(...)`
  extension-contributes-a-panel axis (directly answers D-NSONE's extensibility question).
- **Design-informing but not v1-build candidates**: schema-driven `db`-tab UI generation (depends on
  Prisma-Next migration landing first, per `prisma-next-db-migration` program memory), in-app
  marketplace (depends on the CLI-side JSR installer being solid first), codegen-from-dashboard
  action (depends on #157's typesafe-codegen mandate being fully wired for the resource types the
  dashboard would scaffold).
- **AI-iterate rows are directly relevant to the flagship AI plugin (epic #238) roadmap**, not just
  the dashboard — they should be cross-referenced there, not only consumed by Topic A's design.
- Every row in this file cites `research/A-dashboard/04-baas-admin-console-teardown.md`, which in
  turn cites only fetched, current (July 2026) official docs/blog URLs — no in-repo
  `docs/site/_plan/research/competitors/*.md` sources were available for Appwrite/Directus/Strapi
  (unlike file 03, which had in-repo doc-IA teardowns to cross-check against for Encore/Temporal).
