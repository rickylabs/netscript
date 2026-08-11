# board:dashboard — the existing Dev Dashboard board, reconstructed

> Stage-B discovery corpus for the DevTools Contribution Architecture RFC (`plan-devtools-contribution--seed`).
> **This file records what EXISTS. It is research evidence, not ratified architecture.**
> Baseline: `main` @ `2256a67bf`; corpus authored on branch `plan/devtools-contribution` (worktree HEAD `89c539584`,
> which adds only this run's own artifacts — verified `rtk git log --oneline -1`).
> All GitHub reads were performed with `gh` against `rickylabs/netscript` on 2026-08-11. No mutations were made.

---

## Summary

The "Dev Dashboard" is a **fully-specified, zero-implemented** board. Epic #400 plus 30 children describe a
Fresh/`@netscript/fresh-ui` dashboard shipping as `plugins/dashboard` + `packages/plugin-dashboard-core`, but no such
directory exists at the baseline (`ls plugins/` → `ai auth sagas streams triggers workers`; `ls packages/` has no
`plugin-dashboard-core`). Every artifact produced so far is design/analysis under `.llm/runs/` and `resources/design/`,
plus one shipped tool (`tools/design-sync/`). The board has been rescoped once (2026-07-06, run `dashboard-rescope--seed`,
32 GitHub mutations, owner-ratified) onto a **three-pillar thesis** — Observe / Manage / Follow — with three hard
acceptance lines (non-duplication, one-generator-two-callers, flow≠waterfall). That thesis, and specifically the
Aspire/Scalar/NetScript ownership split quoted in §2, is the durable asset; the screen list, the URL scheme, and the
contribution-seam design around it have all been overtaken.

Authority is unevenly distributed. **PR #685 is merged** and therefore its files are on `main` — but what it merged is
*analysis and Claude-Design prompts*, explicitly "analysis only / no product code changed" (`run-eval.md:3-5`); its own
label is still `status:research`. **PR #780 is an open draft with no labels and no milestone**, containing only visual
prototype passes; nothing in it is ratified. **PR #506 was closed as superseded by #685** after its valuable content
(`tools/design-sync/`) was absorbed. Meanwhile the **merged Frontend Contribution Layer RFC #890 / epic #922** has
already claimed the discovery/registry/host pipeline the dashboard board assumed it would invent (#427), and has filed
its own dashboard-zone panel children (#933, #944). The dashboard board is therefore not merely stale — it is
**partially superseded by a later, ratified RFC**, and its milestone placement (children on `0.0.15`, epic on
`Backlog / Triage`, while milestone `0.0.14` is *described* as "Dev dashboard (thin, contribution-based)" and contains
zero dashboard issues) no longer matches any plan.

---

## Findings

### F1 — Zero dashboard product code exists at the baseline

`ls plugins/` returns `ai auth sagas streams triggers workers`; `ls -d plugins/dashboard packages/plugin-dashboard-core`
returns `No such file or directory` for both. `ls packages/fresh-ui/registry` returns `components islands lib styles theme`
— **no `blocks/`**, so DDX-0 (#410, "fresh-ui L3 `blocks/` promotion") is also unimplemented.
The only shipped artifacts from the whole program are `tools/design-sync/` (wired as `deno.json:80` `"design:sync"`) and
`resources/design/dashboard/` (4 HTML screens + specs, last touched by release commit `4d438ce1a`, `rtk git log -- resources/design/dashboard`).
**Kind: observed.**

### F2 — Epic #400 is the rescoped v2 epic, on `Backlog / Triage`, `type:umbrella`, `status:plan`, `priority:p1`

`gh issue view 400 --json ...` → state OPEN, milestone `Backlog / Triage`, labels
`type:umbrella, area:plugins, area:aspire, wave:v1, area:fresh-ui, area:telemetry, status:plan, priority:p1, epic:dev-dashboard`.
Title: *"epic: NetScript Dev Dashboard — the Aspire/Scalar satellite that drives the framework (ships as a plugin, beta.6)"*.
Its body is self-dated: *"**Rescoped 2026-07-06 (owner mandate, amended same day).** The pass-1 direction duplicated
Aspire/Scalar surfaces."* **Kind: observed.**

### F3 — The ownership thesis (verbatim, from #400's body) — the charter's "must be preserved" item

> **Aspire owns:** resources, console/structured logs, raw traces, metrics, health, process lifecycle.
> **Scalar owns:** API reference, schemas, try-it, code samples.
> **The dashboard owns:** primitive run-state (executions/attempts, saga instances incl. `compensating`, trigger firings,
> stream deliveries), the runtime override/config layer **including gated write-back**, plugin-registry wiring + doctor +
> contribution axes, contract provenance/coverage/duality, route→contract binding, codegen/scaffold state (migrations,
> drift), **the per-capability management loop (create → configure(tabs) → monitor)**, and **the live request journey
> across framework seams (S13)**.

Source: `gh issue view 400 --json body` (https://github.com/rickylabs/netscript/issues/400).
It is operationalised by three **acceptance lines** in the same body, quoted here because they are the enforceable form
of the thesis:

1. *"**Non-duplication.** No dashboard screen may render, as an owned surface: an OTLP trace waterfall / span-bar gantt,
   a structured/console log tail, a metrics chart, a resource start/stop/restart panel, or an OpenAPI operation list /
   try-it console. … Every merged panel must pass **"why can't this just deep-link to Aspire/Scalar?"** with a
   NetScript-only answer recorded in its issue."*
2. *"**One generator, two callers.** Every dashboard mutation invokes the same contract route / CLI scaffolder the
   terminal does and renders its CLI-equivalent line (`netscript …` CodeBlock). No dashboard-only write paths, no forked
   codegen."*
3. *"**Flow ≠ waterfall.** S13 renders a primitive-grouped causal chain with payloads at seams, assembled from
   NetScript's own seam events; … No span bars, no time-proportional gantt, no log tails in S13 — ever."*

The same body records a **"Killed / folded surfaces"** list "documented so they don't creep back": raw OTLP waterfall
renderer, logs panel (#421), resource-control panel (#422), service `/health` panel, metrics charts + GenAI conversation
view, Scalar-style operation list / try-it. **Kind: observed.**

### F4 — Per-issue inventory (epic #400 and every `epic:dev-dashboard` child)

Metadata from `gh issue list --label epic:dev-dashboard --state all --limit 100 --json number,title,state,stateReason,milestone,labels`;
the "asks for" line is distilled from `gh issue view <n> --json body` (first section of each body).

| # | Title (short) | State | Milestone | Key labels | What it actually asks for (one line) |
|---|---|---|---|---|---|
| **400** | epic: Dev Dashboard — Aspire/Scalar satellite | OPEN | `Backlog / Triage` | `type:umbrella` `status:plan` `p1` | The umbrella: three pillars (Observe/Manage/Follow), 13 screens S1–S13, four integration seams, three acceptance lines. |
| **410** | DDX-0 fresh-ui L3 `blocks/` + copy-source registry | OPEN | `0.0.15` | `type:feat` `gate:jsr` `p1` | Promote curated L3 blocks into `fresh-ui/registry/blocks/` with a copy-source model, proved by a scripted byte-diff of 32 fresh-ui⇄eis-chat pairs. |
| **411** | DDX-1 `@netscript/aspire` `command` + `app` kinds | OPEN | `0.0.15` | `type:feat` `area:aspire` `p1` | Widen `AspireResourceKind` with `'command'`/`'app'` and let plugins contribute `withCommand(...)` so the dashboard is a first-class Aspire resource ("one seam, three surfaces"). |
| **412** | DDX-2 `plugin-dashboard-core` scaffold + contract seam | OPEN | `0.0.15` | `type:feat` `gate:jsr` `p1` | Doctrine-05 core package: domain models (`ResourceGraph`, `PanelDescriptor`, `RunRecord`, `ContractCatalogEntry`, `RuntimeConfigChange/Version`, `PluginContributionAxes`, `MigrationStatus`), `TraceRef` correlation-only, 4 ports, `DashboardContract`. |
| **413** | DDX-3 `TelemetryQueryPort` + aspire-otlp-http adapter | OPEN | `0.0.15` | `type:feat` `area:telemetry` `p1` | One correlation-only query port over Aspire `/api/telemetry/*` that resolves a `traceId` for an out-link — never re-renders OTLP. |
| **414** | DDX-4 `plugins/dashboard` thin plugin + E2E join | OPEN | `0.0.15` | `type:feat` `gate:jsr` `p1` | The thin plugin package: `scaffold.plugin.json`, `definePlugin(...)`, adapter install/doctor/info/update/remove, typesafe codegen glue, contracts re-export. |
| **415** | DDX-5 / S1 shell + app-registration + IA | OPEN | `0.0.15` | `type:feat` `area:fresh` `p1` | `SidebarShell` IA, ⌘K palette, env pill, Aspire `app`-kind self-registration, and a "wiring home" stats grid of only-NetScript facts. |
| **416** | DDX-6 / S2 Stack Map (Config Resolution & Topology) | OPEN | `0.0.15` | `type:feat` `area:config` `p1` | Declared-intent-vs-running-reality: `inspectConfig` tree + `ns-stackmap` capability-wiring graph, each node deep-linking into Aspire. |
| **417** | DDX-7 / S4 Service & Contract Catalog | OPEN | `0.0.15` | `type:feat` `area:cli` `p1` | Contract **provenance/coverage/REST-RPC-duality** above the OpenAPI boundary; hands reference + try-it to Scalar. |
| **418** | DDX-8 / S13 Live Flow — request journey across seams | OPEN | `0.0.15` | `type:feat` `area:telemetry` `p1` | Flagship #2: one causal, primitive-grouped chain (HTTP → contract → job → saga → stream) with payloads at seams; **rewritten from the pass-1 trace waterfall**. |
| **419** | DDX-9 / S6 Run Inspector | OPEN | `0.0.15` | `type:feat` `p1` | The run-shaped view: `RunRecord` across primitives, step timeline with attempts/compensation, cross-linked to S13; no owned waterfall. |
| **420** | DDX-10 / S5 Plugin Control host + registry | OPEN | `0.0.15` | `type:feat` `area:aspire` `p1` | Fleet-level plugin view: installed list, contribution-axis map, doctor rows, JSR version drift; the dogfood centerpiece and host mount point for contributed panels. |
| **421** | DDX-11 Logs panel | **CLOSED** `NOT_PLANNED` | none | `p2` | (Killed) Live structured logs + browser-log capture — superseded by an Aspire deep-link + a correlated strip in S6. |
| **422** | DDX-12 Resource Control panel | **CLOSED** `NOT_PLANNED` | none | `p2` | (Killed) Resource start/stop/restart — superseded by `withCommand` contributions rendered *inside Aspire*. |
| **423** | DDX-13 Introspection endpoint `/_netscript/*` | OPEN | `0.0.15` | `type:feat` `area:service` `p1` | The owned read plane (Nitro `/_nitro/tasks` pattern): config, runtime-config + SSE, plugins/doctor/contributions, workers/sagas/triggers, plus `/flows` + `/flows/subscribe`. |
| **424** | DDX-14 CLI surface + auto-launch | OPEN | `0.0.15` | `type:feat` `area:cli` `area:aspire` `p1` | Generator emission of `WithUrl`/`withCommand` into Aspire, a **stable flat deep-link URL scheme**, `netscript dashboard open|url`, and the Aspire out-link set. |
| **425** | DDX-15 Claude design-sync artifact + panel prototype | **CLOSED** `NOT_PLANNED` | none | `p1` | (Superseded by #507) A `.design-sync/` artifact + Fresh panel-shell prototype. |
| **426** | DDX-16 E2E dashboard join + panel smoke | OPEN | `0.0.15` | `gate:e2e` `type:test` `p1` | The `scaffold.runtime` merge gate: app-resource registration, `/_netscript/*` responses, a cross-capability run rendering, a `traceId`→Aspire out-link URL assertion (and explicitly **no** owned-waterfall assertion), plus the S13 flow-chain assertion. |
| **427** | DDX-17 `DashboardPanelContribution` seam | OPEN | `0.0.15` | `type:feat` `gate:jsr` `p1` | The contribution seam: a Standard-Schema `DashboardPanelContribution` contract in `plugin-dashboard-core/contracts/v1`, discovered like `AspireNSPluginContribution`, with **`@netscript/plugin` gaining NO dashboard-coupled axis** (thinness/layering). |
| **428** | DDX-18a / S7 Workers console | OPEN | `0.0.15` | `type:feat` `p1` | Job/task registry, live execution SSE feed, step timeline, scheduler-drift; management loop (gated rerun/cancel). |
| **429** | DDX-18b / S8 Sagas console | OPEN | `0.0.15` | `type:feat` `p1` | Saga instance table incl. `compensating`, from→to transition/compensation timeline; gated replay/compensate. |
| **430** | DDX-18c / S9 Triggers console | OPEN | `0.0.15` | `type:feat` `p1` | Firing-history feed across 8 trigger kinds, enable/disable with CLI-equivalent, cron preview; the management-loop reference screen. |
| **431** | DDX-18d / S10 Streams console | OPEN | `0.0.15` | `type:feat` `p2` | Fan-out/delivery state per subscriber as NetScript run-state; folds stream watcher/delivery events. |
| **432** | DDX-19 Codegen-from-UI "Add resource" | OPEN | `0.0.15` | `type:feat` `wave:defer` `p2` | The management keystone: dashboard "create" actions invoke the **same** `createPluginAdapter(...).toScaffold()` machinery as the CLI, byte-identical output, CLI-equivalent line rendered (#157-safe, no string templates). |
| **507** | Dev Dashboard E2E Claude Design prototype + `tools/design-sync` | OPEN | `0.0.15` | `type:chore` `p1` | Design-only pre-step: the fresh-ui→Claude-Design converter plus a full S1–S13 prototype at 100% registry parity; carries the duplication + flow≠waterfall **design-review gate**. |
| **509** | fresh-ui registry-wide pixel-perfect revamp | OPEN | `0.0.15` | `type:feat` `p1` | Fix registry-wide visual quality gaps the parity sync exposed (broken `skeleton`, unstyled fallbacks, no code-block highlighting, dark/mobile/responsive never audited). |
| **551** | DDX-20 / S3 Runtime-Config Monitor & Control | OPEN | `0.0.15` | `type:feat` `status:triage` `p1` | Flagship #1: live SSE feed of runtime override changes from the existing `runtime-config/application/watcher.ts`, current-state grid, version chain + diffs, gated write-back (gated on #556). |
| **552** | DDX-21 / S11 DB Migrations & Drift | OPEN | `0.0.15` | `type:feat` `status:triage` `p2` | Applied-vs-pending migration table, drift alert, introspect diff, confirm-gated `migrate`/`seed` with CLI-equivalent. |
| **553** | DDX-22 / S12 Dead-Letter Queues | OPEN | `0.0.15` | `type:feat` `status:triage` `p2` | Consolidated queue+trigger DLQ view: depth per backend, failed-message table with reason, bulk `reprocess()` — **no panel ships before its contract route exists**. |
| **554** | `TriggerDlqPort` contract route (co-req) | OPEN | `0.0.15` | `type:feat` `status:triage` `p2` | Expose the existing port-only `TriggerDlqPort` as a thin oRPC route under `/_netscript/triggers/dlq*`. |
| **555** | queue `DeadLetterStore` CLI + contract API (co-req) | OPEN | `0.0.15` | `type:feat` `status:triage` `p2` | Expose `packages/queue`'s port-only `DeadLetterStore` via a CLI command + `/_netscript/queue/dlq*` route. |
| **556** | runtime-config mutation use-cases (co-req) | OPEN | `0.0.15` | `type:feat` `status:triage` `p2` | Add operator `setOverride`/`unsetOverride` + versioned `current` pointer bump to `@netscript/runtime-config` (today read+watch only), so S3 write-back and any CLI verb share one write path. |
| **557** | DDX-23 seam-event flow plane (co-req) | OPEN | `0.0.15` | `type:feat` `status:triage` `p2` | Uniform seam-event envelope `{flowId, seam, primitive, name, phase, payloadRef, attempt?, ts}` on an in-process bus at `/_netscript/flows/subscribe`; upgrades S13 from correlation-join to boundary-event fidelity. |

**Related issues outside the `epic:dev-dashboard` label that the board touches** (found via
`gh search issues --repo rickylabs/netscript "dashboard"`, not by assuming the #410–#432 range is complete):

| # | Title | State | Milestone | Relevance |
|---|---|---|---|---|
| **734** | `feat(plugin): dashboard-panel contribution axis in the plugin manifest` | OPEN | `0.0.10` | Split from #711; asserts the manifest "has no frontend/dashboard-panel contribution axis" and calls itself "the framework precondition for the `/extensions` manager and the 7-member `DashboardContribution` family in the merged dashboard design (coverage-matrix rows #427/#420)". **Not labelled `epic:dev-dashboard`.** |
| **544** | `[process-manager PM-33] DashboardPanelContribution "Process Control" panel` | OPEN | `0.0.15` | Second consumer of #427; explicitly **gated on `CR-DDX-HOSTAGNOSTIC`** — a change request asking #400 to make panel contributions host-agnostic (descriptor host-neutral, `setup()` receives a host-provided context) so one contribution renders in two shells. Slips if the CR is unresolved. |
| **922** | `Epic: Frontend contribution layer — plugins that ship UI` | OPEN | `0.0.9` | Merged RFC #890. Names the dev dashboard as a **consumer**, not an inventor, of the discovery pipeline. |
| **933 / 944** | frontend-contrib S11 "Workers dogfood: zone panel + console route + island" / S22 "Sagas/triggers/streams dashboard-zone panels" | OPEN | `0.0.9` / `0.0.11` | Dashboard-zone panels already filed under a *different* epic and *earlier* milestones than #428–#431. |
| **408** | `[telemetry T7] @netscript/telemetry/query dashboard surface` | CLOSED `COMPLETED` | `0.0.1-beta.6` | Shipped dependency of #413; received a "correlation/export-only non-goal" tightening comment in the 2026-07-06 batch. |

**Kind: observed** (metadata + body first-sections). The one-line "asks for" column is a **compression** of each body —
faithful but abbreviated; the bodies are the authority.

### F5 — What #685 (merged) actually ratified: an analysis + prompt corpus, not an architecture

PR #685 `design: dev-dashboard revamp umbrella (analysis + Claude-Design prompts)` — **MERGED 2026-07-12T04:12:13Z**,
base `main`, head `design/dev-dashboard-revamp`, milestone `0.0.1-beta.10`, labels `type:umbrella, area:tooling,
**status:research**, priority:p1, epic:dev-dashboard` (`gh pr view 685`). Its own body opens:
*"**DRAFT umbrella PR — nothing here merges to main until the owner reviews.** This run changes NO product code; it
produces analysis artifacts and Claude-Design-ready prompts."* Its `run-eval.md` repeats: *"Mission: analysis +
design-spec only; final deliverable = Claude-Design-ready prompts. No product code changed anywhere in this run."*
(`.llm/runs/dashboard-design--orchestrator/run-eval.md:3-5`).

What it merged onto `main` (`gh pr view 685 --json files`), i.e. what genuinely has authority as *committed evidence*:

- `analysis/routing-resort.md` (370 lines) — a **LOCKED routing hierarchy** proposal with 10 principles (P1 every entity
  is a URL segment; P2 typed route contracts; P5 pathname-derived breadcrumbs; P7 `/flow/:correlationId` as a
  first-class journey URL; P9 `_middleware.ts` resolve-or-degrade; P10 `_app`/`_layout` split) and a full route tree.
  It states the prototype today is *"one hash router, **15 sibling routes**, no nesting, no entity URLs"*
  (`analysis/routing-resort.md:14-18`).
- `analysis/plugin-extension-architecture.md` (441 lines) — the **7-member `DashboardContribution` union**
  (`panel | route | action | ai-tool | nav | entity-tab | home-card`), a trust-tiered host (first-party islands vs
  third-party sandboxed iframes + postMessage RPC), a `contributesTo: { dashboard: 'v1' }` version handshake, and a
  `requires: { ports, procedures, commands }` grant surface. Its headline: *"The missing seam is a **frontend
  contribution contract family** owned by `packages/plugin-dashboard-core` (never by `@netscript/plugin` — thinness
  law), discovered the same way `AspireNSPluginContribution` and `netscript generate plugins` registries already work"*
  (`analysis/plugin-extension-architecture.md:19-30`).
- `coverage-matrix.md` (253 lines) — a bidirectional issue⇄prototype matrix flagging `⚠ extends` / `✗ contradicts` per
  issue; it names exactly one **contradiction**: *"✗ #424 is the one true contradiction: its locked URL scheme predates
  the routing resort and must be regenerated"* (`coverage-matrix.md`, "Notes on scope extension / contradiction").
- `screen-catalog.md`, 17 screenshots, the prototype snapshot, 6 Claude-Design prompts, the Codex Sol max UX verdict,
  two GLM 5.2 passes, and — via slice 8 — **the whole of PR #506's content** (`tools/design-sync/`, the
  `dashboard-rescope--seed` run dir, `resources/design/` screens).

**Authority reading (inference, from the above):** #685's merge means *these files are committed*, not that their
proposals are ratified architecture. The PR was self-labelled draft-until-review, its label never advanced past
`status:research`, and no issue body on the board was rewritten to adopt the routing resort or the 7-member family —
#427 still describes a single `DashboardPanelContribution`. The design run *did* post 20 issue comments
(`run-eval.md` slice 6: *"30-issue bidirectional matrix + 20 issue comments posted (all 201)"`), so the analyses are
**referenced from** the board without having **rewritten** it. Treat #685 as high-quality evidence with committed
provenance, and the only board-level ratification event as the **2026-07-06 rescope batch** (§F7).
**Kind: observed (files/metadata) + inference (authority reading).**

### F6 — What #780 (open draft) merely proposes: visual craft, no architecture, no ratification

PR #780 `feat(dashboard): visual revamp to reference bar (adversarial-gated)` — **OPEN, isDraft=true**, base `main`,
head `feat/dashboard-visual-revamp`, **no labels, no milestone** (`gh pr view 780`). Last commit `f7198bf2d`
"refine(dashboard): 10-screen component rethink, crisp (Codex 5.6 medium)", 2026-07-14 — nothing since.
All **158 files** (`gh api repos/rickylabs/netscript/pulls/780/files --paginate`) live under
`.llm/runs/beta10--orchestrator/` (`render/`, `visual/`); **zero files under `packages/`, `plugins/`, `apps/`, `docs/`**.
Its body scopes itself: *"Visual + layout only — no routes/logic/data/copy changes"* and *"The prototype is a Claude
Design working record; it round-trips to `@netscript/fresh-ui` source later."*

Its durable, non-visual outputs are three specs plus a backlog:
`visual/DESIGN-LANGUAGE.md`, `visual/ROLLOUT-DOCTRINE.md` (per-screen bespoke; "no two screens alike"),
`visual/HOME-SPEC.md`, and `visual/DS-UPLIFT-BACKLOG.md` — the latter described in the body as *"every new
component/token/variant/option/mobile pattern the redesign needs … Drives a NS One design-system uplift **after** the
prototype is signed off"*, i.e. an input to #509/#410, not a decision. Per-screen acceptance is recorded in 13 PR
comments (Sagas 2026-07-13, … Extensions 2026-07-14), each naming a commit and a Kimi-K2.6 adversarial gate score
(e.g. *"Sagas — accepted at bespoke 82/100 (committed `b33a1338`)"*, *"Streams — accepted at gate 72/100"*).
**Nothing in #780 is on `main`.** The `.llm/runs/beta10--orchestrator/` dir *does* exist on main but contains only
`briefs/ canvas-prompts/ slices/ supervisor.md worklog.md drift.md kickoff.md MORNING-HANDOFF.md` — **no `render/`, no
`visual/`** (`ls -R .llm/runs/beta10--orchestrator/`). **Kind: observed.**

### F7 — The 2026-07-06 rescope batch is the last owner-ratified board event

`.llm/runs/dashboard-rescope--seed/ratification-summary.md:1-12` carries an executed banner:
*"**✅ EXECUTED 2026-07-06** — owner ratified "yes to all, proceed" (D1–D7). All 32 mutations landed and were verified
live."* The decision summary (`ratification-summary.md`, "Decision summary") locks:
(1) the three-pillar thesis superseding v1's observe-only framing; (2) killing #421/#422/#425; (3) rescoping the
survivors incl. #418 → S13 (only the waterfall scope died); (4) filing 6 new issues (which became #551–#557 — 7, after
D6 split); (5) keeping #410/#414/#509 as-is and tightening #408/#427 by comment; (6) running the design lane.

Two **execution-time corrections** are recorded and are load-bearing facts:
- **D5** — the `0.0.1-beta.7` milestone already existed, so #432/#556/#557 were assigned to it directly.
- **D6** — *"a store-surface check confirmed `@netscript/runtime-config` exposes only read+watch use-cases (the CLI's
  `runtime-config-writer.ts` is deploy-provisioning, not an operator mutation path). So **S3/DDX-20 ships read-only in
  beta.6**, and the mutation use-cases were split into co-req **#556**"* (PR #506 comment, rickylabs 2026-07-06T17:36:24Z).

The batch also created the `area:queue` label and deliberately deferred the `.github/labels.yml` sync commit.
**Kind: observed.**

### F8 — Why #506 was closed, and what was learned

PR #506 `plan(design): Dev Dashboard E2E Claude Design prototype + production design-sync — Plan & Design ready for
review` — **CLOSED**, draft, head `feat/dashboard-design-prototype`, base `main`, baseline `317e4b50`.
Closing comment (rickylabs, 2026-07-12T21:24:00Z):

> Closing as **superseded by #685** (merged). Verified on `main`: everything of value from this branch is already there —
> `tools/design-sync/` … the design/rescope run artifacts, and `resources/design/` screens, all absorbed via #685's
> `5d905018`. Not carried over, deliberately: the `packages/fresh-ui` registry delta on this branch — that work landed
> long since via the #547 pixel-polish pass (main has moved past it); residual registry work belongs to the #509 lane.

Lessons the closure records explicitly:

- **Absorption beats parallel merge.** The earlier comment (2026-07-12T01:26:03Z) says the branch was merged into #685
  *"per owner direction — recommendation is to close this PR as **superseded by #685** once the umbrella merges, rather
  than merging it separately."*
- **Long-lived design branches rot against `main`.** The `packages/fresh-ui` delta was invalidated by #547 landing
  first — *"confirmed by the `layouts.css` conflict against current main"*.
- **A `Closes #N` on a closed PR never fires.** Both comments flag it: *"this PR's `Closes #425` will NOT fire (it only
  fires on merge of this PR)"* and *"**#425 (DDX-15) still needs an owner disposition**"*. #425 was subsequently closed
  `NOT_PLANNED` in the rescope batch, but the warning is a durable process lesson.
- **Its own research finding, still worth carrying:** *"NS One L0–L2 is byte-identical to fresh-ui output; the ratified
  gap is the L3 `blocks/` layer (DDX-0). All current fresh-ui architecture landed 2026-06-14→07-05 — the old canvas
  project predates it entirely."* (#506 body, "Key findings").

**Kind: observed.**

### F9 — The board's own analysis already contradicts the board (`coverage-matrix.md`)

The merged coverage matrix flags, per issue, where the revamp "materially widens or conflicts":

- **✗ #424** — the only outright contradiction: its stable flat URL scheme (`/`, `/resource/{name}`, `/workers`,
  `/plugins/{id}`, `/config`) is *"flatter than the locked hierarchy"* and generator emission must retarget
  `/workers/jobs/:jobId/executions/:execId`, `/flow/:correlationId`.
- **⚠ #427 + #420** — *"Materially extended by Axis 6: one panel member → 7-member family … + injection-zone enum +
  trust tiers + `/extensions` manager + zone inspector + provenance chips + permission prompt + quarantined state."*
- **⚠ #412 + #423** — the contribution union and `InjectionZone` enum become owned models; introspection must serve
  *"per-entity-detail reads for the ~22 new levels"* plus `GET /contributions`.
- **⚠ #428** — must split Jobs vs polyglot Tasks (Deno/Python/Shell/PowerShell/.NET), absent in the prototype.
- **⚠ #432** — *"Management keystone + Axis-1 violation"*: full template-gallery → file-diff preview → confirm-CLI loop.
- **⚠ #400 itself** — must own the **AI console**, **Auth Sessions**, and **`/extensions`** screens, because
  *"no sub-issue owns them today"*.

**Kind: observed.** This matters for the RFC: several dashboard issues are already known-wrong against a design that is
itself now overtaken by #890.

### F10 — The Frontend Contribution Layer RFC (#890, MERGED) has claimed the pipeline #427 assumed

RFC PR #890 is **MERGED** (`gh pr view 890` → state MERGED, non-draft). Its abstract states:
*"The dev dashboard's ratified 7-kind contribution family becomes a sibling payload family on the same envelope — one
discovery pipeline, many hosts."* Its supersession map (`.llm/runs/plan-frontend-contrib--seed/rfc.md:236-248`) records
proposed dispositions:

| Item | Disposition (quoted) |
|---|---|
| #427 DDX-17 | *"**KEEP, re-baseline**: the dashboard family becomes a sibling payload on this RFC's envelope; discovery/registry/doctor arrive from FCB-6/8 — the dashboard epic implements kinds + host, not pipeline"* |
| #432 DDX-19 | *"**KEEP, re-baseline**: its engine is FCB-17 (`AppTarget`); the dashboard "second caller" story is unchanged"* |
| #400 (listed as beta.13) | *"**CONSUMER**: starts on this layer's pipeline + four dogfood panels instead of inventing discovery"* |
| OQ-12 (core axis vs contract seam) | *"**RESOLVED** by the pointer-axis decision (§2.3)"* |

§7 of that RFC also states *"T1/T2 sandbox tiers deferred to the dashboard epic by design"* — i.e. the trust-tier work
from `plugin-extension-architecture.md` is explicitly left to the DevTools side.
**Kind: observed.** Note the tension flagged in F5: #890 calls the 7-kind family "ratified", while its own source
(`plugin-extension-architecture.md`) is headed *"Analysis only — no product code changed"*. That gap is a drift
candidate (D3).

---

## Contracts

Named types/APIs the RFC must consume or extend, all drawn from the dashboard board's own text:

| Contract | Shape (as written) | Source |
|---|---|---|
| `DashboardPanelContribution` | Standard-Schema `{ id, title, icon, capability, component, slots{options,sidebar,actions}, setup(), commands }`, in `plugin-dashboard-core/contracts/v1`; *"Discovery mirrors `AspireNSPluginContribution`"*; *"`@netscript/plugin` gains NO dashboard-coupled axis"* | #427 body |
| `DashboardContribution` (7-member union) | `panel \| route \| action \| ai-tool \| nav \| entity-tab \| home-card` over `DashboardContributionBase { id, title, icon?, capability?, contributesTo:{dashboard:'v1'}, requires?:{ports,procedures,commands} }` | `.llm/runs/dashboard-design--orchestrator/analysis/plugin-extension-architecture.md` §1.2 |
| `DashboardActionContribution.cliEquivalent` | `readonly cliEquivalent: string` — *"MANDATORY NetScript signature: exact CLI equivalent printed in the confirm dialog"* | same file, §1.2 |
| `AspireResourceKind` widening | add `'command'`, `'app'` to today's `'deno-service' \| 'deno-background' \| 'container' \| 'database' \| 'cache'`; `withCommand(name, displayName, executeCommand, options{arguments: InteractionInput[], confirmationMessage})` | #411 body |
| `TelemetryQueryPort` | correlation-only; resolves a stamped `traceparent` → `traceId`; `TraceRef = { traceId, aspireTraceDetailUrl }`; adapter over Aspire `/api/telemetry/{traces,traces/{id},logs,spans}` (pinned 13.4.6) | #413, #412 bodies |
| `/_netscript/*` read plane | `config`, `config/runtime` + `/subscribe` (SSE), `plugins`, `plugins/doctor`, `plugins/contributions`, `workers/*`, `sagas/*`, `triggers/*`, `flows` + `flows/subscribe` | #423 body |
| Seam-event envelope | `{ flowId (traceparent), seam, primitive, name, phase: start\|end\|error, payloadRef, attempt?, ts }` reusing the #402 TC-1..14 attribute vocabulary | #557 body |
| Dashboard core domain models | `ResourceGraph`, `PanelDescriptor`, `RunRecord`, `ContractCatalogEntry`, `RuntimeConfigChange`, `RuntimeConfigVersion`, `PluginContributionAxes`, `MigrationStatus`; ports `TelemetryQueryPort`, `AspireResourcePort`, `IntrospectionPort`, `CommandInvokePort` | #412 body |
| Runtime-config mutation | `setOverride` / `unsetOverride` per topic + `bumpCurrentVersion` (atomic pointer move); today the package is read+watch only | #556 body |
| `CR-DDX-HOSTAGNOSTIC` | change request on #400: panel descriptors host-neutral, `setup()` receives a host-provided context; acceptance = *"one contribution renders in two host shells (dashboard + pm console)"* | #544 body |
| Route contract idiom | `defineRouteContract` with zod `pathSchema` (identity) + `searchSchema` (filters/sort/page/view-state); `paginationSearchSchema().extend({…fallback(…)})`; typed route registry `makeHref`/`href({path})` | `analysis/routing-resort.md` §1 P2/P3/P8 |
| Stable deep-link scheme (**contested**) | `/`, `/resource/{name}`, `/workers\|/sagas\|/triggers\|/streams`, `/plugins`, `/plugins/{id}`, `/config` — flagged `✗ CONTRADICTION` by `coverage-matrix.md` | #424 body |

---

## Drift candidates

| # | Expected (documented/carried-in) | Actual at baseline | Evidence | Severity |
|---|---|---|---|---|
| D1 | Milestone `0.0.14` is described *"Dev dashboard (thin, contribution-based) + auth/deploy tail"* | `0.0.14` holds 11 open issues, **all** deploy-plugin (#915–#919) or enterprise-auth (#881–#886); every dashboard child sits on `0.0.15`, and #400 sits on `Backlog / Triage` | `gh api .../milestones`; `gh issue list --milestone 0.0.14` | significant |
| D2 | #427 defines the plugin contribution seam for dashboard panels, with `@netscript/plugin` untouched | Merged RFC #890 / epic #922 own the discovery pipeline and pointer axis; #890's map re-labels #427 *"KEEP, re-baseline … the dashboard epic implements kinds + host, not pipeline"*; separately #734 (`0.0.10`, **unlabelled for the dashboard epic**) proposes a dashboard-panel axis *in the plugin manifest* | `.llm/runs/plan-frontend-contrib--seed/rfc.md:236-240`; `gh issue view 734` | architectural |
| D3 | #890 calls the 7-kind `DashboardContribution` family *"ratified"* | Its only source, `plugin-extension-architecture.md`, is headed *"Analysis only — no product code changed"*, and no dashboard issue body was rewritten to adopt it (#427 still describes a single panel member) | `analysis/plugin-extension-architecture.md:6-8`; `gh issue view 427` | significant |
| D4 | #424's stable deep-link scheme is the dashboard's URL contract | The merged routing resort replaces it with a nested entity hierarchy + `/flow/:correlationId`; `coverage-matrix.md` marks #424 the *"one true contradiction"* | `analysis/routing-resort.md` §2; `coverage-matrix.md` | significant |
| D5 | Epic #400 is scoped "beta.6" and its children reference `0.0.1-beta.6/7` milestones in their bodies | The repo moved to the `0.0.x` scheme (commit `00e3b047f` *"chore: adopt the 0.0.x release scheme (#995)"*); every child body still carries `**Milestone:** 0.0.1-beta.6` prose that no longer resolves | `rtk git log -- resources/design/dashboard`; #410/#414/#421/#422/#425/#427/#432 bodies | minor |
| D6 | #400 owns S1–S13 | The prototype and coverage matrix add three screens no sub-issue owns: **AI console**, **Auth Sessions**, **`/extensions`** manager | `screen-catalog.md` "Routing reality"; `coverage-matrix.md` #400 row | significant |
| D7 | Dashboard capability panels are #428–#431 (`0.0.15`) | Frontend-contrib epic #922 already filed dashboard-zone panels as #933 (`0.0.9`) and #944 (`0.0.11`) — earlier milestones, different epic, overlapping subject | `gh issue view 933 944` | significant |
| D8 | #544 (process-manager) depends on a resolved `CR-DDX-HOSTAGNOSTIC` on #400 | No such CR is recorded in #400's body or in the rescope run's ratified batch; the dependency is dangling and #544 self-declares *"Slips if the CR is declined/unresolved (R8)"* | `gh issue view 544`; `gh issue view 400 --json body` | significant |
| D9 | #410 promotes `registry/blocks/` into fresh-ui | `packages/fresh-ui/registry` has no `blocks/` directory | `ls packages/fresh-ui/registry` | minor |

---

## First-pass disposition recommendation (RECOMMENDATION ONLY)

> **The supervisor decides. Nothing is filed, closed, retitled, or re-milestoned before owner ratification.**
> Dispositions below are a discovery-stage first pass derived from F1–F10; they are not a filing manifest.

| # | Recommendation | One-line reason |
|---|---|---|
| **400** | **AMEND** (keep as the epic; rewrite body) | The ownership thesis and 3 acceptance lines survive verbatim; the screen list, "beta.6" framing, and the invent-your-own-discovery premise do not. |
| **410** | KEEP | fresh-ui L3 `blocks/` promotion is host-agnostic and still unbuilt; unaffected by the contribution redesign. |
| **411** | KEEP | Aspire `command`/`app` kinds are the out-link/embed seam; independent of the DevTools contribution family. |
| **412** | AMEND | Core package survives, but its owned model set must be re-derived from the new contribution envelope, not from the 7-member analysis draft. |
| **413** | KEEP | Correlation-only telemetry port is exactly the non-duplication thesis in code. |
| **414** | AMEND | Thin plugin survives; its manifest/axis wiring must re-baseline onto #890's pointer-axis + generated registry. |
| **415** | AMEND | Shell/IA survives; must adopt the `_app`/`_layout` split + route-tree-mirroring sidebar and host contributed nav. |
| **416** | KEEP | Declared-vs-running capability wiring is uniquely NetScript-owned. |
| **417** | KEEP | Contract provenance/coverage/duality is above the Scalar boundary by construction. |
| **418** | KEEP | S13 seam-journey is the flagship differentiator and already survived one supersession honestly. |
| **419** | KEEP | Run-shaped view is only-NetScript state; cross-linked to #418. |
| **420** | AMEND | Plugin Control becomes the host for the DevTools contribution family — scope grows into the `/extensions` manager. |
| **421** | (already CLOSED) — **no action**; keep the kill documented in the RFC's non-goals so it cannot creep back. |
| **422** | (already CLOSED) — **no action**; same. |
| **423** | AMEND | `/_netscript/*` survives as the data plane but must serve entity-detail reads + `GET /contributions`, and reconcile with #1446/#1390 data-access decisions. |
| **424** | **SUPERSEDE** | Its URL scheme is the board's one recorded contradiction; the RFC should define the URL contract and this issue re-files against it. |
| **425** | (already CLOSED) — **no action**; its `Closes` never fired, disposition already settled as not-planned. |
| **426** | AMEND | E2E gate survives; add contribution-render + entity-route assertions, keep the "no owned waterfall" assertion. |
| **427** | **FOLD** into the RFC's contribution-family section | #890 already re-baselined it to "kinds + host, not pipeline"; the RFC must define the family, so this issue becomes an implementation slice of it, not an independent design. |
| **428–431** | AMEND (+ deduplicate against #933/#944) | The consoles survive as first-party dogfood consumers, but their panel/zone delivery mechanism and milestone must reconcile with the frontend-contrib children. |
| **432** | KEEP (re-baseline) | "One generator, two callers" is acceptance line 2; #890 already assigns its engine to `AppTarget`. |
| **507** | **CLOSE-LATER** | Its deliverables (`tools/design-sync/`, the S1–S13 prototype) shipped via #685/#780; keep open only until the RFC's design pack absorbs its design-review gate, then close as delivered. |
| **509** | KEEP | Registry pixel/mobile/dark quality is orthogonal to contribution architecture and independently valuable. |
| **551** | KEEP | Runtime-config monitor is only-NetScript state; but see #1446 — check it does not duplicate the runtime-automation admin console. |
| **552** | KEEP | Migration/drift state is invisible to Aspire. |
| **553** | KEEP (blocked) | Explicitly gated on #554/#555 shipping first — the board's own "no panel before its route" rule. |
| **554 / 555 / 556 / 557** | KEEP (backend co-reqs) | Thin API/instrumentation slices with no UI; they unblock S3/S12/S13 and are unaffected by contribution-architecture decisions. |
| **734** | **FOLD** | It proposes the same manifest axis the RFC must own; folding prevents a third competing seam (alongside #427 and #890's pointer axis). |
| **544** | AMEND (resolve `CR-DDX-HOSTAGNOSTIC`) | The RFC should decide host-agnostic descriptors explicitly; #544 is the second-host proof and currently dangles on an unrecorded CR. |
| **933 / 944** | **coordinate, do not touch** | Owned by epic #922 (`0.0.9`/`0.0.11`); the RFC must state which epic owns dashboard-zone panels rather than silently re-scoping another epic's children. |

---

## File-level artifacts a supersession map must also cover

| Path / PR | What it is | Status at baseline |
|---|---|---|
| `.llm/runs/dashboard-design--orchestrator/` (analysis, coverage-matrix, screen-catalog, design-prompts, prototype, 17 screenshots) | The merged #685 corpus — routing resort, 7-member extension architecture, coverage matrix | on `main` (via `eac57c5f5`, later refreshed by `a8a485716` #713 and `93546ae32` #764 for shipped beta.9 CLI verbs) |
| `.llm/runs/dashboard-rescope--seed/` (plan, research 865 lines, issues-rescope 973 lines, epic-rewrite, ratification-summary, `batch/` with 27 bodies + 6 comments + `execute_batch.sh`) | The executed 2026-07-06 rescope batch — the last owner-ratified board event | on `main` |
| `.llm/runs/beta10--orchestrator/` (`briefs/ canvas-prompts/ slices/ supervisor.md worklog.md drift.md kickoff.md MORNING-HANDOFF.md`) | The beta.10 orchestration record | on `main` — **without** `render/` and `visual/` |
| `.llm/runs/beta10--orchestrator/render/` + `visual/` (prototype.dc.html, assets, 33 visual reports, 16 adversarial evals, DESIGN-LANGUAGE / ROLLOUT-DOCTRINE / HOME-SPEC / DS-UPLIFT-BACKLOG, 21 references) | PR #780's entire payload | **only on `feat/dashboard-visual-revamp`**, unmerged, stale since 2026-07-14 |
| `.llm/runs/plan-roadmap-expansion--seed/design/A-dashboard/` (`proposal.md`, `epic-and-issues.md`, `open-questions.md`, `agent-briefs.md`) | The **original** dashboard design that generated #400 and #410–#432 (cited as "Design source" in #410/#421/#422/#425/#427/#432 bodies and as prior art in `plugin-extension-architecture.md` §0) | on `main` — the oldest layer; pre-rescope, pre-#890 |
| `resources/design/dashboard/` (`CLAUDE-DESIGN-BRIEF.md`, `DECISIONS.md`, `OPEN-QUESTIONS.md`, `PROPOSED-COMPONENTS.md`, `SCREEN-SPEC.md`, `screens/01-stack-map.html`…`04-run-inspector.html`, `proto.css`) | Pre-rescope 4-screen HTML prototype + specs | on `main`, last content change at release `4d438ce1a` |
| `tools/design-sync/` + `deno.json:80` `"design:sync"` | The only shipped code product of the whole program (fresh-ui → Claude Design converter), absorbed from #506 via #685 `5d905018` | on `main`, live task |
| `.llm/runs/plan-frontend-contrib--seed/rfc.md` (+ `FILING-LOG.md`, `design/`, `adversarial-*.md`) | Merged RFC #890 — the ratified layer that re-baselines #427/#432 and casts #400 as consumer | on `main` |
| PR #685 / PR #780 / PR #506 | merged umbrella / open draft / closed-superseded | see F5, F6, F8 |

---

## Open questions

1. **Which artifact is the URL contract?** #424's flat scheme or `analysis/routing-resort.md`'s nested tree — the board
   contains both and `coverage-matrix.md` calls it the one true contradiction. Nothing ratified the resort.
2. **Who owns dashboard-zone panels** — epic #400 (#428–#431, `0.0.15`) or epic #922 (#933 `0.0.9`, #944 `0.0.11`)?
   Both boards currently claim the subject at different milestones.
3. **Is `CR-DDX-HOSTAGNOSTIC` a real, recorded change request?** #544 depends on it; it appears in no #400 body text and
   in no rescope batch artifact I read. Verifiable by searching #400's comment thread (not read in this pass).
4. **Was the 7-member `DashboardContribution` family ever owner-ratified**, or did #890 inherit the word "ratified" from
   an analysis-only document? (D3.)
5. **What is milestone `0.0.14` actually for?** Its description names the dev dashboard; its contents are deploy + auth.
6. **Does #551 (S3 runtime-config monitor) collide with RFC #1446's runtime-automation admin console?** Both surface
   override/version state; the charter's Q4 demands the diagnostics/console split be explicit. Not assessed here.
7. **Should #734 be closed, folded, or promoted?** It is the only issue proposing a dashboard axis *in
   `@netscript/plugin`'s manifest*, which #427 explicitly forbids on thinness grounds and #890 routes through a pointer
   axis — three positions, one seam.
8. **Is PR #780 revivable?** Its visual passes are high-effort and adversarially gated, but they encode the *flat*
   15-screen prototype IA. Whether the RFC's IA invalidates them is unassessed.
9. **What happened to the 20 issue comments** posted by the #685 coverage slice — did any board consumer act on them?
   (`run-eval.md` records them as posted "all 201"; their content on-issue was not read in this pass.)
10. **Unverified:** I did not read #400's or the children's *comment threads* (only bodies + PR threads). Later owner
    decisions may live there. Verified by `gh issue view <n> --comments` on #400, #427, #432, #544.

---

## Sources

All read-only. Commands run from `/home/codex/repos/ns-rfc-devtools-contribution`.

**GitHub (via `gh`, 2026-08-11):**
- `gh issue view 400 --json number,title,state,milestone,labels,body`
- `gh issue list --label epic:dev-dashboard --state all --limit 100 --json number,title,state,stateReason,milestone,labels`
- `gh issue view <n> --json body` for n ∈ {410…432, 507, 509, 551…557}
- `gh issue view <n> --json number,title,state,milestone,labels,body` for n ∈ {734, 922, 544, 510}
- `gh issue view <n>` for n ∈ {932, 933, 944}
- `gh search issues --repo rickylabs/netscript "dashboard" --limit 100` (discovery beyond the #410–#432 range)
- `gh pr view 685 --json body,files,comments,state,isDraft,mergedAt,baseRefName,headRefName,labels,milestone`
- `gh pr view 780 --json body,files,comments,commits,state,isDraft`; `gh api repos/rickylabs/netscript/pulls/780/files --paginate`
- `gh pr view 506 --json body,files,comments,state`
- `gh pr view 890 --json number,title,state,isDraft,body`
- `gh api repos/rickylabs/netscript/milestones --paginate`
- `gh issue list --milestone 0.0.14 --state all --limit 50`

**Repository (baseline `main` @ `2256a67bf`):**
- `ls plugins/ packages/`; `ls -d plugins/dashboard packages/plugin-dashboard-core tools/design-sync resources/design`
- `ls packages/fresh-ui/registry`
- `.llm/runs/dashboard-design--orchestrator/run-eval.md`, `coverage-matrix.md`, `screen-catalog.md`,
  `analysis/routing-resort.md`, `analysis/plugin-extension-architecture.md`
- `.llm/runs/dashboard-rescope--seed/ratification-summary.md` (+ dir listing of `batch/`)
- `.llm/runs/plan-frontend-contrib--seed/rfc.md:236-248`
- `.llm/runs/beta10--orchestrator/` (recursive listing)
- `resources/design/dashboard/` (recursive listing); `deno.json:80`
- `rtk git log --oneline -3 -- resources/design/dashboard`; `rtk git log --oneline -3 -- .llm/runs/dashboard-design--orchestrator`
- `.llm/devtools-rfc-orchestrator-brief.md` (this run's charter — Q1–Q12, ownership-thesis preservation mandate)

**Not fetched:** no external URLs were retrieved for this topic, so
`.llm/runs/plan-devtools-contribution--seed/research/sources/` holds no artifacts from this agent.
