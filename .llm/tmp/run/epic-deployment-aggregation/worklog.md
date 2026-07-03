# Worklog — epic-deployment-aggregation

- Run started (UTC): see `.run-started`.
- Worktree created off origin/main: `.claude/worktrees/deployment-research`, branch `research/deployment-aggregation`.
- Run dirs scaffolded: sources/{aspire,deno-deploy,providers,watch}, escalations/.

## Supervisor prep (grounding for spec synthesis)

### Repo taxonomy (rickylabs/netscript, post-#298)
- Milestones: `0.0.1-beta.1` (#1), `0.0.1-stable` (#2), `Backlog / Triage` (#3).
- Colon labels present: `type:{fix,docs,feat,chore,refactor,perf,test,sub-pr,umbrella}`, `area:{cli,docs,plugins,auth,aspire,tooling,ai-core,fresh,fresh-ui,plugin-ai,database,kv,sdk,service,config,deps,telemetry}`, `status:{impl,impl-eval,ready-merge,triage,plan,research,plan-eval,augment-review,ci-fail}`, `priority:{p0,p1,p2,p3}`, `wave:{defer,v1,v1-min}`, `epic:ai-stack`, `gate:{e2e,jsr}`, `rfc`, `breaking`, `prime-time`, `dx`.
- NO `area:deploy` and NO `epic:deployment` label yet → epic issue will need one created (coordinate w/ parent) or fall back to `type:umbrella` + closest area. Precedent: `epic:ai-stack` + `type:umbrella`.

### Current deploy surface (packages/cli/src/public/features/deploy/)
- Command group `deploy-group.ts` with subcommands: build (windows strategy: prebuild/runtime/tasks/options/cli), copy, install, logs, package-cli, start, status, stop, uninstall, upgrade.
- Full Windows service lifecycle already exists (SERVY). Registered via public-command-dependencies.ts (deployBuildDependencies, windows service adapter, manifest resolver).
- Config contract packages/config/src/domain/schemas/deploy-schema.ts: `deploy.windows.*` ONLY today — servyCliPath, installBase, servicePrefix, mode(compile|script), denoPath, compileTarget(x86_64-pc-windows-msvc), concurrency, compile/bundle timeouts, bundleExternal(Imports), workspace, v8HeapMb per type, generateEnvFile, logging(rotation), health(interval/failedChecks/restart), docker{denoBaseImage:denoland/deno:2.5, dotnetBaseImage:aspnet9.0}.
- Top-level `DeployConfigSchema` comment: "Supports multiple deployment targets (windows, future: linux, docker, k8s)" — the extension seam is already anticipated but only `windows` is wired. `docker` sub-block exists but appears unused by any non-windows path.

### ada2a5 hand-off
- Not present in this worktree (separate session). Will fold in if relayed; otherwise ground Aspire publish flow on the scraped corpus + mcp__aspire docs.

## Corpus cached (checkpoint) — 77 source files + servy-assessment.md
- sources/aspire/ 30 (mcp__aspire get_doc; publish/deploy suite + k8s×6 + azure×9 + architecture×3)
- sources/deno-deploy/ 14 (Deno Deploy new platform + sandbox)
- sources/providers/ 15 (aws,cloudflare,coolify,digitalocean,dokploy,gcp,koyeb,render,sevalla,vercel)
- sources/watch/ 8 (pulumi-3838, nitro, rfc-14, deno compile/desktop)
- sources/netscript-start/ 6 (POC origin, gh-api-wsl)
- Master manifest: sources/manifest.md; per-group manifest-g{1..4}.md
- ada2a5 hand-off still not in worktree; Aspire publish flow grounded on sources/aspire/.

## Distilled agent findings (grounding index for spec synthesis)
See detailed per-group in the four agent final reports. Key locked facts:
- ASPIRE: two-command publish/deploy; compute-env (compose/k8s/aks/aca/appservice) orthogonal to Aspire env (dev/stage/prod); pipelines=step graphs (AddStep/WithPipelineStepFactory, replaces WithPublishingCallback 13.0); state cache ~/.aspire/deployments/{sha}/{env}.json; JS publish shapes = ContainerFiles/StaticFiles/StaticWebsite/NodeServer/PackageScript + AddNextJsApp (Deno app mirrors NodeServer/PackageScript = ada2a5 AddDenoApp seam); images always registry-mediated; aspire deploy supersedes azd; CI/CD two-layer.
- DENO DEPLOY (tier-1 strategic): deno-native build (Queue→Prepare→Install→Build→Deploy), CLI-first programmatic deploy (deno deploy create/deno deploy) + GitHub-push auto-build; managed PG/KV; Deno 2.5 runtime allow-all. Sandbox microVM + `deno sandbox deploy --prod` bridge.
- PROVIDERS: Deno-native=Deno Deploy, Koyeb(git/docker). Docker-image=GCP Cloud Run, Render, Sevalla, DigitalOcean(droplet), Dokploy/Coolify(self-host compose). Function-runtime unofficial=Vercel(@lowlighter), Cloudflare(denoflare). AWS=layer-hack or container Lambda (no first-party).
- WATCH: Pulumi#3838 TRACK (0.140 intent not shipped; gRPC-server-in-Deno blocker denoland/deno#23714). Nitro deno_server preset TRACK (needs --unstable; central to RFC-14). RFC-14 unified-mode = product decision (Nitro v3 + oRPC + Fresh2, mode-parity, sagas excluded, 3-5mo). deno compile ADOPT for bare-metal single-binary; deno desktop TRACK (v2.9 VFS+autoUpdate; signing not automated).
- SERVY: MODERNIZE (SERVY upstream healthy; rot NetScript-side). Reuse ProcessPort/WindowsServicePort seam → generalize to os-service port (servy+systemd adapters); gaps: no Linux, doc/code divergence, no rollback/multi-instance, weak secrets, fake-only tests + dead docker/script config + deno:2.5 pin.

## Spec deliverables + epic filed (final checkpoint)
- deployment-architecture-spec.md (427 lines, 8 sections) — Aspire-grounded, CLI↔Aspire one-click, per-target adapter map, OsServicePort bare-metal successor, enterprise concerns, doctrine impact, Phase 0-5 phasing.
- decision-gap-tracker.md (175 lines) — readiness matrix, watch verdicts, gap list, 6 open product decisions, 14-item sub-issue breakdown.
- servy-assessment.md (294 lines) — verdict MODERNIZE.
- EPIC ISSUE FILED: rickylabs/netscript#327 — labels type:umbrella + epic:deployment + area:deploy + status:research + priority:p2; milestone Backlog/Triage. Labels area:deploy + epic:deployment created (epic:ai-stack precedent).
- Milestone rationale: Backlog/Triage (epic must not block road-to-stable umbrella); tier-1 sub-issues can promote to 0.0.1-stable per user tiering decision.
- Critical path: ada2a5 AddDenoApp seam gates Aspire container/cloud lane (Phase 3+); Phases 0-2 (config contract, bare-metal, Deno Deploy) unblocked.

## CORRECTION (2026-07-03) — Aspire container lane is NOT C#-gated (user-flagged, G7 re-verified)
- User flagged: Aspire docs have a language toggle; `?aspire-lang=typescript` reveals `.mts` AppHost codeblocks. The "C#-only custom publish → container lane gated on ada2a5" finding came from the default C# tab and is substantially FALSE.
- G7 (opus) re-fetched 10 deployment pages + 2 deep pages via WebFetch with the lang param; re-cached as sources/aspire/*--ts-tab.md (+ manifest-g7.md).
- TS AppHost drives the full container lane today: addContainer('denoland/deno:2')/addDockerfile; addDockerComposeEnvironment/addKubernetesEnvironment/addAzureContainerAppEnvironment; publishAsDockerComposeService/publishAsKubernetesService/publishAsAzureContainerApp; pipeline.addStep(); .withEnvironment('OTEL_DENO',...); addParameter({secret:true}).
- Genuinely C#-only (narrow, NOT needed by NetScript): authoring brand-new custom resource TYPES + generic callback deployment extensibility (custom-deployments TS tab states verbatim). Minor: appsettings.{env}.json layering.
- ada2a5 AddDenoApp: hard blocker → OPTIONAL DX (TRACK). Riskier than built-in primitives since new resource types land C#-first.
- Critical path: NO upstream hard dependency remains; Phases 0-3 parallelizable. k8s/Azure lose sole blocker. D2 collapses to positioning choice.
- Applied: spec §2.3/§2.4/§2.6/§6.2/§7/§8 + tracker (matrix Docker/k8s/Azure rows, Phase 3 gaps, D2, sub-issue #9) + #327 body (edited) + correction comment posted (#issuecomment-4872149719).

## 2026-07-03 — Directive 3: 6 product decisions resolved + prioritized
- Resolved D1-D6 (calls, not questions): D1 RFC-14=WATCH; D2 Deno Deploy=beta marquee + Aspire Docker/Compose co-beta; D3 v1 bare-metal line = systemd+compile+rollback+health+OTEL+basic-secrets (HA/secret-store→stable); D4 manual signing v1 / automate stable; D5 deploy.targets.* + windows alias through beta, remove at stable; D6 Pulumi=WATCH.
- Priority ordering recorded: beta tier-1 / stable tier-2 / watch — explicit v1 exclusions.
- decision-gap-tracker.md §4 (resolved), new §4b (priority ordering), §5 (sub-issues tagged BETA/STABLE/SPLIT/WATCH).
- #327 body updated (decision table + priority ordering + tagged sub-issues) + decisions comment posted (#issuecomment-4872254216).
- No NEEDS USER items. Research/spec only, no impl.

## 2026-07-03 — D5 USER OVERRIDE: clean break, no alias
- User override: `deploy.windows.*` → `deploy.targets.*` is a CLEAN BREAK, no back-compat alias ("we're alpha, breaking changes allowed, go production-grade directly").
- Dropped the "alias through beta, remove at stable" plan everywhere.
- Updated: decision-gap-tracker.md §4 (D5 row), §4b (beta Phase 0), §5 (sub-issue #2); deployment-architecture-spec.md §3.3 (clean-break stance), §7 item 2, §8 Phase 0; #327 body (D5 row + priority + sub-issue) + correction comment (#issuecomment-4872309717).
- No other decisions reopened. Research/spec only.

## 2026-07-03 — GREENLIGHT: phased plan + 14 slices filed (planning only)
- Posted detailed phased execution plan (Phases 0-5, per-phase goal/deliverables/deps/gates + DAG) as #327 PLAN comment (issuecomment-4872648426).
- Filed 14 slice issues [Deploy-S1..S14] = #337-#350; labels (type/area:deploy+/priority/epic:deployment/wave) + milestones (beta.1 #337-#344, stable #345-#348, Backlog/Triage #349-#350) applied + spot-verified.
- Updated #327 body: sub-issue checklist now links #337-#350 grouped by phase.
- BLOCKED: Projects board add — #327 not on any board + gh token missing read:project scope; flagged to coordinator in PLAN comment.
- Still planning/spec only; no code, no PRs. Impl gate held by coordinator pending user review.
