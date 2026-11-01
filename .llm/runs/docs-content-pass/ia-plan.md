# NetScript docs site: IA audit and change plan

- Baseline: `origin/main` at `9a31e879c` (2026-10-28), plus the live site at https://rickylabs.github.io/netscript/.
- Scope: `docs/site/**`, plus the docs tooling that reads page paths.
- Pre-validated: the F1 code (lanes, sidebar, breadcrumb, pager) and the C1–C7 merge mechanics were applied to a scratch copy of `origin/main` and built with Lume 2.5.4. The build succeeded, generating 803 files. The rendered breadcrumbs match table B, all 8 `oldUrl` redirect pages are emitted, the Reference sidebar is alphabetical, Comparisons renders as a branch, and the generated Build and recipe lists render correctly. The repository itself was not touched.
- When to apply: after the seven content editors finish. Rebase first, then re-run the inventory greps in F0. Line numbers below are from the baseline and will shift. Every edit is written as a pattern so it can be re-located.
- `_plan/**` is excluded from the build. Lume ignores `_`-prefixed folders, and every `_plan/*` URL on the live site returns 404. The plan docs are internal context only.

## The main structural problems

1. **Three names for one thing in Concepts.**
   - The lane is called **Concepts**.
   - Its landing page (`/explanation/`) is titled **Explanation**.
   - A third page, **Core concepts** (`/concepts/`), sits in a different lane (Start).
   - Result: breadcrumbs read "Home / Concepts / Explanation", and readers meet two overview pages that both point at the same essays.
2. **Build has no landing page.**
   - The top-bar link "Build" points at `/web-layer/`, the first pillar.
   - The "Build" crumb is plain text and links nowhere.
   - `/capabilities/`, which pages still link to 17 times, redirects to the home page.
   - The 155-line "All recipes" catalog (`/how-to/`) is a hidden second index of the same recipes, and it has already drifted: it is missing 3 recipes.
3. **Lane, sidebar and breadcrumb disagree.**
   - `/cli-reference/` is listed in the Start sidebar but highlights and breadcrumbs as Reference, so it appears in no sidebar of the lane you land in.
   - `/how-to/` and `/glossary/` sit in Start although they are lookup material.
   - `llms.txt` files `/ai/*` and `/comparisons/*` under "Getting started".
4. **Duplicated levels and duplicated navigation.**
   - The lane crumb and its landing page both show ("Learn / Tutorials", "Concepts / Explanation").
   - The page eyebrow repeats the breadcrumb ("Build · Web Layer" directly under "Home / Build / Web Layer / …").
   - 37 reference pages end with "Back to the reference overview".
   - Three pager mechanisms coexist: front matter, 80 inline `comp.nextPrev` calls, and auto-derivation. The hand-written pagers still encode the retired capability tour, for example Fresh UI → Authentication, and services → "Capabilities" → the home page.
5. **Overlapping pages.** Each pair below covers the same ground:
   - Aspire quickstart and Quickstart;
   - Core concepts and the Explanation index;
   - "How NetScript's path compares" and the Comparisons group;
   - the "Auth reference" hub (a package that does not exist) and the five `auth-*`/`plugin-auth*` pages;
   - "Examples and sandbox" (the sandbox does not exist) and the Web-layer guides.
6. **Noise and outdated material.**
   - One unstyled page with no layout: `/reference/telemetry/convention/`.
   - Maintainer and process text: grading checklists, "release-readiness gate", issue numbers, "doctrine axiom A12".
   - About 50 claims that the hand-written reference is "generated".
   - "This hub is intentionally thin" on 500-line guides.
   - Migration notes for the previous release (0.0.7).
   - 9 recipe-index pages that are stubs.
   - A Claude-Code editor-setup recipe filed under Orchestration.
7. **Inconsistent naming.**
   - Pillars mix "Title Case", "and" and "&".
   - Sidebar order contradicts each hub's own order (Durable workflows, Web layer, Tutorials). Three pages sort above their pillar's guides because they have no `order` front matter.
   - Two tutorial chapters share the title "Scaffold the workspace", and the guide and essay are both titled "Observability".
   - Closing sections use 9 different headings, and opening sections use 2.

---

## A. Target navigation tree

Six lanes, with the order unchanged. Every page has exactly one place in the tree.
- **Lane landing**: the top-bar target, the lane crumb's link, and the first sidebar entry, labelled **Overview**.
- `→ redirect` marks a URL that stops being a page.

### Start (`/quickstart/`, flat): Get running in minutes
| URL | Title |
| --- | --- |
| `/why/` | Why NetScript |
| `/quickstart/` | Quickstart (absorbs `/quickstart/aspire/`) |

Removed from Start:
- Aspire quickstart → merged into Quickstart.
- Core concepts → becomes the Concepts landing.
- CLI reference and Glossary → move to Reference.
- All recipes → becomes the Build landing.

### Learn (`/tutorials/`): Build one thing end to end
| URL | Title |
| --- | --- |
| `/tutorials/` | Tutorials (sidebar: Overview) |
| `/tutorials/storefront/` + `01-scaffold` … `07-deploy` | Storefront (order 1) |
| `/tutorials/workspace/` + `01` … `06` | Team Workspace (order 2) |
| `/tutorials/erp-sync/` + `01` … `05` | ERP Sync (order 3) |
| `/tutorials/live-dashboard/` + `01` … `06` | Live Dashboard (order 4) |
| `/tutorials/chat/` + `01` … `06` | AI Chat (order 5) |

The track order now matches the landing page, the home page and the xref `tut:first-workspace`, all of which lead with Storefront. The sidebar used to lead with Live Dashboard.

### Build (`/how-to/`): Add a capability to your app
| URL | Title (sidebar label) |
| --- | --- |
| `/how-to/` | Build (Overview): nine areas with their recipe lists, generated |
| **`/web-layer/`** | Web layer (Overview) |
| `/web-layer/server/` | Fresh page model (1) |
| `/web-layer/builders/` | Pages and the define-page builder (2) |
| `/web-layer/resources/` | Request-scoped resources (3) |
| `/web-layer/layers/` | Layers, layout, and slots (4) |
| `/web-layer/response/` | Response shaping (5) |
| `/web-layer/route/` | Routing and route contracts (6) |
| `/web-layer/generated-surface/` | Generated web surface (7) |
| `/web-layer/partials/` | Partials (8) |
| `/web-layer/query/` | Data loading and the query cache (9) |
| `/web-layer/query-bridge/` | Query bridge (10) |
| `/web-layer/form/` | Server-validated forms (11) |
| `/web-layer/defer-streaming-ui/` | Deferred and streaming UI (12) |
| `/web-layer/interactive/` | Interactive islands (13) |
| `/web-layer/vite/` | Build and Vite integration (14) |
| `/web-layer/testing/` | Testing Fresh pages (15) |
| `/web-layer/error/` | Error handling and diagnostics (16) |
| `/web-layer/fresh-ui/` | Fresh UI & design (17) |
| `/web-layer/how-to/` | Web layer recipes (Recipes, 100) |
| `/web-layer/how-to/customize-fresh-ui/` | Customize Fresh UI |
| `/web-layer/how-to/build-a-desktop-frontend/` | Build a desktop frontend |
| `/web-layer/how-to/build-a-server-validated-form/` | Build a server-validated form |
| ~~`/web-layer/examples/`~~ | → redirect `/web-layer/` |
| **`/services-sdk/`** | Services & SDK |
| `/services-sdk/services/` | Services & contracts (1) |
| `/services-sdk/sdk/` | Typed SDK & client (2) |
| `/services-sdk/service-layout/` | Service layout (3; it used to sort first) |
| `/services-sdk/how-to/` + `add-a-service` (101), `discover-services` (102), `expose-openapi-scalar` (103), `protect-an-anonymous-route` (104), `call-internal-procedures` (105) | Services & SDK recipes |
| **`/background-processing/`** | Background processing |
| `/background-processing/workers/` | Background jobs (1) |
| `/background-processing/polyglot-tasks/` | Polyglot tasks (2) |
| `/background-processing/how-to/` + `tune-worker-runtime`, `run-a-polyglot-task`, `add-a-task-runtime-adapter`, `restrict-worker-task-permissions` | Background processing recipes |
| **`/durable-workflows/`** | Durable workflows |
| `/durable-workflows/sagas/` | Durable sagas (1) |
| `/durable-workflows/triggers/` | Event triggers (2; renamed per locked decision Q14) |
| `/durable-workflows/streams/` | Durable streams (3) |
| `/durable-workflows/expo-streams/` | Consume durable streams in Expo (4; it used to sort first) |
| `/durable-workflows/how-to/` + `build-a-validated-ingestion-queue`, `publish-a-durable-stream`, `bound-stream-retention` | Durable workflows recipes |
| **`/ai/`** | AI |
| `/ai/mcp/` | MCP client (1) |
| `/ai/durable-chat/` | Durable chat (2) |
| `/ai/chat-ui/` | Chat UI (3) |
| `/ai/engine/` | AI engine (4) |
| `/ai/agent-tooling/` | Agent tooling (5) |
| `/ai/how-to/` + `build-a-durable-chat` | AI recipes |
| **`/data-persistence/`** | Data & persistence |
| `/data-persistence/database/` | Database & Prisma (1) |
| `/data-persistence/kv-queues-cron/` | KV, queues & cron (2) |
| `/data-persistence/how-to/` + `database-migration` (Migrate the database), `use-a-second-database`, `queue-kv-cron` (Use KV, queues, and cron), `choose-a-queue-provider` | Data & persistence recipes |
| **`/identity-access/`** | Identity & access |
| `/identity-access/auth/` | Authentication (1) |
| `/identity-access/better-auth-plugins/` | better-auth plugins (2) |
| `/identity-access/session-lifecycles/` | Session lifecycles (3) |
| `/identity-access/how-to/` + `add-authentication` | Identity & access recipes |
| **`/orchestration-runtime/`** | Orchestration & runtime |
| `/orchestration-runtime/cli-scaffold/` | CLI & scaffold (1) |
| `/orchestration-runtime/runtime-config/` | Runtime configuration (2) |
| `/orchestration-runtime/child-health/` | Background child health (3; it used to sort first) |
| `/orchestration-runtime/how-to/` + `add-a-plugin` (101), `author-a-plugin` (102), `deploy-local-aspire` (103), `detached-start-agents-ci` (104), `deploy` (105, Deploy a workspace), `deploy-deno-deploy` (106), `roll-out-runtime-overrides` (107), `graceful-shutdown` (108), `outbound-webhooks` (109) | Orchestration & runtime recipes |
| ~~`/orchestration-runtime/how-to/deno-lsp-code-intelligence/`~~ | → redirect `/ai/agent-tooling/` |
| **`/observability/`** | Observability |
| `/observability/telemetry/` | Telemetry & logging (1) |
| `/observability/how-to/` + `add-opentelemetry` | Observability recipes |

AI, Identity & access and Observability each have a single-recipe "Recipes" group. These are kept on purpose: every area has the same shape (Overview, guides, Recipes), and flattening them would mean URL moves for no reader gain. Each recipe index now generates a real list (see D), so the group is no longer a stub.

### Reference (`/reference/`): Every published symbol
The sidebar is sorted alphabetically by package name (`sort: 'order title'`). Before this change it was sorted by URL, which scattered `plugin-sagas`, `plugin-streams`, `plugin-triggers` and `plugin-workers`, whose URLs drop the `plugin-` prefix.
| URL | Title |
| --- | --- |
| `/reference/` | Reference (Overview) |
| `/cli-reference/` | CLI cheat sheet (curated item, URL unchanged) |
| `/glossary/` | Glossary (curated item, URL unchanged) |
| `/reference/ai/` (+ `/reference/ai/skills/`) | `@netscript/ai` (+ `@netscript/ai/skills`) |
| `/reference/aspire/` | `@netscript/aspire` |
| `/reference/auth-better-auth/`, `/reference/auth-kv-oauth/`, `/reference/auth-workos/` | `@netscript/auth-*` |
| `/reference/cli/` (+ `/reference/cli/commands/`) | `@netscript/cli` (+ CLI command reference) |
| `/reference/config/` … `/reference/watchers/`, `/reference/sagas/`, `/reference/streams/`, `/reference/triggers/`, `/reference/workers/` | one page per package; all 35 directories |
| `/reference/telemetry/` (+ `/reference/telemetry/convention/`) | `@netscript/telemetry` (+ Telemetry conventions) |
| `/reference/plugin-auth/` | `@netscript/plugin-auth` (absorbs the auth hub) |
| ~~`/reference/auth/`~~ | → redirect `/reference/plugin-auth/` |

### Concepts (`/explanation/`): How and why it works
| URL | Title |
| --- | --- |
| `/explanation/` | Concepts (Overview): the five-layer model from `/concepts/`, then the essay map |
| `/explanation/architecture/` | Architecture (1) |
| `/explanation/contracts/` | Contracts & type flow (2) |
| `/explanation/plugin-system/` | Plugin system (3) |
| `/explanation/auth-model/` | Auth model (4) |
| `/explanation/durability-model/` | Durability model (5) |
| `/explanation/observability/` | Observability model (6) |
| `/explanation/aspire/` | Orchestration with Aspire (7) |
| **`/comparisons/`** (collapsible branch) | How NetScript compares (sidebar: Comparisons; absorbs `/explanation/compared/`) |
| `/comparisons/frontend/` | NetScript vs frontend frameworks |
| `/comparisons/backend/` | NetScript vs backend frameworks |
| ~~`/concepts/`~~, ~~`/explanation/compared/`~~ | → redirect `/explanation/`, `/comparisons/` |

### Design system (`/design-system/`): generated by `_plugins/design-system*.ts`, owned by the design-system stream
The structure is unchanged: Overview, the Themes branch (11), Design guidelines, Token contract, Create your own theme, and Docs kit (Callout gallery, Code gallery). Only the root label changes to **Overview** (see B). The other findings are in E17.

### Not in any lane
- `/` is the home page.
- Redirects are listed in C, and after F9 every redirect is declared through `oldUrl`.

---

## B. Breadcrumb fixes

### The rule
1. Every page belongs to exactly one lane, through `getDocsLane(url)`. The following all use that one answer:
   - the lane crumb,
   - the highlighted top-bar lane,
   - the sidebar the page appears in,
   - the Pagefind `lane:` filter,
   - the `llms.txt` section.
2. The trail is **Home / Lane / sections below the lane landing / Page**.
   - The lane crumb links to the lane landing (it is plain text today).
   - The lane landing never appears as a separate crumb.
   - On a menu-lane landing, the trail is just **Home / Lane**.
3. Labels come from `nav_title || title`. A slug is used only for a folder that has no page, such as `Themes`. Raw package slugs and Diátaxis names never appear.
4. The breadcrumb is the only location indicator. The layout eyebrow ("Build · Web Layer"), which repeats it, is removed.
   - If design wants to keep a mono label above the H1, make it the page **type** (Guide, Recipe, Tutorial, Package, Essay). That is information the breadcrumb does not carry.

### Before and after (the "before" column was checked on the live site)
| Page | Before | After |
| --- | --- | --- |
| `/explanation/` | Home / Concepts / Explanation | Home / Concepts |
| `/explanation/aspire/` | Home / Concepts / Explanation / Orchestration with Aspire | Home / **Concepts** / Orchestration with Aspire |
| `/comparisons/backend/` | Home / Concepts / Comparisons / NetScript vs Nest.js, Hono, and Encore.dev | Home / **Concepts** / Comparisons / NetScript vs backend frameworks |
| `/tutorials/chat/01-scaffold/` | Home / Learn / Tutorials / AI Chat / Scaffold the chat workspace | Home / **Learn** / AI Chat / Scaffold the chat app |
| `/web-layer/query/` | Home / Build (no link) / Web Layer / … | Home / **Build** / Web layer / Data loading and the query cache |
| `/services-sdk/how-to/add-a-service/` | Home / Build / Services and SDK / Recipes / Add a service | Home / **Build** / Services & SDK / Recipes / Add a service |
| `/how-to/` | Home / Start / All recipes | Home / Build |
| `/cli-reference/` | Home / Reference / CLI reference (but listed in the Start sidebar) | Home / **Reference** / CLI cheat sheet (listed in the Reference sidebar) |
| `/glossary/` | Home / Start / Glossary | Home / **Reference** / Glossary |
| `/reference/cli/commands/` | Home / Reference / @netscript/cli / netscript command reference | Home / **Reference** / @netscript/cli / CLI command reference |
| `/reference/telemetry/convention/` | no layout: unstyled HTML, no breadcrumb, sidebar label "Convention" | Home / **Reference** / @netscript/telemetry / Telemetry conventions |
| `/quickstart/` | Home / Start / Quickstart | unchanged ("Start" is plain text because Quickstart is the Start target) |
| `/design-system/themes/studio/` | Home / Design system / Themes / Studio | unchanged (asserted by `tools/fresh-ui-browser/docs-tests/docs.spec.ts`) |

### Edits (exact code in F1)

**B1. `docs/site/_data.ts`**
- Lanes:
  - Start: items are Why and Quickstart only.
  - Build: `href: '/how-to/'`, with `/how-to/` as the first root.
  - Reference: gains curated `items` (CLI cheat sheet, Glossary) and `sort: 'order title'`.
- `expandRoot` now applies only to the **first** root. This lets Comparisons render as a branch.
- Add `NavLane.sort` and `pagerRoots`.
- Delete the `/cli-reference/` special case in `getDocsLane`: the curated `items` now cover it.

**B2. `docs/site/_components/breadcrumb.vto`**
- Rewrite it to follow the rule above.
- Drop `hasLaneCrumb` and the slug fallback for pages.

**B3. `docs/site/_includes/layouts/base.vto`**
- Pass `navTitle: nav_title` to the breadcrumb.
- Delete the `docs-page-eyebrow` paragraph.
- Change the sidebar block for first-root expansion, `lane.items` and `lane.sort`.
- Point the footer link `/concepts/` at `/explanation/`.

**B4. `docs/site/styles/docs.css`**
- Delete both `.docs-page-eyebrow` rules: the base rule at about line 363, and the one in the mobile media query at about line 830.

**B5. Front matter, for the "Overview" labels**
- Add `nav_title: Overview` on `tutorials/index.md`, `reference/index.md`, `explanation/index.vto` and `how-to/index.md`.
- Add `nav_title: Recipes` on the 9 `*/how-to/index.md`.
- In the design-system generator, add `nav_title: 'Overview'` to the `DESIGN_ROOT` page.

**B6. `tools/docs-site/navigation_test.ts`**
- Add assertions: `/how-to/` → build, `/glossary/` → reference, `/comparisons/backend/` → concepts, `/quickstart/` → start.
- The existing `/cli-reference/` → reference assertion stays valid.

---

## C. Merges and deletions

| # | Pages | Decision | Survivor URL | Redirect | Reason and evidence |
| --- | --- | --- | --- | --- | --- |
| C1 | `/quickstart/aspire/` + `/quickstart/` | **Merge** | `/quickstart/` | `oldUrl: /quickstart/aspire/` on `quickstart.vto` | The Aspire quickstart is a strict subset of Quickstart step 3, which already contains `aspire restore` / `aspire start`, the dashboard and the DB-after-Aspire rule. Its only unique parts are the `--no-aspire` opt-out (the locked Q7 "dedicated chapter" for that is `/explanation/aspire/#the---no-aspire-escape-hatch`) and the "TypeScript AppHost, not .NET" line. Both fold into one note in Quickstart step 3. No tooling reads `quickstart/aspire.md`. |
| C2 | `/concepts/` (Core concepts) + `/explanation/` (Explanation index) | **Merge** | `/explanation/`, titled **Concepts** | `oldUrl: /concepts/` | Three names collide: "Concepts" lane, "Explanation" page, "Core concepts" page. The five-layer model already links each essay, so it is the right introduction for the lane. The Explanation index duplicates it with an essay grid and a reading order that **contradicts** the sidebar order (Aspire before Auth model, versus order 4/7). It also says "Eight topics … seven separate articles" and links `/capabilities/`, which redirects to home. URL `/explanation/` is kept because `nav.menu('/explanation/')` needs a real page at its root. |
| C3 | `/explanation/compared/` + `/comparisons/` (an 18-line card stub) | **Merge** | `/comparisons/`, titled "How NetScript compares", sidebar label Comparisons | `oldUrl: /explanation/compared/` | There were two comparison entries side by side in the Concepts sidebar. The essay becomes the group landing, and the two code comparisons become its children. Q4 tension: locked decision Q4 asks for "ONE honest table … no per-competitor head-to-heads", but the owner-commissioned comparison programme (#1652, #1660) postdates it. The table on `/why/` stays. **The owner should confirm that Q4 is superseded.** |
| C4 | `/reference/auth/` ("Auth reference") | **Merge** into the plugin page | `/reference/plugin-auth/` | `oldUrl: /reference/auth/` | There is no `@netscript/auth` package (see `packages/` and `plugins/`), so the page breaks the reference rule of one package, one page. The page also links to the `/capabilities/auth/` redirect, and it is the only `EXCLUDED_REFERENCE_PAGES` entry in `check-exports-drift.ts`. Its unique content moves to plugin-auth: the package map, the adapter-boundary table, and the `oauth_cookie_missing` callback contract. |
| C5 | `/how-to/` "All recipes" + 9 pillar recipe folders | **Repurpose** (no URL change) | `/how-to/` becomes the **Build** landing | `/capabilities/` retargets from `/` to `/how-to/` | The hand catalog is a second index of the sidebar and has drifted: it misses `protect-an-anonymous-route`, `call-internal-procedures` and `bound-stream-retention`. The new page is generated from the Build roots (area, description, recipe list) and keeps the "Preferred NetScript paths" table. The 30 inbound links stay valid, and the 17 `/capabilities/` links now land somewhere meaningful. |
| C6 | `/web-layer/examples/` "Examples and sandbox" | **Delete** | `/web-layer/` | `oldUrl: /web-layer/examples/` on `web-layer/index.md` | The sandbox does not exist: the page itself says hosted sandboxes are "out of scope", and the caveat `arch-debt:fresh-hosted-example-sandboxes` records them as missing. The rest duplicates other pages: a pointer to the Live Dashboard tutorial; a `QueryIsland` example already covered in `/web-layer/query/`; root cache helpers already covered in `/web-layer/query/` (8 mentions) and `/reference/fresh/`; and a "Related" grid that repeats the sidebar. The snippet ratchet stays green without it (Tier-1 candidates go from 41 to 39, floor 35; checked from 27 to 26, floor 21; exempt from 14 to 13, budget 14). |
| C7 | `/orchestration-runtime/how-to/deno-lsp-code-intelligence/` | **Delete** | `/ai/agent-tooling/` | Add `/orchestration-runtime/how-to/deno-lsp-code-intelligence/` and `/how-to/deno-lsp-code-intelligence/` to agent-tooling's `oldUrl` | The page installs a third-party Claude Code plugin (`wyattjoh/deno-lsp-claude-plugin`) into `~/.claude/skills` on each device. Nothing in `packages/`, `plugins/` or `.agents/skills` ships or references it. It is personal editor setup, not a NetScript feature, and it was filed under the wrong pillar. |

**Kept both, with distinct purposes** (no merge):
| Pair | Distinct purpose (state it in each page's first paragraph) |
| --- | --- |
| `/cli-reference/` "CLI cheat sheet", `/reference/cli/commands/` "CLI command reference", `/reference/cli/` `@netscript/cli` | The cheat sheet groups commands by task. The command reference lists every command and flag. The package page covers the embeddable TypeScript API. `check-accuracy-and-discoverability.ts` audits the first two together. Fix the names and the lane; do not merge. |
| Guide and recipe pairs: Authentication / Add authentication, Telemetry & logging / Add OpenTelemetry, Durable chat / Build a durable chat, KV, queues & cron / Use KV, queues, and cron | Each guide explains the surface (types, behaviour), and each recipe walks one task. Rule: the recipe's Prerequisites link the guide, and the guide's "Where to go next" links the recipe. |
| Tutorial chapters / recipes (for example `chat/02` and `build-a-durable-chat`) | Tutorials are linear and build one app. Recipes are standalone. |
| `/explanation/observability/` and `/observability/`; `/explanation/aspire/` and `/orchestration-runtime/` | The essay explains why; the pillar shows how. The duplicate title "Observability" is resolved by renaming the essay "Observability model". |
| `/orchestration-runtime/child-health/` | This is reference material generated from the `@netscript/plugin/health` JSDoc. It stays at its URL and sorts after the guides (`order: 3`, set in the generator). |
| Design system "Docs kit" | Public galleries, asserted by browser tests. Keep. |
| `/tutorials/eis-chat/*` (5) and `/capabilities/*` (16) redirect shims | These preserve external links. Keep them, but move them to `oldUrl` (F9). |

---

## D. Front matter and title normalisation

### Canonical forms (apply everywhere)

**Front matter, in this key order:**
```yaml
layout: layouts/base.vto
title: <sentence case; equals the H1, except on hero pages>
nav_title: <only "Overview" on lane landings and "Recipes" on recipe indexes, plus Comparisons>
description: <one sentence, no trailing period-free fragments>
templateEngine: [vento, md]   # only when the page uses Vento
order: <int>                  # every page under a Build pillar or /explanation/; recipes 101+
oldUrl: <string or list>      # only on pages that absorbed a URL
```
- `prev`/`next` may appear only on `why.vto`, `quickstart.vto` and `tutorials/**`.
- Inline `{{ comp.nextPrev(...) }}` is not allowed in any page.

**Titles:**
- Use sentence case and `&`, not "and", inside area names.
- Do not start guide, essay or recipe titles with an article.
- Recipes start with an imperative verb.
- Tutorial chapter 1 is "Scaffold the <app>", and the last chapter is "Run the <app> under Aspire".
- No two pages share a title.

**H1:**
- Exactly one H1 per page, equal to `title`.
- Hero pages (`/`, `/why/`, `/explanation/`) use the hero tagline as the H1.
- Reference pages use `` # `@netscript/<name>` ``.

**Openers and closers:**
- A page's opening requirements section is `## Prerequisites`.
- The single closing link section is `## Where to go next`.
- Pillar hubs end with `## Learn, do, look up` and nothing else after it.

**Vocabulary:**
- "Guide" for pillar pages, "recipe" for `how-to/` pages, and "Build" for the lane.
- Never use "capability hub", "this hub", "this zone", "the four lanes", "generated API/symbols" (the reference is hand-written against `deno doc`), "doctrine" or issue numbers.

### Table
| File | Field | From | To |
| --- | --- | --- | --- |
| `how-to/index.md` | title / H1 / nav | All recipes; `nav_hide: true`; prev/next | **Build**; `nav_title: Overview`; description "Every NetScript capability area with its guides and recipes."; nav_hide, prev and next removed; body replaced (F2) |
| `tutorials/index.md` | nav / H1 | (none) | `nav_title: Overview`; add `# Tutorials`; description |
| `reference/index.md` | nav / H1 / body | no H1 | `nav_title: Overview`; `# Reference`; description; body rewritten (F2) |
| `explanation/index.vto` (was `concepts.vto`) | title / nav | Core concepts | **Concepts**; `nav_title: Overview`; `oldUrl: /concepts/`; description |
| design generator `DESIGN_ROOT` | nav / H1 | H1 "NetScript Custom Design Guidelines" (the same H1 as `/design-system/guidelines/`) | `nav_title: 'Overview'`; H1 **Design system** |
| `quickstart.vto` | H1 / pager / redirect | no H1 | `# Quickstart`; `prev: {Why NetScript, /why/}`; `next: {Tutorials, /tutorials/}`; `oldUrl: /quickstart/aspire/`; description |
| `why.vto` | pager | (none) | `next: {Quickstart, /quickstart/}`; description |
| `cli-reference.md` | title / H1 | CLI reference | **CLI cheat sheet**; description |
| `glossary.md` | pager | prev/next, inline pager | removed; description |
| `reference/cli/commands.md` | title / H1 | netscript command reference / `` `netscript` command reference `` | **CLI command reference** |
| `reference/telemetry/convention.md` | all | **no front matter** | `layout`, `title: Telemetry conventions`, description; H1 `# Telemetry conventions` |
| `reference/plugin-auth/index.md` | redirect | (none) | `oldUrl: /reference/auth/` |
| `web-layer/index.md` | title / H1 / redirect | Web Layer | **Web layer**; `oldUrl: /web-layer/examples/`; description |
| `services-sdk/index.md` | title | Services and SDK (H1 "Services & SDK") | **Services & SDK**; description |
| `background-processing/index.md` | title / H1 | Background Processing | **Background processing**; description |
| `durable-workflows/index.md` | title / H1 | Durable Workflows | **Durable workflows**; description |
| `ai/index.md` | description | (none) | add description; title "AI" unchanged |
| `data-persistence/index.md` | title / H1 | Data and Persistence / Data & Persistence | **Data & persistence**; description |
| `identity-access/index.md` | title / H1 | Identity and Access / Identity & Access | **Identity & access**; description |
| `orchestration-runtime/index.md` | title / H1 | Orchestration and Runtime / Orchestration & Runtime | **Orchestration & runtime**; description |
| `observability/index.md` | description | (none) | add description |
| 9× `*/how-to/index.md` | title / nav / H1 / body | "Recipes"; H1 "<Area> — recipes" in 4 different spellings ("AI & Agents", "Background jobs", "Durable workflows", "Web Layer") | title and H1 **`<Area> recipes`** (Web layer recipes, Services & SDK recipes, Background processing recipes, Durable workflows recipes, AI recipes, Data & persistence recipes, Identity & access recipes, Orchestration & runtime recipes, Observability recipes); `nav_title: Recipes`; generated list (F2) |
| `web-layer/server.md` | title / H1 / order | The Fresh page model (1) | **Fresh page model** (1) |
| `web-layer/query-bridge.md` | title / H1 / order | The query bridge (15) | **Query bridge** (10) |
| `web-layer/{builders,resources,layers,response,route,generated-surface,partials,query,form,defer-streaming-ui,interactive,vite,testing,error,fresh-ui}.md` | order | 2, 13, 16, 17, 3, 4, 14, 4, 5, 6, 7, 8, 10, 9, 12 | 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17 (matches the order on the `/web-layer/` hub) |
| `services-sdk/service-layout.md` | order | (none, so it sorted first) | 3 |
| `services-sdk/how-to/protect-an-anonymous-route.md`, `call-internal-procedures.md` | order | 105, 110 | 104, 105 |
| `durable-workflows/triggers.md` | title / H1 / order | Triggers & ingress (3) | **Event triggers** (2), per locked decision Q14 |
| `durable-workflows/streams.md` | order | 2 | 3 (hub order: sagas, triggers, streams) |
| `durable-workflows/expo-streams.md` | order | (none, so it sorted first) | 4 |
| `orchestration-runtime/cli-scaffold.md` | title | CLI and Scaffold (H1 "CLI & scaffold") | **CLI & scaffold** |
| `orchestration-runtime/child-health.md` (generator) | order | (none, so it sorted first) | 3 |
| `orchestration-runtime/how-to/*` | order | deploy 101, deploy-local-aspire 102, deploy-deno-deploy 103, detached-start 104, roll-out 105, graceful 106, add-a-plugin 107, author 108, outbound-webhooks 112 | add-a-plugin 101, author-a-plugin 102, deploy-local-aspire 103, detached-start-agents-ci 104, deploy 105, deploy-deno-deploy 106, roll-out-runtime-overrides 107, graceful-shutdown 108, outbound-webhooks 109 |
| `orchestration-runtime/how-to/deploy.md` | title / H1 | Deploy / Deploy a NetScript workspace | **Deploy a workspace** |
| `identity-access/session-lifecycles.md` | title / H1 | Operational session lifecycles | **Session lifecycles** |
| `ai/mcp.md` | title / H1 | MCP (ambiguous next to `@netscript/mcp`, the framework MCP server) | **MCP client** |
| `ai/agent-tooling.md` | redirect | `oldUrl: /capabilities/agent-tooling/` | a list: that URL plus the two deno-lsp URLs (C7) |
| `web-layer/how-to/build-a-desktop-frontend.md` | title / H1 | Building a desktop frontend the NetScript way | **Build a desktop frontend** |
| `data-persistence/how-to/database-migration.md` | title / H1 | Database & migration | **Migrate the database** |
| `data-persistence/how-to/queue-kv-cron.md` | title / H1 | Queue / KV / cron | **Use KV, queues, and cron** |
| `explanation/architecture.md` | H1 | The NetScript architecture | **Architecture** |
| `explanation/plugin-system.md` | title / H1 | The plugin system | **Plugin system** |
| `explanation/auth-model.md` | title / H1 | The pure-backend auth model | **Auth model** |
| `explanation/observability.md` | title / H1 | Observability (the same title as the pillar) | **Observability model** |
| `comparisons/index.md` | all | Comparisons / H1 "Compare NetScript" | title and H1 **How NetScript compares**; `nav_title: Comparisons`; `oldUrl: /explanation/compared/`; description |
| `comparisons/frontend.md` | title | NetScript vs Next.js, Nuxt, SvelteKit, and TanStack Start | **NetScript vs frontend frameworks** (= H1; the competitors stay in `description`) |
| `comparisons/backend.md` | title | NetScript vs Nest.js, Hono, and Encore.dev | **NetScript vs backend frameworks** |
| `tutorials/{storefront,workspace,erp-sync,live-dashboard,chat}/index.md` | order | 4, 3, 5, 1, 2 | 1, 2, 3, 4, 5 |
| `tutorials/storefront/index.md` | title / H1 | Build a storefront backend | **Storefront** (matches the other tracks and `tut:storefront`) |
| `tutorials/chat/01-scaffold.md` | title / H1 | Scaffold the chat workspace | **Scaffold the chat app** |
| `tutorials/erp-sync/01-scaffold.md` | title / H1 | Scaffold the workspace (duplicate) | **Scaffold the ERP sync** |
| `tutorials/live-dashboard/01-scaffold.md` | title / H1 | Scaffold the dashboard workspace | **Scaffold the dashboard** |
| `tutorials/workspace/01-scaffold.md` | title / H1 | Scaffold the workspace (duplicate) | **Scaffold the team workspace** |
| `tutorials/erp-sync/05-deploy.md` | title / H1 | Run it locally under Aspire | **Run the ERP sync under Aspire** |
| `tutorials/live-dashboard/06-deploy.md` | title / H1 | Run the whole dashboard under Aspire | **Run the dashboard under Aspire** |
| `tutorials/storefront/07-deploy.md` | title / H1 | Run the whole storefront | **Run the storefront under Aspire** |
| `tutorials/workspace/06-deploy.md` | title / H1 | Deploy locally | **Run the team workspace under Aspire** |
| 5 last chapters (`chat/06`, `erp-sync/05`, `live-dashboard/06`, `storefront/07`, `workspace/06`) | `next` | "How-to guides" `/how-to/` (4), "Tutorials" (chat) | `{ label: "Build", href: "/how-to/" }` |
| 12 pages (list in F8) | heading | `## Before you start` | `## Prerequisites` |
| 61 pages (list in F8) | heading | `## See also` (16), `## Related` (16), `## Reference` (8), `## Reference →` (6), `## Next steps` (8), `## Next Steps` (2), `## Related pages` (4), `## What next, by intent` (1) | `## Where to go next` (no page has two of these; checked) |

**Pillar descriptions** (also shown on the Build landing):
- Web layer: "Fresh pages, routes, data loading, forms, and islands with `@netscript/fresh`, plus the Fresh UI components."
- Services & SDK: "Contract-first oRPC services and the typed SDK that calls them."
- Background processing: "Worker jobs and polyglot tasks that run outside the request path."
- Durable workflows: "Sagas, event triggers, and durable streams for work that must survive restarts."
- AI: "The AI engine, MCP client, durable chat, chat UI, and tooling for coding agents."
- Data & persistence: "Prisma databases, KV, queues, and cron."
- Identity & access: "Sign-in, sessions, and protected routes with one active auth backend."
- Orchestration & runtime: "The CLI scaffold, the Aspire resource graph, runtime configuration, plugins, and deployment."
- Observability: "OpenTelemetry traces and structured logs, read in the Aspire dashboard."

---

## E. Outdated and noise removals

| # | Item | Evidence | Action |
| --- | --- | --- | --- |
| E1 | `reference/telemetry/convention.md` | The file has no front matter. Live `/reference/telemetry/convention/` is bare HTML with no site chrome and no `<title>`, and its sidebar label is "Convention". The body says "the TC-1..TC-14 checklist used to grade NetScript package and plugin telemetry", "the contract for the beta.5 telemetry revamp; follow-on parity issues…", and "The beta.5 migration emits duplicate deprecated aliases for one beta". | Add front matter (D). Rewrite the opening paragraph as reader-facing ("Span names, attributes and metrics every NetScript package emits"). Drop the `TC-n:` labels and all "beta.5" sentences. Keep the conventions themselves. |
| E2 | `reference/index.md` | It contains maintainer process text: "There is no generator…", "an automated drift check verifies a subset…", "The release-readiness gate treats…", "A maintainer adding or changing an exception must update this table and the gate together", and "the union of exactly two pages … neither page is treated as exhaustive alone". It has no H1. | Rewrite the page (body given in F2). |
| E3 | 37 "Back to the [reference overview / auth reference hub]" footers | `git grep -n "^Back to the \["` finds 37 at baseline. One is in the auth hub deleted by C4, and `reference/ai/skills.md:234-235` spans two lines. They duplicate the breadcrumb and the pager. | Delete (F5). |
| E4 | "generated API / generated symbols" (≈50 lines) | The reference is hand-written; the reference index on main says so. Examples: hub cards "Generated symbols for …" (`ai/index.md:147-157`, `background-processing/index.md:33,41`, `identity-access/index.md:32,41`, `web-layer/index.md:89-98`, …), and the guide closers "the full generated API lives in the reference". | Replace with "API reference" or "the reference" (F8 sed). |
| E5 | "This hub is intentionally thin —" (8 guides of 250–620 lines: `workers.md:534`, `database.md:404`, `streams.md:446`, `telemetry.md:461`, `runtime-config.md:254`, `sdk.md:478`, `services.md:471`, `fresh-ui.md:277`) | This is vocabulary from the retired capability-hub IA, and it is false. | Delete the clause, keeping the rest of the sentence (F8). |
| E6 | "capability hub" / "capabilities hubs" / "this zone" / "four lanes" | `explanation/architecture.md:24,241`, `contracts.md:19`, `glossary.md:18,44,129` (the "capability" term row describes hub pages and a Capabilities index that no longer exist; redefine it as a Build area), `add-authentication.md:18`, `add-opentelemetry.md:287`, `observability/index.md:31`, `telemetry.md:35,312-315`, `expose-openapi-scalar.md:178`, `use-a-second-database.md:328`, `queue-kv-cron.md:24,321` ("Capabilities — KV, queues & cron"), `add-a-plugin.md:292`, `tutorials/index.md:21` ("How the four lanes fit together"), `explanation/index.md` (all; replaced in C2), and `explanation/compared.md:237` ("this zone"). | Reword to "guide" or "Build", or delete. Delete the `tutorials/index.md` "four lanes" callout outright. |
| E7 | Old-release migration sections | 0.0.7 (previous release; current is 0.0.8 per `packages/cli/deno.json`): `services-sdk/sdk.md:436 ### Migrating to 0.0.7` and `services-sdk/how-to/discover-services.md:179 ### Migrating typed-error handling to 0.0.7`. The 0.0.8 notes use 5 different headings: `choose-a-queue-provider.md:109`, `durable-workflows/streams.md:131`, `add-authentication.md:450`, `reference/auth-workos/index.md:85`, `reference/auth/index.md:45` (moving in C4). | **Delete** the two 0.0.7 sections. Convert the 0.0.8 sections into one form: `{{ comp callout { type: "important", title: "Changed in 0.0.8" } }}`. Delete them at the 0.0.9 cut. `child-health.md:93` is generated from JSDoc, so leave it to the generator owner. |
| E8 | `background-processing/workers.md:112-118` | "`0.0.1-beta.7` generated a root `deno.json` whose import map omitted…" (a beta note from ten releases ago), and "For local-source contributor work inside this monorepo, use the maintainer binary…" (contributor-only). | Delete both callouts or paragraphs. |
| E9 | Process and internal references in public pages | `orchestration-runtime/how-to/deploy.md:42` "Migration (#337)"; `reference/plugin-sagas-core/index.md:318` "acceptance scope for issue #2109"; `explanation/durability-model.md:49` "doctrine axiom A12"; `ai/index.md:106` "plugin doctrine (Architecture Doctrine…"; `reference/plugin-ai-core/index.md:31` "≤20-export doctrine budget"; `reference/service/index.md:202` links into `docs/architecture/doctrine/`; `explanation/plugin-system.md:52,58,133,156`, `auth-model.md:81`, `author-a-plugin.md:61,180`, `deploy-deno-deploy.md:44` ("doctrine-true", "the doctrine's …"); `glossary.md:39` "doctrine classification". | Strip the issue numbers and axiom IDs. Rephrase "doctrine" as "design rule" or "the framework's rule". Replace the doctrine link with the public explanation page `/explanation/auth-model/`. |
| E10 | Wrong package names on hub cards | "`@netscript/workers` reference" (`background-processing/index.md:41`), "`@netscript/sagas` reference" (`durable-workflows/index.md:57`), "`@netscript/auth` reference" (`identity-access/index.md:41`). The real packages are `@netscript/plugin-workers` and `@netscript/plugin-sagas`; no `@netscript/auth` exists (`git ls-tree origin/main packages plugins`). | Correct the names. Point the auth card at `/reference/plugin-auth/`. |
| E11 | Double-hop and wrong-target links | 74 links in 27 files go through `/capabilities/*` redirect shims. 17 of them point at `/capabilities/`, which lands on the **home page** while the link text promises "the capabilities hubs" or "Capabilities". | Repoint them (F5). Retarget `/capabilities/` to `/how-to/` (F2/F9). |
| E12 | Missing H1 | Live `/quickstart/`, `/tutorials/`, `/reference/` and `/explanation/` have no `<h1>`. | Fix (D). |
| E13 | Generic `<meta name="description">` | Only 7 of about 190 pages set `description`. Every other page inherits "NetScript — the Deno meta-framework…". | This pass requires `description` on the lane landings, the 9 pillars, the 9 recipe indexes and every page it touches. Content editors add it elsewhere. |
| E14 | Hand-written pagers encoding the retired tour | Two mechanisms carry them: the front-matter prev/next on 21 Build pages plus the essays, `glossary`, `cli-reference` and `how-to`; and **80 inline `{{ comp.nextPrev(...) }}` blocks** that override the layout pager (`base.vto`: `if !content.includes('<nav class="ns-nextprev"')`). Examples: Fresh UI → Authentication; `services.md` prev "Capabilities" → `/capabilities/` → home; `discover-services.md` prev "How-to guides"; `runtime-config.md` next "Capabilities". | Use one mechanism (F4): front matter for Start and tutorials; auto-derived for Reference, Concepts and Comparisons; none in Build (the sidebar is the sequence). |
| E15 | Old Diátaxis "lane" language in landings | `tutorials/index.md:17-26` and `reference/index.md:8-11` route readers to "how-to guides" and "explanation". | Reword to Build and Concepts. |
| E16 | `/web-layer/examples/` advertises a sandbox that does not exist | See C6. | Delete. |
| E17 | Design-system lane (owned by the design-system stream on this branch; coordinate) | (a) The landing H1 "NetScript Custom Design Guidelines" duplicates the `/design-system/guidelines/` H1. (b) The generated pages print their own eyebrow ("Design system · Guidelines"/"· Theme"/"· Fresh UI") on top of the layout eyebrow, so it is shown twice. (c) `/design-system/token-contract/` and `/create-your-own-theme/` keep the source numbering in their H2s ("2. Theme architecture", "7. Creating a new theme…") and repeat sections of the guidelines page. (d) The guidelines page includes "8. Shipping (planned)". | Required now: `nav_title: 'Overview'` on the root, and H1 "Design system". Recommended: drop `ns-design__eyebrow` from `design-system-render.ts`; strip the `^\d+\. ` prefix from sliced section headings; drop or move the "planned" section in `design-system/GUIDELINES.md`, which also needs `GUIDELINE_SECTIONS` updated. |
| E18 | `llms.txt` index misfiles pages | Live `llms.txt` lists `/ai/*` and `/comparisons/*` under "## Getting started". It lists 9 "Recipes" stubs with boilerplate summaries. Its headings ("Capabilities & hubs", "How-to guides") are the retired IA. | Fix `_plugins/llms-policy.ts` so its sections equal the lanes (F7). |
| E19 | Dead or stale data | `xref.ts`: `cap:index` (unused, points at `/`); the comments "36 hand-maintained reference xref units" and "the 36 registered units" become 35 after C4; `howto:deno-lsp-code-intelligence` (C7). Missing keys for `bound-stream-retention`, `protect-an-anonymous-route` and `call-internal-procedures`. | Fix (F6). |

---

## F. Exact edits to apply

**Ground rules:**
- Per the global CLAUDE.md, work in `~/projects/netscript/worktrees/<branch>/`.
- One commit per step below, with `docs(site): …` messages.
- The `packages/cli` and `packages/mcp` changes are **regenerated carriers only** (F10). No framework source is hand-edited.
- Do not run repo-wide `deno fmt`; Markdown fmt is excluded anyway.

### F0. Preconditions (after the content pass merges)
```bash
git fetch origin main && git rebase origin/main
cd docs/site
# Re-inventory; every list below must be regenerated from these, not from baseline line numbers.
git grep -n -E '/capabilities/|/concepts/|/quickstart/aspire/|/explanation/compared/|/reference/auth/|/web-layer/examples/|deno-lsp-code-intelligence' -- . ':!_plan/**'
git grep -l 'comp.nextPrev' -- '*.md' '*.vto' ':!_plan/**' ':!_includes/**' ':!_components/**'
git grep -n -E '^(prev|next):' -- '*.md' '*.vto' ':!_plan/**'
git grep -n -E '^## (See also|Related|Related pages|Next steps|Next Steps|Where next|What next, by intent|Reference|Reference →|Before you start)$' -- . ':!_plan/**'
```
If a content editor created a page in a Build pillar, give it an `order` that fits the table in A.

### F1. Navigation code

**`docs/site/_data.ts`**
- Update the header comment to name the six lanes and say the Build landing is `/how-to/`.
- Replace the `NavLane` interface, `navLanes`, `getDocsLane`, and add `pagerRoots`:
```ts
export interface NavLane {
  id: 'start' | 'learn' | 'build' | 'reference' | 'concepts' | 'design-system';
  label: string;
  /** Lane landing: top-bar target and the breadcrumb lane crumb's link. */
  href: string;
  /** One-line intent gloss rendered under the lane header. */
  subtitle: string;
  kind: 'flat' | 'menu';
  /** Curated links: the whole lane when flat; rendered after the landing link when menu. */
  items?: NavLaneLink[];
  /** kind "menu": nav.menu() roots rendered as subtrees, in curated order. */
  roots?: string[];
  /** kind "menu": the FIRST root renders as the landing link plus its children at lane level; later roots render as branches. */
  expandRoot?: boolean;
  /** nav.menu() sort for this lane; defaults to `navSort`. */
  sort?: string;
}

export const navLanes: NavLane[] = [
  {
    id: 'start', label: 'Start', href: '/quickstart/', subtitle: 'Get running in minutes', kind: 'flat',
    items: [
      { href: '/why/', label: 'Why NetScript' },
      { href: '/quickstart/', label: 'Quickstart' },
    ],
  },
  {
    id: 'learn', label: 'Learn', href: '/tutorials/', subtitle: 'Build one thing end to end',
    kind: 'menu', roots: ['/tutorials/'], expandRoot: true,
  },
  {
    id: 'build', label: 'Build', href: '/how-to/', subtitle: 'Add a capability to your app', kind: 'menu',
    roots: [
      '/how-to/',
      '/web-layer/', '/services-sdk/', '/background-processing/', '/durable-workflows/', '/ai/',
      '/data-persistence/', '/identity-access/', '/orchestration-runtime/', '/observability/',
    ],
  },
  {
    id: 'reference', label: 'Reference', href: '/reference/', subtitle: 'Every published symbol',
    kind: 'menu', roots: ['/reference/'], expandRoot: true, sort: 'order title',
    items: [
      { href: '/cli-reference/', label: 'CLI cheat sheet' },
      { href: '/glossary/', label: 'Glossary' },
    ],
  },
  {
    id: 'concepts', label: 'Concepts', href: '/explanation/', subtitle: 'How and why it works',
    kind: 'menu', roots: ['/explanation/', '/comparisons/'], expandRoot: true,
  },
  {
    id: 'design-system', label: 'Design system', href: '/design-system/',
    subtitle: 'One design grammar, every surface', kind: 'menu', roots: ['/design-system/'], expandRoot: true,
  },
];

/** Choose one lane from the source URL, before the base-path plugin rewrites links. */
export function getDocsLane(url: string): NavLane {
  return navLanes.find((lane) => lane.roots?.some((root) => url.startsWith(root))) ??
    navLanes.find((lane) => lane.items?.some((item) => url.startsWith(item.href))) ??
    navLanes.find((lane) => lane.id === 'start')!;
}

/** Sections whose pager is derived from the sidebar order (scoped to the root). */
export const pagerRoots: string[] = ['/reference/', '/explanation/', '/comparisons/'];
```
(Keep the existing `deno fmt` style: single quotes, line width 100.)

**`docs/site/_includes/layouts/base.vto`**
1. Toolbar: change `{{ comp.breadcrumb({ url, title }) }}` to `{{ comp.breadcrumb({ url, title, navTitle: nav_title }) }}`.
2. Delete the whole line `<p class="ns-eyebrow docs-page-eyebrow">{{ lane.label }}{{ if lane.label === "Build" }} · … {{ /if }}</p>`.
3. Sidebar menu branch: replace the `{{ else }} {{ for root of lane.roots }} … {{ /for }} {{ /if }}` block with:
```vento
          {{ else }}
            {{ for root of lane.roots }}
              {{ set tree = nav.menu(root, navQuery, lane.sort || navSort) }}
              {{ if tree && tree.data }}
                {{ if lane.expandRoot && root === lane.roots[0] }}
                  <a href="{{ tree.data.url |> url }}" class="ns-dashboard__nav-item"{{ if url === tree.data.url }} aria-current="page"{{ /if }}>{{ tree.data.nav_title || tree.data.title }}</a>
                  {{ for extra of lane.items || [] }}
                    <a href="{{ extra.href |> url }}" class="ns-dashboard__nav-item"{{ if url === extra.href }} aria-current="page"{{ /if }}>{{ extra.label }}</a>
                  {{ /for }}
                  {{ for child of tree.children || [] }}
                    {{ include "nav/menu-item.vto" { item: child, currentUrl: url } }}
                  {{ /for }}
                {{ else }}
                  {{ include "nav/menu-item.vto" { item: tree, currentUrl: url } }}
                {{ /if }}
              {{ /if }}
            {{ /for }}
          {{ /if }}
```
4. Footer: change `<a href="{{ '/concepts/' |> url }}">The five-layer mental model</a>` to `'/explanation/'`.

**`docs/site/_components/breadcrumb.vto`**: replace the whole file:
```vento
{{# breadcrumb.vto — Home / Lane / sections below the lane landing / Page.
   The lane crumb links to the lane landing (getDocsLane(url).href) and replaces it in
   the trail; on a menu-lane landing the trail is Home / Lane. Labels: nav_title || title;
   a slug only for folder nodes without a page (e.g. Themes). Source urls; hrefs base-prefixed. #}}
{{ set lane = getDocsLane(url) }}
{{ set isLanding = lane.kind === "menu" && url === lane.href }}
{{ set crumbs = nav.breadcrumb(url, navQuery, lane.sort || navSort).filter((crumb) => crumb.data && crumb.data.url !== "/" && crumb.data.url !== lane.href && crumb.data.url !== url) }}
<nav class="ns-breadcrumb" aria-label="Breadcrumb">
  <ol class="ns-breadcrumb__list">
    <li class="ns-breadcrumb__item"><a href="{{ "/" |> url }}">Home</a></li>
    <li class="ns-breadcrumb__sep" aria-hidden="true">/</li>
    {{ if isLanding }}
      <li class="ns-breadcrumb__item" aria-current="page">{{ lane.label }}</li>
    {{ else }}
      {{ if url === lane.href }}
        <li class="ns-breadcrumb__item">{{ lane.label }}</li>
      {{ else }}
        <li class="ns-breadcrumb__item"><a href="{{ lane.href |> url }}">{{ lane.label }}</a></li>
      {{ /if }}
      {{ for crumb of crumbs }}
        {{ set crumbLabel = crumb.data.nav_title || crumb.data.title || crumb.slug.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase()) }}
        <li class="ns-breadcrumb__sep" aria-hidden="true">/</li>
        {{ if crumb.data.url }}
          <li class="ns-breadcrumb__item"><a href="{{ crumb.data.url |> url }}">{{ crumbLabel }}</a></li>
        {{ else }}
          <li class="ns-breadcrumb__item">{{ crumbLabel }}</li>
        {{ /if }}
      {{ /for }}
      <li class="ns-breadcrumb__sep" aria-hidden="true">/</li>
      <li class="ns-breadcrumb__item" aria-current="page">{{ navTitle || title }}</li>
    {{ /if }}
  </ol>
</nav>
```
`base.vto` never renders the breadcrumb on `/`, so the old home branch is gone.

**`docs/site/_components/nextPrev.vto`**:
- Replace the `{{ if url && url.startsWith("/reference/") }} … {{ /if }}` block with the block below.
- Update the header comment: front matter applies to Start and tutorials; auto-derivation applies to the `pagerRoots`; Build pages have no pager.
```vento
{{ set pagerRoot = url ? pagerRoots.find((root) => url.startsWith(root)) : null }}
{{ if pagerRoot }}
  {{ set pagerQuery = "url^=" + pagerRoot + " " + navQuery }}
  {{ set pagerSort = getDocsLane(url).sort || navSort }}
  {{ if !prevLink }}
    {{ set autoPrev = nav.previousPage(url, pagerQuery, pagerSort) }}
    {{ if autoPrev && autoPrev.url }}{{ set prevLink = { label: autoPrev.title, href: autoPrev.url } }}{{ /if }}
  {{ /if }}
  {{ if !nextLink }}
    {{ set autoNext = nav.nextPage(url, pagerQuery, pagerSort) }}
    {{ if autoNext && autoNext.url }}{{ set nextLink = { label: autoNext.title, href: autoNext.url } }}{{ /if }}
  {{ /if }}
{{ /if }}
```
The pager label uses `title`, not `nav_title`, so a landing page never shows "← Overview".

**`docs/site/styles/docs.css`**: delete both `.docs-page-eyebrow { … }` rules.

**`tools/docs-site/navigation_test.ts`**: inside the existing test, add:
```ts
    assertEquals(getDocsLane('/how-to/').id, 'build');
    assertEquals(getDocsLane('/glossary/').id, 'reference');
    assertEquals(getDocsLane('/comparisons/backend/').id, 'concepts');
    assertEquals(getDocsLane('/quickstart/').id, 'start');
```

### F2. Merges, deletions and landings (C1–C7)

**C1 Quickstart**
- `git rm docs/site/quickstart/aspire.md`.
- `quickstart.vto` front matter: add `description: Install the CLI, scaffold a workspace, start it under Aspire, and prepare the database.`, `prev: { label: "Why NetScript", href: "/why/" }`, `next: { label: "Tutorials", href: "/tutorials/" }` and `oldUrl: /quickstart/aspire/`.
- Add `# Quickstart` as the first body line.
- In the Prerequisites callout, change `<a href="/quickstart/aspire/">why NetScript uses Aspire</a>` to `<a href="/explanation/aspire/">why NetScript uses Aspire</a>`.
- In `## 3. Start the resource graph`, after the paragraph that starts "Aspire is the resource graph for local development…", insert the callout below.
  - It contains **no** fenced block, so the `quickstart-walk` command parity is unaffected: `quickstart-command-drift_test.ts` reads only ` ```bash ` fences between the walk markers.
```vento
{{ comp callout { type: "note", title: "Prefer no orchestration?" } }}
Aspire is the default, not a requirement. The AppHost is generated TypeScript (<code>aspire/apphost.mts</code>); you write no C#. To skip it, scaffold with <code>netscript init my-app --db postgres --no-aspire</code> and start the app with <code>deno task --cwd apps/dashboard dev</code>; Postgres, the cache, and every connection string are then yours to provide. <a href="/explanation/aspire/#the---no-aspire-escape-hatch">What you give up</a>.
{{ /comp }}
```
- `why.vto` front matter: add `description: When NetScript is the right trade for a TypeScript app that has become a system, and when it is not.` and `next: { label: "Quickstart", href: "/quickstart/" }`.

**C2 Concepts landing**
- Run `git rm docs/site/explanation/index.md && git mv docs/site/concepts.vto docs/site/explanation/index.vto`.
- Replace the front matter with:
```yaml
---
layout: layouts/base.vto
title: Concepts
nav_title: Overview
description: The five-layer mental model, then the essays that explain each layer.
templateEngine: [vento, md]
oldUrl: /concepts/
---
```
- Append to the end of the file:
```vento

## Go deeper

{{ comp.featureGrid({ items: [
  { title: "Architecture", href: "/explanation/architecture/", body: "The published-surface thesis, the contracts-first workflow, and the publish gate that enforces it." },
  { title: "Contracts & type flow", href: "/explanation/contracts/", body: "How an oRPC contract flows through implement() and a typed handler into a typed client, query layer, and island." },
  { title: "Plugin system", href: "/explanation/plugin-system/", body: "How a plugin relates to its core package, what its manifest contributes, and how the host discovers it." },
  { title: "Auth model", href: "/explanation/auth-model/", body: "One backend port in core, pure backend adapters, and a plugin that composes exactly one active backend." },
  { title: "Durability model", href: "/explanation/durability-model/", body: "Sagas as explicit state machines: correlation, the kv or prisma store, and compensation as message-handler effects." },
  { title: "Observability model", href: "/explanation/observability/", body: "How framework spans, handler telemetry, console logs, and Aspire collection fit together." },
  { title: "Orchestration with Aspire", href: "/explanation/aspire/", body: "The generated TypeScript AppHost, the resource graph, the dashboard, and the --no-aspire opt-out." },
  { title: "How NetScript compares", href: "/comparisons/", body: "What other frameworks teach first, where NetScript differs, and side-by-side code." }
] }) }}
```
- In the body, the link `[Orchestration & runtime](/orchestration-runtime/)` stays as it is.
- The old index's "recurring themes", reading-order list and lane callouts are dropped. The reading order is the sidebar order, and the auto pager follows it.

**C3 Comparisons**
- First copy the `{{ comp.cardsGrid(…) }}` block out of the current `docs/site/comparisons/index.md`.
- Replace the body of `docs/site/comparisons/index.md` with the body of `explanation/compared.md`. Then delete the old file with `git rm docs/site/explanation/compared.md`.
- In the moved body:
  - H1 becomes `# How NetScript compares`.
  - Delete the trailing inline `{{ comp.nextPrev(...) }}`.
  - Change `/concepts/` to `/explanation/` and `/capabilities/` to `/how-to/`.
  - "this zone" becomes "these pages".
- Insert the old index's `{{ comp.cardsGrid({ columns: 2, cards: [ … frontend … backend … ] }) }}` verbatim under a new `## Side-by-side code` heading, placed immediately before `## Where to go next`.
- Front matter:
```yaml
---
layout: layouts/base.vto
title: How NetScript compares
nav_title: Comparisons
description: What Next.js, Nuxt, SvelteKit, Laravel, and Rails teach first, where NetScript differs, and side-by-side frontend and backend code.
templateEngine: [vento, md]
order: 1
oldUrl: /explanation/compared/
---
```

**C4 Auth reference**
- Run `git rm docs/site/reference/auth/index.md`.
- In `docs/site/reference/plugin-auth/index.md`:
  - Front matter: add `oldUrl: /reference/auth/` and `description: The auth plugin manifest, its constants, remote session verification, and the map of auth packages.`
  - Line 9–11: replace "For the auth package map, return to the [auth reference hub](/reference/auth/)." with "The other auth packages are listed under [Auth packages](#auth-packages)."
  - Before the closing section, append the old hub's content:
    - `## Auth packages`: the old "Units" table, verbatim.
    - The old "Backend adapter boundary" table, under `### Backend adapters`.
    - `## OAuth callback errors`: verbatim, with its `### 0.0.8 error-code migration` subsection turned into a `{{ comp callout { type: "important", title: "Changed in 0.0.8" } }}…{{ /comp }}`.
  - Delete the "Back to the [auth reference hub]" line.
- In `identity-access/index.md`:
  - The card `href: "/reference/auth/"` becomes `"/reference/plugin-auth/"`, with title "auth packages" and body "The auth plugin, its core contracts, and the three backend adapters."
  - `resolveXref("ref:auth")` becomes `resolveXref("ref:plugin-auth")`.
- In `identity-access/auth.md`: `comp.xref({ key: "ref:auth" … })` becomes `key: "ref:plugin-auth"`.
- Delete "Back to the auth reference hub" in `auth-better-auth`, `auth-kv-oauth`, `auth-workos` and `plugin-auth-core` (this is also done by F5).
- In `.llm/tools/docs/check-exports-drift.ts`: make `EXCLUDED_REFERENCE_PAGES` an empty array (`[]`). Keep the export and its type. Adjust `check-exports-drift_test.ts` only if it asserts that entry (run it).

**C5 Build landing**
Replace `docs/site/how-to/index.md`:
- The front matter.
- The intro and the callout up to `## Preferred NetScript paths`, as shown below.
- Everything after the "Preferred NetScript paths" table (the per-pillar lists and the "Not sure which recipe" outro) is replaced by the generated section.
```vento
---
layout: layouts/base.vto
title: Build
nav_title: Overview
description: Every NetScript capability area with its guides and recipes.
templateEngine: [vento, md]
---

# Build

Each area pairs guides, which explain a capability, with recipes, which solve one task. Pick the area that matches what you are adding.

{{ comp callout { type: "important", title: "Start Aspire first" } }}
Recipes that touch Postgres, Redis, or a plugin service expect the AppHost to be running: from your workspace, <code>cd aspire &amp;&amp; aspire start</code>.
{{ /comp }}

{{ for root of navLanes.find((lane) => lane.id === "build").roots.slice(1) }}
{{ set area = nav.menu(root, navQuery, navSort) }}
## [{{ area.data.title }}]({{ area.data.url }})

{{ area.data.description }}

{{ for recipe of area.children?.find((child) => child.slug === "how-to")?.children ?? [] -}}
- [{{ recipe.data.title }}]({{ recipe.data.url }})
{{ /for }}
{{ /for }}

## Preferred NetScript paths

<keep the existing intro sentence, table and closing paragraph verbatim>
```
- In `capabilities/index.md`, change `redirectTo: /` to `redirectTo: /how-to/`. F9 later turns this into an `oldUrl`.

**C5b Recipe indexes**
In each of the 9 `docs/site/*/how-to/index.md`, replace the whole file with the template below. Substitute `<Area>` (from the D table) and `<area noun>` (for example "web pages", "services and the SDK", "background work", "durable workflows", "AI features", "data and persistence", "authentication", "running and deploying a workspace", "telemetry").
```vento
---
layout: layouts/base.vto
title: <Area> recipes
nav_title: Recipes
description: Task-oriented recipes for <area noun>, one problem each.
templateEngine: [vento, md]
order: 100
---

# <Area> recipes

Each recipe solves one concrete problem and assumes the guides above it in the sidebar.

{{ for recipe of nav.menu(url, navQuery, navSort)?.children ?? [] -}}
- [{{ recipe.data.title }}]({{ recipe.data.url }}){{ recipe.data.description ? ": " + recipe.data.description : "" }}
{{ /for }}
```
Use the ternary expression, not `{{ if }}…{{ /if }}`. With an `{{ /if }}` at the end of the line, Lume's Vento trims the line break and the list collapses into one item; this was verified in a scratch build.

**C6 Examples**
- Run `git rm docs/site/web-layer/examples.md`.
- In `web-layer/index.md`, add `oldUrl: /web-layer/examples/`, and change `**[worked examples](/web-layer/examples/)**` to `**[the Live Dashboard tutorial](/tutorials/live-dashboard/)**`.
- In `web-layer/testing.md` and `web-layer/vite.md`, delete the list item `- [Examples and sandbox](/web-layer/examples/)`.
- In `.llm/tools/docs/snippet-policy.ts`, remove `'web-layer/examples.md',` from `TIER_1_PAGES`.
- In `.llm/tools/docs/snippet-extractor_test.ts`, remove `'web-layer/examples.md',` from the fixture page list (around line 154).
- Leave `TIER_1_FLOOR` unchanged.

**C7 Deno LSP recipe**
- Run `git rm docs/site/orchestration-runtime/how-to/deno-lsp-code-intelligence.md`.
- In `ai/agent-tooling.md`, set the front matter to:
```yaml
oldUrl:
  - /capabilities/agent-tooling/
  - /orchestration-runtime/how-to/deno-lsp-code-intelligence/
  - /how-to/deno-lsp-code-intelligence/
```

**Landing H1s and bodies**
- `tutorials/index.md`:
  - Add `nav_title: Overview` and `description: Five tracks, each building one complete application from netscript init to a running Aspire graph.`
  - Insert `# Tutorials` as the first body line.
  - Replace "Unlike the [how-to guides](/how-to/), which assume…" with "Unlike the recipes in [Build](/how-to/), which assume…".
  - Delete the callout `{{ comp callout { type: "tip", title: "How the four lanes fit together" } }} … {{ /comp }}`.
- `reference/index.md`: replace the file with:
```markdown
---
layout: layouts/base.vto
title: Reference
nav_title: Overview
description: The public API of every NetScript package and plugin, one page per package.
---

# Reference

One page per published package: its entrypoints, exported symbols, and signatures, written against
`deno doc` output for the current release. For the command line, use the
[CLI cheat sheet](/cli-reference/) for everyday tasks and the
[CLI command reference](/reference/cli/commands/) for every command and flag. The
[glossary](/glossary/) defines the terms these pages use.

## Where each package lives

Every package is at `/reference/<name>/`, its name without the `@netscript/` scope. The four
deployable plugins drop the `plugin-` prefix; their `-core` packages keep it:

| Package | Page |
| --- | --- |
| `@netscript/plugin-sagas` | [`/reference/sagas/`](/reference/sagas/) |
| `@netscript/plugin-streams` | [`/reference/streams/`](/reference/streams/) |
| `@netscript/plugin-triggers` | [`/reference/triggers/`](/reference/triggers/) |
| `@netscript/plugin-workers` | [`/reference/workers/`](/reference/workers/) |

A deployable plugin's page covers its manifest and integration entrypoints, then links to its
`-core` package for the contracts it shares.
```

### F3. Front matter and titles
- Apply every row of the D table: titles, H1s, `nav_title`, `order`, `description` and `oldUrl`.
- When changing a title, change the matching H1 in the same edit.
- Generator-owned items:
  - `.llm/tools/docs/generate-child-health-docs.ts`: in the front-matter template (around line 78), add `order: 3` after `title: Background child health`. Then run `deno task gen:child-health-docs`.
  - `docs/site/_plugins/design-system-render.ts`:
    - Add `nav_title?: string` to the `DesignPage` interface.
    - Add `nav_title: 'Overview'` to the `DESIGN_ROOT` entry.
    - Change `<h1>NetScript Custom Design Guidelines</h1>` to `<h1>Design system</h1>`.
    - Coordinate with the design-system stream before the optional E17 items.

### F4. One pager mechanism
1. **Tutorials.** Front matter is authoritative.
   - Verify that each `tutorials/**` page has `prev:` and `next:` in front matter:
     ```bash
     for f in $(git ls-files 'docs/site/tutorials/*.md' | grep -v eis-chat); do grep -q '^next:' "$f" || echo "missing next: $f"; done
     ```
     If a page is missing them, copy the values from its inline block.
   - Then set `next: { label: "Build", href: "/how-to/" }` on the five last chapters.
2. **Remove all inline pagers** in pages (80 blocks at baseline):
   ```bash
   cd docs/site
   git ls-files -z '*.md' '*.vto' | grep -zvE '^(_|tutorials/eis-chat/)' \
     | xargs -0 perl -0pi -e 's/\n*\{\{ comp\.nextPrev\(\{.*?\}\) \}\}[ \t]*\n?/\n/sg'
   git grep -c 'comp.nextPrev' -- '*.md' '*.vto' ':!_*'   # expect no output
   ```
3. **Remove front-matter `prev`/`next`** everywhere except `tutorials/**`, `why.vto` and `quickstart.vto`. Use the script below, which also handles multi-line YAML values:
   ```bash
   cd docs/site
   python3 -I - $(git grep -l -E '^(prev|next):' -- '*.md' '*.vto' ':!_*' ':!tutorials/**' ':!why.vto' ':!quickstart.vto') <<'EOF'
   import re, sys, pathlib
   for p in sys.argv[1:]:
       path = pathlib.Path(p); t = path.read_text()
       m = re.match(r'---\n(.*?)\n---\n', t, re.S)
       if not m: continue
       out, skip = [], False
       for line in m.group(1).split('\n'):
           if re.match(r'(prev|next):', line): skip = True; continue
           if skip and line[:1] in (' ', '\t'): continue
           skip = False; out.append(line)
       path.write_text('---\n' + '\n'.join(out) + '\n---\n' + t[m.end():])
   EOF
   ```

### F5. Link sweep (kills double hops)
Run the script from `docs/site`. Apply it to content only, never to `_plan`, `_data`, `_plugins` or `capabilities/`. Lines carrying `oldUrl` or YAML list items are skipped.
```bash
cd docs/site
FILES=$(git ls-files '*.md' '*.vto' | grep -vE '^(_|capabilities/)')
perl -pi -e '
  next if /^\s*(oldUrl:|- \/)/;
  s#/capabilities/ai/#/ai/#g;
  s#/capabilities/auth/#/identity-access/auth/#g;
  s#/capabilities/background-jobs/#/background-processing/workers/#g;
  s#/capabilities/database/#/data-persistence/database/#g;
  s#/capabilities/durable-sagas/#/durable-workflows/sagas/#g;
  s#/capabilities/fresh-framework/#/web-layer/#g;
  s#/capabilities/fresh-ui/#/web-layer/fresh-ui/#g;
  s#/capabilities/kv-queues-cron/#/data-persistence/kv-queues-cron/#g;
  s#/capabilities/polyglot-tasks/#/background-processing/polyglot-tasks/#g;
  s#/capabilities/runtime-config/#/orchestration-runtime/runtime-config/#g;
  s#/capabilities/sdk/#/services-sdk/sdk/#g;
  s#/capabilities/services/#/services-sdk/services/#g;
  s#/capabilities/streams/#/durable-workflows/streams/#g;
  s#/capabilities/telemetry/#/observability/telemetry/#g;
  s#/capabilities/triggers/#/durable-workflows/triggers/#g;
  s#/capabilities/(?=["\x27)\s\#\\])#/how-to/#g;
  s#/explanation/compared/#/comparisons/#g;
  s#/reference/auth/(?=["\x27)\s\#])#/reference/plugin-auth/#g;
  s#(["\x27(])/concepts/#$1/explanation/#g;
' $FILES
# Targeted, context-dependent links (decide wording by hand):
#   why.vto: '/quickstart/aspire/' -> '/explanation/aspire/#the---no-aspire-escape-hatch' ("See the Aspire boundary")
#   index.vto: '/quickstart/aspire/' -> '/quickstart/#3-start-the-resource-graph' ("Aspire dashboard")
#   index.vto + why.vto: the '/concepts/' links are already handled by the sweep above
# glossary.md "capability" row (type: "/capabilities/<cap>/", "Each capability has a hub page…"): rewrite by hand (E6).
# "Back to …" footers (reference/ai/skills.md:234-235 spans two lines, so edit it by hand):
perl -ni -e 'print unless /^Back to the \[/' $(git grep -l '^Back to the \[' -- 'reference/**/*.md')
```
Link text that still names the old IA ("capability hub", "capabilities", "how-to guides", "explanation") is fixed by F8 and E6.
- In the tutorial endings and `reference/index.md`, the text for `/how-to/` becomes "Build" or "the recipes in Build".
- The text for `/explanation/` becomes "Concepts".

### F6. `docs/site/_data/xref.ts`
- Delete `'cap:index'` and `'howto:deno-lsp-code-intelligence'`.
- `'howto:index'`: label becomes `'Build'`.
- Add three keys:
```ts
  'howto:bound-stream-retention': {
    href: '/durable-workflows/how-to/bound-stream-retention/',
    label: 'Bound stream retention',
  },
  'howto:protect-an-anonymous-route': {
    href: '/services-sdk/how-to/protect-an-anonymous-route/',
    label: 'Protect an anonymous service route',
  },
  'howto:call-internal-procedures': {
    href: '/services-sdk/how-to/call-internal-procedures/',
    label: 'Call internal procedures from a service or worker',
  },
```
- `'howto:database-migration'` label becomes `'Migrate the database'`.
- `'howto:queue-kv-cron'` label becomes `'Use KV, queues, and cron'`.
- `'howto:build-a-desktop-frontend'` stays as it is.
- `'howto:deploy'` label becomes `'Deploy a workspace'`.
- `'cap:triggers'` label becomes `'Event triggers'`.
- `'explain:index'` label becomes `'Concepts'`.
- `'explain:compared'` becomes `{ href: '/comparisons/', label: 'How NetScript compares' }`.
- `'explain:plugin-model'` and `'explain:plugin-system'` labels become `'Plugin system'`.
- `'explain:observability'` label becomes `'Observability model'`.
- `'explain:durable-workflows'` and `'explain:durability-model'` labels become `'Durability model'`.
- `'concept:concepts'` becomes `{ href: '/explanation/', label: 'Concepts' }`.
- `'cli:reference'` label becomes `'CLI cheat sheet'`.
- `REFERENCE_UNITS`: remove `'auth'`. Change the comments "The 36 hand-maintained" and "the 36 registered units" to 35.
- The build fails on any remaining `ref:auth` or `howto:deno-lsp…` use; the fixes are in F2.

### F7. Docs tooling
**`docs/site/_plugins/llms-policy.ts`**
- Its `llms.txt` sections now equal the lanes.
- It is copied to `packages/cli/src/kernel/assets/llms-policy.generated.ts` by F10.
```ts
export const SECTIONS: readonly Section[] = [
  { id: 'start', heading: 'Start' },
  { id: 'tutorials', heading: 'Learn' },
  { id: 'capabilities', heading: 'Build' },
  { id: 'reference', heading: 'Reference' },
  { id: 'explanation', heading: 'Concepts' },
  { id: 'design-system', heading: 'Design system' },
];

const HUB_PREFIXES = [
  '/how-to/', '/web-layer/', '/services-sdk/', '/background-processing/', '/durable-workflows/',
  '/ai/', '/data-persistence/', '/identity-access/', '/orchestration-runtime/', '/observability/',
];

export function sectionOf(url: string): string {
  if (url.startsWith('/tutorials/')) return 'tutorials';
  if (url.startsWith('/reference/') || url === '/cli-reference/' || url === '/glossary/') {
    return 'reference';
  }
  if (url.startsWith('/explanation/') || url.startsWith('/comparisons/')) return 'explanation';
  if (url.startsWith('/design-system/')) return 'design-system';
  if (HUB_PREFIXES.some((prefix) => url.startsWith(prefix))) return 'capabilities';
  return 'start';
}
```
The section `id`s are kept, so `ai-tooling.ts` needs no logic change.

**`docs/site/_plugins/ai-tooling.ts`** (task-router labels only):
- "Web Layer overview ([Web Layer]" becomes "Web layer guide ([Web layer]".
- "Background Processing hub ([Background Processing]" becomes "Background processing guide ([Background processing]".
- "Data Persistence hub ([Data Persistence]" becomes "Data & persistence guide ([Data & persistence]".
- "Durable Workflows hub ([Durable Workflows]" becomes "Durable workflows guide ([Durable workflows]".
- "Identity & Access hub ([Identity & Access]" becomes "Identity & access guide ([Identity & access]".
- "Services & SDK hub" becomes "Services & SDK guide".
- "Observability hub" becomes "Observability guide".
- "Streams capability guide" becomes "Durable streams guide".

The other tooling edits are listed in F2 (C4, C6) and F3 (child-health, design-system).

### F8. Headings and noise text
```bash
cd docs/site
FILES=$(git ls-files '*.md' '*.vto' | grep -vE '^_')
perl -pi -e 's/^## Before you start$/## Prerequisites/' $FILES
perl -pi -e 's/^## (See also|Related|Related pages|Next steps|Next Steps|Where next|What next, by intent|Reference|Reference →)$/## Where to go next/' $FILES
perl -pi -e 's/This hub is intentionally thin — //g; s/the full generated API/the full API reference/g; s/Full generated API/Full API reference/g; s/The full generated API/The full API reference/g; s/The generated API/The API reference/g; s/Generated API reference\./API reference./g; s/Generated symbols for /Symbols for /g; s/generated \[Reference\]/[Reference]/g; s/the generated <a href="\/reference\/">reference<\/a>/the <a href="\/reference\/">reference<\/a>/g' $FILES
```
Fix these by hand:
- E6: the capability-hub wording, at the listed lines.
- E7: delete the two 0.0.7 sections, and convert the four 0.0.8 headings to the canonical "Changed in 0.0.8" callout.
- E8: `workers.md` beta.7 and maintainer-binary paragraphs.
- E9: process references.
- E10: package names on the hub cards.

Each of the 9 pillar hubs:
- Keep the lede and the `## Learn, do, look up` card row.
- Delete the first `cardsGrid`. It is the "Overview & Concepts / Quickstart / How-To / API Reference" grid, and it duplicates the sidebar and the card row.
- Delete any `## Where to go next` list above the card row (on `observability/index.md`, `orchestration-runtime/index.md` and `ai/index.md`).
- If a content editor has already rewritten a hub, apply only what is still missing.

### F9. One redirect mechanism (`oldUrl`)
Move every `layouts/redirect.vto` shim to `oldUrl` on its target, delete the shims, then delete the layout:

| Shim(s) | Add to `oldUrl` of |
| --- | --- |
| `capabilities/index.md` | `how-to/index.md` |
| `capabilities/ai.md` | `ai/index.md` |
| `capabilities/auth.md` | `identity-access/auth.md` |
| `capabilities/background-jobs.md` | `background-processing/workers.md` |
| `capabilities/database.md` | `data-persistence/database.md` |
| `capabilities/durable-sagas.md` | `durable-workflows/sagas.md` |
| `capabilities/fresh-framework.md` | `web-layer/index.md` (list with `/web-layer/examples/`) |
| `capabilities/fresh-ui.md` | `web-layer/fresh-ui.md` |
| `capabilities/kv-queues-cron.md` | `data-persistence/kv-queues-cron.md` |
| `capabilities/polyglot-tasks.md` | `background-processing/polyglot-tasks.md` |
| `capabilities/runtime-config.md` | `orchestration-runtime/runtime-config.md` |
| `capabilities/sdk.md` | `services-sdk/sdk.md` |
| `capabilities/services.md` | `services-sdk/services.md` |
| `capabilities/streams.md` | `durable-workflows/streams.md` |
| `capabilities/telemetry.md` | `observability/telemetry.md` |
| `capabilities/triggers.md` | `durable-workflows/triggers.md` |
| `tutorials/eis-chat/index.md` | `tutorials/chat/index.md` |
| `tutorials/eis-chat/01-scaffold.md` | `tutorials/chat/01-scaffold.md` |
| `tutorials/eis-chat/02-message-contract.md`, `03-deliver-worker.md` | `tutorials/chat/02-durable-chat-route.md` (list) |
| `tutorials/eis-chat/04-live-stream.md` | `tutorials/chat/06-live-streaming.md` |

Run: `git rm -r docs/site/capabilities docs/site/tutorials/eis-chat docs/site/_includes/layouts/redirect.vto`.

- Confirm that nothing else uses the layout: `git grep -n "redirect.vto"`, which should be empty except for `_plan`.
- The trade-off: the plugin's meta-refresh drops `#fragment` on old links, which the shim's script preserved. This is acceptable for retired URLs.
- If the owner wants to keep fragments, skip F9. Everything else in the plan stands without it.

### F10. Regenerate carriers (generated chain: prose → corpus → assets barrel → publish assets)
```bash
deno task gen:child-health-docs
deno task gen:agent-docs-prose      # builds docs/site, rewrites packages/cli/src/kernel/assets/agent-docs-prose.generated.ts + llms-policy.generated.ts
deno task gen:publish-assets        # MCP_EMBEDDED_DOCS includes llms.txt; budget 294_912 bytes
deno task check:assets-barrel && deno task check:publish-assets && deno task check:agent-docs-prose
```
- The removed pages drop out of the CLI carrier: `pages/quickstart/aspire`, `pages/concepts`, `pages/explanation/compared`, `pages/reference/auth`, `pages/web-layer/examples` and `pages/orchestration-runtime/how-to/deno-lsp-code-intelligence`.
- The frozen fixture `.llm/tools/docs/fixtures/legacy-carrier-parity/digests.json` is independent of the current pages. Do not touch it.

### F11. Verify
```bash
deno task --cwd docs/site verify                 # build + internal links + caveat refs
deno test --no-lock -A tools/docs-site/navigation_test.ts
deno task docs:accuracy                          # cli-reference.md + reference/cli/commands.md corpus (paths unchanged)
deno task docs:exports-drift
deno test -A .llm/tools/docs/snippet-extractor_test.ts .llm/tools/docs/check-exports-drift_test.ts
deno test -A packages/cli/e2e/tests/presentation/quickstart-command-drift_test.ts
# browser suite if runnable: tools/fresh-ui-browser/docs-tests/docs.spec.ts (breadcrumb assertions are unchanged)
```
Acceptance greps. Each must return nothing, scoped to `docs/site` and excluding `_plan`:
```bash
git grep -n -E '\]\(/capabilities/|href="/capabilities/|/concepts/|/quickstart/aspire/|/explanation/compared/|/reference/auth/[")]|/web-layer/examples/' -- docs/site ':!docs/site/_plan/**'
git grep -n 'comp.nextPrev' -- 'docs/site/**/*.md' 'docs/site/*.vto' 'docs/site/**/*.vto' ':!docs/site/_*'
git grep -n -E '^Back to the \[|intentionally thin|generated API|Generated symbols|capability hub|four lanes|TC-[0-9]+|beta\.5|#2109|#337|axiom A12' -- docs/site ':!docs/site/_plan/**'
git grep -n -E '^## (See also|Related|Related pages|Next steps|Next Steps|Where next|Reference|Reference →|Before you start)$' -- docs/site ':!docs/site/_plan/**'
```
Spot-check these in `docs/site/_site` (open each `index.html` and read `.ns-breadcrumb`, the sidebar and the pager):
- `/explanation/`, `/explanation/aspire/`, `/comparisons/backend/`
- `/tutorials/chat/01-scaffold/`, `/how-to/`, `/services-sdk/how-to/add-a-service/`
- `/cli-reference/`, `/glossary/`, `/reference/telemetry/convention/`, `/reference/cli/commands/`
- `/design-system/themes/studio/`

Each must match the B table. Also confirm:
- The Reference sidebar is alphabetical.
- Concepts shows Comparisons as a collapsible branch.
- No page shows a "← Overview" pager.
- `llms.txt` headings read Start / Learn / Build / Reference / Concepts / Design system.
- The `#the---no-aspire-escape-hatch` anchor exists in `_site/explanation/aspire/index.html`. If it does not, use the id the build emits.

### F12. Commit and PR
- One commit per F step.
- Open the PR with `Refs` only: this is an IA pass, not an issue closure, unless an issue is opened for it.
- Apply the netscript-pr taxonomy: `type:docs`, `area:docs`, and one `status:`.

---

## Notes on the plan docs (respect or correct)

- **`02-information-architecture.md`** is superseded by `10-nav-ia-redesign.md`. This pass agrees with 02 on two points it lost along the way:
  - The CLI reference and the Glossary are grouped together, as 02's "Resources" grouping did. They now sit in the Reference lane.
  - "Core concepts" *is* the Explanation zone. It is now the Concepts landing.
- **`08-decisions-locked.md`**:
  - Q7 (Aspire is hero-level, with a dedicated chapter that makes the opt-out explicit) is satisfied by Quickstart plus `/explanation/aspire/#the---no-aspire-escape-hatch`, linked from Quickstart, Why and the home page.
  - Q14 (plain-English labels) is applied to the triggers guide: "Event triggers".
  - Q4 ("ONE honest table, no per-competitor head-to-heads") conflicts with the owner-commissioned `/comparisons/` programme (#1652, #1660). Flag it for the owner. This plan keeps the programme and the single table on `/why/`.
- **`10-nav-ia-redesign.md`** is implemented (#865), but its header still says "PROPOSAL — awaiting maintainer approval". This pass supersedes its §2 in these places:
  - Start lane composition: Aspire quickstart, Core concepts, CLI reference, Glossary, All recipes.
  - The Build landing.
  - The Concepts landing.
  - Comparisons.
  - The Auth reference hub.
  - Its count "32 reference units"; the count is 35 after C4.

  Optionally, add one line at the top of `10-nav-ia-redesign.md`: "Implemented in #865; §2 lane composition superseded by the 2026-10-28 IA pass." `_plan` is internal and not built.
