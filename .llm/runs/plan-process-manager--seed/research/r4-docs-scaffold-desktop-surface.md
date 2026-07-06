# R4 — Docs/Scaffold Teardown + Desktop-Surface Fit for the Process-Manager Plugin

Stage-B discovery corpus for `plan-process-manager--seed`. Scope: what the docs site currently
promises about deploy + dev process management, what the `--no-aspire` scaffold path actually does
today, how a Deno-Desktop admin console for a process manager relates to the dev-dashboard epic
(#400) and the desktop Tier-4 plan (#451–#458), and which docs pages a process-manager chapter
would touch. All citations are repo-relative paths against the worktree
`C:/Dev/repos/netscript-framework/.llm/tmp/wt-process-manager` unless marked as a full external URL.

---

## 1. What the docs site currently promises about deploy + bare-metal process supervision

### 1.1 `docs/site/how-to/deploy.md` — the canonical deploy recipe

- The doc frames three layers: backing services, NetScript processes, orchestration
  (`docs/site/how-to/deploy.md:86-107`), and is explicit that Aspire is optional in production:
  "In production you can keep Aspire (it can publish a deployment manifest) or drop it and run each
  process yourself with your own supervisor" (`docs/site/how-to/deploy.md:104`).
- **Step 4 ("Choose an orchestration path")** is the load-bearing section for bare metal. Its
  "Drop Aspire (`--no-aspire`)" tab says, verbatim: "You now own provisioning Postgres + a cache,
  and starting each process. Bring-your-own-supervisor: systemd, a container per process, or a
  PaaS. Start the Fresh app directly during dev: `deno task --cwd apps/dashboard dev`"
  (`docs/site/how-to/deploy.md:239-242`). **This is the entire dev-fallback story today: one
  `deno task --cwd <member> dev` per process, run by hand in separate terminals, with no supervisor,
  no restart policy, no aggregated log view, no orchestration at all.** This is precisely the gap a
  pup/pm2-style process manager fills.
- **Step 6 ("Run a process by hand — the bare-metal primitive")** is the closest thing to a
  process-manager story the docs have, and it is manual: it shows raw `deno run --unstable-kv
  --allow-net …` invocations per resource and says "Map this pattern across every enabled resource
  and you have a complete, container-free deployment... orchestrate them with compose or your
  platform of choice, honoring the `PluginReferences` start order (streams → workers →
  sagas/triggers, plus auth-api when present)" (`docs/site/how-to/deploy.md:340-369`). There is no
  mention of a supervisor process, a restart policy, or a unified CLI/UI for this — the reader is
  expected to bring their own (systemd, a container per process, pm2, or hand-rolled).
- The doc's `<!-- caveat: arch-debt:* -->` callout list (`docs/site/how-to/deploy.md:371-384`)
  enumerates known scaffold limitations (no generated Dockerfile/compose/k8s manifest,
  Cloud Run needs config, empty `deploy: {}` by default) but says nothing about process supervision
  as a gap — confirming it is currently an *unnamed* gap rather than a tracked debt item; this seed
  run is the first to name it explicitly.
- Step 5 documents the three generated CI starter workflows (`deploy-compose-ghcr.yml`,
  `deploy-deno-deploy.yml`, `deploy-bare-metal.yml`) at `docs/site/how-to/deploy.md:314-338`. The
  bare-metal workflow "Compiles service artifacts with `netscript deploy build`... then uploads the
  output as workflow artifacts for host-specific installation" (`docs/site/how-to/deploy.md:322`) —
  i.e. CI produces `deno compile` artifacts, but installing/supervising them on the host is left
  entirely to the operator today.

### 1.2 `docs/site/how-to/deploy-local-aspire.md` — the dev orchestration companion

- Frames Aspire as strictly the **local** story: "`aspire start` exists to make `git clone` → one
  command produce a complete, observable, correctly-wired stack on one machine... not your
  production database or cache" (`docs/site/how-to/deploy-local-aspire.md:158-164`).
- Explicitly hands the `--no-aspire` reader back to `deploy.md`: "If you ran `netscript init my-app
  --no-aspire` there is no `aspire/` folder and no `aspire start` — you start the Deno processes
  yourself and supply your own infrastructure. That path is covered in the Deploy recipe..."
  (`docs/site/how-to/deploy-local-aspire.md:38-44`). **There is no third document for "how do I run
  a `--no-aspire` workspace in dev without hand-starting N terminals" — that content does not exist
  yet.** A process-manager plugin's dev-fallback story is new content, not a rewrite.

### 1.3 `docs/site/cli-reference.md` — stale relative to shipped bare-metal work (drift candidate)

- The curated CLI reference's "Deploy" section states: "Two deploy paths are wired today: the
  Deno Deploy cloud target and the pre-existing Windows Service (Servy) path"
  (`docs/site/cli-reference.md:294-296`), and its callout says "`netscript deploy docker` and
  `netscript deploy compose` command groups exist but are **not wired**... Bare-metal `linux` deploy
  is likewise planning-only. Only the Windows Service path and `deno-deploy` run today."
  (`docs/site/cli-reference.md:327-332`). The "Windows Service (Servy)" section
  (`docs/site/cli-reference.md:334-348`) documents only the Windows/Servy adapter.
- **This is stale against the shipped source.** `packages/cli/src/public/adapters/os-service-factory.ts:29-44`
  dispatches to `SystemdOsServiceAdapter` for every non-Windows OS
  (`packages/cli/src/public/adapters/systemd-os-service.ts`) and `ServyOsServiceAdapter` for Windows
  (`packages/cli/src/public/adapters/servy-os-service.ts`), behind one `OsServicePort`
  (`packages/cli/src/public/ports/os-service-port.ts`) consumed by the same install/start/stop/
  status/upgrade/uninstall command surface (`packages/cli/src/public/features/deploy/{install,
  start,stop,status,uninstall}*`). The charter's own baseline confirms bare-metal tier-1 slices
  (#337–#344, "`OsServicePort`+`SystemdAdapter` #339, `deno compile` artifact #340") shipped ≤
  beta.3 (charter.md:39-40). **The public docs have not been updated to reflect that systemd is a
  first-class, already-shipped bare-metal OS-service target** — cli-reference.md still reads as if
  only Windows/Servy exists and Linux bare-metal is "planning-only." Flag as a driftCandidate: this
  process-manager RFC should either fix this doc drift as a fast-follow, or explicitly build the new
  plugin's docs chapter so it supersedes/corrects this stale section rather than compounding it.
- Architecturally, this also answers part of the charter's re-use directive: **the `OsServicePort`
  abstraction is the existing "install as a host-supervised service" seam** (systemd unit files /
  Windows Service registration via Servy). A pup/pm2-style process manager is a *different* layer —
  per-app-process supervision (restart policy, log multiplexing, a control CLI/UI) that itself would
  typically be the **single** process registered with systemd/Servy via `OsServicePort`, then fans
  out to supervise the individual NetScript processes underneath it. The relationship (does the
  process-manager plugin sit *above* `OsServicePort`, replace it, or run *underneath* it as one more
  target) is a design question other research topics in this run own; this document only establishes
  that the seam exists, is shipped, and is under-documented in the public site today.

### 1.4 No existing docs mention "process manager," "pup," or "pm2"

A case-insensitive search of `docs/` for `pup|pm2|process.manager|process-manager` returns zero
matches. The docs site has no prior art, precedent language, or even a placeholder chapter for this
concept — every doc touchpoint below is new content, not a revision of an existing "process manager"
section.

---

## 2. The scaffold surface — `--no-aspire` semantics (verified in source)

### 2.1 What `--no-aspire` actually skips

- `noAspire: boolean` is a first-class scaffold option
  (`packages/cli/src/kernel/domain/scaffold/scaffold-options.ts:59,96`).
- **No `appsettings.json` is written at all** when `--no-aspire` is set:
  `packages/cli/src/kernel/application/scaffold/plan-init.ts:196` guards the entire
  `generateAppsettings(...)` call behind `if (!options.noAspire)`. This means the single
  declarative process-graph description that the rest of the deploy story depends on
  (`docs/site/how-to/deploy.md` Step 1) **does not exist** in a `--no-aspire` scaffold — there is no
  machine-readable manifest of "what processes exist, what ports, what permissions, what start
  order" for a process manager to consume out of the box in this mode. Any process-manager plugin
  that wants a declarative process list in `--no-aspire` mode either needs its own manifest format or
  needs to read the same underlying plugin/scaffold metadata (`scaffold.plugin.json`
  `officialSource` blocks — see §2.3) directly, since `appsettings.json` is unavailable.
- The Compose/GHCR CI workflow is dropped in `--no-aspire` scaffolds — only the Deno Deploy and
  bare-metal workflow templates are emitted (`packages/cli/src/kernel/application/scaffold/
  plan-init.ts:132-139`).
- `init-pipeline.ts` still runs `scaffoldAspire(...)` as a phase even under `--no-aspire`
  (`packages/cli/src/kernel/application/scaffold/init-pipeline.ts:48`), but the human-readable phase
  description differs only between legacy/TS AppHost — the actual content gating happens inside
  `plan-init.ts`'s option checks, not by skipping the phase call itself.

### 2.2 What the scaffolded README tells a `--no-aspire` user about dev

`packages/cli/src/kernel/templates/workspace/generate-readme.ts` is the actual generator for the
project's own `README.md` and is instructive about what NetScript already tells users to do without
Aspire:

- Quick-start block: when `!options.noAspire` it emits `cd aspire && aspire restore` +
  `aspire start`; **when `noAspire` is true, that whole orchestration block is simply absent** — the
  Quick Start section falls through to the per-member `deno task --cwd <member> dev` table rows only
  (`generate-readme.ts:60-155`, table rows at 129-136 always emitted, Aspire-only rows gated at
  `137-154`).
- The workspace tree diagram omits `aspire/`, `dotnet/`, and `appsettings.json` entirely under
  `--no-aspire` (`generate-readme.ts:94-115`).
- The "Deployment CI" section (workflow table) is gated behind `!options.noAspire`
  (`generate-readme.ts:163-206`) — **a `--no-aspire` scaffold's own README does not mention deploy
  CI at all today**, beyond whatever survives in `.github/workflows/` from §2.1.
- Database guidance under `--no-aspire` explicitly tells the user to self-provision: "Self-provision
  the database and expose its connection string with `<ENV_VAR>` or `DATABASE_URL`"
  (`generate-readme.ts:211-216`), vs. the Aspire path's "starts automatically... no manual container
  setup required" (`generate-readme.ts:217-223`). This is the same bring-your-own-infra pattern the
  process story has: NetScript hands you the primitives and explicit env-var contracts, not a
  managed runtime.

### 2.3 The plugin-manifest metadata a process manager could read directly

Every first-party plugin ships an `officialSource` block in its `scaffold.plugin.json` with exactly
the facts a process supervisor needs — entrypoint, port, DB/KV requirements, permission flags — e.g.
`plugins/streams/scaffold.plugin.json:49-66` (`serviceEntrypoint: "services/src/main.ts"`,
`servicePort: 4437`, `requiresDb: false`, `permissions: [...]`). This is the same shape
`docs/site/how-to/deploy.md`'s Step 1 table (`docs/site/how-to/deploy.md:116-126`) surfaces from
`appsettings.json` in the Aspire path. **A process-manager plugin's `--no-aspire` dev-fallback mode
has two candidate data sources for "what to supervise": (a) `appsettings.json` when it exists
(Aspire scaffold), or (b) each installed plugin's `scaffold.plugin.json` `officialSource` block plus
the workspace's own `deno.json` task graph when it does not.** Neither is currently wired for
process-manager consumption; this is new plumbing, not existing plumbing to reuse verbatim.

---

## 3. The desktop Tier-4 plan (#451–#458) — what it actually builds and does not build

Source: `.llm/runs/plan-process-manager--seed/context/adjacent-issues.jsonl` (issue bodies, #451-458)
and `.llm/runs/plan-roadmap-expansion--seed/design/E-desktop/proposal.md` (the locked Opus 4.8
design for that tier). Milestone: `0.0.1-beta.8` (core), `0.0.1-stable` (hardening/gate).

### 3.1 The headline: it is a **single-process app-hosting mechanism**, not a process supervisor

The Tier-4 design's entire point is collapsing an existing multi-process NetScript app (services +
Fresh frontend + db) into **one OS process** for desktop shipping:

- `#E1` (`packages/sdk/src/client/in-process-client-link.ts`): an in-process oRPC transport that
  routes `ServiceApp.fetch()` calls in-process instead of over loopback HTTP
  (adjacent-issues.jsonl #451; design proposal.md:76-115).
- `#E2` (folds #375): a 4th `desktop` branch in the Aspire app-type generator
  (`packages/cli/src/kernel/templates/aspire/helpers/register/generate-register-apps.ts`) — this
  registers a **dev-time** desktop window as an Aspire resource with `Enabled:false` opt-in
  (adjacent-issues.jsonl #452; proposal.md:296-299, 356-361).
- `#E3`: relocates the tursodb single-writer into the desktop host process (per-user data dir
  resolution + in-process `build()` composition root) — a database-locking concern
  (adjacent-issues.jsonl #453; proposal.md §2).
- `#E4`: wires the packaged binary's service clients through the in-process link so the shipped
  artifact has **zero external service process and zero loopback RPC** (adjacent-issues.jsonl #454;
  proposal.md §3.2 "S-single-process").
- `#E5`: offline-first via Turso Sync in that single-process host (adjacent-issues.jsonl #455).
- `#E6`: `deno desktop` 1-click packaging + signed auto-update server (adjacent-issues.jsonl #456;
  proposal.md §3.3 packaging specifics — CEF backend required on Windows, `--no-check`, explicit
  `-o`, Windows stages-but-does-not-apply update fallback).
- `#E7`/`#E8` (stable): desktop deploy-e2e coverage and code-signing automation.

**None of #E1–#E8 is "supervise N background processes with restart policy and a control UI."** The
Tier-4 design collapses *N processes into 1* for a packaged desktop app; a process manager
supervises *N already-separate processes*. These are complementary, not overlapping, concerns — but
they share adjacent infrastructure (see §3.2/§3.3).

### 3.2 Where a process-manager admin console and the desktop Tier-4 shell WOULD share a mechanism

- **Both need a Deno-Desktop UI shell.** #E2's Aspire desktop app-type branch and #E6's `deno
  desktop` packaging pipeline are the *only* place in the repo that currently knows how to build/
  ship a Deno-Desktop binary (Fresh build-order gate, `--backend cef` requirement, `--no-check`,
  explicit `-o`, bsdiff/Ed25519 auto-update — proposal.md:323-344). **If the process-manager plugin
  ships a Deno-Desktop admin console (charter surface A), it should reuse the #E6 packaging/
  update-server mechanism rather than re-inventing `deno desktop` packaging** — this is the concrete
  re-use seam for surface (A) of the charter, and it should be named as a hard dependency edge in
  this run's plan (Tier-4 #E6 → process-manager desktop packaging), not duplicated.
- **Both could share the in-process service-client mechanism (#E1) if the process-manager's desktop
  console talks to the process-manager's own core via oRPC.** If `plugin-process-manager-core`
  exposes an oRPC contract (consistent with the dashboard/streams/workers pattern — see §4), the
  desktop admin console could mount that contract in-process via `createInProcessClientLink`
  exactly as designed for #E4, rather than opening a loopback HTTP port purely to talk to itself.
  This is a real, citable re-use opportunity for Stage-D/E to evaluate — not yet decided.
- **Both are gated on the same `deno desktop` primitive risks** documented in proposal.md:323-344:
  WebView2 broken on Windows bare metal (must force `--backend cef`), Fresh build-order gate,
  `-o`/`--no-check` requirements, Windows auto-update stages-but-does-not-apply. Any process-manager
  desktop console inherits every one of these constraints verbatim; they are not process-manager-
  specific research, they are already-solved (or already-scoped-as-residual-risk) desktop-packaging
  facts that this plan should cite rather than re-derive.

### 3.3 Where the desktop Tier-4 plan is silent on process supervision — the actual gap this RFC fills

Nothing in #E1–#E8 or the E-desktop design proposal addresses: multi-process restart policy,
crash-loop backoff, log aggregation/rotation across N processes, a CLI verb surface (`start/stop/
restart/status/logs`) for arbitrary long-running processes, or a bare-metal bring-your-own-
supervisor replacement. **The desktop Tier-4 plan is entirely about *shipping a single already-
composed app as one packaged process*; the process-manager charter's surface (B) — the pure CLI,
pup/pm2-equivalent — has no existing design-pack coverage anywhere in the roadmap-expansion corpus.**
This is a genuinely new surface for this seed run to design, not a convergence with existing planned
work, beyond the shared desktop-packaging mechanism named in §3.2.

---

## 4. The dev-dashboard epic (#400) — panel/plugin-section pattern the process manager should reuse

Source: `.llm/runs/plan-process-manager--seed/context/adjacent-issues.jsonl` (#400 body) and
`.llm/runs/plan-roadmap-expansion--seed/design/A-dashboard/proposal.md` (locked Opus 4.8 design).
Milestone `0.0.1-beta.6`.

### 4.1 Archetype precedent directly reusable by the process-manager plugin

- The dashboard is architected as thin `plugins/dashboard` (ARCHETYPE-5) + fat
  `packages/plugin-dashboard-core` (ARCHETYPE-2), modeled on the `streams`/`plugin-streams-core`
  pair rather than `workers`, because it is a read/aggregation/UI-serving surface with **no
  background processor, no owned DB schema at beta.6** (proposal.md:9-12, 50-65). **A process-
  manager plugin is a closer structural match to `workers` than to `streams`/`dashboard`, because it
  genuinely does own a background processor (the supervisor loop itself) and needs durable process-
  state** — Stage C/D should treat `workers`/`plugin-workers-core` as the primary archetype analog
  for the process-manager core, not the dashboard/streams pair, even though the plugin also ships a
  UI.
- The dashboard's `DashboardContract` extends `BasePluginContract`
  (`packages/plugin/src/contract-base/domain/base-contract.ts`, cited proposal.md:123-149) with
  oRPC routes for `resources`/`catalog`/`traces`/`runs`/`invokeCommand` etc. **This is the concrete,
  reusable contract-first pattern**: any process-manager admin console (desktop or dashboard-
  embedded) should define its own `ProcessManagerContract extends BasePluginContract` with routes
  like `processes` (list), `processById`, `logs` (`?follow`), `invokeCommand` (`start/stop/restart`),
  mirroring the dashboard's route table shape (proposal.md:134-146) rather than inventing a new
  contract convention.
- **`DashboardPanelContribution` (§9.2 of the dashboard proposal, `plugin-dashboard-core/
  contracts/v1`) is the exact seam a process-manager plugin should contribute through** if it wants
  a "Process Control" panel/per-capability section inside the shared dev-dashboard shell, rather
  than building a wholly separate admin surface. The contribution contract shape is `id, title,
  icon, capability, component, slots, setup(), commands` (proposal.md:534-535) — a process-manager
  plugin author would export one of these, discovered the same way `AspireNSPluginContribution` is
  discovered (proposal.md:536-541), keeping `@netscript/plugin` dashboard-agnostic per the thinness
  law.
- The dashboard's per-capability "manage-through-UI" thesis (§9.1, proposal.md:484-519) — create →
  configure(tabs) → monitor loop, Appwrite-precedent — is the identical shape a process-manager
  panel needs: create/register a process, configure its restart policy/env, monitor its status/logs.
  **If this seed run's charter surface (A) — the Deno-Desktop admin console — turns out to overlap
  functionally with what a process-manager "section" inside the dev-dashboard would show, Stage C
  must explicitly decide: is (A) a *standalone* desktop app, or is it the SAME panel/contribution
  rendered two ways (embedded in the shared dashboard shell for dev, and standalone-packaged via
  `deno desktop` for bare-metal admin)?** See §5 below — this is the single most consequential open
  question this document surfaces.

### 4.2 Aspire `command`-kind extension (§2.2 of the dashboard proposal) — directly reusable

The dashboard proposal locks a `command` kind addition to `AspireResourceKind` + an
`addCommand(...)`/`withCommand` passthrough on the `AspireBuilder` port
(proposal.md:196-204), specifically because "one seam, three surfaces" (UI action = CLI verb = MCP
tool) is required for "control the full stack" to be literally true. **A process-manager plugin's
`start/stop/restart` actions are the textbook case for this exact seam** — if/when the `command`
kind lands (WSL Codex framework slice per the dashboard proposal, not yet shipped), the process-
manager plugin should register its lifecycle actions through it rather than building a parallel
Aspire-contribution mechanism. This is a **shared framework dependency**, not process-manager-
specific work — Stage E should record it as a cross-epic dependency edge (dev-dashboard → Aspire
`command` kind → process-manager), same shape as the dashboard's own dependency on it.

---

## 5. Answering the three directed questions

### (a) How does a Deno-Desktop process-manager admin console relate to the dev-dashboard plugin plans — shared shell? shared panel contract? separate app?

**Verdict from the evidence: it should be a shared panel/contribution contract, packaged as a
separate standalone desktop app for the bare-metal admin case, NOT a separate framework mechanism.**

- The dev-dashboard (#400) is explicitly the local **dev-time** Aspire-extension console — "an
  Encore-dev-equivalent local dev console... live data from Aspire `/api/telemetry/*`"
  (adjacent-issues.jsonl #400 body) — it assumes Aspire is running and consumes Aspire's OTLP HTTP
  API (proposal.md §4.1). It is **not** designed to run standalone on a bare-metal box with no
  Aspire present.
- The charter's surface (A) is explicitly a **bare-metal deployment target component** — "how
  NetScript apps are run, supervised, and administered on bare metal" (charter.md:45-47) — which by
  definition must work with **no Aspire dashboard running** (Aspire is dev-only per
  `docs/site/how-to/deploy-local-aspire.md:158-164`).
- Therefore the process-manager's admin console cannot simply *be* a panel inside the Aspire-
  dependent dev-dashboard shell for its primary bare-metal use case — it needs its own standalone
  data source (its own process-manager core, not `/api/telemetry/*`) and its own standalone
  packaging (`deno desktop`, reusing #E6's mechanism per §3.2).
- **But** the *contract and panel-rendering mechanism* should still be shared: define the process-
  manager's oRPC contract + `DashboardPanelContribution` once in `plugin-process-manager-core`, and
  render it **twice** — (1) embedded as a contributed section inside the dev-dashboard shell when
  Aspire/dev-dashboard is present (so a developer sees process-manager status alongside
  workers/sagas/triggers panels in one place, dogfooding the same contribution seam the dashboard
  proposal establishes), and (2) standalone-packaged via `deno desktop` as the bare-metal admin
  console when there is no Aspire/dashboard on the box at all. This is the same "one contract, two
  hosts" pattern the desktop Tier-4 design already validates for services generally (in-process vs.
  HTTP link-mode, §1.4 of proposal E) — applying it to the UI layer (one panel component, two host
  shells) is a natural, low-risk extension of an already-locked design pattern, not a new one.
- **Open item for Stage D:** confirm whether `plugin-dashboard-core`'s `DashboardPanelContribution`
  contract is genuinely host-agnostic (renderable both inside the Fresh dashboard shell and inside a
  standalone `deno desktop` shell), or whether it has Fresh-dashboard-specific coupling that would
  need generalizing first. The dashboard proposal does not address standalone-desktop rendering of
  its own contributed panels — this is a real gap between the two design packs that Stage D should
  close explicitly, not assume away.

### (b) What is the `--no-aspire` dev fallback story today?

**One `deno task --cwd <member> dev` per process, run manually in separate terminals, with zero
supervision.** Concretely, verified above:
- No `appsettings.json` is generated (`plan-init.ts:196`), so there is no declarative process graph
  for anything to consume.
- The scaffolded README's Quick Start table lists every member's `dev` task as a separate manual
  command with no aggregation (`generate-readme.ts:129-155`).
- `docs/site/how-to/deploy.md:239-242` names the fallback explicitly as "Bring-your-own-supervisor:
  systemd, a container per process, or a PaaS" — i.e. NetScript today provides **no** dev-time
  process orchestration outside of Aspire at all. This is the literal gap the charter's "nice-to-
  have" clause targets (charter.md:22-23): "For `--no-aspire` scaffolds it is a decent dev-process
  fallback (in dev it runs like every other plugin — that is fine)."
- The only structured process metadata available in `--no-aspire` mode is each installed plugin's
  `scaffold.plugin.json` `officialSource` block (§2.3) plus the workspace root `deno.json` task
  graph — neither is currently read by anything to build a supervised process list.

### (c) Which docs pages would need a process-manager chapter?

Ranked by how directly each page's existing content would need to change or extend:

1. **`docs/site/how-to/deploy.md`** — Step 4's "Drop Aspire (`--no-aspire`)" tab
   (`docs/site/how-to/deploy.md:239-242`) and Step 6 "Run a process by hand"
   (`docs/site/how-to/deploy.md:340-369`) are the two sections a process-manager plugin directly
   supersedes/extends: the manual `deno run` instructions become "or install the process-manager
   plugin and let it supervise the graph for you." Highest-priority edit.
2. **`docs/site/cli-reference.md`** — the "Deploy" section (`:292-348`) is stale (§1.3) and is
   exactly where a process-manager CLI verb surface (`netscript process start/stop/restart/status/
   logs`, or whatever the plugin's `cli.ts` exposes) would be documented alongside the existing
   Servy/systemd `OsServicePort` commands — and the staleness should be fixed in the same pass so the
   new content does not compound an existing drift.
3. **New capabilities page**, parallel to `docs/site/capabilities/{background-jobs,streams,
   durable-sagas}.md` (all ~25-36KB, the established shape for a first-party plugin's capability
   chapter) — e.g. `docs/site/capabilities/process-manager.md` — following the same structure:
   contract surface, config, backends, gotchas.
4. **New reference directory**, parallel to `docs/site/reference/{workers,sagas,streams,triggers}/`
   — generated CLI/API reference for the plugin's public surface once it ships.
5. **`docs/site/explanation/aspire.md`** — needs a cross-reference clarifying the process-manager's
   relationship to Aspire (dev orchestrator) and to `OsServicePort` (host-service registration),
   matching the crisp statement the E-desktop proposal makes for its own scope: "Aspire = dev
   orchestrator + multi-process production deploy orchestrator; `deno desktop` single-process = a
   distinct SHIP target" (proposal.md:371-373) — this plan needs the equivalent one-paragraph
   disambiguation for "process-manager plugin = bare-metal process supervisor, distinct from both."
6. **`docs/site/how-to/deploy-local-aspire.md`** — a lighter-touch cross-link update only (its
   `--no-aspire` hand-off sentence at `:38-44` should point at the new process-manager how-to rather
   than only at `deploy.md`'s manual instructions).
7. **A new how-to page** (e.g. `docs/site/how-to/supervise-bare-metal-processes.md`) is likely
   warranted given the size and task-recipe shape of every existing how-to in this family
   (`add-a-plugin.md`, `database-migration.md`, etc. — all task-recipe format, `docs/site/how-to/
   index.md` is the index page listing them) — Stage E should decide whether this replaces or
   supplements the Step 4/6 edits to `deploy.md` above.

---

## 6. Repo-survey finding: no `apps/` directory exists in this repo at all

`find . -maxdepth 2 -iname apps -type d` against the repo root returns **zero results.** There is no
`apps/` folder in `netscript-framework` itself. Every reference in the A-dashboard/E-desktop design
proposals to `apps/dashboard/components/{ui,blocks}` (proposal.md:339, :424-447) and to
`apps/dashboard/lib/desktop-chrome.ts` (E-desktop proposal.md:343) is a reference to **eis-chat**, a
separate downstream product repo that is NetScript's own dogfood/reference app and design-sync
source — not to anything inside `netscript-framework`. `apps/` only comes into existence inside a
**scaffolded workspace** (created by `netscript init`, e.g. `apps/dashboard` in the deploy docs'
resource table, `docs/site/how-to/deploy.md:124`). **Implication for this run: any "admin UI patterns
that exist in the repo" the charter asks about are patterns that live in `packages/fresh-ui` (the
component library shipped to scaffolded `apps/`) and in eis-chat (an external reference, not
directly readable from this worktree) — not in a first-party `apps/` tree in the framework repo
itself.** `packages/fresh-ui/src/presentation/` currently ships only `data-grid.{tsx,css}` and
`primitives.tsx` — confirming the A-dashboard proposal's finding that fresh-ui has **no L3 `blocks/`
layer** (`registry/components/ui` exists as L2; no `blocks/` directory anywhere under
`packages/fresh-ui/`) and that promoting one is a locked precursor slice for the dashboard
(proposal.md §5, "D-NSONE"). A process-manager admin console (desktop or dashboard-embedded) would
be built on the **same** promoted L3 layer once it lands — this is a shared dependency, not
process-manager-specific scope, and should be named as such rather than re-scoped into this RFC.

---

## Relevance to the NetScript process-manager plugin (summary)

1. **The `--no-aspire` dev-fallback "nice-to-have" is real and currently unimplemented** — today it
   is exactly zero terminals-worth of automation beyond `deno task --cwd <member> dev` run by hand,
   confirmed in both the scaffold source (`plan-init.ts`, `generate-readme.ts`) and the docs
   (`deploy.md:239-242`). This validates the charter's framing verbatim.
2. **`OsServicePort` (`SystemdAdapter`/`ServyAdapter`) is a shipped, adjacent, but distinct seam** —
   host-level "register as a service" — that the process-manager plugin will need to position itself
   against (sit above it as the single supervised entry point, or alongside it as an alternative).
   The public docs (`cli-reference.md`) are stale about this seam's Linux coverage; fixing that is a
   low-cost, high-value fast-follow this run should flag even if out of scope to implement.
3. **The desktop Tier-4 plan (#E1-E8) is a single-process app-shipping mechanism, not a process
   supervisor** — no scope overlap on the supervision problem itself, but **real, nameable re-use**
   on desktop packaging mechanics (`deno desktop` cross-compile, CEF backend requirement, signed
   auto-update server via #E6) and potentially on in-process service-client wiring (#E1) if the
   process-manager's own desktop console talks to its own core via oRPC.
4. **The dev-dashboard epic (#400) sets the exact contract-first + `DashboardPanelContribution`
   pattern the process-manager plugin should reuse** for its own oRPC contract shape and any
   dashboard-embedded panel, but the dashboard is Aspire-dependent and dev-only, so the process-
   manager's bare-metal admin console cannot simply be "a dashboard panel" for its primary use case —
   it needs standalone data-sourcing and standalone `deno desktop` packaging, while still sharing the
   contract/contribution *shape* so a dev-time embedded view is possible for free.
5. **Structurally, `workers`/`plugin-workers-core` is the closer archetype analog than `streams`/
   `dashboard`**, because the process manager genuinely owns a background supervisor loop and durable
   process state — Stage C/D should not default to the dashboard's read-only/no-background-processor
   archetype just because both plugins ship a UI.
6. **Docs debt is real and pre-existing** (`cli-reference.md`'s stale "planning-only" Linux
   bare-metal claim) — this run should decide whether fixing it is in scope as a fast-follow or
   explicitly deferred, but should not let the new process-manager docs chapter compound the
   confusion by documenting a second, disconnected bare-metal story next to the stale one.
