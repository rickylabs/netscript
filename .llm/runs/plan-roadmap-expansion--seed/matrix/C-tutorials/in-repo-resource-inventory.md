# In-repo resource inventory — Topic C

## Existing tutorial tracks (docs/site/tutorials/, NetScript worktree)

Five tracks exist today (not four — see `context/C-tutorials/drift-candidates.md`):

| Track | Path | Chapters | Landed |
|---|---|---|---|
| Storefront | `docs/site/tutorials/storefront/` | 6 (`01-scaffold` … `06-deploy`) | commit `a01722e2` "docs-v4 IA overhaul" |
| Team Workspace | `docs/site/tutorials/workspace/` | 6 | commit `a01722e2` |
| ERP Sync | `docs/site/tutorials/erp-sync/` | 5 | commit `a01722e2` |
| Live Dashboard | `docs/site/tutorials/live-dashboard/` | 6 | commit `a01722e2` |
| AI Chat | `docs/site/tutorials/chat/` | 4 | commit `2f643f49` "beta.2 overhaul — AI stack, durable chat, Deno Deploy (#383)" — landed **later**, separately |

Plus `docs/site/tutorials/index.md` — the tracks landing page (five-lane `featureGrid` + `apiTable`
"choose by what you're building").

## Planning corpus (docs/site/_plan/)

- `00-README.md`, `01-positioning-brief.md`, `02-information-architecture.md` (the nav ladder + the
  original "4-tutorial" decision, Q10), `03-page-outlines.md`, `04-engine-and-components.md`,
  `05-build-migration-plan.md`, `06-reference-site-teardown.md`, `07-questions-for-user.md`,
  `08-decisions-locked.md` (locked tone/voice), `09-research-integration.md`.
- `research/00-research-summary.md`, `research/doc-architecture-patterns.md`,
  `research/lume-vento-plugins.md`, `research/market-fit.md`, `research/netscript-feature-landscape.md`.
- `research/competitors/{astro,encore,hono,laravel,lume,medusa,nestjs,tanstack,temporal,trpc}.md` — 9
  prior teardowns; `medusa.md` and `astro.md` were re-read for this topic, the rest are cited via
  `doc-architecture-patterns.md`.
- `briefs/00-INDEX.md`, `briefs/phase-1-front-door.md`.
- `samples/{callout.vto,index.vto}` — reference Vento component usage samples.
- `worklog/{index.md,quickstart.md,why.md}`.

## Site plumbing that touches tutorials

- `docs/site/_data.ts` — `navSections`: 8 capability hubs each link to a specific tutorial chapter as
  their "Quickstart" anchor (see `analysis/C-tutorials/03-docs-cut-logistics.md` for the full map).
  This is the load-bearing nav-wiring surface for any URL/slug change.
- `docs/site/deno.json` tasks: `build` (Lume), `check:links`, `check:caveats`, `verify` (all three
  chained), `diagrams:render` / `diagrams:check`.
- `docs/site/_includes/layouts/base.vto`, `docs/site/styles/` — chrome, explicitly marked KEEP in
  `02-information-architecture.md`.

## eis-chat reference export (`.llm/tmp/eis-chat-ref/`, read-only, private repo mirror)

- `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/BUILD-PLAN.md` (the scaffold-to-NetScript bridge
  doc), `docs/PHASE-1..7-*.md`, `docs/PHASE-5-NOTES.md`, `docs/HANDOVER.md`, `docs/INDEX.md`,
  `docs/SKILL.md`, `docs/DESKTOP-SHELL.md`.
- `docs/assets/*.png` — 9 real screenshots + 1 example-input image (full inventory in
  `analysis/C-tutorials/02-eis-chat-build-arc.md`).
- Real seam-dogfooding source: `services/eischat`, `contracts/versions/v1/*.contract.ts`,
  `packages/channel/mod.ts`, `workers/{jobs,tasks}/`, `streams/notifications-stream.ts`,
  `plugins/channel-sync/`, `database/sqlite` (Prisma), `apps/dashboard/`, `aspire/`.
- `.design-sync/` — the "NS One" design system (Topic A's concern, not re-analyzed here).
