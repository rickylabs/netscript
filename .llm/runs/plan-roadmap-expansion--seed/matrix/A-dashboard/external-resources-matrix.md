# Topic A — Dev Dashboard: External Resources Matrix (B1)

Master matrix of every useful resource found for the NetScript Dev Dashboard topic: upstream Aspire
docs, competitor dev-console prior art, in-repo seams, design-system source, doctrine, and prior-art
issues. The **where-distilled** column indexes into the B2 (`analysis/A-dashboard/`), B3
(`research/A-dashboard/`), and B4 (`context/A-dashboard/`) files where each resource is worked out in
depth. Competitor rows are consolidated from `_draft-competitor-rows.md` (kept alongside for the raw
teardown link set).

Legend — `kind`: `upstream-doc` · `competitor` · `in-repo-seam` · `design-system` · `doctrine` ·
`prior-art-issue` · `convention`.

## A. Aspire upstream (dashboard-extension surface)

| resource | kind | why it matters | where distilled |
|---|---|---|---|
| Aspire `custom-resource-commands` doc (`WithCommand`/`withCommand`) | upstream-doc | The plugin's Aspire-side action seam; TS AppHost SDK **has** `withCommand` (one seam → dashboard menu + `aspire resource` CLI + MCP tool) | [research/…/01](../../research/A-dashboard/01-aspire-dashboard-extension-surface.md#1-withcommand--custom-resource-commands--does-have-a-typescript-path) |
| Aspire `interaction-service-preview` doc (`IInteractionService`) | upstream-doc | **Hard constraint:** NOT available in the TS AppHost SDK regardless of version; command `arguments` (InteractionInput prompt) is the substitute | [research/…/01 §2](../../research/A-dashboard/01-aspire-dashboard-extension-surface.md#2-interaction-service--confirmed-not-available-in-the-typescript-apphost-sdk) |
| Aspire custom resources / `addExecutable` / `addNodeApp` / browser-logs | upstream-doc | How a Deno/Fresh app is modeled as an Aspire resource + `withBrowserLogs` (the #218 mechanism) | [research/…/01](../../research/A-dashboard/01-aspire-dashboard-extension-surface.md), [research/…/02](../../research/A-dashboard/02-aspire-version-pin-and-apphost-seam.md) |
| Aspire OTLP / resource-graph / structured-logs data surfaces | upstream-doc | Beta.6 first data source for the dashboard before Topic B lands; OTLP is open, resource-service is internal gRPC | [context/…/01](../../context/A-dashboard/01-telemetry-consumer-seam.md) |
| `aspire` MCP server tool set (`list_resources`/`list_traces`/`list_structured_logs`) | upstream-doc | Most concrete structured query surface available today for resource/log/trace data | [context/…/01](../../context/A-dashboard/01-telemetry-consumer-seam.md) |

## B. Competitor dev-console prior art (IA teardown)

| resource | kind | why it matters | where distilled |
|---|---|---|---|
| Encore Local Dev Dashboard (Service Catalog, API Explorer, Encore Flow, trace waterfall) | competitor | The headline analog — code-derived live infra map + typed API explorer; "Encore Flow" is the signature spark | [research/…/03 §1](../../research/A-dashboard/03-competitor-dev-console-teardown.md#1-encore--local-development-dashboard) · in-repo `docs/site/_plan/research/competitors/encore.md` |
| Temporal Web UI (workflow list, event-history detail, task-queue health) | competitor | run-list→detail→history pattern for sagas/workers/triggers/streams; multi-altitude history (All/Compact/JSON) | [research/…/03 §2](../../research/A-dashboard/03-competitor-dev-console-teardown.md#2-temporal--web-ui) · in-repo `competitors/temporal.md` |
| Inngest dev server (function runs, step-timeline waterfall, rerun/replay) | competitor | Two-panel step waterfall + rerun-from-step + attempt badges = ergonomic standard for step-function inspection | [research/…/03 §3](../../research/A-dashboard/03-competitor-dev-console-teardown.md#3-inngest--dev-server-ui) |
| Trigger.dev dashboard (run list/detail, live logs, Detail/Context tabs) | competitor | Clean split of platform-recorded vs userland run context; live-tail logs | [research/…/03 §4](../../research/A-dashboard/03-competitor-dev-console-teardown.md#4-triggerdev--dashboard--run-inspector) |
| Prisma Studio (data browser) | competitor | **Different category** (data-CRUD, not infra/observability); NetScript `db` surface already owns this — defer | [research/…/03 §5](../../research/A-dashboard/03-competitor-dev-console-teardown.md#5-prisma-studio--data-browser-different-category--data-crud-not-infraobservability) |
| Nitro dev-server devtools (`/_nitro/*` introspection) | competitor | Machine-readable dev introspection endpoint pattern the Fresh dashboard consumes to render plugins/routes/jobs | [research/…/03 §6](../../research/A-dashboard/03-competitor-dev-console-teardown.md#6-nitro--dev-server-devtools) |
| In-repo competitor doc-teardowns (`competitors/{medusa,trpc,hono,nestjs,astro,laravel,lume,tanstack}.md`) | competitor | Documentation-IA teardowns (sidebar/Diátaxis/hero), not dashboard-UI — contributed positioning framing only | in-repo `docs/site/_plan/research/competitors/*.md` |

Full candidate-panel row set (14 rows, categorized core-v1 vs deferred vs convention):
[`_draft-competitor-rows.md`](./_draft-competitor-rows.md).

## C. In-repo seams (what the dashboard hooks into)

| resource | kind | why it matters | where distilled |
|---|---|---|---|
| `@netscript/aspire` package (contribution-registry, `AspireNSPluginContribution` base, `AspireBuilder` port, TS builder adapter) | in-repo-seam | The plugin→Aspire contribution seam; **closed `AspireResourceKind` set has no command/app kind** today → gap for a dashboard plugin | [research/…/02](../../research/A-dashboard/02-aspire-version-pin-and-apphost-seam.md) |
| `register-apps.mts` / `addExecutable` / `withBrowserLogs` (scaffolded apphost helpers) | in-repo-seam | Config-driven app-registration path — the raw-SDK escape hatch where `withCommand`/Fresh-app embedding is actually reachable today | [research/…/02](../../research/A-dashboard/02-aspire-version-pin-and-apphost-seam.md) |
| `plugins/workers` + `packages/plugin-workers-core` | in-repo-seam | Heavy reference plugin: the thin-plugin/fat-core split archetype | [analysis/…/04](../../analysis/A-dashboard/04-plugin-archetype-grounding.md) |
| `plugins/streams` + `packages/plugin-streams-core` | in-repo-seam | Thin utility plugin — closer analog for a dashboard plugin's shape | [analysis/…/04](../../analysis/A-dashboard/04-plugin-archetype-grounding.md) |
| `packages/plugin` base contract/service seam + `plugin new` skeleton | in-repo-seam | Minimal starting shape; base contract is a real non-phantom oRPC `ContractProcedure` | [analysis/…/04](../../analysis/A-dashboard/04-plugin-archetype-grounding.md) |
| `netscript plugin add` JSR-install path (`scaffold.plugin.json` dynamic `provider.kind`) | in-repo-seam | `plugin add dashboard` needs **no CLI code change** — dynamic registration from the package manifest | [analysis/…/04](../../analysis/A-dashboard/04-plugin-archetype-grounding.md) |

## D. Design system (D-NSONE evidence)

| resource | kind | why it matters | where distilled |
|---|---|---|---|
| `@netscript/fresh-ui` registry (46 components, tokens, runtime primitives, `ui:add` copy-source CLI) | design-system | Current UI surface; copy-based registry with `copyOwnership: app-owned-after-copy` | [analysis/…/01](../../analysis/A-dashboard/01-fresh-ui-current-surface-inventory.md) |
| eis-chat `.design-sync/` ("NS One": conventions.md, previews/, config.json, NOTES.md) | design-system | The Claude design-sync spec (L0–L4, `--ns-*` tokens, layout objects, prompt.md+d.ts convention) | [analysis/…/02](../../analysis/A-dashboard/02-eis-chat-design-sync-full-extraction.md) |
| eis-chat `apps/dashboard/components/ui/**` (real implementation) | design-system | The REAL NS One truth chain (not `previews/`); 41-component set incl. 9 L3 blocks | [analysis/…/02](../../analysis/A-dashboard/02-eis-chat-design-sync-full-extraction.md), [analysis/…/03](../../analysis/A-dashboard/03-fresh-ui-vs-nsone-gap-inventory.md) |
| fresh-ui vs NS One 41-component parity table (D-NSONE cost surface) | design-system | **Shared L0–L2 layer is byte-identical** (copy-source); real gap = fresh-ui has no L3 blocks layer | [analysis/…/03](../../analysis/A-dashboard/03-fresh-ui-vs-nsone-gap-inventory.md) |
| `fresh-ui-horizontal` skill (`l0-conventions.md`, `theme-authoring.md`) | design-system | NetScript's own L0–L4 convention — same lineage as NS One | in-repo `.claude/skills/fresh-ui-horizontal/` |

## E. Doctrine & prior art

| resource | kind | why it matters | where distilled |
|---|---|---|---|
| `docs/architecture/doctrine/06-archetypes.md` (ARCHETYPE-5 Plugin) + `.llm/harness/archetypes/ARCHETYPE-5-plugin.md` | doctrine | Required shape/gates for `plugins/dashboard` + `packages/plugin-dashboard-core` | [analysis/…/04](../../analysis/A-dashboard/04-plugin-archetype-grounding.md) |
| Plugin-thinness / core-centralization law (memory + `specs/01`) | doctrine | Dashboard plugin stays thin, meets flagship bar; convention-bearing primitives live in core | [analysis/…/04](../../analysis/A-dashboard/04-plugin-archetype-grounding.md) |
| NetScript issue #218 (CLOSED — Aspire browser-logs devtools) | prior-art-issue | "Wrap, don't reinvent" — extend Aspire's native browser-logs; flags HTTP/1.1 6-connection ceiling for durable-streams | [analysis/…/05](../../analysis/A-dashboard/05-issue-218-prior-art.md) |
| Auto-launch + fixed port + real-time + code/scaffold-derived | convention | Universal dev-console UX (Encore :9400, Prisma :5555, Temporal, Inngest); constrains how every panel behaves | [research/…/03 synthesis](../../research/A-dashboard/03-competitor-dev-console-teardown.md#cross-tool-synthesis--the-recurring-ia-vocabulary) |
