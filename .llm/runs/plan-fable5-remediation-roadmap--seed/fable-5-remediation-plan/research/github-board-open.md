# GitHub open-board snapshot — `rickylabs/netscript`

**Captured:** 2026-08-08, via authenticated `gh` reads (`gh issue list --state open --limit 500`,
`gh api repos/rickylabs/netscript/milestones`, `gh pr list --state open`). Read-only; no mutations.
This document is the **dedup ground truth** for the Fable 5 remediation roadmap: any new issue draft
must be checked against §2/§3 before filing.

## 0. Headline counts (facts)

| Metric | Value |
|---|---|
| Open issues (excludes PRs) | **259** |
| Closed issues | 385 |
| Open milestones | **13** (not 11 — see §0.1) |
| Open PRs | 8 (all drafts) |
| Open umbrella issues (`type:umbrella`) | **20** |
| Distinct `epic:*` labels on open issues | 13 |

### 0.1 Milestone inventory (`gh api .../milestones`)

`open`/`closed` below are GitHub's own counters (they include PRs, so they exceed the issue-only
column on the right).

| # | Title | GH open | GH closed | Open **issues** (measured) |
|---|-------|--------:|----------:|---------------------------:|
| 14 | 0.0.2 | 5 | 53 | 5 |
| 15 | 0.0.3 | 0 | 38 | 0 |
| 22 | 0.0.4 | 0 | 63 | 0 |
| 23 | 0.0.5 | 22 | 160 | 21 |
| 25 | 0.0.6 | 23 | 0 | 22 |
| 24 | 0.0.7 | 20 | 6 | 20 |
| 16 | 0.0.8 | 50 | 4 | 48 |
| 17 | 0.0.9 | 15 | 0 | 15 |
| 18 | 0.0.10 | 2 | 0 | 2 |
| 19 | 0.0.11 | 10 | 0 | 10 |
| 20 | 0.0.12 | 11 | 0 | 11 |
| 21 | 0.0.13 | 44 | 0 | 44 |
| 3 | Backlog / Triage | 58 | 15 | 58 |
| — | *(no milestone)* | — | — | **3** |

**Conflict vs pre-plan:** the pre-plan said "~265 open issues, 11 open milestones". Current state is
**259 open issues across 13 open milestones** (0.0.3 and 0.0.4 are open milestone records with zero
open items; 0.0.2 still carries 5 open issues *behind* three shipped milestones — see §5.1).

### 0.2 Label distribution across the 259 open issues

`type:` — feat 161, fix 30, umbrella 20, chore 14, test 11, docs 11, refactor 9, `type:feature` 1 (typo'd singleton on one issue).
`priority:` — p1 128, p2 93, p0 19, p3 16 (3 unlabelled).
`status:` — plan 162, triage 82, research 10, blocked 2, impl 1 (2 unlabelled).
`wave:` — v1 66, defer 33, v1-min 21 (139 unlabelled).
`area:` (top) — cli 69, plugins 62, deploy 58, tooling 27, fresh-ui 24, fresh 23, docs 21, service 21, auth 20, aspire 19, database 19, telemetry 14, agentic 11.
`gate:` — e2e 6, jsr 8. Non-namespaced legacy labels still present: `rfc` 4, `documentation` 1.

### 0.3 Open PRs (context for "is this already in flight?")

| PR | Draft | Branch | Title |
|---|---|---|---|
| 1347 | yes | `plan/fable5-remediation-roadmap` | plan(seed): Fable 5 long-range remediation roadmap (this run) |
| 1337 | yes | `orchestrator/0.0.5-continuation` | chore(harness): orchestrate the 0.0.5 continuation |
| 1215 | yes | `orchestrator/docs-mainpages` | orchestrator: docs main-pages revamp + docs-leverage program |
| 822 | yes | `plan/rfc-single-deployment` | RFC: NetScript Single Deployment (#820) |
| 780 | yes | `feat/dashboard-visual-revamp` | feat(dashboard): visual revamp to reference bar |
| 778 | yes | `feat/canvas-shots-tool` | feat(tooling): canvas-shots screenshot gate |
| 775 | yes | `fix/design-sync-preact-compat` | fix(design-sync): Preact value-import surface |
| 572 | yes | `copilot/evaluate-proposal-and-documentation` | harness: GlideMQ evaluation run |

No non-draft PR is open. Nothing in §2 is currently being implemented by an open ready PR.

---

## 1. How to read the tables

`U` column = `**EPIC**` when the issue carries `type:umbrella`.
Label condensation order: `type · priority · a:area(s) · e:epic(s) · w:wave · s:status · g:gate · <legacy>`.
Every issue number links to `https://github.com/rickylabs/netscript/issues/<n>`.

---

## 2. Per-milestone open-issue tables (exhaustive, 198 issues in release milestones)

### Milestone `0.0.2` — 5 open issues

| # | U | Title | Labels (condensed) |
|---|---|-------|--------------------|
| [175](https://github.com/rickylabs/netscript/issues/175) |  | Service logs spurious "MySQL is NOT reachable" ERR under --db sqlite |  |
| [767](https://github.com/rickylabs/netscript/issues/767) |  | quality(docs): docs:readme:check is a dead gate — checker/template/house-style three-way divergence | chore · p3 · a:docs+tooling · w:v1 · s:triage |
| [768](https://github.com/rickylabs/netscript/issues/768) |  | fix(ci): OpenHands agent runtime fails to bootstrap — ModuleNotFoundError: No module named 'fastapi' | fix · p2 · a:tooling+agentic · w:v1 · s:triage |
| [863](https://github.com/rickylabs/netscript/issues/863) |  | scaffold: `netscript db init` can block indefinitely on an Unhealthy-but-Running Postgres resource (clean-machine quickstart flake) | fix · p1 · a:cli+aspire · w:v1 · s:triage |
| [864](https://github.com/rickylabs/netscript/issues/864) |  | cli: `deploy list --json` advertises an `emit` operation that no target command tree ships | fix · p2 · a:cli+deploy · w:v1 · s:triage |

### Milestone `0.0.5` — 21 open issues

| # | U | Title | Labels (condensed) |
|---|---|-------|--------------------|
| [1004](https://github.com/rickylabs/netscript/issues/1004) |  | fix(release): canary lane has no same-semver republish path — a 503 mid-publish forces a wasted canary.N | fix · p1 · a:tooling · s:plan |
| [1090](https://github.com/rickylabs/netscript/issues/1090) |  | verify(wave-five): does the shipped agent surface actually change agent behaviour? | test · p1 · a:cli+agentic · s:triage |
| [1102](https://github.com/rickylabs/netscript/issues/1102) |  | feat(mcp): make capability discovery an intent-aware primary agent workflow | feat · p1 · a:docs+tooling · s:triage |
| [1108](https://github.com/rickylabs/netscript/issues/1108) |  | docs(tooling): verify generated package references against live export maps | docs · p1 · a:docs+tooling · s:triage |
| [1119](https://github.com/rickylabs/netscript/issues/1119) |  | agentic: 'canary' means two unrelated things — rename the AI-rollout pair before the release cadence lands | chore · p2 · a:agentic · s:plan |
| [1126](https://github.com/rickylabs/netscript/issues/1126) | **EPIC** | Epic: OpenAPI→MCP service introspection — agent-legible service APIs | umbrella · p1 · a:tooling+service · e:openapi-mcp · s:plan |
| [1137](https://github.com/rickylabs/netscript/issues/1137) |  | [openapi-mcp S11] Contract summary/tags enrichment across first-party contracts | feat · p1 · a:service · e:openapi-mcp · s:plan |
| [1138](https://github.com/rickylabs/netscript/issues/1138) |  | [openapi-mcp S12] Docs: agent-facing OpenAPI→MCP reference + cross-links | docs · p2 · a:docs · e:openapi-mcp · s:plan |
| [1166](https://github.com/rickylabs/netscript/issues/1166) |  | fix(release): canary payload misses work that lands behind a release PR via a merge commit | fix · p1 · a:tooling · e:harness-v3 · s:triage |
| [1169](https://github.com/rickylabs/netscript/issues/1169) | **EPIC** | epic: guarantee a one-pass publish — eliminate the non-deterministic failures that made 0.0.4 take three canaries and six reruns | umbrella · p1 · a:tooling · e:harness-v3 · s:triage |
| [1197](https://github.com/rickylabs/netscript/issues/1197) |  | agentic: the agent-init harness had zero adoption on 0.0.4 — 0 MCP calls, 0 plugin doctor, 0 aspire otel, 0 skills across a full 452-call agent run | fix · p1 · a:tooling+agentic · s:plan |
| [1202](https://github.com/rickylabs/netscript/issues/1202) |  | fix(scaffold): users service Prisma binds a stale Postgres endpoint — DB health check fails on a clean scaffold.runtime run | fix · p1 · a:cli+database · s:plan |
| [1208](https://github.com/rickylabs/netscript/issues/1208) |  | docs(tutorials): no tutorial demonstrates the page builder — every tutorial underleverages NetScript, and the MCP-served docs will teach the wrong patterns | docs · p0 · a:docs · s:plan |
| [1325](https://github.com/rickylabs/netscript/issues/1325) |  | fix(triggers): generated background runtime omits the Redis adapter and crash-loops on the default Aspire cache | fix · p1 · a:plugins+aspire · s:triage |
| [1326](https://github.com/rickylabs/netscript/issues/1326) |  | fix(streams): DurableStreamProducer permanently drops writes after an initial connection failure; reconnect is never attempted | fix · p0 · a:plugins · s:triage |
| [1327](https://github.com/rickylabs/netscript/issues/1327) |  | fix(cli): db migrate reports success in headless mode without creating the migration implied by the command | fix · p1 · a:cli+database · s:triage |
| [1329](https://github.com/rickylabs/netscript/issues/1329) |  | fix(streams): documented SSE consumer shape differs from the wire protocol and does not specify the standard event/OTEL envelope | fix · p0 · a:docs+plugins+telemetry · s:triage |
| [1332](https://github.com/rickylabs/netscript/issues/1332) |  | docs(data/contracts): show generated DB schemas as the normative predecessor to API contracts in DB-backed products | docs · p1 · a:docs+database+contracts · s:triage |
| [1333](https://github.com/rickylabs/netscript/issues/1333) |  | fix(scaffold/frontend): make the default app an idiomatic eis-chat-grade reference and derive its name from the project | fix · p0 · a:cli+fresh-ui+fresh · s:triage |
| [1334](https://github.com/rickylabs/netscript/issues/1334) |  | docs(home): complete the capability story beyond end-to-end typesafety without turning the landing page into a catalog | docs · p1 · a:docs · s:triage |
| [1338](https://github.com/rickylabs/netscript/issues/1338) |  | chore(agentic): make DeepSeek V4 Flash 0731 max the formal IMPL-EVAL default | chore · p0 · a:tooling+agentic · w:v1 · s:impl |

### Milestone `0.0.6` — 22 open issues

| # | U | Title | Labels (condensed) |
|---|---|-------|--------------------|
| [1085](https://github.com/rickylabs/netscript/issues/1085) |  | fix(agentic): launch-codex-slice dies on SIGTERM and takes the Codex turn with it | fix · p2 · a:tooling+agentic · s:triage |
| [1093](https://github.com/rickylabs/netscript/issues/1093) |  | plugin core: discovery hardcodes official plugins' factory functions - third-party plugins cannot participate | fix · p2 · a:plugins · s:triage |
| [1112](https://github.com/rickylabs/netscript/issues/1112) |  | docs(database): make the MySQL Prisma adapter example honest and executable | docs · p1 · a:database · s:triage |
| [1139](https://github.com/rickylabs/netscript/issues/1139) |  | [openapi-mcp S13] EndpointPolicy + invoke_service_operation (gated on F2) | feat · p2 · a:tooling · e:openapi-mcp · s:plan |
| [1140](https://github.com/rickylabs/netscript/issues/1140) |  | [openapi-mcp S14] Wave observation: introspection calls vs blind curl (routes to #1090) | chore · p2 · a:tooling · e:openapi-mcp · s:plan |
| [1163](https://github.com/rickylabs/netscript/issues/1163) |  | verify(milestone-run): 0.0.5 runs on the orchestrator skill + milestone-run profile as its first real execution | test · p1 · a:tooling+agentic · e:harness-v3 · s:triage |
| [1175](https://github.com/rickylabs/netscript/issues/1175) |  | fix(ci): replace the fixed 120s JSR-propagation sleep with a version-named poll that reports what it waited for | fix · p3 · a:tooling · s:triage |
| [1201](https://github.com/rickylabs/netscript/issues/1201) |  | mcp: serve the generated export surfaces, not just prose docs — the most-used doc surface has no MCP path | feat · p2 · a:docs+tooling+agentic · s:plan |
| [1210](https://github.com/rickylabs/netscript/issues/1210) |  | docs(web-layer): differentiator deep-dives + competitive tutorial benchmark — per-API sub-pages for the page builder (withResource, Partials, …) | docs · p1 · a:docs · s:plan |
| [1243](https://github.com/rickylabs/netscript/issues/1243) |  | auth: session list --stream-url default pins localhost:4437 which no longer exists post-#1211 | fix · p3 · a:auth · s:triage |
| [1246](https://github.com/rickylabs/netscript/issues/1246) |  | windows: project-local node_modules/.deno materialization is incomplete — scaffolded frontend cannot start | fix · p1 · a:cli+fresh+deps · s:triage |
| [1260](https://github.com/rickylabs/netscript/issues/1260) |  | mcp: include SDK guidance in the shipped search_docs corpus | feat · p2 · a:docs+tooling+agentic · s:triage |
| [1262](https://github.com/rickylabs/netscript/issues/1262) |  | scaffold: db seed is a placebo — SELECT 1 plus a success banner, no rows seeded | fix · p2 · a:cli+database · s:triage |
| [1263](https://github.com/rickylabs/netscript/issues/1263) |  | service: generated by-id handler returns 500 {defined:false} for a missing row instead of a defined 404 | fix · p2 · a:service+contracts · s:triage |
| [1278](https://github.com/rickylabs/netscript/issues/1278) | **EPIC** | Type soundness ratification: eliminate unsound and arbitrary types across the public surface and the docs | umbrella · p1 · a:docs+packages+contracts · s:triage |
| [1279](https://github.com/rickylabs/netscript/issues/1279) | **EPIC** | docs: migration chapter — per-framework guides, compatibility matrix, and e2e migration recipes | umbrella · p2 · a:docs · s:triage |
| [1280](https://github.com/rickylabs/netscript/issues/1280) |  | aspire: backing services report no real health check — blocked on TypeScript AppHost custom health-check support | fix · p2 · a:aspire+database · s:blocked |
| [1293](https://github.com/rickylabs/netscript/issues/1293) |  | prisma-adapter-mysql: adapter class is unexported and has no connection-error hook — the honest example needs both | feat · p2 · a:database+packages · s:triage |
| [1296](https://github.com/rickylabs/netscript/issues/1296) |  | contracts/ai: source-side rows split out of the #1110/#1112/#1108 docs batch | fix · p2 · a:packages+contracts · s:triage |
| [1306](https://github.com/rickylabs/netscript/issues/1306) |  | fix(aspire): 'the dashboard is the authority' is unusable for an agent — aspire start detaches in a non-TTY and prints no login token | feature · p1 · a:cli · s:triage |
| [1320](https://github.com/rickylabs/netscript/issues/1320) |  | deps: collapse to a single Zod instance — blocked on @ag-ui/core hard ^3 and kvdex | fix · p2 · a:deps · s:blocked |
| [1343](https://github.com/rickylabs/netscript/issues/1343) |  | verify(0.0.6): prove installed-consumer scaffold smoke against post-fix canary | test · p1 · a:cli+tooling+agentic · s:triage · g:e2e |

### Milestone `0.0.7` — 20 open issues

| # | U | Title | Labels (condensed) |
|---|---|-------|--------------------|
| [922](https://github.com/rickylabs/netscript/issues/922) | **EPIC** | Epic: Frontend contribution layer — plugins that ship UI | umbrella · p1 · a:plugins+fresh · e:frontend-contrib · s:plan |
| [923](https://github.com/rickylabs/netscript/issues/923) |  | [frontend-contrib S1] P1 proof: mounted sub-app command ordering | chore · p0 · a:fresh · e:frontend-contrib · s:plan |
| [924](https://github.com/rickylabs/netscript/issues/924) |  | [frontend-contrib S2] P2 proof: literal lazy route loaders + normalizeFreshRouteModule | chore · p0 · a:fresh · e:frontend-contrib · s:plan |
| [925](https://github.com/rickylabs/netscript/issues/925) |  | [frontend-contrib S3] P3 proof: dependency-island build matrix + plugin-vite pin policy | chore · p0 · a:fresh · e:frontend-contrib · s:plan |
| [926](https://github.com/rickylabs/netscript/issues/926) |  | [frontend-contrib S4] P4 proof: SSR failure-containment fixtures | chore · p0 · a:fresh · e:frontend-contrib · s:plan |
| [927](https://github.com/rickylabs/netscript/issues/927) |  | [frontend-contrib S5] P5 proof: gateway threat model + streaming abort | chore · p0 · a:fresh · e:frontend-contrib · s:plan |
| [928](https://github.com/rickylabs/netscript/issues/928) |  | [frontend-contrib S6] @netscript/plugin-frontend-core contracts/v1 | feat · p0 · a:plugins · e:frontend-contrib · s:plan |
| [929](https://github.com/rickylabs/netscript/issues/929) |  | [frontend-contrib S7] @netscript/plugin pointer axis (.withFrontend) | feat · p0 · a:plugins · e:frontend-contrib · s:plan |
| [930](https://github.com/rickylabs/netscript/issues/930) |  | [frontend-contrib S8] Frontend registry emissions: transactional replace-set | feat · p0 · a:cli · e:frontend-contrib · s:plan |
| [931](https://github.com/rickylabs/netscript/issues/931) |  | [frontend-contrib S9] @netscript/fresh/plugins host runtime | feat · p0 · a:fresh · e:frontend-contrib · s:plan |
| [932](https://github.com/rickylabs/netscript/issues/932) |  | [frontend-contrib S10] Scaffold template wiring + HostSurfaceDescriptor + vite feed | feat · p1 · a:cli · e:frontend-contrib · s:plan |
| [933](https://github.com/rickylabs/netscript/issues/933) |  | [frontend-contrib S11] Workers dogfood: zone panel + console route + island | feat · p1 · a:plugins · e:frontend-contrib · s:plan |
| [934](https://github.com/rickylabs/netscript/issues/934) |  | [frontend-contrib S12] Generated deny-by-default procedure gateway | feat · p1 · a:fresh · e:frontend-contrib · s:plan |
| [935](https://github.com/rickylabs/netscript/issues/935) |  | [frontend-contrib S13] plugin new --with frontend | feat · p2 · a:cli · e:frontend-contrib · s:plan |
| [936](https://github.com/rickylabs/netscript/issues/936) |  | [frontend-contrib S14] netscript plugin dev (frontend watch loop) | feat · p1 · a:cli · e:frontend-contrib · s:plan |
| [937](https://github.com/rickylabs/netscript/issues/937) |  | [frontend-contrib S15] Doctor frontend check + five-state taxonomy | feat · p2 · a:cli · e:frontend-contrib · s:plan |
| [938](https://github.com/rickylabs/netscript/issues/938) |  | [frontend-contrib S16] Quarantine render states + provenance chrome | feat · p2 · a:fresh · e:frontend-contrib · s:plan |
| [939](https://github.com/rickylabs/netscript/issues/939) |  | [frontend-contrib S17] AppTarget scaffolder seam + plugin resource add --app | feat · p1 · a:plugins · e:frontend-contrib · s:plan |
| [940](https://github.com/rickylabs/netscript/issues/940) |  | [frontend-contrib S18] defineFrontendTestSuite + budgets enforcement | feat · p1 · a:plugins · e:frontend-contrib · s:plan |
| [941](https://github.com/rickylabs/netscript/issues/941) |  | [frontend-contrib S19] generate frontend-wiring adoption verb | feat · p2 · a:cli · e:frontend-contrib · s:plan |

### Milestone `0.0.8` — 48 open issues

| # | U | Title | Labels (condensed) |
|---|---|-------|--------------------|
| [511](https://github.com/rickylabs/netscript/issues/511) |  | [process-manager PM-0] Wire linux-service/windows-service deploy targets + fix resolveTargetConfig key mismatch + de-gate flat verbs | fix · p1 · a:cli+deploy · e:process-manager · w:v1-min · s:plan |
| [512](https://github.com/rickylabs/netscript/issues/512) |  | [process-manager PM-1] Process-graph contract v1 (ProcessGraphShape/ProcessSpecShape + state vocabulary + restart policies) | feat · p1 · a:plugins+config · e:process-manager · w:v1-min · s:plan |
| [513](https://github.com/rickylabs/netscript/issues/513) |  | [process-manager PM-2] Telemetry: netscript.process domain + ProcessInstrumentationLike facade | feat · p1 · a:telemetry · e:process-manager · w:v1-min · s:plan |
| [514](https://github.com/rickylabs/netscript/issues/514) |  | [process-manager PM-3] Core package scaffold: ports + KV registry adapter | feat · p1 · a:plugins+kv · e:process-manager · w:v1-min · s:plan |
| [515](https://github.com/rickylabs/netscript/issues/515) |  | [process-manager PM-4] Restart controller: pure nextDelay(state, policy, clock) | feat · p1 · a:plugins · e:process-manager · w:v1-min · s:plan |
| [516](https://github.com/rickylabs/netscript/issues/516) |  | [process-manager PM-5] Process runner: Deno.Command-native spawn + descendant-tree kill | feat · p1 · a:plugins · e:process-manager · w:v1-min · s:plan |
| [517](https://github.com/rickylabs/netscript/issues/517) |  | [process-manager PM-6] Supervisor loop + composable start policies (autostart/cron/watch) | feat · p1 · a:plugins · e:process-manager · w:v1-min · s:plan |
| [518](https://github.com/rickylabs/netscript/issues/518) |  | [process-manager PM-7] Log multiplexer + persistent sink (rotation) | feat · p2 · a:plugins · e:process-manager · w:v1 · s:plan |
| [519](https://github.com/rickylabs/netscript/issues/519) |  | [process-manager PM-8] Dev loop + ShutdownManager integration (engine side of pm dev) | feat · p1 · a:cli+plugins · e:process-manager · w:v1-min · s:plan |
| [520](https://github.com/rickylabs/netscript/issues/520) |  | [process-manager PM-9] ProcessManagerContract v1: the 18-route table | feat · p1 · a:plugins+service · e:process-manager · w:v1-min · s:plan |
| [521](https://github.com/rickylabs/netscript/issues/521) |  | [process-manager PM-10] Control-plane oRPC service (PluginServiceContribution) | feat · p1 · a:plugins+service · e:process-manager · w:v1-min · s:plan |
| [522](https://github.com/rickylabs/netscript/issues/522) |  | [process-manager PM-11] Loopback transport + address-descriptor discovery + CLI degraded mode | feat · p1 · a:plugins+service · e:process-manager · w:v1-min · s:plan |
| [523](https://github.com/rickylabs/netscript/issues/523) |  | [process-manager PM-12] Token auth: opaque bearer + 0o600 secrets + deny-remote default | feat · p1 · a:plugins+service · e:process-manager · w:v1-min · s:plan |
| [524](https://github.com/rickylabs/netscript/issues/524) |  | [process-manager PM-13] Event stream + follow-logs (eventIterator, live-only v1) | feat · p2 · a:plugins+service · e:process-manager · w:v1 · s:plan |
| [525](https://github.com/rickylabs/netscript/issues/525) |  | [process-manager PM-14] Telemetry wiring: span/metric catalog + 14-point checklist | feat · p2 · a:plugins+telemetry · e:process-manager · w:v1 · s:plan |
| [526](https://github.com/rickylabs/netscript/issues/526) |  | [process-manager PM-15] systemd renderer knobs: Type=notify, WatchdogSec, hardening, cgroups v2 | feat · p2 · a:deploy · e:process-manager · w:v1 · s:plan |
| [527](https://github.com/rickylabs/netscript/issues/527) |  | [process-manager PM-16] Pure-Deno sd_notify helper (+ abstract-namespace spike) | feat · p2 · a:deploy · e:process-manager · w:v1 · s:plan |
| [528](https://github.com/rickylabs/netscript/issues/528) |  | [process-manager PM-17] OsServicePort capability descriptor + warn-and-omit | feat · p2 · a:plugins+deploy · e:process-manager · w:v1 · s:plan |
| [529](https://github.com/rickylabs/netscript/issues/529) |  | [process-manager PM-18] Conventions wiring: ServiceDeployTargetPorts → wired 8-op adapters | feat · p1 · a:deploy · e:process-manager · w:v1-min · s:plan |
| [530](https://github.com/rickylabs/netscript/issues/530) |  | [process-manager PM-19] Compile adapters: ProcessSpec → systemd/Servy unit configs | feat · p1 · a:plugins+deploy · e:process-manager · w:v1-min · s:plan |
| [531](https://github.com/rickylabs/netscript/issues/531) |  | [process-manager PM-20] Extract packages/deploy-core (@netscript/deploy-core) + promote F-DEPLOY gates | refactor · p2 · a:deploy · e:process-manager · w:v1 · s:plan |
| [532](https://github.com/rickylabs/netscript/issues/532) |  | [process-manager PM-21] Deploy-facing schema: process-graph knobs on deploy.targets.linux/.windows | feat · p1 · a:config+deploy · e:process-manager · w:v1-min · s:plan |
| [533](https://github.com/rickylabs/netscript/issues/533) |  | [process-manager PM-22] --no-aspire resolvers + pm explain provenance | feat · p1 · a:cli+plugins · e:process-manager · w:v1-min · s:plan |
| [534](https://github.com/rickylabs/netscript/issues/534) |  | [process-manager PM-23] AspireResource[] resolver (manifest-wins precedence) | feat · p2 · a:cli+aspire · e:process-manager · w:v1 · s:plan |
| [535](https://github.com/rickylabs/netscript/issues/535) |  | [process-manager PM-24] pm scaffold.plugin.json + plugin add typed glue (pm.config.ts) | feat · p2 · a:cli+plugins · e:process-manager · w:v1 · s:plan |
| [536](https://github.com/rickylabs/netscript/issues/536) |  | [process-manager PM-25] netscript pm CLI router + read verbs (+ degraded-local reads) | feat · p1 · a:cli · e:process-manager · w:v1-min · s:plan |
| [537](https://github.com/rickylabs/netscript/issues/537) |  | [process-manager PM-26] Lifecycle verbs via the shared CommandInvokePort shape | feat · p1 · a:cli · e:process-manager · w:v1-min · s:plan |
| [538](https://github.com/rickylabs/netscript/issues/538) |  | [process-manager PM-27] pm dev: foreground multiplexer over the engine dev loop | feat · p1 · a:cli · e:process-manager · w:v1-min · s:plan |
| [539](https://github.com/rickylabs/netscript/issues/539) |  | [process-manager PM-28] pm monitor: live status + follow stream (no TUI lib) | feat · p2 · a:cli · e:process-manager · w:v1 · s:plan |
| [540](https://github.com/rickylabs/netscript/issues/540) |  | [process-manager PM-29] Admin console: Fresh app, browser-served by the control plane | feat · p2 · a:fresh-ui+service · e:process-manager · w:v1 · s:plan |
| [541](https://github.com/rickylabs/netscript/issues/541) |  | [process-manager PM-30] Docs wave: 7 pages + cli-reference staleness fix | docs · p1 · a:docs · e:process-manager · w:v1-min · s:plan |
| [542](https://github.com/rickylabs/netscript/issues/542) |  | [process-manager PM-31] Merge-readiness e2e: scaffold suites + JSR-scoped publish dry-run | test · p1 · a:cli · e:process-manager · w:v1-min · s:plan · g:e2e |
| [543](https://github.com/rickylabs/netscript/issues/543) |  | [process-manager PM-32] Desktop packaging of the console (deno desktop, 5-target cross-compile) | feat · p2 · a:fresh-ui · e:process-manager · w:defer · s:plan |
| [734](https://github.com/rickylabs/netscript/issues/734) |  | feat(plugin): dashboard-panel contribution axis in the plugin manifest | feat · p2 · a:plugins · w:v1 · s:triage |
| [742](https://github.com/rickylabs/netscript/issues/742) |  | feat(sagas): saga definition versioning — .version() builder, versioned registry key, migration scaffold | feat · p2 · a:sagas · w:v1 · s:triage |
| [827](https://github.com/rickylabs/netscript/issues/827) |  | feat(pm): graph adoption & reconcile contract [PM-A] | feat · p1 · a:plugins · e:process-manager · w:v1 · s:plan |
| [828](https://github.com/rickylabs/netscript/issues/828) |  | feat(pm): supervised-child runtime helper — pipe-EOF liveness + descendant cleanup [PM-B] | feat · p1 · a:plugins · e:process-manager · w:v1 · s:plan |
| [829](https://github.com/rickylabs/netscript/issues/829) |  | feat(plugins): official plugins ship compile-able ./services entrypoints | feat · p1 · a:plugins · w:v1 · s:plan |
| [844](https://github.com/rickylabs/netscript/issues/844) |  | feat(pm): Windows Task Scheduler adapter — cron-policy processes compile to Scheduled Tasks [PM-C] | feat · p2 · a:plugins+deploy · e:process-manager · w:v1 · s:plan |
| [859](https://github.com/rickylabs/netscript/issues/859) |  | test(deploy): native auto-update apply/rollback execution proof — pending upstream denoland/deno#36150 | test · p1 · a:cli · e:desktop-frontend · w:v1 · s:triage · g:e2e |
| [872](https://github.com/rickylabs/netscript/issues/872) |  | [enterprise-auth S1] Make auth capability discovery backend-truthful | fix · p0 · a:auth+service · e:enterprise-auth · w:v1 · s:triage |
| [893](https://github.com/rickylabs/netscript/issues/893) |  | [deploy-plugin DPB-1] Move deploy contracts to plugin-deploy-core behind compatibility re-exports | refactor · p0 · a:cli+deploy · e:deploy-plugin · s:plan |
| [894](https://github.com/rickylabs/netscript/issues/894) |  | [deploy-plugin DPB-2] Move pure deploy conventions with their constants to core | refactor · p1 · a:cli+deploy · e:deploy-plugin · s:plan |
| [895](https://github.com/rickylabs/netscript/issues/895) |  | [deploy-plugin DPB-3] Empty duplicate-rejecting core registry + CLI compatibility composition root | feat · p0 · a:cli+deploy · e:deploy-plugin · s:plan |
| [896](https://github.com/rickylabs/netscript/issues/896) |  | [deploy-plugin DPB-4] Host-owned deploy shell split + router rewired over core contracts | refactor · p1 · a:cli+deploy · e:deploy-plugin · s:plan |
| [897](https://github.com/rickylabs/netscript/issues/897) |  | [deploy-plugin DPB-5] Capability + topology contracts, rejection compiler, conformance harness | feat · p0 · a:deploy · e:deploy-plugin · s:plan |
| [898](https://github.com/rickylabs/netscript/issues/898) |  | [deploy-plugin DPB-6] Two-phase config loader + deploy schema re-home + frozen legacy union | feat · p0 · a:config+deploy · e:deploy-plugin · s:plan |
| [950](https://github.com/rickylabs/netscript/issues/950) |  | [AI-stack hardening] production agent lifecycle, completion policy, MCP routing, and conformance | feat · a:ai-core · e:ai-stack · w:v1 |

### Milestone `0.0.9` — 15 open issues

| # | U | Title | Labels (condensed) |
|---|---|-------|--------------------|
| [899](https://github.com/rickylabs/netscript/issues/899) |  | [deploy-plugin DPB-7] Extract deploy-baremetal (build pipeline, Servy/systemd, compat handlers) | refactor · p1 · a:cli+deploy · e:deploy-plugin · s:plan |
| [900](https://github.com/rickylabs/netscript/issues/900) |  | [deploy-plugin DPB-8] Extract deploy-aspire (target-by-op table, applier matrix, secret-safe state policy) | refactor · p1 · a:aspire+deploy · e:deploy-plugin · s:plan |
| [901](https://github.com/rickylabs/netscript/issues/901) |  | [deploy-plugin DPB-9] Extract deploy-deno (honest manifest; no emit by design) | refactor · p1 · a:deploy · e:deploy-plugin · s:plan |
| [902](https://github.com/rickylabs/netscript/issues/902) |  | [deploy-plugin DPB-10] Adapter-side config member schemas over the schema registry | refactor · p1 · a:config+deploy · e:deploy-plugin · s:plan |
| [903](https://github.com/rickylabs/netscript/issues/903) |  | [deploy-plugin DPB-11] Legacy/config compatibility gate | test · p1 · a:cli+deploy · e:deploy-plugin · s:plan |
| [904](https://github.com/rickylabs/netscript/issues/904) |  | [deploy-plugin DPB-12] Host: CLI mount-children contribution contract | feat · p1 · a:cli+plugins+deploy · e:deploy-plugin · s:plan |
| [905](https://github.com/rickylabs/netscript/issues/905) |  | [deploy-plugin DPB-13] Host: async CLI bootstrap, loader isolation, plugin-absent UX | feat · p1 · a:cli+deploy · e:deploy-plugin · s:plan |
| [906](https://github.com/rickylabs/netscript/issues/906) |  | [deploy-plugin DPB-14] Host: doctor-checks as data + installer tooling variant + contributionAxes | feat · p1 · a:plugins+deploy · e:deploy-plugin · s:plan |
| [907](https://github.com/rickylabs/netscript/issues/907) |  | [deploy-plugin DPB-15] plugins/deploy: manifest triad, descriptor composition root, verify-plugin | feat · p1 · a:plugins+deploy · e:deploy-plugin · s:plan |
| [908](https://github.com/rickylabs/netscript/issues/908) |  | [deploy-plugin DPB-16] Plugin CLI children: target add/remove, capabilities, cells apply, eight-op router | feat · p1 · a:cli+deploy · e:deploy-plugin · s:plan |
| [909](https://github.com/rickylabs/netscript/issues/909) |  | [deploy-plugin DPB-17] Scaffolder: deploy/ leaf, Story-0 assets, conditional capability-check pipeline step | feat · p1 · a:deploy · e:deploy-plugin · s:plan |
| [910](https://github.com/rickylabs/netscript/issues/910) |  | [deploy-plugin DPB-18] Story-0 scaffold.runtime E2E (install, target add, plan) | test · p1 · a:cli+deploy · e:deploy-plugin · s:plan |
| [911](https://github.com/rickylabs/netscript/issues/911) |  | [deploy-plugin DPB-19] deploy-events stream, telemetry, runtime-config topic | feat · p2 · a:telemetry+deploy · e:deploy-plugin · s:plan |
| [920](https://github.com/rickylabs/netscript/issues/920) |  | [deploy-plugin DPB-28] Docs: target-matrix reference + per-target how-tos replace the alpha-minimal page | docs · p1 · a:docs+deploy · e:deploy-plugin · s:plan |
| [944](https://github.com/rickylabs/netscript/issues/944) |  | [frontend-contrib S22] Sagas/triggers/streams dashboard-zone panels | feat · p2 · a:plugins · e:frontend-contrib · s:plan |

### Milestone `0.0.10` — 2 open issues

| # | U | Title | Labels (condensed) |
|---|---|-------|--------------------|
| [873](https://github.com/rickylabs/netscript/issues/873) |  | [enterprise-auth S2] Add a first-class Microsoft Entra ID OAuth/OIDC profile | feat · p1 · a:cli+auth · e:enterprise-auth · s:triage |
| [874](https://github.com/rickylabs/netscript/issues/874) |  | [enterprise-auth S3] Compose multiple auth backends with tenant-aware routing | feat · p1 · a:auth+service · e:enterprise-auth · s:triage |

### Milestone `0.0.11` — 10 open issues

| # | U | Title | Labels (condensed) |
|---|---|-------|--------------------|
| [875](https://github.com/rickylabs/netscript/issues/875) |  | [enterprise-auth S4] Complete the WorkOS AuthKit and enterprise SSO interactive adapter | feat · p1 · a:auth · e:enterprise-auth · s:triage |
| [876](https://github.com/rickylabs/netscript/issues/876) |  | [enterprise-auth S5] Normalize per-tenant enterprise connection setup | feat · p1 · a:cli+auth · e:enterprise-auth · s:triage |
| [877](https://github.com/rickylabs/netscript/issues/877) |  | [enterprise-auth S6] Integrate WorkOS Directory Sync and SCIM lifecycle | feat · p1 · a:auth+database · e:enterprise-auth · s:triage |
| [878](https://github.com/rickylabs/netscript/issues/878) |  | [enterprise-auth S7] Define enterprise auth audit events and bridge WorkOS Audit Logs | feat · p1 · a:auth+telemetry · e:enterprise-auth · s:triage |
| [880](https://github.com/rickylabs/netscript/issues/880) |  | [enterprise-auth S9] Introduce an enterprise auth secret-reference and rotation lifecycle | feat · p1 · a:cli+auth · e:enterprise-auth · s:triage |
| [912](https://github.com/rickylabs/netscript/issues/912) |  | [deploy-plugin DPB-20] deploy-container: OCI build/push + ContainerBuildPort + Dockerfile emission | feat · p1 · a:deploy · e:deploy-plugin · s:plan |
| [913](https://github.com/rickylabs/netscript/issues/913) |  | [deploy-plugin DPB-21] Thin platform clients: fly, koyeb, sevalla, coolify, dokploy + live smokes | feat · p1 · a:deploy · e:deploy-plugin · s:plan |
| [914](https://github.com/rickylabs/netscript/issues/914) |  | [deploy-plugin DPB-22] Container scaffold story (Story 3) + artifact goldens | feat · p2 · a:deploy · e:deploy-plugin · s:plan |
| [942](https://github.com/rickylabs/netscript/issues/942) |  | [frontend-contrib S20] Auth v1 frontend (account + session widget + signin starter) | feat · p1 · a:auth · e:frontend-contrib · s:plan |
| [943](https://github.com/rickylabs/netscript/issues/943) |  | [frontend-contrib S21] AI frontend (durable chat route + assist launcher) | feat · p1 · a:plugin-ai · e:frontend-contrib · s:plan |

### Milestone `0.0.12` — 11 open issues

| # | U | Title | Labels (condensed) |
|---|---|-------|--------------------|
| [881](https://github.com/rickylabs/netscript/issues/881) |  | [enterprise-auth S10] Generate Better Auth plugin schema and migrations | feat · p1 · a:cli+auth+database · e:enterprise-auth · s:triage |
| [882](https://github.com/rickylabs/netscript/issues/882) |  | [enterprise-auth S11] Mount Better Auth interactive handlers and client integration | feat · p1 · a:cli+auth+service · e:enterprise-auth · s:triage |
| [883](https://github.com/rickylabs/netscript/issues/883) |  | [enterprise-auth S12] Ship curated Better Auth capability profiles | feat · p1 · a:cli+auth · e:enterprise-auth · s:triage |
| [884](https://github.com/rickylabs/netscript/issues/884) |  | [enterprise-auth S13] Define organization-aware identity and authorization policy contracts | feat · p1 · a:auth+service · e:enterprise-auth · s:triage |
| [885](https://github.com/rickylabs/netscript/issues/885) |  | [enterprise-auth S14] Build an auth conformance, mocking, and scaffold test kit | feat · p1 · a:cli+auth+tooling · e:enterprise-auth · s:triage |
| [886](https://github.com/rickylabs/netscript/issues/886) |  | [enterprise-auth S15] Authenticate machines, agents, CLIs, and MCP clients | feat · p1 · a:cli+auth+ai-core+service · e:enterprise-auth · s:triage |
| [915](https://github.com/rickylabs/netscript/issues/915) |  | [deploy-plugin DPB-23] CF-PROBE: live Workers conformance, Miniflare fidelity, token story | feat · p1 · a:deploy · e:deploy-plugin · s:plan |
| [916](https://github.com/rickylabs/netscript/issues/916) |  | [deploy-plugin DPB-24] deploy-cloudflare (workers variant) + Story 1 | feat · p1 · a:deploy · e:deploy-plugin · s:plan |
| [917](https://github.com/rickylabs/netscript/issues/917) |  | [deploy-plugin DPB-25] Vercel probe + deploy-vercel (Build Output API) + Story 4 | feat · p1 · a:deploy · e:deploy-plugin · s:plan |
| [918](https://github.com/rickylabs/netscript/issues/918) |  | [deploy-plugin DPB-26] AWS-PROBE-HTTP: live Lambda Web Adapter conformance | feat · p1 · a:deploy · e:deploy-plugin · s:plan |
| [919](https://github.com/rickylabs/netscript/issues/919) |  | [deploy-plugin DPB-27] deploy-aws (lambda variant, HTTP scope) + Story 2 | feat · p1 · a:deploy · e:deploy-plugin · s:plan |

### Milestone `0.0.13` — 44 open issues

| # | U | Title | Labels (condensed) |
|---|---|-------|--------------------|
| [410](https://github.com/rickylabs/netscript/issues/410) |  | [dashboard DDX-0] fresh-ui L3 blocks/ promotion + copy-source registry | feat · p1 · a:fresh-ui · e:dev-dashboard · w:v1 · s:plan · g:jsr |
| [411](https://github.com/rickylabs/netscript/issues/411) |  | [dashboard DDX-1] @netscript/aspire command + app resource kinds | feat · p1 · a:aspire · e:dev-dashboard · w:v1 · s:plan |
| [412](https://github.com/rickylabs/netscript/issues/412) |  | [dashboard DDX-2] plugin-dashboard-core scaffold + contract seam | feat · p1 · a:plugins · e:dev-dashboard · w:v1 · s:plan · g:jsr |
| [413](https://github.com/rickylabs/netscript/issues/413) |  | [dashboard DDX-3] TelemetryQueryPort + aspire-otlp-http adapter | feat · p1 · a:plugins+telemetry · e:dev-dashboard · w:v1 · s:plan |
| [414](https://github.com/rickylabs/netscript/issues/414) |  | [dashboard DDX-4] plugins/dashboard thin plugin + E2E join | feat · p1 · a:cli+plugins · e:dev-dashboard · w:v1 · s:plan · g:jsr |
| [415](https://github.com/rickylabs/netscript/issues/415) |  | [dashboard DDX-5] Fresh build-console shell + app-registration + IA | feat · p1 · a:plugins+fresh-ui+fresh · e:dev-dashboard · w:v1 · s:plan |
| [416](https://github.com/rickylabs/netscript/issues/416) |  | [dashboard DDX-6] Stack Map panel | feat · p1 · a:aspire+fresh-ui+fresh+config · e:dev-dashboard · w:v1 · s:plan |
| [417](https://github.com/rickylabs/netscript/issues/417) |  | [dashboard DDX-7] Service Catalog + API Explorer panel | feat · p1 · a:cli+plugins+fresh-ui+fresh · e:dev-dashboard · w:v1 · s:plan |
| [418](https://github.com/rickylabs/netscript/issues/418) |  | [dashboard DDX-8] S13: Live Flow — request journey across framework seams | feat · p1 · a:plugins+fresh-ui+fresh+telemetry · e:dev-dashboard · w:v1 · s:plan |
| [419](https://github.com/rickylabs/netscript/issues/419) |  | [dashboard DDX-9] Run Inspector panel | feat · p1 · a:plugins+fresh-ui+fresh+telemetry · e:dev-dashboard · w:v1 · s:plan |
| [420](https://github.com/rickylabs/netscript/issues/420) |  | [dashboard DDX-10] Plugin Control host + registry/overview | feat · p1 · a:plugins+aspire+fresh-ui+fresh · e:dev-dashboard · w:v1 · s:plan |
| [423](https://github.com/rickylabs/netscript/issues/423) |  | [dashboard DDX-13] Introspection endpoint (/_netscript/*) | feat · p1 · a:cli+plugins+service+config · e:dev-dashboard · w:v1 · s:plan |
| [424](https://github.com/rickylabs/netscript/issues/424) |  | [dashboard DDX-14] CLI surface + auto-launch | feat · p1 · a:cli+aspire · e:dev-dashboard · w:v1 · s:plan |
| [426](https://github.com/rickylabs/netscript/issues/426) |  | [dashboard DDX-16] E2E dashboard join + panel smoke | test · p1 · a:cli+plugins · e:dev-dashboard · w:v1 · s:plan · g:e2e |
| [427](https://github.com/rickylabs/netscript/issues/427) |  | [dashboard DDX-17] DashboardPanelContribution seam (.withDashboardPanel) | feat · p1 · a:plugins · e:dev-dashboard · w:v1 · s:plan · g:jsr |
| [428](https://github.com/rickylabs/netscript/issues/428) |  | [dashboard DDX-18a] workers per-capability dashboard section | feat · p1 · a:plugins+fresh-ui+fresh · e:dev-dashboard · w:v1 · s:plan |
| [429](https://github.com/rickylabs/netscript/issues/429) |  | [dashboard DDX-18b] sagas per-capability dashboard section | feat · p1 · a:plugins+fresh-ui+fresh · e:dev-dashboard · w:v1 · s:plan |
| [430](https://github.com/rickylabs/netscript/issues/430) |  | [dashboard DDX-18c] triggers per-capability dashboard section | feat · p1 · a:plugins+fresh-ui+fresh · e:dev-dashboard · w:v1 · s:plan |
| [431](https://github.com/rickylabs/netscript/issues/431) |  | [dashboard DDX-18d] streams per-capability dashboard section | feat · p2 · a:plugins+fresh-ui+fresh · e:dev-dashboard · w:v1 · s:plan |
| [432](https://github.com/rickylabs/netscript/issues/432) |  | [dashboard DDX-19] Codegen-from-UI Add-resource action | feat · p2 · a:cli+plugins · e:dev-dashboard · w:defer · s:plan |
| [507](https://github.com/rickylabs/netscript/issues/507) |  | feat(design): Dev Dashboard E2E Claude Design prototype + production design-sync system (tools/design-sync) | chore · p1 · a:tooling+fresh-ui · e:dev-dashboard · w:v1 · s:plan |
| [509](https://github.com/rickylabs/netscript/issues/509) |  | fresh-ui: registry-wide pixel-perfect UI revamp (defaults, states, responsive/mobile, dark) + registry extensions | feat · p1 · a:fresh-ui · e:dev-dashboard · s:plan |
| [544](https://github.com/rickylabs/netscript/issues/544) |  | [process-manager PM-33] DashboardPanelContribution "Process Control" panel | feat · p2 · a:fresh-ui · e:process-manager · w:defer · s:plan |
| [551](https://github.com/rickylabs/netscript/issues/551) |  | [dashboard DDX-20] S3: Runtime-Config Monitor & Control (flagship) | feat · p1 · a:plugins+fresh-ui+config · e:dev-dashboard · w:v1 · s:triage |
| [552](https://github.com/rickylabs/netscript/issues/552) |  | [dashboard DDX-21] S11: DB Migrations & Drift | feat · p2 · a:plugins+fresh-ui+database · e:dev-dashboard · w:v1 · s:triage |
| [553](https://github.com/rickylabs/netscript/issues/553) |  | [dashboard DDX-22] S12: Dead-Letter Queues (queue + trigger) | feat · p2 · a:plugins+fresh-ui+queue · e:dev-dashboard · w:defer · s:triage |
| [554](https://github.com/rickylabs/netscript/issues/554) |  | feat(triggers): TriggerDlqPort contract route (dashboard DLQ co-req) | feat · p2 · a:service · e:dev-dashboard · w:defer · s:triage |
| [555](https://github.com/rickylabs/netscript/issues/555) |  | feat(queue): DeadLetterStore CLI + contract API (dashboard DLQ co-req) | feat · p2 · a:cli+queue · e:dev-dashboard · w:defer · s:triage |
| [556](https://github.com/rickylabs/netscript/issues/556) |  | feat(runtime-config): mutation use-cases — set/unset + versioned current pointer bump (S3 write-back co-req) | feat · p2 · a:config · e:dev-dashboard · w:defer · s:triage |
| [557](https://github.com/rickylabs/netscript/issues/557) |  | [dashboard DDX-23] seam-event flow plane: unified envelope + HTTP boundary events (S13 co-req) | feat · p2 · a:telemetry+service · e:dev-dashboard · w:defer · s:triage |
| [825](https://github.com/rickylabs/netscript/issues/825) |  | feat(deploy): NetScript.Aspire.Packaging — .NET Aspire hosting integration (ATS-exported) for installer authoring | feat · p1 · a:aspire+deploy · e:deployment · w:v1 · s:plan |
| [831](https://github.com/rickylabs/netscript/issues/831) |  | feat(deploy): PackagingModel + InstallGraphManifest compiler + Aspire publish step [SD-2] | feat · p2 · a:cli+aspire · e:deployment · w:v1 · s:plan |
| [832](https://github.com/rickylabs/netscript/issues/832) |  | feat(desktop): supervisor host — embedded PM engine (per-user) / client mode (per-machine) [SD-1] | feat · p2 · a:plugins+service · e:deployment · w:v1 · s:plan |
| [833](https://github.com/rickylabs/netscript/issues/833) |  | feat(deploy): installers — scopes, least-privilege ACLs, journaled operations, port registry [SD-3] | feat · p2 · a:cli+deploy · e:deployment · w:v1 · s:plan |
| [834](https://github.com/rickylabs/netscript/issues/834) |  | feat(deploy): graph update transaction — N-artifact snapshots, barriers, quiescence [SD-4] | feat · p2 · a:cli+deploy · e:deployment · w:v1 · s:plan |
| [835](https://github.com/rickylabs/netscript/issues/835) |  | feat(deploy): first-run provisioning phase [SD-5] | feat · p2 · a:cli · e:deployment · w:v1 · s:plan |
| [836](https://github.com/rickylabs/netscript/issues/836) |  | feat(sdk): end-user health surface widget over the control plane [SD-6] | feat · p2 · a:fresh-ui+sdk · e:deployment · w:v1 · s:plan |
| [837](https://github.com/rickylabs/netscript/issues/837) |  | docs/test(deploy): composition-modes doctrine + cross-mode conformance suite [SD-7] | test · p2 · a:docs+deploy · e:deployment · w:v1 · s:plan |
| [838](https://github.com/rickylabs/netscript/issues/838) |  | test(deploy): graph deploy e2e — both scopes + full fault suite [SD-8] | test · p2 · a:deploy · e:deployment · w:v1 · s:plan · g:e2e |
| [839](https://github.com/rickylabs/netscript/issues/839) |  | feat(deploy): Linux OS-enforced containment backstop — PDEATHSIG/cgroup spike [SD-H] | feat · p3 · a:deploy · e:deployment · w:defer · s:plan |
| [845](https://github.com/rickylabs/netscript/issues/845) |  | feat(deploy): Windows hybrid tier — desktop window + PM-managed sidecars as Windows services & Scheduled Tasks | feat · p2 · a:cli+deploy · e:deployment · w:v1 · s:plan |
| [879](https://github.com/rickylabs/netscript/issues/879) |  | [enterprise-auth S8] Add WorkOS RBAC/FGA authorization providers | feat · p1 · a:auth+service · e:enterprise-auth · s:triage |
| [945](https://github.com/rickylabs/netscript/issues/945) |  | [frontend-contrib S23] auth-org backend capability (org-console prerequisite) | feat · p2 · a:auth · e:frontend-contrib · s:plan |
| [946](https://github.com/rickylabs/netscript/issues/946) |  | [frontend-contrib S24] Convention generator (generate frontend) | feat · p3 · a:cli · e:frontend-contrib · s:plan |

---

## 3. No-milestone and `Backlog / Triage` tables (61 issues)

The three `(none)` issues are unmilestoned — a taxonomy violation per `AGENTS.md` ("assign an
explicit release milestone (`0.0.2`…`0.0.9` or `Backlog / Triage`)"). They are the single cheapest
board-hygiene fix in the roadmap.

### Milestone `Backlog / Triage` — 58 open issues

| # | U | Title | Labels (condensed) |
|---|---|-------|--------------------|
| [232](https://github.com/rickylabs/netscript/issues/232) | **EPIC** | epic: docs — march to 0.0.1-stable (coverage & accuracy) | umbrella · p1 · a:docs · s:plan |
| [234](https://github.com/rickylabs/netscript/issues/234) |  | feat: HTTP/2 by default for NetScript services (feasibility + rollout) | feat · p2 · a:service · w:defer · s:research · rfc |
| [238](https://github.com/rickylabs/netscript/issues/238) | **EPIC** | epic: NetScript AI Stack — first-class AI runtime, chat & plugin seams (anchor #219) | umbrella · p1 · a:plugins+ai-core+plugin-ai · e:ai-stack · s:plan |
| [247](https://github.com/rickylabs/netscript/issues/247) |  | [AI-stack E8] @netscript/ai: orchestration primitives (fan-out + bounded-cycle) | feat · p2 · a:ai-core · e:ai-stack · w:defer · s:plan · g:jsr |
| [248](https://github.com/rickylabs/netscript/issues/248) |  | [AI-stack E9] @netscript/ai: OTel GenAI/MCP semconv telemetry adapter (./otel) | feat · p2 · a:ai-core+telemetry · e:ai-stack+telemetry-revamp · w:defer · s:plan · g:jsr |
| [256](https://github.com/rickylabs/netscript/issues/256) |  | [AI-stack FB3] fresh-ui: paced-reveal streaming-UX hooks | feat · p2 · a:fresh-ui · e:ai-stack · w:defer · s:plan |
| [262](https://github.com/rickylabs/netscript/issues/262) |  | [AI-stack P5] plugin-ai: opt-in --gateway centralized AI service | feat · p2 · a:plugin-ai · e:ai-stack · w:defer · s:plan · g:e2e/jsr |
| [266](https://github.com/rickylabs/netscript/issues/266) |  | [AI-stack] usage/cost rollups + message feedback (product analytics) — track only | feat · p3 · a:telemetry · e:ai-stack · w:defer · s:triage |
| [271](https://github.com/rickylabs/netscript/issues/271) |  | [AI-stack E12] @netscript/ai: skill-authoring approval-gate contract (create_skill/use_skill, deferred) | feat · p2 · a:ai-core · e:ai-stack · w:defer · s:plan |
| [272](https://github.com/rickylabs/netscript/issues/272) |  | [AI-stack FB6] @netscript/fresh-ui: interactive MCP-App bridge (widget-action → tools/call → re-render, deferred) | feat · p2 · a:fresh-ui · e:ai-stack · w:defer · s:plan |
| [295](https://github.com/rickylabs/netscript/issues/295) |  | Dogfood proof: Aspire Deno runtime (Layers A+B) verified against the full NetScript framework | test · p2 · a:cli+aspire+telemetry · w:defer · s:research |
| [301](https://github.com/rickylabs/netscript/issues/301) | **EPIC** | epic: Road to 0.0.1-stable | umbrella · p1 · a:tooling · s:plan |
| [302](https://github.com/rickylabs/netscript/issues/302) |  | [S1] Positioning + netscript-bench | feat · p1 · a:tooling · w:defer · s:plan |
| [303](https://github.com/rickylabs/netscript/issues/303) |  | [S2] Enterprise maturation + consolidation | refactor · p1 · a:tooling · w:v1 · s:plan |
| [307](https://github.com/rickylabs/netscript/issues/307) |  | [S6] Stale-code + stale-file elimination | chore · p2 · a:tooling · w:v1 · s:plan |
| [309](https://github.com/rickylabs/netscript/issues/309) |  | [S8] Release engineering + API-stability gates | feat · p1 · a:tooling · w:defer · s:plan |
| [313](https://github.com/rickylabs/netscript/issues/313) | **EPIC** | epic: migrate NetScript DB layer to Prisma Next (Postgres-first pilot, deferred) | umbrella · p2 · a:database · w:defer · s:plan · rfc |
| [314](https://github.com/rickylabs/netscript/issues/314) |  | Prisma Next gap (a): MSSQL support (absent & unplanned) | feat · p2 · a:database+deps · w:defer · s:triage |
| [315](https://github.com/rickylabs/netscript/issues/315) |  | Prisma Next gap (b): shipped Standard-Schema validator consumer | feat · p2 · a:database+deps · w:defer · s:triage |
| [316](https://github.com/rickylabs/netscript/issues/316) |  | Prisma Next gap (c): MySQL engine (planned, no date) | feat · p3 · a:database+deps · w:defer · s:triage |
| [317](https://github.com/rickylabs/netscript/issues/317) |  | Prisma Next gap (d): Turso/libsql driver (absent) | feat · p2 · a:database+deps · w:defer · s:triage |
| [318](https://github.com/rickylabs/netscript/issues/318) |  | Prisma Next gap (e): beta/GA channel promotion off Early Access | chore · p2 · a:database+deps · w:defer · s:triage |
| [319](https://github.com/rickylabs/netscript/issues/319) |  | Layer A tracking: Aspire TypeScript-AppHost Deno toolchain resolver (closes upstream aspire#16218) | feat · p2 · a:aspire · w:defer · s:research |
| [320](https://github.com/rickylabs/netscript/issues/320) |  | Layer B tracking: Aspire Deno hosting (AddDenoApp / DenoAppResource) | feat · p2 · a:aspire · w:defer · s:research |
| [327](https://github.com/rickylabs/netscript/issues/327) | **EPIC** | epic: NetScript enterprise deployment framework (cloud-agnostic + bare-metal, CLI + Aspire) | umbrella · p2 · a:cli+aspire+deploy · e:deployment · s:plan |
| [345](https://github.com/rickylabs/netscript/issues/345) |  | [Deploy-S9] Bare-metal enterprise hardening (stable): cross-host HA + external secret store + signing | feat · p2 · a:deploy · e:deployment · w:v1 · s:plan |
| [346](https://github.com/rickylabs/netscript/issues/346) |  | [Deploy-S10] Aspire Kubernetes + Azure + Docker-image providers | feat · p2 · a:cli+aspire+deploy · e:deployment · w:v1 · s:plan |
| [348](https://github.com/rickylabs/netscript/issues/348) |  | [Deploy-S12] One-click convergence + release-skill integration | feat · p2 · a:cli+deploy · e:deployment · w:v1 · s:plan |
| [350](https://github.com/rickylabs/netscript/issues/350) |  | [Deploy-S14] WATCH: Pulumi #3838 Deno provider (IaC adapter feasibility) | chore · p3 · a:deploy · e:deployment · w:defer · s:triage |
| [400](https://github.com/rickylabs/netscript/issues/400) | **EPIC** | epic: NetScript Dev Dashboard — the Aspire/Scalar satellite that drives the framework (ships as a plugin, beta.6) | umbrella · p1 · a:plugins+aspire+fresh-ui+telemetry · e:dev-dashboard · w:v1 · s:plan |
| [451](https://github.com/rickylabs/netscript/issues/451) |  | feat(sdk): in-process link-mode adapter for single-process service mounting | feat · p2 · a:sdk · e:deployment+unified-runtime · s:research · g:jsr |
| [453](https://github.com/rickylabs/netscript/issues/453) |  | feat(desktop): tursodb single-writer relocation + in-process composition root | feat · p2 · a:cli+database · e:deployment+unified-runtime · s:research |
| [454](https://github.com/rickylabs/netscript/issues/454) |  | feat(desktop): true single-process mode (option c) | feat · p2 · a:cli+sdk · e:deployment+unified-runtime · s:research |
| [455](https://github.com/rickylabs/netscript/issues/455) |  | feat(desktop): offline-first via Turso Sync in the single-process host | feat · p3 · a:database · e:deployment+unified-runtime · s:research |
| [458](https://github.com/rickylabs/netscript/issues/458) |  | feat(desktop): code-signing automation (macOS notarize / Windows signtool) | feat · p3 · a:cli · e:deployment · s:research |
| [499](https://github.com/rickylabs/netscript/issues/499) |  | feat(ai-core): semantic recall adapter for AgentMemoryPort (E10) | feat · p2 · a:ai-core · e:ai-stack · w:defer · s:triage |
| [501](https://github.com/rickylabs/netscript/issues/501) |  | feat(ai-core): schema-constrained structured output seam (generateObject) | feat · p3 · a:ai-core · e:ai-stack · w:defer · s:triage |
| [510](https://github.com/rickylabs/netscript/issues/510) | **EPIC** | Epic: NetScript Process Manager — bare-metal supervisor + admin console (pup/pm2 done right) | umbrella · p1 · a:cli+docs+plugins+telemetry+deploy · e:process-manager · w:v1 · s:plan · rfc |
| [545](https://github.com/rickylabs/netscript/issues/545) |  | [process-manager PM-34] systemd --user + linger non-root install mode | feat · p3 · a:deploy · e:process-manager · w:defer · s:plan |
| [546](https://github.com/rickylabs/netscript/issues/546) |  | [process-manager PM-35] Per-host multi-instance / clustering (template units + reusePort) | feat · p3 · a:plugins+deploy · e:process-manager · w:defer · s:plan |
| [695](https://github.com/rickylabs/netscript/issues/695) |  | docs(tutorials): checkpoint-execution validation pass — run every track's checkpoints against a scaffolded app | docs · p2 · a:docs · e:docs-cut · s:triage |
| [820](https://github.com/rickylabs/netscript/issues/820) |  | RFC: single deployment — enterprise installation layer, update lifecycle, PM foundation, single-runtime composition | p1 · a:deploy · s:research · rfc |
| [823](https://github.com/rickylabs/netscript/issues/823) | **EPIC** | epic: Unified Single-Runtime Deployment — Nitro v3 single deploy output (Next/Nuxt-class) | umbrella · p1 · a:fresh+deploy · e:unified-runtime · w:v1 · s:plan |
| [830](https://github.com/rickylabs/netscript/issues/830) | **EPIC** | epic: Desktop Singleton-Graph Deployment — install/update/supervise one artifact | umbrella · p2 · a:deploy · e:deployment · w:v1 · s:plan |
| [871](https://github.com/rickylabs/netscript/issues/871) | **EPIC** | Epic: Enterprise auth | umbrella · p1 · a:auth · e:enterprise-auth · s:triage |
| [887](https://github.com/rickylabs/netscript/issues/887) |  | [enterprise-auth S16] Define outbound NetScript-as-IdP support | feat · p2 · a:auth+service · e:enterprise-auth · s:triage |
| [892](https://github.com/rickylabs/netscript/issues/892) | **EPIC** | Epic: Deploy plugin family | umbrella · p1 · a:plugins+deploy · e:deploy-plugin · s:plan |
| [921](https://github.com/rickylabs/netscript/issues/921) |  | [deploy-plugin DPB-29] Deferred RFC: AWS event semantics, leaf backing graduation, Radius target graduation | feat · p2 · a:deploy · e:deploy-plugin · s:plan |
| [1244](https://github.com/rickylabs/netscript/issues/1244) |  | chore(tooling): root docs:links does not scan docs/site — link-gate evidence gap | chore · p3 · a:agentic · s:triage |
| [1245](https://github.com/rickylabs/netscript/issues/1245) |  | fix(fresh/query): island query types reject the package's own documented patterns | fix · p2 · a:packages · s:triage |
| [1249](https://github.com/rickylabs/netscript/issues/1249) |  | fix(fresh/form): controlProps() is not element-assignable, and Zod 4 constraint derivation misses numbers and regex | fix · p2 · a:fresh · s:triage |
| [1255](https://github.com/rickylabs/netscript/issues/1255) |  | fix(fresh): page.layer.delivery span attribute reports 'blocking' for deferring regions | fix · p3 · a:packages · s:triage |
| [1259](https://github.com/rickylabs/netscript/issues/1259) |  | fix(cli): generated service aggregate health check fails on sqlite/libSQL — and intermittently on postgres | fix · p2 · a:cli+database · s:triage |
| [1273](https://github.com/rickylabs/netscript/issues/1273) |  | ci: reserve the docker+postgres runtime tier for postgres-relevant changes — the saving #1158 set out to get | feat · p2 · a:tooling · s:triage |
| [1275](https://github.com/rickylabs/netscript/issues/1275) | **EPIC** | epic(docs): migration chapter — migrate-from guides, capability equivalence matrix, and end-to-end migration recipes | docs/umbrella · p2 · a:docs · s:triage |
| [1276](https://github.com/rickylabs/netscript/issues/1276) | **EPIC** | epic(quality): ratify and eliminate unsound types — no as-unknown-as, no arbitrary any, no conceded TS errors | umbrella · p1 · a:packages · s:triage |
| [1277](https://github.com/rickylabs/netscript/issues/1277) | **EPIC** | epic(docs-site): layout and UI polish pass — the desktop shell wastes space and has never had a design review | umbrella · p2 · a:docs · s:triage |
| [1335](https://github.com/rickylabs/netscript/issues/1335) | **EPIC** | Epic: Scaffold conformance — generated surfaces match current docs, exports and idiomatic usage | umbrella · p1 · a:cli+tooling · s:triage |

### Milestone `(none)` — 3 open issues

| # | U | Title | Labels (condensed) |
|---|---|-------|--------------------|
| [979](https://github.com/rickylabs/netscript/issues/979) |  | fix(aspire): plugin API resources still pin host ports 8091–8094 | fix · p2 · a:plugins+aspire · s:triage |
| [980](https://github.com/rickylabs/netscript/issues/980) |  | fix(cli): 'netscript service add' still pins an Aspire host port | fix · p3 · a:cli+aspire · s:triage |
| [1000](https://github.com/rickylabs/netscript/issues/1000) |  | docs: Rename .NET Aspire to Aspire | s:triage · documentation |

---

## 4. Open epics / umbrellas and their children

20 open `type:umbrella` issues. Children are resolved two ways: the `epic:*` label group (machine
truth) and the body checkbox list (author truth). Where they disagree, the label group wins for
membership and the checkbox list is stale.

#### #232 — epic: docs — march to 0.0.1-stable (coverage & accuracy)
- milestone: `Backlog / Triage` · labels: `area:docs, type:umbrella, status:plan, priority:p1`
- no machine-readable child list in body (prose-only umbrella)

#### #238 — epic: NetScript AI Stack — first-class AI runtime, chat & plugin seams (anchor #219)
- milestone: `Backlog / Triage` · labels: `type:umbrella, area:plugins, area:ai-core, epic:ai-stack, area:plugin-ai, status:plan, priority:p1`
- `epic:ai-stack` open members (10): #247, #248, #256, #262, #266, #271, #272, #499, #501, #950
- body checked children (20): #240, #241, #242, #243, #244, #245, #246, #249, #250, #251, #252, #253, #254, #255, #257, #258, #259, #260, #261, #263
- body unchecked children (4): #247[open], #248[open], #256[open], #262[open]

#### #301 — epic: Road to 0.0.1-stable
- milestone: `Backlog / Triage` · labels: `type:umbrella, area:tooling, status:plan, priority:p1`
- body checked children (1): #304
- body unchecked children (12): #302[open], #303[open], #305[CLOSED], #306[CLOSED], #307[open], #309[open], #313[open], #327[open], #391[CLOSED], #399[CLOSED], #400[open], #401[CLOSED]

#### #313 — epic: migrate NetScript DB layer to Prisma Next (Postgres-first pilot, deferred)
- milestone: `Backlog / Triage` · labels: `type:umbrella, wave:defer, status:plan, priority:p2, area:database, rfc`
- no machine-readable child list in body (prose-only umbrella)

#### #327 — epic: NetScript enterprise deployment framework (cloud-agnostic + bare-metal, CLI + Aspire)
- milestone: `Backlog / Triage` · labels: `area:cli, type:umbrella, area:aspire, status:plan, priority:p2, area:deploy, epic:deployment`
- `epic:deployment` open members (21): #345, #346, #348, #350, #451, #453, #454, #455, #458, #825, #830, #831, #832, #833, #834, #835, #836, #837, #838, #839, #845
- body checked children (13): #337, #338, #339, #340, #341, #342, #343, #344, #347, #349, #452, #456, #457
- body unchecked children (9): #345[open], #346[open], #348[open], #350[open], #451[open], #453[open], #454[open], #455[open], #458[open]

#### #400 — epic: NetScript Dev Dashboard — the Aspire/Scalar satellite that drives the framework (ships as a plugin, beta.6)
- milestone: `Backlog / Triage` · labels: `type:umbrella, area:plugins, area:aspire, wave:v1, area:fresh-ui, area:telemetry, status:plan, priority:p1, epic:dev-dashboard`
- `epic:dev-dashboard` open members (29): #410, #411, #412, #413, #414, #415, #416, #417, #418, #419, #420, #423, #424, #426, #427, #428, #429, #430, #431, #432, #507, #509, #551, #552, #553, #554, #555, #556, #557

#### #510 — Epic: NetScript Process Manager — bare-metal supervisor + admin console (pup/pm2 done right)
- milestone: `Backlog / Triage` · labels: `area:cli, area:docs, type:umbrella, area:plugins, wave:v1, area:telemetry, status:plan, priority:p1, rfc, area:deploy, epic:process-manager`
- `epic:process-manager` open members (39): #511, #512, #513, #514, #515, #516, #517, #518, #519, #520, #521, #522, #523, #524, #525, #526, #527, #528, #529, #530, #531, #532, #533, #534, #535, #536, #537, #538, #539, #540, #541, #542, #543, #544, #545, #546, #827, #828, #844

#### #823 — epic: Unified Single-Runtime Deployment — Nitro v3 single deploy output (Next/Nuxt-class)
- milestone: `Backlog / Triage` · labels: `type:umbrella, wave:v1, area:fresh, status:plan, priority:p1, area:deploy, epic:unified-runtime`
- `epic:unified-runtime` open members (4): #451, #453, #454, #455

#### #830 — epic: Desktop Singleton-Graph Deployment — install/update/supervise one artifact
- milestone: `Backlog / Triage` · labels: `type:umbrella, wave:v1, status:plan, priority:p2, area:deploy, epic:deployment`
- `epic:deployment` open members (21): #327, #345, #346, #348, #350, #451, #453, #454, #455, #458, #825, #831, #832, #833, #834, #835, #836, #837, #838, #839, #845

#### #871 — Epic: Enterprise auth
- milestone: `Backlog / Triage` · labels: `type:umbrella, area:auth, status:triage, priority:p1, epic:enterprise-auth`
- `epic:enterprise-auth` open members (16): #872, #873, #874, #875, #876, #877, #878, #879, #880, #881, #882, #883, #884, #885, #886, #887
- body unchecked children (16): #872[open], #873[open], #874[open], #875[open], #876[open], #877[open], #878[open], #879[open], #880[open], #881[open], #882[open], #883[open], #884[open], #885[open], #886[open], #887[open]

#### #892 — Epic: Deploy plugin family
- milestone: `Backlog / Triage` · labels: `type:umbrella, area:plugins, status:plan, priority:p1, area:deploy, epic:deploy-plugin`
- `epic:deploy-plugin` open members (29): #893, #894, #895, #896, #897, #898, #899, #900, #901, #902, #903, #904, #905, #906, #907, #908, #909, #910, #911, #912, #913, #914, #915, #916, #917, #918, #919, #920, #921
- body unchecked children (29): #893[open], #894[open], #895[open], #896[open], #897[open], #898[open], #899[open], #900[open], #901[open], #902[open], #903[open], #904[open], #905[open], #906[open], #907[open], #908[open], #909[open], #910[open], #911[open], #912[open], #913[open], #914[open], #915[open], #916[open], #917[open], #918[open], #919[open], #920[open], #921[open]

#### #922 — Epic: Frontend contribution layer — plugins that ship UI
- milestone: `0.0.7` · labels: `type:umbrella, area:plugins, area:fresh, status:plan, priority:p1, epic:frontend-contrib`
- `epic:frontend-contrib` open members (24): #923, #924, #925, #926, #927, #928, #929, #930, #931, #932, #933, #934, #935, #936, #937, #938, #939, #940, #941, #942, #943, #944, #945, #946
- body unchecked children (24): #923[open], #924[open], #925[open], #926[open], #927[open], #928[open], #929[open], #930[open], #931[open], #932[open], #933[open], #934[open], #935[open], #936[open], #937[open], #938[open], #939[open], #940[open], #941[open], #942[open], #943[open], #944[open], #945[open], #946[open]

#### #1126 — Epic: OpenAPI→MCP service introspection — agent-legible service APIs
- milestone: `0.0.5` · labels: `type:umbrella, area:tooling, status:plan, priority:p1, area:service, epic:openapi-mcp`
- `epic:openapi-mcp` open members (4): #1137, #1138, #1139, #1140
- body checked children (1): #1127
- body unchecked children (13): #1128[CLOSED], #1129[CLOSED], #1130[CLOSED], #1131[CLOSED], #1132[CLOSED], #1133[CLOSED], #1134[CLOSED], #1135[CLOSED], #1136[CLOSED], #1137[open], #1138[open], #1139[open], #1140[open]

#### #1169 — epic: guarantee a one-pass publish — eliminate the non-deterministic failures that made 0.0.4 take three canaries and six reruns
- milestone: `0.0.5` · labels: `type:umbrella, area:tooling, status:triage, priority:p1, epic:harness-v3`
- `epic:harness-v3` open members (2): #1163, #1166

#### #1275 — epic(docs): migration chapter — migrate-from guides, capability equivalence matrix, and end-to-end migration recipes
- milestone: `Backlog / Triage` · labels: `area:docs, type:docs, type:umbrella, status:triage, priority:p2`
- no machine-readable child list in body (prose-only umbrella)

#### #1276 — epic(quality): ratify and eliminate unsound types — no as-unknown-as, no arbitrary any, no conceded TS errors
- milestone: `Backlog / Triage` · labels: `type:umbrella, status:triage, priority:p1, area:packages`
- no machine-readable child list in body (prose-only umbrella)

#### #1277 — epic(docs-site): layout and UI polish pass — the desktop shell wastes space and has never had a design review
- milestone: `Backlog / Triage` · labels: `area:docs, type:umbrella, status:triage, priority:p2`
- no machine-readable child list in body (prose-only umbrella)

#### #1278 — Type soundness ratification: eliminate unsound and arbitrary types across the public surface and the docs
- milestone: `0.0.6` · labels: `area:docs, type:umbrella, status:triage, priority:p1, area:packages, area:contracts`
- no machine-readable child list in body (prose-only umbrella)

#### #1279 — docs: migration chapter — per-framework guides, compatibility matrix, and e2e migration recipes
- milestone: `0.0.6` · labels: `area:docs, type:umbrella, status:triage, priority:p2`
- no machine-readable child list in body (prose-only umbrella)

#### #1335 — Epic: Scaffold conformance — generated surfaces match current docs, exports and idiomatic usage
- milestone: `Backlog / Triage` · labels: `area:cli, type:umbrella, area:tooling, status:triage, priority:p1`
- body unchecked children (1): #1328[CLOSED]

### 4.1 Umbrella findings (facts)

- **Stale checkbox state (verified against closed set):**
  - `#301` "Road to 0.0.1-stable" — 5 unchecked children are already CLOSED: #305, #306, #391, #399, #401.
  - `#1126` "OpenAPI→MCP" — 9 unchecked children are already CLOSED: #1128–#1136. Only #1137, #1138, #1139, #1140 remain open. The epic reads far less complete than it is.
  - `#1335` "Scaffold conformance" — its only listed sub-issue #1328 is **CLOSED** (2026-08-07, `status:shipped`, `canary:0.0.5-canary.15`).
- **No umbrella has a checked box pointing at a still-open issue** (no false-complete rows).
- **Six umbrellas carry no machine-readable child list at all** — #232, #313, #400 (label group only), #510 (label group only), #1275, #1276, #1277, #1278, #1279. For #1276/#1277/#1278/#1279 there is *no* `epic:` label and *no* checkbox list, so their scope exists only as prose. These are the highest-risk duplicate-filing surfaces.
- **`epic:*` label groups that have no umbrella issue of their own:** `epic:desktop-frontend` (only #859), `epic:docs-cut` (only #695), `epic:telemetry-revamp` (only #248, which is also `epic:ai-stack`). These are orphaned single-member epic labels.
- **Cross-epic double membership:** #451, #453, #454, #455 carry both `epic:deployment` and `epic:unified-runtime`; #830 is itself an umbrella *and* a member of `epic:deployment` (child of #327). #248 sits in both `epic:ai-stack` and `epic:telemetry-revamp`.

### 4.2 Duplicate / near-duplicate umbrella pairs (dedup-critical)

These are the clearest duplicate filings on the current board. Confirmed by reading both bodies.

| Backlog copy | Milestoned copy | Evidence |
|---|---|---|
| **#1276** `epic(quality): ratify and eliminate unsound types` (Backlog/Triage) | **#1278** `Type soundness ratification` (0.0.6) | Same owner directive dated 2026-08-04, same evidence set (`query-bridge.md` `as unknown as IslandQueryClient` + TS2551/TS2345, `BaseContractProcedure = Readonly<{ ~orpc: any }>`, `observedEvents: any[]`, the 7 `quality:scan` allowances, `packages/cli/src/public/public-api.ts` ×5, `plugins/workers/streams/producer.ts`). #1276 organizes as tranches T1–T6; #1278 as inventory A/B/C/D. Both subsume #1245 and #1249. **One must be closed as duplicate or explicitly demoted to the epic-of-record.** |
| **#1275** `epic(docs): migration chapter` (Backlog/Triage) | **#1279** `docs: migration chapter` (0.0.6) | Identical title semantics: "migrate-from guides, capability equivalence matrix, end-to-end migration recipes" vs "per-framework guides, compatibility matrix, e2e migration recipes". Both `type:umbrella`. |

Additional overlaps that are *not* strict duplicates but will produce duplicate slices if planned independently:

- **#823** (`epic:unified-runtime`, Nitro v3 single deploy output) vs **#327** (`epic:deployment`, enterprise deployment framework) vs **#830** (`epic:deployment`, desktop singleton graph) — #823's entire open membership (#451, #453, #454, #455) is *inside* #327's unchecked child list. Three umbrellas, one child set.
- **#892** (`epic:deploy-plugin`, 29 open children) vs **#327**/**#830** — deploy plugin family vs deployment framework; no cross-reference in either body.
- **#400** (`epic:dev-dashboard`, 29 open children) vs **#922** (`epic:frontend-contrib`, 24 open children) — #922 names #400 as its first consumer ("this epic's core lands in the same beta.13 cut as its first consumer"), and #427/#432 are explicitly "KEEP-and-re-baseline per the RFC's supersession map". The re-baseline has not happened; both sets are still open verbatim.
- **#1335** (scaffold conformance) vs **#1333** (scaffold frontend modernization) — #1335's body names #1333's work as "Frontend scaffold modernization and dynamic app naming" but as a plain-text row, not a linked checkbox. A dedup pass must not re-file it.

---

## 5. Milestone-shape observations (facts, then hypotheses)

### 5.1 Facts

- **0.0.5 is the active release and still has 21 open issues**, including four `p0` (#1208, #1326, #1329, #1333) and one `status:impl` (#1338). Recent merged PRs (#1346, #1344, #1342, #1341, #1340 in local `git log`) show canary.14/canary.15 already cut, so 0.0.5 is mid-canary with p0 work outstanding.
- **0.0.2 still holds 5 open issues** (#175, #767, #768, #863, #864) although 0.0.3, 0.0.4 and most of 0.0.5 have shipped. #175 carries **no labels at all**.
- **0.0.8 (48) and 0.0.13 (44) are the two largest forward milestones**; 0.0.13 is almost entirely `epic:process-manager` + `epic:deploy-plugin` tail, i.e. a dumping ground rather than a release plan.
- **0.0.6 (22) mixes** three umbrellas (#1278, #1279), docs-leverage phase 3 (#1210), MCP corpus work (#1201, #1260), a blocked Aspire item (#1280), and the post-canary verification (#1343).
- **`status:` distribution is not release-shaped**: 162 `status:plan` and 82 `status:triage` against a single `status:impl`. 82 triage items means roughly a third of the board has never been groomed.
- **Exactly two `status:blocked` issues**, both in 0.0.6: **#1280** (Aspire TypeScript AppHost lacks custom health-check registration; Deno KV Connect exposes no health endpoint — both upstream) and **#1320** (`deps: collapse to a single Zod instance — blocked on @ag-ui/core hard ^3 and kvdex`).
- **19 open `priority:p0`**, distributed **0.0.5 = 5** (#1208, #1326, #1329, #1333, #1338), **0.0.7 = 9** (#923–#931, the entire frontend-contrib Wave-0 + contract spine), **0.0.8 = 5** (#872, #893, #895, #897, #898). Zero p0 in Backlog. So p0 pressure is concentrated in exactly three milestones and 0.0.7's p0 block is a single epic's critical path.
- **Board-hygiene gaps (exact):** issues with **no `priority:`** label — #175, #950, #1000. Issues with **no `status:`** label — #175, #950. Issue with **no labels at all** — **#175**. Issues with **no milestone** — #979, #980, #1000. Legacy non-namespaced labels still in use: `rfc` on #234, #313, #510, #820; `documentation` on #1000 only.

### 5.2 Hypotheses (flagged as such — not verified)

- The Backlog/Triage bucket (58) functions as a second epic registry, not a triage queue: 11 of the 20 open umbrellas live there. A roadmap that treats Backlog as "unplanned" will mis-scope ~200 transitively-owned children.
- 0.0.13 looks like a horizon milestone rather than a dated cut; its 44 issues are almost all `epic:process-manager`/`epic:deploy-plugin` leaves whose parents are unmilestoned in Backlog.

---

## 6. Detailed body summaries for the 31 pre-plan key issues

**Two of the named issues are CLOSED — current GitHub state overrides the pre-plan:**

| # | State | Detail |
|---|---|---|
| **1328** | **CLOSED 2026-08-07** | `fix(scaffold): generated check misses TSX/plugin runtimes while bare lint/fmt report 154 scaffold-owned findings` — milestone 0.0.5, labels `type:fix, area:cli, area:tooling, priority:p1, status:shipped, canary:0.0.5-canary.15`. Still referenced as an *open* dependency by #1333 ("Related: … #1328") and as the only sub-issue checkbox of #1335. |
| **1184** | **CLOSED 2026-08-04** | `sagas: generated runtime glue registers no KV adapter — saga runner crashes on a default scaffold` — milestone 0.0.5, labels `type:fix, status:ci-fail, priority:p1, area:kv, area:sagas, canary:0.0.5-canary.2`. This is the *precedent* #1325 invokes ("the triggers sibling of the saga generated-glue defect fixed in #1184"). |

The remaining 29 are open; summaries follow.

### 6.1 Scaffold / generated-surface conformance cluster

#### #1333 — `fix(scaffold/frontend): make the default app an idiomatic eis-chat-grade reference and derive its name from the project`
- **Milestone** 0.0.5 · `type:fix, area:cli, area:fresh-ui, area:fresh, status:triage, priority:p0`
- **Contract.** The scaffold ships strong frontend capability but its *default product surface* does not make the idiomatic patterns canonical. Evidence: a real Wave 6 agent (`rickylabs/loom`) received the Fresh-UI registry, `/design`, app `AGENTS.md`/`WEB-LAYER.md` and advanced templates, yet built routes with hand-rolled tables/buttons/forms/CSS, direct service calls, and a **676-line island**. `eis-chat` is named as the intended ceiling (app-owned registry components, layered `definePage`, `withForm`, QueryIsland/query factories, cache hydration, optimistic mutation, partial navigation, generated DB schemas, error contracts, live StreamDB, telemetry, route-local organization). Second defect: `SCAFFOLD_DEFAULTS.APP_NAME = 'dashboard'` is hardcoded, so every non-interactive scaffold produces a "dashboard".
- **Acceptance (10 boxes).** Default routes use app-owned Fresh-UI components; canonical resource flow = route contract → typed SDK/query factory → layered page builder → QueryIsland hydration/cache-first → optimistic mutation/rollback; managed forms + loading/error/empty/success + partial navigation + telemetry + auth-ready boundary in executable starter code; generated DB schemas feed versioned contracts; `/design` and `/design/composition` named as the living reference; resource-local `(_components)`/`(_islands)`; existing examples upgraded not deleted; omitted `--app-name` derives a project-appropriate name (explicit flag stays authoritative); Fresh scaffold golden/runtime tests; **a measured agent smoke** that adopts-or-explicitly-rejects the built-ins.
- **Dependencies.** "Related: #1071, #1073, #1208, #1210, **#1328**" — #1328 is now CLOSED, so that dependency is discharged.

#### #1335 — `Epic: Scaffold conformance — generated surfaces match current docs, exports and idiomatic usage`
- **Milestone** Backlog / Triage · `type:umbrella, area:cli, area:tooling, status:triage, priority:p1`
- **Contract.** No single conformance audit proves every scaffolded file uses current exports, current conventions, and the primitives the docs recommend. Explicitly *does not* duplicate #1328 (quality gates + 154 findings) or the frontend modernization issue; it owns the repository-wide inventory.
- **Scope.** Inventory every generated file and conditional variant across CLI scaffolding, apps, services, contracts, databases, plugins, background runtimes, Aspire config, examples, design routes, agent guidance, tasks, READMEs. Per file record: generator/template source; current public export demonstrated; canonical docs link; classification (required / optional example / generated artifact / removable noise); check-lint-fmt-runtime coverage; golden + published-canary conformance.
- **Acceptance.** Machine-readable generated-surface inventory mapping template → emitted file → docs → public export; every example checked against current exports; stale/duplicated/misleading noise removed; specialized issues land before rows are ticked; golden tests + scaffold runtime E2E; published-canary smoke proving local-source and published output match; a measured unfamiliar-agent run.
- **Dependencies.** Sub-issue list = `#1328` (CLOSED) + "Frontend scaffold modernization and dynamic app naming" (= #1333, unlinked) + "further surface-specific issues". States: "This is an umbrella. No implementation PR should close it directly."

#### #1325 — `fix(triggers): generated background runtime omits the Redis adapter and crash-loops on the default Aspire cache`
- **Milestone** 0.0.5 · `type:fix, area:plugins, area:aspire, status:triage, priority:p1`
- **Contract.** `plugins/triggers/src/adapter/resources/glue/runtime.stub.ts` emits `triggers/runtime.ts` with **no `import '@netscript/kv/redis'`**. Against the default Aspire Redis/Garnet cache the generated trigger runtime crash-loops until the user hand-edits a generated file (regeneration-unsafe).
- **Repro.** Scaffold on `0.0.5-canary.13` → install triggers → keep default Aspire cache → generate plugin resources → start AppHost → trigger resource fails (no adapter for detected Redis/Garnet provider) → add the import → restarts fine.
- **Acceptance.** Generated trigger runtime resolves/registers the configured KV adapter; default fresh scaffold starts with no manual edit; both Redis/Garnet and `CACHE_PROVIDER=denokv` covered; **RED-first generated-output test**; scaffold runtime E2E installs *every* KV-backed first-party background runtime and proves each reaches healthy; the invariant is shared/enumerated so a saga fix cannot ship while the trigger sibling is broken.
- **Dependencies.** Declared as "the triggers sibling of the saga generated-glue defect fixed in **#1184**" (#1184 CLOSED 2026-08-04, canary.2). The generalization requirement is the real deliverable.

#### #1327 — `fix(cli): db migrate reports success in headless mode without creating the migration implied by the command`
- **Milestone** 0.0.5 · `type:fix, area:cli, area:database, status:triage, priority:p1`
- **Contract.** After a schema change, `netscript db migrate` in a non-TTY session can exit 0 having only *deployed existing* migrations — creating none for the change, and not treating that absence as failure. Violates the artifact semantics established by `db init` and `db generate`: success must mean the named artifact-producing operation happened and is verifiable from its artifact.
- **Acceptance.** Consistent artifact semantics across `db init`/`db generate`/`db migrate`; schema-change + success ⇒ verified migration artifact; headless inability to create ⇒ explicit non-zero with actionable next command; deploy-only behavior gets an unambiguous name and cannot masquerade; output separates created vs applied; E2E covers TTY and non-TTY and verifies files **plus** DB state, not exit codes.
- **Environment.** WSL2, non-interactive OpenCode session, `0.0.5-canary.13`, PostgreSQL/Prisma scaffold.

#### #1332 — `docs(data/contracts): show generated DB schemas as the normative predecessor to API contracts in DB-backed products`
- **Milestone** 0.0.5 · `type:docs, area:docs, area:database, area:contracts, status:triage, priority:p1`
- **Contract.** Docs teach contract-first starting from a hand-written Zod API contract. In a DB-backed product, `db generate` already emits model schemas via `@database/zod`; mirroring them by hand is drift. Reproduced in Wave 6 Loom (contracts import no generated DB schema, hand-write Workflow/Node/Edge/Run/Step even though the import map exposes `@database/zod`); `eis-chat` by contrast imports generated `ChannelModelSchema`. Both truths must survive: DB-less products author the contract first; once a DB model exists, reuse/narrow/extend the generated schema is normative.
- **Locations.** Homepage contract/type-flow diagram + tabs, `docs/site/explanation/contracts.md`, `docs/site/web-layer/route.md`, cross-links from DB generation into server/builders/route docs.
- **Acceptance.** Type-flow diagram gains optional predecessor `DB model → db generate → @database/zod → narrowed/extended versioned API schema → handler/OpenAPI/SDK/page`; three-tab example gains optional Tab 0; examples explicitly omit persistence-only/private fields; both paths described with DB-backed identified as the norm when generated schemas exist; bidirectional links; all examples type-check against current generated exports incl. a multi-model relation case; a docs test/fixture prevents import-path drift.
- **Dependencies.** "Related: #1254 (shipped the multi-model generated schema barrel), #1210."

### 6.2 Streams / durable-runtime cluster

#### #1326 — `fix(streams): DurableStreamProducer permanently drops writes after an initial connection failure; reconnect is never attempted`
- **Milestone** 0.0.5 · `type:fix, area:plugins, status:triage, priority:p0`
- **Contract.** In `packages/plugin-streams-core/src/application/create-durable-stream.ts`, `#connect` runs **once**; on failure it sets `#connectError` and returns, and `#appendEvent` drops every event while that field is set. No timer, retry policy, or reconnect transition clears it. The log line promises "until reconnect" — a transition that cannot occur. A transient stream-service startup race therefore permanently disables live publication for the process lifetime.
- **Acceptance.** Initial *and* later transport failures enter a documented reconnect state; explicit retry/backoff, cancellation, readiness and shutdown semantics; explicit buffer bounds and overflow behavior (no silent loss); producer recovers when the server starts after it; tests for initial outage / mid-session outage / recovery / event ordering / shutdown-during-backoff; OTEL spans+metrics for connection state, retries, dropped/buffered events, recovery, using the standardized stream event envelope; **operator messages never promise a transition the implementation cannot perform**.
- **Dependency.** The "standardized stream event envelope" is defined by #1329 — these two must be planned as a pair.

#### #1329 — `fix(streams): documented SSE consumer shape differs from the wire protocol and does not specify the standard event/OTEL envelope`
- **Milestone** 0.0.5 · `type:fix, area:docs, area:plugins, area:telemetry, status:triage, priority:p0`
- **Contract.** `docs/site/durable-workflows/streams.md` teaches `source.onmessage` parsing one `{ key, value? }` change. The real `0.0.5-canary.13` wire emits **named `data` events whose payload is a JSON array of changes**, plus named **`control`** events carrying offsets. The documented code receives nothing. Deeper: there is no single documented standardized NetScript stream event envelope, and no statement of how correlation + W3C trace context cross the SSE boundary. Real consumer evidence: `rickylabs/loom` `apps/dashboard/islands/LoomCanvas.tsx` uses named `data` events and array payloads after runtime reverse-engineering. Endpoint: `/v1/stream/<namespace>/<stream>?live=sse&offset=0_0`.
- **Acceptance (8).** One exported versioned schema defining every SSE event name and payload (data batches, control/offset frames, errors, heartbeats); server emission + generated consumers + Fresh helpers + docs derived from or conformance-tested against it; the official example works unchanged against a real service; replay offsets/ordering/batching/deletion/reconnect/malformed-frame documented; each data envelope carries standardized correlation identity + `traceparent`/`tracestate`; **Aspire OTEL proof of producer → durable stream → SSE consumption in one correlated trace**; contract tests fail on event-name/envelope/cardinality/telemetry-field drift; complete shapes appear in task docs and generated reference API docs.

### 6.3 Docs-leverage program (#1208 → phase 2 → #1210) and MCP corpus

#### #1208 — `docs(tutorials): no tutorial demonstrates the page builder …`
- **Milestone** 0.0.5 · `type:docs, area:docs, status:plan, priority:p0`
- **Contract.** Owner-filed 2026-08-04, urgent — an agent launch waits on canary.2 and will consume these docs *through the MCP*, which multiplies the harm. **Phase 1 (this issue, merges FIRST):** primary tutorials demonstrate the page builder as the default way to build pages, with real type-checked examples exercising `withResource`, `withLayer`, `withLayout`, `withForm`, cache-first against the SDK, server+client dehydration, traces, and contract-first route implementation — the feature inventory verified against the **actual exported surface via `deno doc`**, not from memory. Every example compiles against published entrypoints with verification commands quoted. Tutorials stop teaching hand-rolled patterns where a page-builder feature exists (each replaced usage named).
- **Phase 2** (separate follow-up after phase 1 merges): full inconsistency-and-underleverage sweep across all tutorials, tracked as a checklist comment on #1208 when phase 1 lands. **This phase-2 issue does not exist yet on the board** — dedup risk: a roadmap may re-file it.
- **Verification.** Docs checks green; examples type-check; changed-file audit clean (docs lane — no `packages/`/`plugins/` source).

#### #1210 — `docs(web-layer): differentiator deep-dives + competitive tutorial benchmark`
- **Milestone** 0.0.6 · `type:docs, area:docs, status:plan, priority:p1`
- **Contract.** Phase 3 of the docs-leverage program. Two named exemplars, explicitly not the full scope — **every** page-builder API gets the same treatment. `withResource` deep-dive: request deduplication across layers, shared resources refined per layer, idiomatic for auth and context/URL-aware queries — "the owner has never seen it used in a single agent demo; the underleverage is measured, not hypothetical." **Partials**: NetScript's Fresh partial builder + helpers + API mechanism vs the ceremony bare Fresh requires; composes with deferred loaders.
- **Acceptance.** Web Layer manual gains a **per-API sub-page structure** (one page per API — `withResource`, `withLayer`, `withLayout`, `withForm`, Partials, dehydration, traces, contract-first routes, cache-first SDK data, and every other API discovered from the real `deno doc` surface), each with what-it-replaces, the idiomatic patterns, and a type-checked example; a **competitive benchmark** against Next.js / Nuxt / SvelteKit / Rails-class tutorial flows recording where our tutorials undersell and where our differentiators have no peer equivalent; cross-links from the phase-1 tutorials; examples verified against published entrypoints; docs checks green; docs-lane file audit clean.
- **Sequencing.** After #1208 phase 1 merges; phase 2 may run in parallel where surfaces don't overlap. Refs #1208, #1201.
- **Byproduct.** #1210 authoring is the discovery source for #1245 and #1249 (framework bugs found by writing the deep-dives). Run trail lives on PR #1215 (`orchestrator/docs-mainpages`, `d1-d4-report.md`), branch `docs/web-layer-deep-dives` baseline `24dbcaaa7`.

#### #1260 — `mcp: include SDK guidance in the shipped search_docs corpus`
- **Milestone** 0.0.6 · `type:feat, area:docs, area:tooling, area:agentic, status:triage, priority:p2`
- **Contract.** The CLI's default MCP composition embeds only the MCP package README (`packages/mcp/cli.ts`) plus `EMBEDDED_SKILL_FILES["help.md"]` (`packages/cli/src/public/features/agent/mcp/run-agent-mcp.ts`). No SDK/package documentation corpus, so `search_docs` cannot answer cache-invalidation / Fresh-hydration / optimistic-mutation questions even when the prose exists elsewhere. Observed in the maintainer session recorded in **#1253**; the *runtime* export-corpus failure is fixed there — this issue is deliberately scoped to the **prose corpus-coverage gap** so it is not mislabeled as a ranking defect.
- **Acceptance.** Shipped CLI MCP composition includes a bounded, release-matched SDK doc corpus; `search_docs` returns relevant SDK-level results for those three query classes; coverage proven **through the real CLI stdio interface from a scaffolded project**; freshness + release-staging gates analogous to the export corpus; result size and public-only filtering explicit and tested.
- **Refs.** #1253, #1218, #1201, #1197.

#### #1201 — `mcp: serve the generated export surfaces, not just prose docs`
- **Milestone** 0.0.6 · `type:feat, area:docs, area:tooling, area:agentic, status:plan, priority:p2`
- **Contract.** `docs-corpus-port.ts` models a document as title/description/headings with slugged sections ranked by token match — a **Markdown prose** corpus. The generated per-package export surfaces (`deno doc` output: every export, subpath, signature, JSDoc) are a different corpus type with **no MCP path**. Argument is asymmetric value: the prose has a map (`llms.txt`, headings); the export surface is 36 flat files with no map. Quoting the docs bundle's own note: *"The generated surfaces are excellent once you know what you want and useless for discovering what exists."*
- **Measured evidence** (wave-4 attribution-control run, 452 tool calls, complete product): `docs/deno-doc/` touched by **17** commands, `docs/pages/` 5, `llms.txt`/`llms-full.txt` 1, **MCP calls 0**. The most-used doc surface is the only one with no MCP path.
- **Strategic role.** "The last blocker to a mirror-free workspace" — wave runs ship an 8 MB docs mirror into every agent workspace; while a greppable mirror exists, `bash` stays the path of least resistance and MCP competes with a trusted tool.
- **Four question forms to answer.** (1) which package/subpath exports `<symbol>`; (2) what does `<pkg>` export grouped by subpath; (3) signature + JSDoc of `<symbol>`; (4) what exports look like `<partial name/shape>`.
- **Acceptance.** Distinct corpus type (not Markdown pretence); all four forms answerable with no docs mirror present; bounded retrieval (symbol + signature, not the whole file); version-pinned like the embedded prose corpus; **a workspace with no `docs/` directory at all** answers "which subpath exports this helper" end to end; verified by re-measuring a real agent run with MCP calls non-zero and `deno-doc` grep counts at zero *because the files are not there*.
- **Dependency.** Explicit follow-up to #1197.

#### #1102 — `feat(mcp): make capability discovery an intent-aware primary agent workflow`
- **Milestone** 0.0.5 · `type:feat, area:docs, area:tooling, status:triage, priority:p1`
- **Contract.** Current MCP retrieval is a flat lexical pass: tokenize → count in title ×12, headings ×5, body ×1 → sort → return one body-adjacent snippet. No concept/synonym expansion, field-length normalization, section-level ranking, link-graph traversal, task sequence, or code-block extraction. MCP instructions only route agents to docs search for *troubleshooting symptoms*, never as the default "understand this unfamiliar framework before implementing" workflow. Wave-four baseline: 0 docs-MCP calls across three runs.
- **Required shape.** An intent-aware guidance flow (`find_guidance` named as illustrative) returning: ordered recommended pages **and sections**; why each matches; a prerequisite → implementation → verification sequence; relevant code blocks with language + source slug/section; related capability/reference links; confidence/fallback. The #1068/#1079 task router becomes *input* to this flow rather than a separate text artifact.
- **Retrieval requirements.** BM25 + curated concept aliases, a small local embedding model, or another deterministic hybrid — contract over algorithm: concept mismatch must work ("avoid hitting my service every render" → cache-first queries/`staleTime`); section-level ranking; link-based next/prerequisite traversal; independently retrievable code fences/Vento examples; filesystem and embedded corpora behave identically; token-bounded and offline-capable.
- **Evaluation corpus (checked in).** Five named intents with expected top-three destinations: validated route-bound form → `web-layer/form`; keep server data fresh without polling → `web-layer/query` / live-dashboard cache-first chapters; add a capability NetScript does not ship → custom plugin authoring guide; use a Prisma-supported DB NetScript does not wrap → second-database unsupported-driver section; build a real service-backed UI → the #1068 task-router sequence. Measure top-k recall and deterministic bounds.
- **Explicit boundary.** "Do not use a future agent run as an acceptance checkbox" — observational adoption is tracked **only** in #1090.

#### #1197 — `agentic: the agent-init harness had zero adoption on 0.0.4`
- **Milestone** 0.0.5 · `type:fix, area:tooling, area:agentic, status:plan, priority:p1`
- **Contract.** 0.0.4 shipped #1023 (three-skill split) and #1024 (tooling bundle) to close the discovery gap. The first measured agent run on published 0.0.4 used **none of it**. Measured from the full OpenCode event log of the wave-4 DeepSeek attribution-control run (2h51m, 452 tool calls, complete product): MCP server **0**, `netscript plugin doctor` **0**, `aspire otel logs|spans|traces` **0**, all five installed skills **0**, `help.md` **0**, the 11 `.llm/tools/*` from #1024 **0**, `netscript agent drift record` **0**. Instead: 340 bash (75%), 52 read, 31 write, 23 edit, 1 skill (`playwright-cli`, not a NetScript skill), **35 hand-rolled `curl` probes**, 37 `aspire logs`, 125 grep/rg. It recorded five drift entries including three framework defects having run neither prescribed command; one defect cost 75 minutes.
- **Sixth consecutive zero.** Wave three measured zero MCP calls across all three runs — that is what motivated #1023/#1024; this is the first run on the release containing them and the number is still zero.
- **Structural finding.** The drift gate is real *and unreachable*: generated `AGENTS.md` says `agent drift record`/MCP `record_drift` refuse without a `plugin doctor --resource` receipt from the last 15 minutes, but agents record drift in a **markdown file** because that is what every brief and journal template asks for. "A gate on an unused tool constrains nothing."
- **Acceptance.** Routing to a diagnostic surface **at the moment of failure**, not by prior instruction; MCP usage on a measured run non-zero **or** the MCP server is not installed by default; drift recording either flows through the gated path or the gate is removed as unenforceable; verified by **re-measuring a real agent run** and comparing tool-call counts against this one; a repeatable extraction script lands with the fix.
- **Related.** #1163 (0.0.6) owns the internal twin (a milestone run executing from artifacts alone).

#### #1090 — `verify(wave-five): does the shipped agent surface actually change agent behaviour?`
- **Milestone** 0.0.5 · `type:test, area:cli, area:agentic, status:triage, priority:p1`
- **Contract.** A pure **verification** issue holding four acceptance criteria that no PR can satisfy because they observe a future agent run — relocated (not ticked, deleted or weakened) from #1072 box 4, #1073 box 3, #1071's falsifiable check, and #1068. To verify in wave five: non-zero MCP diagnostic tool usage (#1072); an agent building a data screen runs `ui:add` or records why not (#1073); the **#1071 falsifiable check** — same brief/version/bundle/budget, varying only the app-scoped conventions file, six agents per arm, blind scoring: does the agent inspect the component barrel and golden example before writing its route, and does the product import app-owned primitives rather than recreating them; an agent asked to build a service-backed UI reaches a Web Layer page before writing a route (#1068).
- **Thesis.** Wave four's lesson: *capability present is not capability activated* (`ui:add` existed, documented, unused; `agent init` diagnostic surface largely unused; `fresh-ui.txt` bundled, linked three times, a declared dependency — never opened).
- **Provenance.** Raised by the PR-D supervisor during 0.0.4 release orchestration 2026-08-03; relocated to 0.0.5 by the orchestrator.
- **Note.** #1090, #1102, #1197, #1201 form one measurement chain: #1102/#1201 build the capability, #1197 demands the re-measurement, #1090 holds the observational boxes. Planning them separately will duplicate the measurement harness three times.

#### #1343 — `verify(0.0.6): prove installed-consumer scaffold smoke against post-fix canary`
- **Milestone** 0.0.6 · `type:test, area:cli, area:tooling, area:agentic, gate:e2e, status:triage, priority:p1`
- **Contract.** One publication-dependent observation relocated from **#1024** by owner decision 2026-08-07. **#1342** supplies the implementation/lifecycle repair; this issue owns only the published-artifact proof.
- **Acceptance (single box).** From a clean directory **outside** the NetScript framework checkout, install and invoke the exact post-fix canary containing #1342 with **no local-source fallback**, run the full installed-consumer scaffold E2E smoke successfully, and preserve a receipt containing exact package version + provenance, command and working root, per-step verdicts, raw exit code, and cleanup/leak outcome.
- **Boundaries (explicit).** Do not duplicate #1024's five criteria already completed by #1092; do not reopen #1328's scaffold-owned quality implementation; does not publish a canary or change release order.
- **Cross-check.** `#1342` appears merged in local `git log` as `1455231b0 fix(scaffold): make generated quality gates own executable source (#1342)`, so the implementation half has landed and only the published-canary proof remains.

### 6.4 Type-soundness cluster

#### #1278 — `Type soundness ratification …` (0.0.6, `type:umbrella`)
- **Thesis.** "Type soundness is a primary NetScript selling point. Today the repo and the docs both concede places where it does not hold." Owner directive 2026-08-04: group them all, fix them all; sub-items are checkboxes so deferral is visible rather than silent. Sharpest exemplar: `docs/site/web-layer/query-bridge.md` requires `const queryClient = createNetScriptQueryClient() as unknown as IslandQueryClient;` because `createNetScriptQueryClient()` returns a real TanStack `QueryClient` typed as the narrower `QueryClientPort` (declares `fetchQuery`, not `prefetchQuery`, not assignable to `dehydrateQueryClient`'s parameter) — errors TS2551 and TS2345. **"A documented cast is a framework bug with a paragraph attached."**
- **Inventory A (docs).** `[x]` `web-layer/query-bridge.md` (the only checked box); `[ ]` `tutorials/chat/06-live-streaming.md` `as any`; `[ ]` `reference/contracts/index.md` `BaseContractProcedure = Readonly<{ ~orpc: any }>` **published as the contract surface**; `[ ]` `reference/triggers/index.md` + `examples_test.ts` `const observedEvents: any[]`; `[ ]` sweep for remaining `as any` / `as unknown as` / `@ts-ignore` in docs snippets.
- **Inventory B (12 production assertion sites, most carrying `quality-allow` rationale).** `packages/cli/src/public/public-api.ts` (**5** — "public facade bridges duplicated internal and exported plugin port identities pending package-boundary unification"; the largest and most public cluster); `packages/fresh/src/application/builders/define-page/builder/route-support.ts` (`RuntimePageConfig<TRouteTypes, true>['route']` cast — needs a conditional-preserving signature); `packages/fresh/src/application/form/_internal/runtime-types.ts` (2); `plugins/workers/streams/producer.ts` (`as ExecutionMutationHook` — fix by declaration merging or an upstream PR, not a cast); `packages/cli/.../new-plugin-use-case.ts`, `.../public-command-dependencies.ts`, `.../aspire/helpers/_utils.ts`, service-manifest loader `as ServiceManifest`.
- **Inventory C (guard rails).** A lint/check gate failing on new `as any` / `as unknown as` / `@ts-ignore` outside an allowlist that requires a linked issue id (same fail-closed shape as the version-drift and no-op-plugin gates); the gate covers **docs snippets**, not only source; `deno doc --lint` clean on every published package.
- **Inventory D (out of scope).** ~19 `*-contract-soundness_test.ts` files whose `@ts-expect-error`s **are** the soundness assertions — must stay, and the guard rail must not flag them.
- **Acceptance.** No `as any`/`as unknown as` on a public path without a linked open milestoned debt issue; no documented example requires a cast; regression gate live and fail-closed; each deferred sub-item unchecked with an explicit milestone.

#### #1276 — `epic(quality): ratify and eliminate unsound types …` (Backlog / Triage, `type:umbrella`)
- **Near-duplicate of #1278** (see §4.2). Same 2026-08-04 owner directive, overlapping evidence, different organization.
- **Additional measured numbers #1278 does not state:** **56** `as unknown as` occurrences across `packages/` + `plugins/`; **8** `deno-lint-ignore no-explicit-any` suppressions; **7 ratified `quality:scan` allowances** (6 in `packages/cli`, 1 in `plugins/workers/streams/producer.ts`) with their exact rationale strings. Also cites precise doc line numbers: `query-bridge.md:259` (cast) with the compiler refusal printed at lines 276–277; `reference/contracts/index.md:32`; `reference/triggers/index.md:310`.
- **Tranches (deferrable independently).** T1 public surface first (eliminate `any` from exported types); T2 the documented workarounds (#1245 + #1249, docs update lands with the fix); T3 the 7 ratified allowances ("pending package-boundary unification is a plan, not a resting state"); T4 production `as unknown as`; T5 test-side casts; T6 keep it fixed — extend `quality:scan` so a new `any` in an **exported** type or an unregistered `as unknown as` fails CI (today `quality:scan` covers `packages/cli/src` + `plugins` only).
- **Subsumes.** #1245, #1249, #1255 (`page.layer.delivery` span attribute misreport).
- **Constraints.** Framework source → WSL Codex slices per CLAUDE.md; docs updates follow each fix on the docs lane. "No suppression-as-fix": a new `deno-lint-ignore`/`as unknown as` introduced to green a gate is a review-blocking finding.

#### #1245 — `fix(fresh/query): island query types reject the package's own documented patterns`
- **Milestone** Backlog / Triage · `type:fix, area:packages, status:triage, priority:p2`
- **Three boundaries, established by running the checker (not reading types):** (1) `initialDataUpdatedAt` is documented as the route for `cachedAt` but is absent from `IslandQueryOptions` → **TS2353**; entry age cannot reach the island as documented. (2) `createNetScriptQueryClient()` returns a real `QueryClient` typed as the narrower `QueryClientPort`, making the package's own dehydration recipe untypeable without a bridge → **TS2551 + TS2345**. (3) `IslandQueryResult` omits `isRefetching`/`isFetching` → **TS2339**.
- **Also.** `getIslandQueryClient()`'s `@throws` JSDoc describes a guard the implementation lacks (docs wording corrected on the deep-dives branch); live-dashboard ch.4's island/dehydration snippets fail `deno check` against declared types — the phase-1 fixture passed **only because it mocked the SDK surface**.
- **Provenance.** Found during #1210 phase-3 authoring, batch 2; evidence in the run trail on PR #1215 (`d1-d4-report.md` "## Batch 2").
- **Lane.** Framework source → WSL Codex slice per doctrine. `web-layer/query-bridge.md` documents the boundaries honestly and should be simplified when these land.

#### #1249 — `fix(fresh/form): controlProps() is not element-assignable, and Zod 4 constraint derivation misses numbers and regex`
- **Milestone** Backlog / Triage · `type:fix, area:fresh, status:triage, priority:p2`
- **Defect 1.** `ControlProps` declares `readonly role?: string` (`packages/fresh/src/application/form/_internal/prop-types.ts`) while Preact JSX declares `role?: Signalish<AriaRole | undefined>`, so the canonical `<input {...state.fields.email.controlProps({ type: 'email' })} />` fails `deno check` with **TS2322** on `role` only. Reproduced with `jsx: "precompile"` / `jsxImportSource: "preact"` (the compiler options `packages/fresh/deno.json` and the scaffolded app use), preact 10.29.7. Adding `role={undefined}` after the spread compiles; naming props individually compiles. This is *why* `@netscript/fresh-ui` ships `getInputProps`/`getSelectProps`/`getTextareaProps` in `registry/components/ui/control-props.ts`. Package tests only read individual properties off `controlProps()`, never spread it, so nothing catches it. Suggested fix: narrow `ControlProps['role']` to the ARIA role union or `JSX.HTMLAttributes['role']`.
- **Defect 2.** `packages/fresh/src/application/form/schema-adapter/zod-constraints.ts` switches on check kinds `'min'`, `'max'`, `'multipleOf'` and handles `'string_format'` only for `format === 'url'`. Zod 4.4.3 emits different names: string `min_length`/`max_length` (`minimum`/`maximum`), `.regex()` → `string_format` with `format:'regex'` (`pattern`), number `greater_than`/`less_than` (`value` + `inclusive`), `multiple_of` (`value`), array `min_length`/`max_length`. Result: `z.string().regex(...)` gets **no `pattern`**; `z.number().min/max/multipleOf` gets **no `min`/`max`/`step`**. Strings and arrays work today only accidentally. Impact is presentational (server validation still enforces), but `formProps` sets `noValidate: true`, so a consumer gets neither native enforcement nor the attributes. Suggested fix: extend `readCheckKind`'s switch to the Zod 4 names with `inclusive` handling, read `pattern` off `_zod.def`, plus a regression test covering all five cases.
- **Provenance.** Found writing the `withForm` deep-dive (#1210 phase 3), proven with controls against `docs/web-layer-deep-dives` baseline `24dbcaaa7`. Documented as honest boundaries in `docs/site/web-layer/form.md` on that branch; prose should be simplified once fixed.

### 6.5 Plugin architecture / frontend-contribution cluster

#### #922 — `Epic: Frontend contribution layer — plugins that ship UI`
- **Milestone** 0.0.7 · `type:umbrella, area:plugins, area:fresh, epic:frontend-contrib, status:plan, priority:p1` · **24 open children (#923–#946)**
- **Contract.** A plugin becomes a full-stack unit: the same package contributing services, workers, schemas and Aspire wiring gains a `frontend/` directory contributing **pages, islands, zone components, nav entries and theme CSS** to any NetScript Fresh host app, discovered like every other axis (manifest pointer + generated type-checked registry) and mounted through upstream Fresh 2.3 primitives.
- **Design record.** RFC **#890** (draft PR carrying `rfc.md` + `.llm/runs/plan-frontend-contrib--seed/`, rev 3, twice reviewed: Sol·high adversarial 20/20 integrated, Kimi K3 docs-forecast 17/17 integrated).
- **Five pillars.** (1) Contracts — `@netscript/plugin-frontend-core/contracts/v1`: envelope + `(family, major)` versioning, `app` family (route/island/zone/nav/theme), identity quartet, `HostSurfaceDescriptor`, request/client context split, budgets. (2) Discovery — pointer axis in `@netscript/plugin`; transactional generated replace-set in `.netscript/generated/` with `frontend.check.ts` as the install gate. (3) Host runtime — `@netscript/fresh/plugins`: post-`fsRoutes` composition mounting, literal route loaders + normalizer, island specifier registration, `PluginZone`, nav feed, deny-by-default procedure gateway. (4) DX/lifecycle — `plugin new --with frontend`, `netscript plugin dev`, doctor taxonomy, quarantine states, `AppTarget` starters, `defineFrontendTestSuite` + budgets. (5) Consumers — first-party dogfood panels, auth v1, ai durable chat; dashboard (#400) and deploy epics consume in their own runs.
- **Sequencing law.** Wave-0 proofs S1–S5 (#923–#927) land before any public contract freezes — those mechanisms were the adversarial review's blocker findings. "First pull: the p0s (#923–#931)."
- **Waves.** Wave 0 proofs #923–#927 (p0, beta.13); Wave 1 contracts+spine #928–#931 (p0) + #932, #933 (p1); Wave 1b gateway #934 (p1); Wave 2 DX/lifecycle #935–#938, #940, #944; Wave 3 consumers #939, #941, #942, #943 (beta.15); Completion #945, #946 (beta.17).
- **Acceptance gates.** All Wave-0 proofs recorded with pass/fail evidence before contract-freeze slices merge; extended `scaffold.runtime` (install → render → hydrate → remove) green with a frontend-contributing plugin; every sub-issue closed or explicitly re-homed with a pointer.
- **Unblocks / supersession.** Dev dashboard panels (#400), auth UI, ai surfaces, deploy consoles. "Refs #427, #432 — both KEEP-and-re-baseline per the RFC's supersession map; no issues closed by this epic's filing." **Milestone drift (measured):** #922 says beta.13/beta.15/beta.17, but its children sit in **0.0.7** (#923–#941, 19 issues), **0.0.9** (#944), **0.0.11** (#942, #943), **0.0.13** (#945, #946). The epic itself is 0.0.7. Wave labels in the body and actual milestones no longer agree, and #944 (a Wave-2 item) is milestoned *later* than Wave-3 siblings would suggest.

#### #928 — `[frontend-contrib S6] @netscript/plugin-frontend-core contracts/v1`
- **Milestone** 0.0.7 · `type:feat, area:plugins, epic:frontend-contrib, status:plan, priority:p0` · Part of #922
- **Scope.** New **Archetype-1** package: `FrontendManifestEnvelope` + `(family, major)` versioning, app-family kinds (route/island/zone/nav/theme), identity quartet, `HostSurfaceDescriptor`, `PluginRequestContext`/`PluginClientContext` split, `FrontendRequires`, `FrontendBudgets`, `defineFrontend` (authoring form: contract default, string `MessageRef` shorthand, singular theme). Design source RFC #890 §5 + `.llm/runs/plan-frontend-contrib--seed/design/canonical/` rev 3.
- **Acceptance (gates only).** `deno doc --lint` clean + JSR publish dry-run green; envelope negotiation tests (old-host/new-plugin × new-host/old-plugin); `quality:scan` + `arch:check` green.

#### #934 — `[frontend-contrib S12] Generated deny-by-default procedure gateway`
- **Milestone** 0.0.7 · `type:feat, area:fresh, epic:frontend-contrib, status:plan, priority:p1` · Part of #922 · **its own reviewed wave (1b)**
- **Scope.** Generated per-procedure route table from `requires.procedures` × contract metadata at `/api/plugins/<mountId>/`; server-side auth via principal port; **no blind credential forwarding**; CSRF/origin checks, limits, timeouts, abort, manual redirects, header allowlist, audit line; streaming per metadata (AI durable chat stays on its specialized adapter).
- **Acceptance.** P5 threat-model checklist item-by-item negative tests; a non-granted procedure returns 404/deny (no wildcard reachability test).

#### #942 — `[frontend-contrib S20] Auth v1 frontend (account + session widget + signin starter)`
- **Milestone** **0.0.11** · `type:feat, area:auth, epic:frontend-contrib, status:plan, priority:p1` · Part of #922 (Wave 3, "beta.15")
- **Scope.** `plugins/auth` frontend over the **real five procedures**: live `/auth/account` route + `app.topbar.end` session widget + `SessionMenu` island; scaffolded signin/callback starters; **org console explicitly excluded** (waits on the auth-org capability, #945).
- **Acceptance.** Works against all three adapters (better-auth / workos / kv-oauth) with capability degradation; `defineFrontendTestSuite` green.

#### #946 — `[frontend-contrib S24] Convention generator (generate frontend)`
- **Milestone** **0.0.13** · `type:feat, area:cli, epic:frontend-contrib, status:plan, priority:p3` · Part of #922 (Completion wave, "beta.17")
- **Scope.** Phase-2 sugar: derive manifest contribution lists from the `frontend/` file tree; the explicit manifest **stays the contract**; export-map maintenance already owned by `plugin dev`.
- **Acceptance.** Generated lists **byte-match** a hand-written manifest for the dogfood plugin.

#### #1093 — `plugin core: discovery hardcodes official plugins' factory functions — third-party plugins cannot participate`
- **Milestone** 0.0.6 · `type:fix, area:plugins, status:triage, priority:p2`
- **Contract.** `packages/plugin/src/sdk/discovery/ast-extractor.ts:6-7` holds a table mapping **official plugins' factory functions to axes** (`{ callee: 'defineSaga', axis: 'sagas' }`, `{ callee: 'defineWebhook', axis: 'triggers' }`). A third-party plugin shipping `defineChannelSync` gets no AST discovery and there is no seam to register one — the core must be edited to add a plugin, which is exactly what the contribution model exists to avoid. Fails silently: the author concludes their plugin is wrong.
- **Why it matters beyond its size.** "Write your own plugin when the capability is missing" is load-bearing product story; `rickylabs/eis-chat` — a real product in daily production use — ships its own `plugins/channel-sync` and is the target agent demo runs are held against.
- **Scope, deliberately narrow.** In scope: the callee→axis table. Judgement call: `packages/config/src/paths/mod.ts:28-32,103-105` (`WORKERS`/`SAGAS`/`TRIGGERS` typed path constants) — decide and record whether it is scaffold-layout convention or plugin knowledge. **Explicitly out of scope:** JSDoc/usage examples, first-party plugins naming themselves, test fixtures.
- **Proposal.** Move the callee→axis declaration into the plugin that owns it (alongside `scaffold.plugin.json`/`officialSource`); core reads contributions. Official plugins then declare their factories exactly as a third-party plugin would — "the only way we find out whether the seam actually works."
- **Acceptance.** No core package requires editing to add a plugin's discovery; `defineSaga`/`defineWebhook` axes declared by `plugins/sagas`/`plugins/triggers`; a **third-party plugin fixture** discovered end to end, proven by a test that fails on today's `main`; the `packages/config` question decided and recorded; a doctrine check (`arch:check` or guard test) fails if a core package gains a branch on a specific plugin name.
- **Provenance.** Wave-four review 2026-08-03, raised while reviewing #1076 — the issue explicitly records that **#1076 itself is clean** and the hardcoding predates it. `packages/plugin/src/cli/application/registry-emitter.ts:13` already states the correct rule, so this is a gap against existing doctrine.

### 6.6 Enterprise auth cluster (children of #871)

#### #884 — `[enterprise-auth S13] Define organization-aware identity and authorization policy contracts`
- **Milestone** 0.0.12 · `type:feat, area:auth, area:service, epic:enterprise-auth, status:triage, priority:p1` · Part of #871
- **Contract.** Shared vendor-neutral contracts the vendor integrations need: canonical organization, membership, connection, role/group, assurance and policy-decision types, plus an authorization request over subject × organization × resource × action × context. The simple scope/role route guard is preserved **as an adapter, not the ceiling**.
- **Acceptance gates (9).** Identity contract distinguishes user / linked account / organization / membership / backend / provider / connection identifiers; authorization input includes tenant, subject, resource, action-relation, environment context, assurance/freshness; decision includes allow-deny, safe reason, provider, policy/model version, audit correlation; unknown tenants/memberships/claims/policy-providers/timeouts **fail closed**; claim normalization covers Entra app roles/groups, WorkOS roles/permissions, Better Auth org roles without conflating sources; Entra B2B guests use tenant-qualified immutable `tid`+`oid` and never key authorization by `#EXT#` UPN text; subject vocabulary distinguishes humans, service principals, autonomous machines, CLIs and user-delegated agents with an explicit actor/delegation chain; existing path scope/role guards adapt without breaking simple apps; tenant isolation has model/property tests across storage, cache, routing, authorization.
- **Dependencies.** None — **foundational for EA-04 … EA-07, EA-11, EA-14, EA-15.** Delivery shape: new vendor-neutral core/service contracts and adapters.

#### #885 — `[enterprise-auth S14] Build an auth conformance, mocking, and scaffold test kit`
- **Milestone** 0.0.12 · `type:feat, area:cli, area:auth, area:tooling, epic:enterprise-auth, status:triage, priority:p1` · Part of #871
- **Contract.** Expand the two current object builders into a security-focused test kit used by all auth backends and generated projects: fake OIDC/JWKS, signed tokens, WorkOS/Better Auth sessions and webhooks, SCIM events, Conditional Access claims challenges, multi-backend identities, clock/replay controls, negative cases.
- **Acceptance gates (7).** Shared suite per backend for capability truth / authentication / expiry / refresh / revoke / malformed input / unsupported operations; fake OIDC/JWKS supports rotation, bad issuer-audience-signature, nonce/state/replay, clock skew, refresh reuse, claims challenges; WorkOS session+webhook, Better Auth handler+plugin, Directory Sync/SCIM fixtures deterministic with **no live credentials**; multi-backend routing, linking, logout, provider outage and tenant-isolation scenarios reusable; generated-project smoke profiles cover direct Entra, WorkOS enterprise, Better Auth application auth and selected coexistence; docs/examples use the same fixtures and distinguish mocked conformance from live-provider acceptance; CI exposes a compact failure matrix by backend × capability × security invariant.
- **Dependencies.** Initial contract follows EA-00 and EA-12; expands alongside every adapter. Delivery shape: new shared testing package/fixtures + scaffold E2E profiles.

### 6.7 Aspire / infrastructure

#### #979 — `fix(aspire): plugin API resources still pin host ports 8091–8094`
- **Milestone** **none** · `type:fix, area:plugins, area:aspire, status:triage, priority:p2`
- **Contract.** Split out of #952 / PR #978, which made host-port pinning opt-in for the example service and the app but **deliberately left plugin API resources pinned**. Two workspaces that both install plugins collide on `:8091–:8094`, and `aspire start --isolated` cannot randomize them away.
- **Why not fixed in #978 (the real dependency chain).** The `scaffold.runtime` E2E suite **live-probes those exact ports**: `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts` L140–L235 probes `http://127.0.0.1:8091/health/live`, `:8092/api/v1/sagas/sagas`, `:8093/health`, `:8094/health/live`, and passes `--allow-net=127.0.0.1:8091,127.0.0.1:8092` into the generated project. **~20 tutorial and explanation passages under `docs/site/**` also `curl` those ports.**
- **Prerequisites.** (1) `scaffold.runtime` gates resolve each plugin resource's endpoint from the Aspire resource service or dashboard API instead of hardcoding `127.0.0.1:<port>`, including the `--allow-net` grant handed to the generated project. (2) Docs move from "`curl :8091`" to "read the URL the dashboard shows".
- **Then.** Drop `Port` from the plugin entries the scaffolder writes; the generator seam already exists — `packages/cli/src/kernel/templates/aspire/helpers/register/render-http-endpoint.ts` emits `{ env: 'PORT' }` when an entry carries neither `HostPort` nor `Port`, and `generate-register-plugins.ts` already calls it.
- **Sibling.** #980 (`netscript service add` still pins an Aspire host port, p3, also unmilestoned) is the same defect on a different command.

#### #1280 — `aspire: backing services report no real health check — blocked on TypeScript AppHost custom health-check support`
- **Milestone** 0.0.6 · `type:fix, area:aspire, area:database, status:blocked, priority:p2`
- **Contract.** Split from #1251 after verification. #1251's other rows (SQLite in the graph, `deno-kv` modelled with a resolved value and URL, no unresolved-parameter banner, a graph test per provisioned backing service) stay on #1251 for 0.0.5. **This row is proven undeliverable:** (1) Aspire's own health-checks documentation states verbatim that *"TypeScript AppHost support for registering custom health checks with `builder.Services.AddHealthChecks()` is not yet available"* — the C# `AddCheck` + `WithHealthCheck` path has no TypeScript equivalent. (2) The HTTP path cannot substitute: `withHttpHealthCheck('/health')` exists in TypeScript but requires the resource to serve HTTP, and **Deno KV Connect 0.11.0 exposes only authenticated POST `/`, `/snapshot_read`, `/atomic_write`, `/watch`** — no health endpoint. A generated `/health` probe would report green while checking nothing, the exact `healthStatus`-without-`healthReports` failure mode #1251 set out to kill. A prototype was built and deliberately discarded (PR #1266 research artifacts).
- **Acceptance (unblocks when an upstream condition changes).** Every provisioned backing service reports at least one **real** health check so `healthStatus` is never green off an empty report set; no generated probe passes against an endpoint that does not implement it.
- **Watch conditions.** Aspire TypeScript AppHost gaining custom health-check registration, **or** Deno KV Connect exposing a health endpoint.

---

## 7. Dedup checklist for roadmap authors

Before filing anything, check against these clusters — each already has an owner issue:

| Proposed topic | Existing issue(s) — do not re-file |
|---|---|
| Scaffold default app is not idiomatic / app name hardcoded | **#1333** |
| Repo-wide generated-surface conformance inventory | **#1335** |
| Generated background runtime missing a KV adapter | **#1325** (triggers); #1184 CLOSED (sagas) |
| `db migrate` false-green in headless | **#1327** |
| Docs should start from generated DB schemas | **#1332** |
| Durable stream producer never reconnects | **#1326** |
| SSE event envelope / telemetry propagation | **#1329** |
| Tutorials don't show the page builder | **#1208** (phase 1) — phase 2 sweep **is not yet an issue** |
| Per-API page-builder deep dives + competitor benchmark | **#1210** |
| MCP corpus lacks SDK prose | **#1260** |
| MCP has no export-surface corpus | **#1201** |
| MCP retrieval is lexical, not intent-aware | **#1102** |
| Agents don't use the shipped agent surface | **#1197** (fix) + **#1090** (measurement) |
| Published-canary installed-consumer smoke | **#1343** |
| Type soundness / `as unknown as` / `any` in public types | **#1276** *and* **#1278** (duplicates — pick one) |
| Island query type gaps (`initialDataUpdatedAt`, `QueryClientPort`, `isRefetching`) | **#1245** |
| `controlProps` role assignability + Zod 4 constraint derivation | **#1249** |
| Plugins shipping UI (routes/islands/zones/nav/theme) | **#922** + #923–#946 |
| Plugin discovery hardcodes official factories | **#1093** |
| Org-aware identity/authorization contracts | **#884** |
| Auth conformance/mocking test kit | **#885** |
| Aspire plugin resources pin host ports | **#979** (+ **#980** for `service add`) |
| Backing services have no real health check | **#1280** (blocked upstream) |
| Migration chapter docs | **#1275** *and* **#1279** (duplicates — pick one) |
| Docs-site layout/UI polish | **#1277** |
| Single Zod instance | **#1320** (blocked on `@ag-ui/core` ^3 + kvdex) |

---

## 8. Method and limits

- All issue data from `gh issue list --repo rickylabs/netscript --state open --limit 500 --json number,title,labels,milestone,createdAt,updatedAt,body,assignees,url` on 2026-08-08; closed-set cross-check from the same command with `--state closed --limit 1200` (385 rows).
- Milestone counters from `gh api repos/rickylabs/netscript/milestones --paginate`; they include PRs, which is why they exceed the issue-only measurement.
- Umbrella child resolution is *mechanical*: `epic:*` label membership plus regex over `- [ ] #N` / `- [x] #N` in the umbrella body. Umbrellas that list children in prose (#232, #313, #1275, #1276, #1277, #1278, #1279) have **no** machine-readable child set and are flagged as such — their true scope is unknown to this snapshot and must be read manually before planning.
- GitHub's native sub-issue graph was **not** queried (the MCP/`gh` surface used here exposes body text and labels only). If sub-issue links exist beyond the checkbox lists, this snapshot under-reports them.
- Body summaries in §6 are condensations of the issue text as written; where a body states a measurement (tool-call counts, file:line, TS error codes), the measurement is reproduced verbatim and is the issue author's claim, not independently re-verified in this pass.
