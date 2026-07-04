# BaaS / Admin-Console Teardown — Topic A (NetScript Dev Dashboard)

**Slice:** Stage-B owner-expanded competitor corpus. Purpose: file
`03-competitor-dev-console-teardown.md` covered **dev/observability/run consoles** (Encore, Temporal,
Inngest, Trigger.dev, Prisma Studio, Nitro) — the closest analogs to a code-derived local dev
dashboard. That corpus **missed the single most on-point exemplar category** for Topic A's core
thesis — "**the dashboard IS how you drive the framework**" — namely **admin consoles that let you
MANAGE the features a framework/platform exposes THROUGH the UI**, not just observe runs. This file
is the sibling BaaS/admin-console teardown, at the same panel/IA depth as file 03, covering three
owner-prioritized exemplars: **Appwrite Console** (north-star: per-capability manage-through-UI),
**Directus** (extensibility model + schema-driven UI generation), and **Strapi** (narrow: codegen-from-UI
mirroring the CLI + in-dashboard AI). Feeds
`matrix/A-dashboard/_draft-competitor-rows-baas.md`.

**Method:** fresh web research (July 2026) against each tool's official docs, cited with real URLs.
Where a doc page was overview-only (no UI-level detail), a second, more specific page (quick-start,
feature-specific doc, or product blog post) was fetched to reach panel/IA-level detail — cited
alongside the overview page.

---

## 1. Appwrite Console — the north-star: per-capability manage-through-UI

**Refs:** [Docs home](https://appwrite.io/docs) ·
[Databases overview](https://appwrite.io/docs/products/databases) ·
[Databases quick start](https://appwrite.io/docs/products/databases/quick-start) ·
[Console 2.0: Databases redesign](https://medium.com/appwrite-io/introducing-console-2-0-databases-f74c0de43e50) ·
[Auth overview](https://appwrite.io/docs/products/auth) ·
[Manage users](https://appwrite.io/docs/products/auth/users) ·
[Storage overview](https://appwrite.io/docs/products/storage) ·
[Storage buckets](https://appwrite.io/docs/products/storage/buckets) ·
[Functions overview](https://appwrite.io/docs/products/functions) ·
[Functions deployment](https://appwrite.io/docs/products/functions/deployment) ·
[Messaging overview](https://appwrite.io/docs/products/messaging) ·
[Messaging messages](https://appwrite.io/docs/products/messaging/messages) ·
[Realtime API](https://appwrite.io/docs/apis/realtime) ·
[API keys](https://appwrite.io/docs/advanced/platform/api-keys) ·
[GitHub repo](https://github.com/appwrite/appwrite)

Appwrite is the clearest existing proof that a framework/BaaS can ship **one dashboard that is the
primary way you drive every backend capability it exposes** — not a read-only observability layer
bolted on afterward, but the actual control surface: create, inspect, configure, and monitor each
capability, all inside the Console. This is the through-line Topic A names as its core thesis.
Each capability below gets its **own first-class management surface** in the Console, not a shared
generic "data" tab — the IA maps one-to-one from framework primitive to dashboard panel/section.

### Per-capability breakdown (the create/inspect/configure/monitor loop)

- **Databases → Databases section.** *Create*: Console → Databases → "Create database" (name +
  optional custom ID) → inside it, "Create table/collection" (name + optional custom ID). *Configure
  fields*: a **Columns/Attributes panel** with a "Create column" button, a type dropdown (String,
  Integer, Boolean, Relationship, etc.), and per-type option fields (e.g. String → key + size).
  *Configure access*: a separate **Settings → Permissions** panel — add a role (e.g. "Any"), then
  check CREATE/READ/UPDATE/DELETE checkboxes per role — permissions are a distinct tab from schema,
  not inlined into the field editor. *Inspect/monitor*: the Console 2.0 redesign (2024, still current
  IA in 2026) added a **sticky ID column** on the documents table (so the row identifier stays
  visible while scrolling through many attribute columns), quick-action menus on attributes/indexes
  for view-overhead/create-index/delete directly from the table row (no separate page), and clearer
  visual flags for disabled collections. *Indexes*: a sibling panel/tab to Attributes, "Create index"
  button, index type + attribute selection — the same "one settings surface, several tabs" pattern as
  Attributes/Permissions.
- **Auth → Auth section.** *Users*: a list/table of all project users (via the dedicated
  admin-perspective Users API the Console itself calls) with block/delete, session inspection,
  activity/audit logs, labels, and preferences editable per-user. *Security*: a **Security tab**
  under Auth exposing session-limit configuration (default 10, max 100) and **session alerts**
  toggle. *Providers*: OAuth2/SMS/phone providers are enabled/configured from their own panel.
  *Dev/testing aid*: **Mock Phone Numbers** under Auth → Security lets you create fake phone numbers
  for testing OTP flows without a real SMS provider — a "control the framework's own dev ergonomics
  from the dashboard" detail worth noting.
- **Storage → Storage section.** *Create*: "Create bucket" — the create form itself carries
  Settings sub-panels for **Maximum file size**, **File extensions** allow-list (up to 100),
  **Compression** (gzip/zstd, capped at 20MB), **Encryption** (also 20MB-capped), and permissions
  (buckets start with **zero granted permissions** — an explicit-grant default). *Inspect*: browse
  files inside a bucket, upload/download directly from the Console.
- **Functions → Functions section.** *Create*: a template gallery ("clone a quick-start template or
  a template with a pre-built integration") is the primary creation entry point, not a blank form.
  *Configure*: **Functions → \<fn\> → Settings → Configuration** exposes Git integration (repo +
  branch/path filters via glob patterns), build command, entry point, and root directory (for
  monorepos) — each its own sub-panel. *Triggers*: HTTP, SDK-method, server-event, webhook, and
  scheduled (cron) triggers are configured per-function. *Monitor*: a dedicated **Executions**
  view (history, status, duration, logs) separate from the **Deployments** view (build/version
  history) — the same "two related but distinct histories" split Topic A's telemetry work should
  note.
- **Messaging → Messaging section.** *Providers*: push (APNs/FCM), email (Mailgun/SendGrid/SMTP),
  SMS (Twilio/MSG91/Telesign/Textmagic/Vonage) each configured in their own provider panel.
  *Compose*: a **message-creation form** that branches by type — push gets title/body/icon/sound/
  color/tag/badge/priority fields; email gets subject + content (plain/HTML) + CC/BCC; SMS gets
  plain content — all from one composer, field set adapts to the selected channel. *Target*: topics,
  individual users, or target IDs — segment/audience selection is a first-class part of the compose
  form, not an afterthought. *Schedule*: ISO-datetime scheduling built into the same form.
  *Monitor*: a **Messages tab** lists every message with ID, description, type, and a status
  lifecycle (`draft → scheduled → processing → success/failed`) — the run-list pattern from file 03
  reappears here, but for **messages sent**, not jobs executed.
- **Realtime.** No dedicated management panel — Realtime is consumed via WebSocket subscription from
  client SDKs, not configured through the Console. Noted as a gap/non-pattern: not every capability
  needs (or gets) a management surface; some are pure runtime infrastructure the dashboard doesn't
  need to expose controls for.
- **Project / Settings / API keys.** Every project has an **Overview → Integration → API keys**
  panel: "Create API key," then a **scopes picker** grouped by service (Auth, Databases, Functions,
  Storage, Messaging, Sites, Other) — scope categories mirror the Console's own top-level navigation,
  i.e. the permission model's taxonomy **is** the capability taxonomy. A separate **Dev Keys**
  section (Overview → Dev Keys) generates short-lived, rotate-in-place keys for local development
  without touching the "real" API keys — a dashboard-native dev-ergonomics feature, not just prod key
  management.

### The IA through-line

Every capability gets: (1) a top-level nav entry named after the primitive (Databases, Auth,
Storage, Functions, Messaging — not "Data" or "Config"); (2) a create action that is the fastest
path to a working instance of that primitive (template galleries for Functions, one-click "Create
X" buttons elsewhere); (3) a **Settings sub-area with tabbed sub-panels** for the things that aren't
the primary object (permissions, security, build config) — configuration is deliberately not
crammed into the creation form; (4) where the primitive produces ongoing activity (executions,
messages, users' sessions), a **separate monitor view** with its own status vocabulary. Scopes in
the API-key picker replicate the nav taxonomy 1:1 — the permission model and the dashboard IA are
the same tree.

### Mapping onto NetScript

| Appwrite capability panel | NetScript analog |
| --- | --- |
| Databases (create db/collection → columns/attributes → indexes → permissions tabs) | `db` surface: Prisma-Next schema browser + a NetScript "collection" = Prisma model; permissions tab ≈ NetScript auth/ACL config surface |
| Auth (Users list + Security tab + Mock Phone Numbers dev aid) | NetScript auth-core/adapters plugin: a Users panel + a "dev auth" mock-provider panel for local iteration |
| Storage (bucket create form with size/extension/compression/encryption sub-panels) | Any future `plugin-storage`-shaped plugin; the "explicit-grant-by-default" permission stance is a NetScript-relevant default too |
| Functions (template gallery → Git/build config → Executions vs Deployments split) | `plugin-workers`/background-processor: a run/executions view distinct from a deployments/build view maps onto worker job-run history vs. scaffold/deploy history |
| Messaging (channel-adaptive compose form + topics/targets + status lifecycle) | Not a current NetScript primitive, but the "one composer, fields adapt to channel" pattern generalizes to any multi-provider NetScript panel (e.g. multi-adapter KV/queue config) |
| Project Overview → API keys (scopes grouped by service = nav taxonomy) | A NetScript dashboard "API keys/tokens" panel should group scopes by **plugin**, mirroring the plugin-contribution axes (service, background-processor, stream-topics, etc.) the same way Appwrite's scopes mirror its nav |
| Dev Keys (short-lived, rotate-in-place, local-dev-only) | A NetScript dashboard-native "dev token" feature distinct from production secrets — directly usable in the Aspire-local dev loop |

**Distillation for NetScript:** Appwrite proves the differentiator is **per-capability first-class
panels with a consistent create → configure(tabs) → monitor loop**, not a single generic
"resources" screen. For NetScript, this means each plugin category (workers, sagas, triggers,
streams, auth, db, kv) should earn its own top-level dashboard section following the same loop,
rather than the dashboard rendering one undifferentiated "plugins" list. This is the strongest
evidence yet for **D-NSONE's L3-blocks gap** (file `03-fresh-ui-vs-nsone-gap-inventory.md`) needing
per-capability composed blocks (a "collection/attributes/indexes" block shape, a "provider config"
block shape, a "compose message" block shape) rather than only generic Card/DataTable primitives.

---

## 2. Directus — extensibility model + schema-driven UI generation

**Refs:** [Extensions overview](https://directus.com/docs/guides/extensions/overview) ·
[Interfaces](https://directus.com/docs/guides/extensions/app-extensions/interfaces) ·
[Displays](https://directus.com/docs/guides/extensions/app-extensions/displays) ·
[Layouts](https://directus.com/docs/guides/extensions/app-extensions/layouts) ·
[Dashboard Panels](https://directus.com/docs/guides/extensions/app-extensions/panels) ·
[Modules](https://directus.io/docs/guides/extensions/app-extensions/modules) ·
[Marketplace](https://directus.io/docs/guides/extensions/marketplace) ·
[Publishing Extensions](https://directus.io/docs/guides/extensions/marketplace/publishing) ·
[Configure a Data Model](https://directus.com/docs/getting-started/data-model) ·
[Collections](https://directus.com/docs/guides/data-model/collections) ·
[GitHub repo](https://github.com/directus/directus)

Directus is the reference for two patterns Appwrite doesn't emphasize: (a) a **plugin/extension-
contributes-a-panel** model with a defined taxonomy of extension "shapes," and (b) a **schema drives
the UI, not the other way around** model — the admin UI is generated from the data model, live.

### (a) The extensibility model — extension types, SDK, marketplace

Directus names **eight extension types**, split App (Data Studio) vs. API (backend):

- **Interfaces** — form inputs on the item/edit page; the primary way a user enters/edits a value
  for a field. Bound to a field via the Data Model UI (see below), not hardcoded per-collection.
- **Displays** — small, read-only renderers for a single value, reused wherever that value appears
  across the Data Studio (list columns, related-item previews, etc.) — a display and an interface
  are deliberately separate concerns (edit-shape vs. show-shape).
- **Layouts** — alternate ways to render a *list* of items on a collection's page (built-in: table;
  extension ecosystem adds cards/calendar/map/kanban-style layouts). Contract: a layout extension
  exports `id`/`name`/`icon`/`component`/optional `slots.options|sidebar|actions`/`setup()`; the
  component receives collection name, selection state, layout options+query, filters, search, and a
  select/readonly mode flag; it emits `update:selection`/`update:layoutOptions`/`update:layoutQuery`
  back to the shell. Users switch layouts from the collection's "Explore" page via a layout picker,
  with per-layout options exposed through the `options` slot.
- **Panels** — customizable components inside **Insights** (Directus's built-in analytics/dashboard
  module) — i.e. Directus's own dashboard-building surface is itself extension-driven; a "panel" is
  the same unit of composition a third party or the platform ships.
- **Modules** — top-level areas of the Data Studio, navigated to from the left-hand module bar
  (Content, Files, Users, Insights, Settings are the built-in modules; extensions can add new ones).
  A module extension exports display metadata + internal routes + the Vue component tree, and can
  use the globally-registered `private-view` component to inherit Directus's own page chrome (nav,
  header slots) rather than building a page shell from scratch.
- **Themes** — restyle the Data Studio (colors, fonts, visual tokens) without touching structure.
- **API-side**: **Hooks** (run code on schedule/DB-event/app-lifecycle), **Endpoints** (register new
  API routes), **Operations** (a single step inside Directus's no-code Flow automation tool).

Build tooling: a **`create-directus-extension` CLI** plus the `@directus/extensions-sdk` package
(exposes composables like `useApi()`/`useStores()`, and globally-registers Directus's own UI
component library so an extension's components look native without importing a design system).
Extensions run **in the same environment as the main application** — not sandboxed by default for
App extensions, though the Marketplace's API-extension install path is explicitly sandboxed.
Distribution: the **Directus Marketplace**, reachable from project Settings inside the Data Studio
itself (search/filter/sort → extension detail page → install, no leaving the app), backed by a
registry that currently mirrors npm-published extensions.

### (b) Schema/data-model-driven UI generation

Configuring a data model happens in **Settings → Data Model** inside the Data Studio: create a
collection (starts from a primary key), then **"Create Field"** and pick an *interface* (Input for
text, WYSIWYG for rich content, etc.) — the field's interface choice is a first-class, per-field
decision made at schema-definition time, not inferred. Relationships (e.g. Many-to-One from
`posts` → `authors`) are created the same way — as a field with a relational interface — and carry a
**Display Template** so the related item renders meaningfully wherever it's shown, rather than by
raw foreign key. Once schema + interface/display choices are saved, the Data Studio **updates
automatically and without further UI code**: the module sidebar reflects the new/changed
collections, the Content module gets full CRUD screens for it, and item-detail pages render the
configured fields and relationship pickers matching the schema. When Directus connects to an
*existing* database, supported column types are auto-detected and made available immediately, then
progressively "dressed" with interfaces/displays/icons as the team configures them from the Data
Studio rather than by writing admin-UI code.

### Mapping onto NetScript

- **Extension-contributes-a-panel** maps directly onto NetScript's plugin-contribution axis model
  (`definePlugin().withService()/.withBackgroundProcessor()/.withStreamTopics()` etc., per
  `04-plugin-archetype-grounding.md`) — Directus's Panel/Module/Layout extension types are a concrete
  precedent for what a NetScript **dashboard-panel contribution axis** could look like:
  `.withDashboardPanel({ id, title, icon, component, slots })` as a first-class `definePlugin` axis,
  the same way `.withService`/`.withStreamTopics` already are. This directly sharpens the **D-NSONE
  extensibility call**: rather than (or in addition to) promoting NS One's L3 blocks wholesale, the
  dashboard plugin's own core package (`plugin-dashboard-core`) could expose a **panel registry
  contract** any first-party or third-party plugin implements to contribute a section to the
  dashboard — turning the dashboard into an L3-block *registry consumer*, not just an L3-block
  *author*.
- **Schema-drives-UI** maps onto NetScript's Prisma-Next DB layer: the dashboard's future "db" tab
  (deferred per file 03's Prisma Studio note) could generate its browse/edit UI directly from the
  Prisma schema the same way Directus generates Content-module screens from its data model — model →
  auto CRUD screen, field type → auto-selected default interface, with an explicit override seam
  (NetScript's Standard-Schema/`defineStreamTopic`-style typed contracts are already schema-first,
  which is the same substrate Directus's field/interface binding needs).
- **Marketplace-inside-the-app** (install without leaving the Data Studio) is a UX bar for
  NetScript's own `plugin add` story: today `plugin add` is a CLI/JSR flow (per
  `04-plugin-archetype-grounding.md` §4); Directus shows what an **in-dashboard plugin marketplace**
  (search/filter installed-vs-available plugins, install a dashboard panel-contributing plugin from
  inside the running dashboard) would look like as a stretch goal once the CLI-side installer is
  solid.

---

## 3. Strapi — codegen-from-UI mirroring the CLI + in-dashboard AI (narrow scope)

**Refs:** [Content-type Builder](https://docs.strapi.io/cms/features/content-type-builder) ·
[CLI](https://docs.strapi.io/cms/cli) ·
[Introducing Strapi AI](https://strapi.io/blog/introducing-strapi-ai) ·
[Strapi AI for content managers](https://docs.strapi.io/cms/ai/for-content-managers) ·
[Strapi AI GA announcement](https://strapi.io/blog/strapi-ai-is-now-generally-available) ·
[Strapi AI product page](https://strapi.io/ai) ·
[GitHub repo](https://github.com/strapi/strapi)

Per the brief, only two Strapi facts matter here — generic CMS UI is out of scope.

### (a) Dashboard-driven codegen mirrors CLI-driven codegen

Strapi's **Content-Type Builder** is an admin-dashboard UI (Collection Types / Single Types /
Components tabs) for defining content models with a large field-type set (short/long text, rich
text as Blocks or Markdown, numbers, date/time, password, media, six relation kinds, boolean, JSON,
email, enumeration, UID/slug, single/repeatable components, Dynamic Zones, marketplace custom
fields). The critical fact: **saving a content type in this UI generates the identical on-disk
artifacts the CLI's own generator produces** — each content type gets its own folder under
`src/api/<name>/` containing `content-types/<name>/schema.json`, plus a matching
`controllers/<name>`, `routes/<name>`, and `services/<name>` file, wired through Strapi's
Routes → Middlewares → Controllers → Services request pipeline. The CLI equivalent,
`strapi generate`, is an **interactive menu** (API generator / content-type generator / controller /
service / policy / middleware / migration generators) that prompts for the same inputs the dashboard
form collects (display name, singular/plural kebab-case names, destination — new API, existing API,
plugin, or project root) and writes to the **same paths** — content-type-only generates just
`schema.json`; "with API bootstrap" additionally emits schema + controller + service + route,
mirroring exactly what saving in the dashboard produces. TypeScript projects get generated type
declarations via a `ts:generate-types` command regardless of which path (UI or CLI) created the
content type. In other words: **the dashboard is not a separate authoring surface with its own
output format — it is a second frontend for the same on-disk codegen the CLI drives**, and either
path leaves a project in an identical, CLI-reproducible state.

### (b) In-dashboard AI combined with that codegen for fast iteration

**Strapi AI** (GA, requires v5.30+ and a Growth plan/trial; credit-metered, 1,000 credits/month on
Growth) surfaces inside the Content-Type Builder as a **chat assistant** that both explains existing
schemas (using the project's current content types as context) and edits/creates them conversationally
— e.g. "add blog functionality," then iterate by chatting further rather than restarting the manual
field-by-field flow. Two additional input modes feed the same codegen path: **Design Import** (paste
a Figma link or upload a design screenshot; Strapi AI infers a content structure — hero sections,
feature blocks, testimonials, CTAs — from the visual layout) and **Code Analysis** (point it at an
existing Next.js/Nuxt/Astro app; it reverse-engineers a schema matching that app's data needs).
All three modes terminate in the **same Collection Types / Single Types / Components / Dynamic
Zones artifacts** the manual Content-Type Builder produces — meaning AI-driven schema authoring
still lands as the same generated `schema.json` + controller/route/service files a human or the CLI
would produce, just reached in "minutes instead of manual field-by-field configuration." Strapi AI
also appears in two adjacent admin surfaces (Media Library auto-captioning, Content Manager
auto-translation on save) but those are outside this teardown's narrow scope.

### Mapping onto NetScript

- **Codegen-from-UI mirroring the CLI** is a direct, almost literal precedent for NetScript's **#157
  typesafe-codegen mandate** (`plugin add` emits only typesafe userland glue via factory/AST, never
  string templates) — Strapi proves the inverse direction is viable and valuable too: a **dashboard
  action that drives the same scaffolder the CLI drives**, landing identical generated files
  (contract re-exports, resource scaffolders per `04-plugin-archetype-grounding.md` §1a's
  `src/adapter/resources/mod.ts` pattern) whether triggered from `netscript plugin add` or from a
  future dashboard "Add resource" button. This is a concrete, scoped feature candidate for the
  dev-dashboard's panel IA: a **"scaffold from the dashboard" action** per plugin/resource type,
  backed by the exact same adapter/resource-scaffolder code the CLI installer already calls (per
  `04-plugin-archetype-grounding.md` §4's `createPluginAdapter(...).toScaffold()` mechanism) — no new
  codegen engine, just a second caller of the existing one.
- **In-dashboard AI on codegen** is a direct precedent for the **flagship AI plugin**
  (`@netscript/plugin-ai`, epic #238) converging with the dashboard: a dashboard panel that lets a
  developer describe a desired resource/contract/panel in natural language (or point at existing
  code) and have the AI plugin drive the same typesafe scaffolder, producing the identical
  CLI-reproducible artifacts — Strapi's three input modes (chat / design-import / code-analysis) are
  a reusable taxonomy for what such a NetScript dashboard-AI panel could offer: chat-driven contract
  authoring, screenshot/Figma-driven UI-block scaffolding (relevant to fresh-ui/NS One L3 blocks),
  and existing-code-driven reverse-schema inference (e.g. point the AI at an existing Prisma schema
  or oRPC contract to scaffold the matching plugin resource).

---

## Cross-tool synthesis — the manage-through-UI vocabulary

Patterns this BaaS/admin-console corpus adds that file 03's dev/run-console corpus did not surface:

1. **Per-capability management surface (create → configure(tabs) → monitor loop).** Appwrite's
   Databases/Auth/Storage/Functions/Messaging sections each have their own nav entry, their own
   creation entry point (form or template gallery), a **separate tabbed settings area** distinct from
   the creation form (permissions/security/build-config as their own panels, not inlined), and — where
   the capability produces ongoing activity — a dedicated monitor view with its own status vocabulary
   (Executions vs. Deployments; message `draft→scheduled→processing→success/failed`). File 03 only
   had this pattern for *runs* (Temporal/Inngest/Trigger.dev); Appwrite generalizes it to *every*
   backend primitive, which is exactly Topic A's "dashboard is how you drive the framework" thesis.
2. **Plugin/extension-contributes-a-panel extensibility model.** Directus names a closed taxonomy of
   extension "shapes" (Interface, Display, Layout, Panel, Module, Theme, plus API-side Hook/Endpoint/
   Operation) with a documented SDK contract per shape, and even builds its own dashboard-building
   module (Insights) on the same Panel extension primitive it exposes to third parties. Nothing in
   file 03 addressed *who else can add a panel and how* — this directly answers the D-NSONE
   extensibility question with a concrete precedent: a typed `.withDashboardPanel(...)` contribution
   axis, contract-shaped like Directus's Layout/Panel exports (id/name/icon/component/slots/setup).
3. **Schema/scaffold-driven UI generation.** Directus's Data Model → automatic Content-module CRUD
   screens (collection → fields+interfaces → full item-detail page, with zero hand-written admin-UI
   code) is a pattern absent from file 03 entirely (Prisma Studio browses data but doesn't generate
   *configurable* UI from schema in the same declarative sense). This is the strongest available
   precedent for a NetScript dashboard "db" tab that renders directly off the Prisma-Next schema.
4. **Codegen-from-UI mirroring the CLI.** Strapi's Content-Type Builder writes the *same* files
   (`schema.json` + controller/route/service under `src/api/<name>/`) that its own `strapi generate`
   CLI command writes — dashboard and CLI are two callers of one generator, not two separate
   authoring systems. File 03 had no codegen-parity pattern at all (its tools are runtime/observability
   consoles, not scaffolding tools). This is a direct, almost off-the-shelf precedent for extending
   NetScript's #157 typesafe-codegen mandate to a dashboard-triggered scaffold action.
5. **In-dashboard AI-on-codegen for fast iteration.** Strapi AI's chat/design-import/code-analysis
   triad, landing in the same generated artifacts as manual/CLI authoring, is a precedent absent from
   file 03 (whose tools have no AI-authoring surface at all) and directly informs how NetScript's
   flagship AI plugin could converge with the dashboard's scaffold-from-UI action rather than being a
   separate chat product bolted alongside it.

Secondary, smaller conventions worth carrying into the panel IA even though they're not full patterns
on their own: **scopes/permissions taxonomy mirrors nav taxonomy** (Appwrite API keys); **short-lived,
rotate-in-place dev-only keys as a dashboard-native feature** (Appwrite Dev Keys); **in-app
marketplace for extensions** (Directus, reachable from Settings without leaving the Data Studio) as a
longer-term evolution of NetScript's CLI-only `plugin add` flow; **edit-shape vs. show-shape as
separate extension concerns** (Directus Interface vs. Display) — relevant to fresh-ui/NS One's own
component taxonomy (form-field components vs. read-only display/badge components) which currently
has no such named split.
