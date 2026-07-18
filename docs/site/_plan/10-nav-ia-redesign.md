# 10 — Multilevel Nav & IA Redesign (Lume nav plugin) — Proposal

**Status: PROPOSAL — awaiting maintainer approval. No content moved or rewritten yet.**

Provenance: produced 2026-07-18 by a supervised multi-agent design run (4 repo/market audits →
3 independent full IA proposals → 3 adversarial judges → synthesis), with every count re-verified
against the live repo. Judges: reader-experience → P2, migration/link-integrity → P2,
state-of-the-art/technical-fit → P3. Winning spine = P2 (journey lanes) with two structural grafts
from P1 (capability-native) and P3 (Diátaxis-separation).

The problem being solved: today's sidebar is a hand-rolled flat `navSections` array in `_data.ts` —
13 sections, ~120 always-visible links, 37 duplicate listings (the same page in 2–3 sections),
14 pillar guide pages unlisted in nav (counting agent-tooling), and no hierarchy/collapse. The Lume nav plugin derives the
tree from page URLs, so the folder layout must become the IA.

## 1. Decision summary

**Shape chosen: lifecycle-lane spine, with the pillars kept whole and the recipes moved home.**
Five curated top-level lanes — **Start · Learn · Build · Reference · Concepts** — render as visual
dividers over folder-derived `nav.menu()` subtrees. This lands dead-center of the 6–9-group SOTA
band (today: 13 flat sections, ~120 always-visible links), keeps Learn (tutorials) as the second
lane so a newcomer's "build one thing" path is prominent, and uses plain-English/intent labels that
are *not* the Diátaxis quadrant names (satisfying the locked "Diátaxis demoted from front door"
decision in `08-decisions-locked.md`).

**Per-capabilities: KEPT and strengthened.** All nine pillars stay top-level and **contiguous
inside one Build lane**, fixing the journey-first proposal's own worst defect — a Build/Operate
split that fractured the capability set ("where is Observability?"). There is no Operate lane;
deploy/observe concerns are expressed as recipes inside the Orchestration and Observability pillars
plus cross-refs, not by relocating whole pillars. The locked "docs-v4 Capability-Hub IA" (pillars as
the mental model) is preserved, so this design carries **no top-level-IA ratification risk**.

**The one graft that changes URLs: recipes move into their pillar.** The 27 flat `/how-to/` recipes
were the sidebar's least navigable asset — a decontextualized global list. Two of three judges ruled
a flat recipe list unacceptable. We adopt the namespaced **`/<pillar>/how-to/<recipe>/`** subfolder
(plugin-native real node, collision-proof, depth-3 because pillars stay top-level). Each recipe now
sits next to the guide it serves, in one expand. `queue-kv-cron` and `choose-a-queue-provider`
re-home from Background Processing to Data & Persistence (better semantic fit next to the
`kv-queues-cron` guide).

**Cost of that graft, stated honestly:** 28 URL moves (27 recipes + `capabilities/agent-tooling`).
This is a deliberate reader-value-over-migration-minimalism decision. The cost is bounded and
build-gated: `check-internal-links.ts` (deno.json task) scans every href in built HTML, so no broken
link can merge; the Lume `redirects` plugin reduces 28 shims to 28 `oldUrl` front-matter lines
(generated pages are flagged `isRedirect: true` and sit outside every nav.menu root). Reference
(crown jewels), tutorials, explanation, and all nine pillar-guide URLs stay byte-stable.

**Reference stays a single flat locked lane** (universal SOTA pattern; 32 units, `mcp` now
registered) — never scattered into pillars. **Cross-listing dies entirely** (37 duplicate nav
listings removed); discovery re-lands in pillar-hub card-grids via the existing `xref` system.

## 2. Full target arborescence

Legend: **[KEEP]** URL+home unchanged · **[MOVE from X]** file moves, ships redirect · **[NEW]** new
file · **[RETIRE→catalog]** kept as nav-hidden catalog · **[HIDE]** on disk, `nav_hide`,
search/link-reachable only · **[LOCKED]** reference URL, byte-stable · **[REGISTER]** exists on
disk, add to data/xref. Lane dividers (`━━`) are non-interactive headers (depth L0). Collapsible
depth below a lane: L1 pillar/track/unit → L2 leaf/how-to-node → L3 recipe/chapter/subpage.
**Max collapsible depth = 3.**

```
/                                      Home (not a nav item)                    [KEEP]

━━ START ━━  (curated flat list — locked plain-English front door)
  /why/                                Why NetScript                            [KEEP]
  /quickstart/                         Quickstart (Aspire hero path)            [KEEP]  (de-cross-listed: drop 2nd listing under Orchestration)
  /quickstart/aspire/                  Aspire quickstart                        [NEW]   (hero CTA landing; TS AppHost, not .NET; --no-aspire opt-out lives in /explanation/aspire/)
  /concepts/                           Core concepts                            [KEEP]  (de-cross-listed: drop 2nd listing under Observability; reprose — §6)
  /cli-reference/                      CLI reference (task cheat-sheet)         [KEEP]  (NOT moved; reprose to defer symbols to /reference/cli/commands/)
  /glossary/                           Glossary                                 [KEEP]
  /how-to/                             All how-to recipes (catalog)             [RETIRE→catalog]  children moved out; nav_hide; linked from Start + pillar hubs

━━ LEARN ━━  nav.menu("/tutorials/", "nav_hide!=true", "order basename")
  /tutorials/                          Tutorials (index)                        [KEEP]  L1
    /tutorials/live-dashboard/  01–06  Live dashboard                           [KEEP]  L2 → chapters L3   (drop Web "Quickstart→index" dup)
    /tutorials/chat/            01–06  Durable chat                             [KEEP]  L2 → L3            (drop AI dup)
    /tutorials/workspace/       01–06  Workspace                                [KEEP]  L2 → L3            (drop Identity "02-auth" mid-chapter anchor)
    /tutorials/storefront/      01–07  Storefront                               [KEEP]  L2 → L3            (drop Services/Data/Durable mid-chapter anchors)
    /tutorials/erp-sync/        01–05  ERP sync                                 [KEEP]  L2 → L3            (drop BG "03-polyglot-transform" anchor)
    /tutorials/eis-chat/**  (5 shims)  → /tutorials/chat/*                      [HIDE]  nav_hide (URL preservation only)

━━ BUILD ━━  9 contiguous pillar nav.menu() roots, curated order (the locked capability spine)
             within each pillar: guide leaves (L2), then a how-to/ node (L2) whose recipes are L3

  /web-layer/                          Web Layer                                [KEEP]  L1  (rewrite → card-grid hub, §6)
    /web-layer/server/ builders/ route/ query/ form/ defer-streaming-ui/
      interactive/ vite/ error/ testing/ examples/                              [KEEP]  L2 (12 guide leaves)
    /web-layer/fresh-ui/               Fresh UI & design                        [KEEP]  L2  (was nav-orphan → gains home)
    /web-layer/how-to/                 (recipes)                                [NEW]   L2  index
      …/customize-fresh-ui/            [MOVE from /how-to/customize-fresh-ui/]           L3
      …/build-a-desktop-frontend/      [MOVE from /how-to/build-a-desktop-frontend/]     L3
      …/build-a-server-validated-form/ [MOVE from /how-to/build-a-server-validated-form/] L3

  /services-sdk/                       Services & SDK                           [KEEP]  L1  (rewrite hub)
    /services-sdk/services/            Services & contracts                     [KEEP]  L2  (was orphan → home)
    /services-sdk/sdk/                 Typed SDK & client                       [KEEP]  L2  (was orphan → home)
    /services-sdk/how-to/              [NEW] L2
      …/add-a-service/ …/discover-services/ …/expose-openapi-scalar/    [MOVE from /how-to/*]  L3 (3)

  /background-processing/              Background jobs                          [KEEP]  L1  (rewrite hub; "workers" taught inside)
    /background-processing/workers/    Background jobs (guide)                  [KEEP]  L2  (was orphan → home)
    /background-processing/polyglot-tasks/ Polyglot tasks                       [KEEP]  L2  (was orphan → home)
    /background-processing/how-to/     [NEW] L2
      …/tune-worker-runtime/ …/run-a-polyglot-task/
      …/add-a-task-runtime-adapter/ …/restrict-worker-task-permissions/  [MOVE from /how-to/*]  L3 (4)

  /durable-workflows/                  Durable workflows                        [KEEP]  L1  (rewrite hub; "sagas" taught inside)
    /durable-workflows/sagas/ streams/ triggers/                                [KEEP]  L2  (all 3 were orphans → homes)
    /durable-workflows/how-to/         [NEW] L2
      …/build-a-validated-ingestion-queue/ …/publish-a-durable-stream/   [MOVE from /how-to/*]  L3 (2)

  /ai/                                 AI & Agents                              [KEEP]  L1  (rewrite hub)
    /ai/mcp/ durable-chat/ chat-ui/                                             [KEEP]  L2
    /ai/engine/                        AI engine (guide)                        [KEEP]  L2  (reprose: demote from "Reference:", §6)
    /ai/agent-tooling/                 Agent tooling                            [MOVE from /capabilities/agent-tooling/]  L2  (was orphan in all-shim dir)
    /ai/how-to/                        [NEW] L2
      …/build-a-durable-chat/          [MOVE from /how-to/build-a-durable-chat/]         L3  (UNKEYED — see §5)

  /data-persistence/                   Data & Persistence                       [KEEP]  L1  (rewrite hub)
    /data-persistence/database/ kv-queues-cron/                                 [KEEP]  L2  (both were orphans → homes)
    /data-persistence/how-to/          [NEW] L2
      …/database-migration/ …/use-a-second-database/                     [MOVE from /how-to/*]  L3
      …/queue-kv-cron/ …/choose-a-queue-provider/   [MOVE from /how-to/*, RE-HOMED from Background Processing]  L3  (4 total)

  /identity-access/                    Identity & Access                        [KEEP]  L1  (rewrite hub)
    /identity-access/auth/             Authentication                           [KEEP]  L2  (was orphan → home)
    /identity-access/better-auth-plugins/                                       [KEEP]  L2
    /identity-access/how-to/           [NEW] L2
      …/add-authentication/            [MOVE from /how-to/add-authentication/]           L3

  /orchestration-runtime/              Orchestration & Runtime  (Aspire home)   [KEEP]  L1  (rewrite hub)
    /orchestration-runtime/cli-scaffold/                                        [KEEP]  L2
    /orchestration-runtime/runtime-config/                                      [KEEP]  L2  (was orphan → home)
    /orchestration-runtime/how-to/     [NEW] L2
      …/deploy/ …/deploy-local-aspire/ …/deploy-deno-deploy/
      …/roll-out-runtime-overrides/ …/graceful-shutdown/
      …/add-a-plugin/ …/author-a-plugin/ …/deno-lsp-code-intelligence/   [MOVE from /how-to/*]  L3 (8)
                                       (deploy-deno-deploy is UNKEYED — see §5)

  /observability/                      Observability                            [KEEP]  L1  (rewrite hub)
    /observability/telemetry/          Telemetry & logging                      [KEEP]  L2  (was orphan → home)
    /observability/how-to/             [NEW] L2
      …/add-opentelemetry/             [MOVE from /how-to/add-opentelemetry/]            L3

━━ REFERENCE ━━  nav.menu("/reference/", "", "order basename")  — 32 units, URLs LOCKED byte-stable
  /reference/                          Reference (index)                        [KEEP][LOCKED] L1
    …31 registered units (ai, aspire, auth, auth-better-auth, auth-kv-oauth, auth-workos,
      cli, config, contracts, cron, database, fresh, fresh-ui, kv, logger, plugin,
      plugin-ai, plugin-ai-core, plugin-auth, plugin-auth-core, prisma-adapter-mysql,
      queue, runtime-config, sagas, sdk, service, streams, telemetry, triggers,
      watchers, workers)…                                                       [KEEP][LOCKED] L2  (single listing; drop the 2nd pillar-section copy)
    /reference/mcp/                    @netscript/mcp                           [REGISTER][LOCKED] L2  (exists on disk; ADD to referenceUnits + REFERENCE_UNITS + ref:mcp)
    /reference/cli/commands/           CLI commands                             [KEEP][LOCKED] L3
    /reference/ai/skills/              AI skills                                [KEEP][LOCKED] L3
    /reference/telemetry/convention/   Telemetry convention                     [KEEP][LOCKED] L3  (was orphan → auto-surfaces via nav.menu)

━━ CONCEPTS ━━  nav.menu("/explanation/", "nav_hide!=true", "order basename")  — plain-English label (Diátaxis demoted)
  /explanation/                        How NetScript works (index)              [KEEP]  L1
    /explanation/architecture/ contracts/ plugin-system/ auth-model/
      durability-model/ observability/ aspire/                                  [KEEP]  L2 (7 essays)

━━ (not in any nav lane) ━━
  /capabilities/*.md  (16 non-index shims + index.md → pillar dirs)             [KEEP as shims]  nav_hide
  + 28 NEW redirect entries at every [MOVE] source (27 recipes + agent-tooling) [NEW]            auto-unlisted via redirects plugin
```

**Verified totals:** 28 pages MOVE · 2 NEW pages (`/quickstart/aspire/`, optional — §8) ·
9 NEW `how-to/index.md` · 16 pages surface in nav for the first time (14 pillar guides currently
unlisted — counting `agent-tooling`, which re-homes to `/ai/` — + `telemetry/convention` + `mcp`) ·
**37 duplicate listings removed** (today's sidebar: 147 entries, 110 unique hrefs) · **0 reference
URLs changed**.

## 3. Sidebar & nav plugin implementation

**Plugin registration (`_config.ts`).** Add `import nav from "lume/plugins/nav.ts"; site.use(nav());`
and `import redirects from "lume/plugins/redirects.ts"; site.use(redirects());`. Registration order
relative to `base_path` is irrelevant for `nav` — it is a template-data provider emitting *source*
(pre-base) URLs, and `base_path()` still runs last and rewrites emitted `href`s. `redirects` must
run before `base_path` (it emits pages). `code_highlight`, `pagefind`, `aiTooling` untouched.

**What replaces `navSections`.** Delete the ~120-entry `navSections` array, the
`NavItem`/`NavSection` types, **and** the `referenceUnits` array (all were nav-only inputs;
reference is now folder-derived). Replace with a compact `navLanes` spine — the *only*
hand-maintained nav data (~35 lines vs ~120):

```ts
export interface NavLane {
  label: string; subtitle: string; icon?: string;
  kind: "flat" | "menu";
  items?: string[];   // flat: curated hrefs (Start)
  roots?: string[];   // menu: nav.menu roots, in curated order (Build owns the 9-pillar sequence)
}
export const navLanes: NavLane[] = [
  { label: "Start", subtitle: "Get running in minutes", kind: "flat",
    items: ["/why/","/quickstart/","/quickstart/aspire/","/concepts/","/cli-reference/","/glossary/","/how-to/"] },
  { label: "Learn", subtitle: "Build one thing end to end", kind: "menu", roots: ["/tutorials/"] },
  { label: "Build", subtitle: "Add a capability to your app", kind: "menu",
    roots: ["/web-layer/","/services-sdk/","/background-processing/","/durable-workflows/",
            "/ai/","/data-persistence/","/identity-access/","/orchestration-runtime/","/observability/"] },
  { label: "Reference", subtitle: "Every symbol, generated", kind: "menu", roots: ["/reference/"] },
  { label: "Concepts", subtitle: "How and why it works", kind: "menu", roots: ["/explanation/"] },
];
```

The nine-pillar curated order lives in `Build.roots` — this is what neutralizes decision D-E1's
concern (a *global* `nav.menu("/")` inverting designed order): top-level lane order and pillar
sequence stay curated data, and `nav.menu` only builds single-home subtrees it can order correctly
with `order` front matter.

**Front-matter conventions (the real content sweep):**

- `order: <n>` on every index + leaf a `nav.menu` root touches (~113 non-shim pages; none exist
  today). Sort string everywhere: `"order basename"` (verified valid multi-field grammar).
  Pillar/track/how-to **index pages get `order: 0`** so the hub sorts first. Tutorial chapters need
  no `order` — their `NN-` basename sorts under the `basename` tiebreak. Recipes get an
  `order: 100+` band so they always cluster after guides inside a pillar.
- `nav_hide: true` filtered out via the `"nav_hide!=true isRedirect!=true"` query (verified:
  negation valid, undefined passes). The Lume `redirects` plugin flags its generated pages
  `isRedirect: true` (redirects.ts:126 — it does **not** set `unlisted`), and every moved-from URL
  lives under `/how-to/` or `/capabilities/`, outside all nav.menu roots; the `isRedirect!=true`
  term is belt-and-braces. Only the 5 `tutorials/eis-chat/*` shims (which live under a rendered
  root) and the retired `/how-to/` catalog need explicit `nav_hide`.
- `nav_title: <str>` only where the sidebar label must differ from the page H1 (today's curated
  labels like "The Fresh page model" diverge from H1s). Template reads
  `node.data.nav_title || node.data.title`.
- Every **nav-rendered content root and its subfolders** (tutorials/*, the nine pillar dirs,
  reference/*, explanation/) already has `index.md` (verified; scope excludes non-content dirs like
  `_components`/`assets`/`styles`) → every section node carries `data`, so every `<summary>` is
  clickable and `order`-sort is hazard-free (no page-less intermediate nodes).

**`base.vto` (replace lines 47–72).** Loop `navLanes`:

- Render each lane divider:
  `<h3 class="nav-lane">{{ lane.label }}<span class="nav-lane-sub">{{ lane.subtitle }}</span></h3>`
  (subtitles are a kept SOTA affordance — Stripe/Lume pattern).
- `kind:"flat"` → curated `<a>`s; active check `page.data.url == href` (drop today's double
  `|> url` dance — source==source, since base_path rewrites the emitted href).
- `kind:"menu"` → for each root, feed `nav.menu(root, "nav_hide!=true", "order basename").children`
  to a recursive **`_includes/menu_item.vto`** partial (the plugin's documented recursion — required
  because Build reaches depth 3 at pillar→how-to→recipe and Reference/Learn reach
  unit/track→subpage). Each folder node is `<details {{ if url.startsWith(node.data.url) }}open{{ /if }}>`;
  leaves are `<a … {{ if node.data.url == url }}aria-current="page"{{ /if }}>`. Per-lane icons come
  from `navLanes`; per-page icons are dropped (nav data carries none).

**Collapse:** default-collapsed siblings, auto-expand the active path via `url.startsWith`. Native
`<details>/<summary>`, zero JS. A reader sees ~5 lane headers + 9 pillar summaries + one open
subtree — strictly fewer on-screen elements than today's 120.

**Breadcrumb (`breadcrumb.vto`).** Replace the `navSections` scan with `nav.breadcrumb(url)`
(root→page array), prefixed by the owning lane label via a small `root→lane` lookup (so
`/web-layer/query/` reads *Build › Web Layer › Data loading & cache*). Guard `{{ if crumb.data }}`.
Behavior change accepted: one deterministic trail replaces "last matching section."

**Next/prev (`nextPrev.vto`).** Keep front-matter-driven for tutorials (per-chapter editorial
control; it never touched `navSections`, cannot break). For Reference (32 units, unmaintainable by
hand) auto-derive with the verified v2.5.4 signature — `nav.nextPage(url, query?, sort?)` /
`nav.previousPage(url, query?, sort?)` (there is **no** basePath argument; nav.ts:85/111). Scope to
the reference lane via the query: `nav.nextPage(url, "url^=/reference/", "order basename")`.

**Untouched chrome (verified nav-agnostic):** `<aside data-sidebar>` shell, brand header, mobile
toggle/backdrop JS, theme toggle, TOC/scroll-spy, code-copy, tabbed-code, edit-this-page footer,
pagefind, code_highlight, base_path, aiTooling, the entire `xref.ts` layer.

## 4. Storyline

**First-time visitor (evaluating).** Lands on `/` (locked outcome-led hero, Aspire named). The
sidebar reads top-down as a promise of the path ahead: **Start** "get running in minutes" →
**Learn** "build one thing end to end" → **Build** "add a capability" → the lookup tail. They never
guess a pillar first. They open the only-expanded **Start** lane — Why · Quickstart · Aspire
quickstart (hero path; `--no-aspire` opt-out one click into `/explanation/aspire/`) · Core concepts ·
CLI reference · Glossary — then commit to **Learn**, the second lane, where a tutorial track walks
them chapter-to-chapter with a lane-prefixed breadcrumb (Learn › Storefront › 03). Alpha framing set
here. Learn-second ordering is the decisive newcomer win; the alternatives buried tutorials below
the pillar wall.

**Returning builder (implementing).** Goes straight to **Build**, where all nine pillar names are
visible and contiguous (no Build/Operate fracture — Observability and Orchestration are right there
in the capability set). Expands the one pillar they need — say **Background jobs** — and sees its
whole world in one expand: the overview hub, the `workers` and `polyglot-tasks` guides (no longer
orphaned), then a **Recipes** node with `tune-worker-runtime`, `run-a-polyglot-task`,
`restrict-worker-task-permissions` right beside the guide they serve. Learn → do → look up is one
vertical scan, not a hunt through a decontextualized 27-item list. When they need a queue provider,
muscle memory sends them to **Data & Persistence** where `queue-kv-cron` and
`choose-a-queue-provider` live next to the `kv-queues-cron` guide (re-homed for semantic fit). The
pillar hub card-grids out to the matching tutorial and deep-dive via `xref`, so cross-cutting
content is one prose click away without polluting the tree.

**API-lookup user (or agent).** Ignores the top three lanes; jumps to **Reference** (or ⌘K
pagefind, or the `.md` twin / `llms.txt`). Gets the flat, `order`-banded, byte-stable 32-unit tree
keyed by package — families clustered (`auth*`, `plugin*`) — now including the previously-orphaned
`mcp` and the `telemetry/convention` / `cli/commands` / `ai/skills` L3 subpages that surface
automatically because the tree is folder-derived. Auto next/prev pages through the set. Reference is
never scattered into pillars, so a symbol-hunter never touches the capability spine.

**Concepts** sits last as the "graduate to understanding" tier — the essays a productive user reads
once (Concepts-second alternatives were penalized for inverting do-before-understand).

## 5. Cross-reference & migration plan

**Verified counts (re-checked in-repo 2026-07-18):** 32 reference unit dirs on disk (`mcp` present,
unregistered; today's `referenceUnits` nav array has 33 entries because `cli/commands` and
`ai/skills` ride as extra rows) · 27 recipes (flat `.md`, excluding `index.md`) · 26 `howto:` keys incl. `howto:index` → 25 recipe keys;
exactly 2 recipes UNKEYED: `build-a-durable-chat`, `deploy-deno-deploy` · ~517 hardcoded absolute
markdown links (`](/…)` form; 533 in the broader sweep incl. anchored/mixed forms) + 25 relative
links · 61 hardcoded inbound to `/how-to/<slug>` (markdown form) · 6 inbound to `agent-tooling` ·
`capabilities/agent-tooling.md` is a real `base.vto` page (verified), movable.

**Movement scope:** 28 URL moves (27 recipes → `/<pillar>/how-to/<recipe>/`;
`capabilities/agent-tooling` → `/ai/agent-tooling/`). `/cli-reference/` NOT moved (kept in Start,
reframed) — saves 14 inbound + the `cli:reference` xref. Reference: 0 moves.

**Per moved URL, three actions:**

1. **Redirect** via the Lume `redirects` plugin: add `oldUrl: /how-to/<slug>/` front matter to the
   destination page (auto-sets `unlisted:true`, so no manual `nav_hide` and no shim file). 28
   one-line additions. GitHub Pages emits no 301s; the plugin's meta-refresh stub is the mechanism
   (supersedes hand-rolled `redirect.vto` files for these moves; keeps the 21 existing
   `redirect.vto` shims as-is).
2. **xref retarget:** repoint the 25 existing recipe `howto:` keys; **add 2 new keys**
   (`howto:build-a-durable-chat`, `howto:deploy-deno-deploy`) so the build link-checker covers them
   (they currently ride on nothing — a gap all three source proposals missed); add
   `cap:agent-tooling → /ai/agent-tooling/` (currently unkeyed, 6 hardcoded inbound). = ~28 xref
   edits.
3. **Hardcoded sweep (kill double-hops):** repoint the 61 `](/how-to/<slug>)` + 6 agent-tooling
   markdown links to canonical new URLs — grep-scriptable (`/how-to/<slug>/` →
   `/<pillar>/how-to/<slug>/` via a slug→pillar map). Redirects keep old links working, so this is
   deferrable/incremental, not a build-blocker.

**Orphan/registration fixes (no move):** add `mcp` to `referenceUnits` (data) + `REFERENCE_UNITS`
(xref) + a `ref:mcp` key (build throws on unknown key, so this must land before any `ref:mcp` use).
The ~203 `xref` links overall need zero shims (they move for free with href retargets).

**aiTooling coupling (first-class step for every move):** after any URL change, regenerate
`llms.txt`/tiered variants and the per-page `.md` twins (aiTooling in `_config.ts` is URL-coupled);
external deep-links to old `.md` twins have no shim, so this is required, not optional.

**Front-matter sweep (additive, zero link risk):** `order` on ~113 pages; `nav_title` on ~40;
`nav_hide` on the eis-chat shims + `/how-to/` catalog. Cannot break a link — only mis-sequence a
menu (visual QA catches it).

**Ordered migration slices — each ends `deno task verify` (check-internal-links) green:**

- **S0** — Register `nav` + `redirects` plugins; add `order`/`nav_title` front matter site-wide;
  keep old `navSections` rendering. *(additive, no URL change → green)*
- **S1** — Register `mcp` (referenceUnits + REFERENCE_UNITS + `ref:mcp`); add the 2 missing
  `howto:` keys pointing at *current* URLs. *(fixes orphans in place → green)*
- **S2** — Move `agent-tooling` → `/ai/agent-tooling/` (`oldUrl`, key, regenerate aiTooling).
  *(1 move → green)*
- **S3.1–S3.9** — Move recipes **one pillar at a time**: per pillar, move N recipes to
  `/<pillar>/how-to/`, add `how-to/index.md`, set `oldUrl`, retarget keys, regenerate aiTooling.
  *(green after each pillar; re-home queue recipes to Data in the data-persistence slice)*
- **S4** — Swap `base.vto` from `navSections` to `navLanes`+`nav.menu`; swap `breadcrumb.vto` to
  `nav.breadcrumb`; switch Reference `nextPrev` to `nav.nextPage`; delete
  `navSections`/`referenceUnits` arrays. *(render swap; URLs already stable → green)*
- **S5** — Hardcoded double-hop sweep (incremental). *(green throughout)*
- **S6** — Prose rewrites (§6). *(green throughout)*

**Net:** 28 moves, 28 `oldUrl` redirect lines, ~28 xref retargets + 3 additions, 9 new how-to
indexes, ~113 additive front-matter edits, ~67 optional hardcoded repoints. Reference: 0 URL
changes; 1 registration.

## 6. Rewrite list

**Priority 1 — required for the new IA to be coherent:**

- 9 pillar `index.md` (`/web-layer/`, `/services-sdk/`, `/background-processing/`,
  `/durable-workflows/`, `/ai/`, `/data-persistence/`, `/identity-access/`,
  `/orchestration-runtime/`, `/observability/`): rewrite thin overviews into true **card-grid
  hubs** — because the sidebar no longer cross-lists, each hub must surface its reference unit(s)
  (`ref:`), its tutorial ("Start here → …"), and its deep-dive (`explain:`) as prose cards. This is
  where all removed cross-listing re-lands.
- `/how-to/index.md`: rewrite from a live tier into a flat **all-recipes catalog** linking every
  recipe at its new pillar URL via `howto:` xref; `nav_hide`, reachable from Start + pillar hubs.
- `/concepts/`: strip the "Quickstart: trace the model" (Observability cross-listing) framing;
  single-home as Core concepts; deconflict altitude vs `/explanation/architecture/` (5-min model vs
  deep why).

**Priority 2 — de-duplication the IA exposes:**

- `/cli-reference/`: reframe as a task-oriented CLI cheat-sheet; defer symbol tables to
  `/reference/cli/commands/` (ends the 3-way CLI overlap).
- `/ai/engine/`: demote from "Reference: AI engine" to a guide; point to `/reference/ai/` +
  `/reference/plugin-ai/` + `/reference/plugin-ai-core/` (ends 4-way AI-reference duplication).
- `/ai/agent-tooling/` (moved): reframe as an AI-pillar guide; dedup CLI+MCP overlap; refresh the
  2026 agent surface (llms.txt / docs-MCP / copy-as-markdown).
- `/explanation/{observability,auth-model,durability-model}/`: set explicit altitude ("this essay
  is *why*; the pillar is *how*") and cross-link both ways so the Concepts lane doesn't read as
  orphaned duplication.

**Priority 3 — light edits:**

- 27 moved recipes: add `order` (100+ band), `nav_title`; remove now-redundant "see the X pillar"
  pointers (co-located now).
- 5 tutorial track indexes: add a closing "after this track → **Build › <pillar>**" hand-off
  (replaces implicit cross-listing).
- Pillar hubs referencing mid-tutorial-chapter "Quickstart" anchors: repoint prose to the track
  index or pillar quickstart (deep-links retired from nav).
- `/reference/mcp/index.md`: add `title`/`order` front matter to join the tree.
- `/quickstart/aspire/` (if authored): new thin page framed as TS AppHost inspection, never .NET.
- `/why/` + `/`: verify Aspire hero framing, alpha framing, no banned superlative claims.

The 13 formerly nav-orphan pillar guides already in their pillar dirs need **no prose change** — they only gain nav homes.

## 7. Rejected alternatives

**P2's original journey lanes (the winning spine, but two features rejected).** *Argued:* 6
lifecycle lanes (Start/Learn/Build/Operate/Reference/Concepts), 1 URL move, recipes as a flat
`nav.menu("/how-to/")` list under Build, deploy recipes surfaced a second time via hand-rolled
`extraLinks` under Operate. *Rejected features:* (a) the Build/Operate split fractured the
capability set — a builder wanting telemetry had to know Observability was under Operate, not Build
(reader judge: scent failure); replaced by nine contiguous pillars in one Build lane. (b) The flat
27-recipe list decontextualized recipes from their guides — P2 cited "Astro nests recipes inside
Guide" then declined to do it (reader + sota judges: its central unfulfilled claim); replaced by
pillar-nested recipes. (c) The `extraLinks` re-introduced duplicate listings via hand-rolled hrefs —
the exact disease the exercise cures (sota judge). *Kept from P2:* lane spine, subtitles,
Learn-second ordering, Concepts-last, lane-prefixed breadcrumb, `redirects`-plugin instinct, correct
plugin-registration reasoning.

**P1 capability-native (2nd on reader, strong on migration/sota).** *Argued:* nine pillars
top-level in bands, recipes nested in real `/<pillar>/how-to/` subfolders, `/how-to/` demoted to
catalog. *Rejected as a whole because:* it kept ~13 collapsible top-level roots — above the 6–9
SOTA ceiling, "the same over-count that ails the current site, merely collapsed" (sota judge); and
buried tutorials/reference at the bottom, failing the newcomer and API-lookup personas (reader
judge). It was also silent on the aiTooling `llms.txt`/`.md`-twin ripple of its own moves and on
the 2 unkeyed recipes. *Kept from P1:* the namespaced `/<pillar>/how-to/<recipe>/` subfolder
mechanism (adopted wholesale — plugin-native, collision-proof, depth-3 under top-level pillars),
the pillar-hub card-grid rewrite spec, the D-E1 fallback ladder.

**P3 Diátaxis-separation (sota winner, but rejected as spine).** *Argued:* 5 groups
(Start/Concepts/Guides/Tutorials/Reference), pillars demoted into a single "Guides" collapse,
inline `diataxis:` cluster sublabels for in-pillar recipes. *Rejected because:* (a) it hid all nine
pillar names behind a generic "Guides" collapse — worst capability visibility (reader judge). (b)
It made the Diátaxis quadrant names the literal front-door labels while claiming to honor the
locked decision that demotes exactly those labels — an unreconciled contradiction. (c) It ordered
Concepts second, before doing (inverts newcomer flow). (d) It stacked two locked-decision
deviations — the highest ratification risk (migration judge). *Kept from P3:* the `redirects`
plugin (`oldUrl` + auto-`unlisted`), the aiTooling-coupling migration step, the two-orphan capture
(`mcp` + `telemetry/convention`), the queue-recipe re-home to Data. *Rejected in favor of P1's:*
the inline `diataxis:` sublabels (transition-detection fragility + collision-prone flat slugs) lost
to P1's real subfolder.

## 8. Risks & open questions for the maintainer

Supervisor recommendations are inline; items 1–4 need explicit maintainer sign-off before S2+.

1. **The recipe-move trades the 1-move migration win.** Pillar-nested recipes = 28 moves + 28
   redirects + aiTooling regen instead of 1 move. **Recommendation: accept** — two of three judges
   ruled the flat recipe list unacceptable, the cost is build-gated, and in-pillar co-location is
   the core reader-scent payoff of the whole redesign. Fallback: flat `nav.menu("/how-to/")` list
   (1 move) if you value URL stability above scent.
2. **Decision D-E1** ("`nav.ts` for the Reference sub-tree ONLY") lives in
   `09-research-integration.md` §3, **not** in the user-binding `08-decisions-locked.md` — it is an
   engineering caveat, not a user lock. **Recommendation: amend** to "curated data owns
   cross-level/top-level order; `nav.menu` builds any single-home subtree." Fallback ladder: render
   Build/Learn/Concepts from curated per-root link arrays and restrict `nav.menu` to `/reference/`
   only — preserves every URL decision, loses folder-derived depth.
3. **`choose-a-queue-provider` re-home** to Data & Persistence is reader-endorsed for co-location
   with `kv-queues-cron`, but is arguably a Background-Processing concern.
   **Recommendation: Data & Persistence** (co-location wins; the move is one front-matter line to
   reverse). `queue-kv-cron` → Data is unambiguous.
4. **`/quickstart/aspire/` new page** — the locked "Aspire hero-level" decision wants a hero CTA
   landing. **Recommendation: author it** (thin page, small scope) rather than deep-linking into
   `/orchestration-runtime/`.
5. **Loss of sidebar cross-listing is deliberate** (nav plugin enforces one home). Discoverability
   re-lands entirely in the pillar-hub card-grid rewrites (Priority 1). **The hub rewrites are
   load-bearing, not optional polish** — they ship in the same wave as S4.
6. **~113-page `order` sweep is broad and un-gated.** A wrong `order` mis-sequences a menu
   silently. **Recommendation: add a lint** that fails any nav-rendered page missing `order`, and
   any page with `oldUrl`/`redirectTo` not `unlisted`/`nav_hide`.
7. **Vento authoring landmines** (prior research): the literal word `function` inside a comp-tag
   argument aborts the build; never run repo-wide `deno fmt`; pre-flight the recursive
   `menu_item.vto` against the deepest paths (`/reference/cli/commands/`,
   `/web-layer/how-to/customize-fresh-ui/`) with a real build.
8. **Reference count is 32, not "33/34".** `mcp` exists on disk but is unregistered (verified). Any
   downstream doc or count built on "34 units" is wrong.
