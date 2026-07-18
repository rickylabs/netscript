# NetScript competitive-advantage inventory (repositioning pass, 2026-07-18)

Working artifact per owner method guidance: every genuine advantage, each with its proof point
from the lane-3 fact sheets / audited READMEs / executed evidence, then ranked by
enterprise-buyer appeal. This ranking drives section order in BOTH the root README and the
docs-site homepage. Sources: facts-runtime-plugins.md (FRP), facts-cli-agentic.md (FCA),
facts-aspire-deploy.md (FAD), facts-docs-status.md (FDS), homepage-research.md (HR),
executed-command evidence in this worklog (EXEC).

## A. Inventory (advantage → proof point)

1. **Contract-first, end-to-end typed, zero codegen drift.** One oRPC contract is implemented by
   services and consumed by generated typed SDK clients, both in sync because they share one
   definition. Proof: FRP D1 "What it IS" (contracts README:12-16); typed client pipeline
   `defineServices` (sdk README:23-33); CRUD builders emit whole contracts from one entity schema
   (contracts README:28-33). EXEC: scaffolded contract snippet `deno check` clean on beta.10.
2. **One unified API across the whole backend surface.** The same contract style covers services,
   workers, sagas, triggers, streams, auth — plugins bind `*-core` builders to the host; shared
   6-code error vocabulary in `baseContract`. Proof: FRP D1/D2 (contracts README:20-22;
   plugin README:12-34; per-plugin READMEs).
3. **Backend batteries no frontend meta-framework ships.** Durable jobs in 4 runtimes with
   at-least-once delivery (workers README:25-32), sagas with compensation + crash-resume
   (sagas README:24-32), ack-then-process trigger ingress with retry/dead-letter
   (triggers README:28-38), durable replayable streams with no database (streams README:8,23-34),
   swappable-backend auth (auth README:24-36), in-process AI surface (ai README:7-8,24-36).
   Proof: FRP D2 throughout. EXEC: `plugin install worker --name workers` output.
4. **Deploy spectrum: single consumer binary → multi-cloud distributed infrastructure.** Shipped
   beta.10: docker, compose, linux-service, windows-service (single compiled binary as OS
   service), deno-deploy (preflight guard), kubernetes, azure-aca/app-service/aks, cloud-run —
   one thin router, canonical lifecycle. Proof: EXEC `netscript deploy list` (10 targets);
   FAD D2 (cli README:131-145). Native desktop consumer installers (.dmg/.AppImage/.deb/.rpm/
   .msi) + Ed25519 update server: **New in 0.0.1-beta.11** (FAD D2; adversarial shipped-truth
   check). Owner direction: further targets (e.g. Cloudflare) are roadmap direction, not shipped.
5. **Cloud-agnostic, operator-owned posture.** NetScript mints no credentials and hand-authors no
   Helm/Bicep/k8s manifests; targets delegate to the operator's own tooling. Proof: FAD D2
   (cli README:131-145, deploy-target-port.ts:2-32).
6. **One command from nothing to a running distributed app.** `netscript init` scaffolds 183
   files/44 dirs (contracts + typed service + Postgres + Aspire) in seconds; Aspire brings up the
   whole graph with a live dashboard. Proof: FCA D1 (cli README:24-26,91); EXEC clean-run
   timings (init 4-5.5 s; full flow verified end-to-end incl. health 200).
7. **Orchestration without lock-in: Aspire behind an adapter.** No Aspire SDK type in any public
   signature; config is plain validated data; composition testable in memory with no .NET
   toolchain. Proof: FAD D1 (aspire README:6-37).
8. **Observability by default, zero-SDK OTLP.** Every service gets tracing middleware; scheduler →
   queue → worker → RPC → SSE stitched into one distributed trace; Deno's built-in OTLP exporter —
   zero OpenTelemetry SDK dependency; dashboard shows every resource/trace/log. Proof: FRP D1
   (service README:31-33; telemetry README:7-9,53-55); FAD D1.
9. **Derived wiring is regenerated, never hand-maintained.** "Scaffold-and-grow, not
   scaffold-and-diverge": every workspace-changing verb regenerates AppHost helpers, plugin
   registries, contract aggregates. Proof: FCA D1 (cli README:22,104). EXEC: "Regenerated 12
   Aspire helper files" on plugin install.
10. **Agent operability layer (MCP × skills × CLI).** 13 token-bounded MCP tools, content-hashed
    skill bundle, default-deny CLI gate (17 allow/6 deny), one-command `agent init`,
    version-locked triple. Proof: FCA D2 (tool-types.ts:4-19; truncation.ts:10;
    command-policy.ts:24-49; cli README:113-127). EXEC: agent init wrote .mcp.json + 3 skills.
11. **Deno-native security and platform.** Explicit permission flags on every scaffolded resource;
    Deno 2.9+/Deno KV platform; production preflight for Deno Deploy. Proof: FRP maturity lines
    (workers README:138-142); EXEC scaffold (`--allow-net --allow-env …` in generated
    register-services.mts); FAD D2 (cli README:138).
12. **Lockstep-versioned ecosystem with a hard publish surface.** 29 published packages + 6
    plugins on one aligned version; "the published package surface is the contract"; docs
    reference generated from source with `deno doc`. Proof: FDS §2.1-2.2 (why.vto:17;
    index.vto:17-22), §1.6; EXEC jsr checks.
13. **Deterministic testing surfaces built in.** CLI `./testing` in-memory ports; per-plugin
    testing primitives; memory Aspire builder. Proof: FCA D1 (cli README:32-34); FRP D2; FAD D1.
14. **Honest health/lifecycle runtime.** 3 health probes, graceful drain, LIFO shutdown hooks per
    service — one call. Proof: FRP D1 (service README:22-33). EXEC: /health JSON with database
    check.

## B. Ranking by enterprise-buyer appeal (drives section order)

1. Unified contract-first e2e-typed API (##1+2) — the Laravel-class "one coherent framework"
   promise; lead example.
2. Batteries no frontend meta-framework ships (#3) + the spectrum line (#4) — the
   differentiation chapter ("from a single binary on a consumer machine to a multi-cloud
   distributed infrastructure", desktop half version-marked beta.11).
3. One-command running distributed app + regenerated wiring (##6+9) — the quickstart payoff.
4. Orchestration + observability by default (##7+8) — the production-grade evidence.
5. Deploy breadth, cloud-agnostic posture (##4+5) — the "ship anywhere" chapter.
6. Agent operability (#10) — strong dedicated chapter, demoted from flagship lead per owner.
7. Trust floor: lockstep versions, testing surfaces, health/lifecycle, Deno security
   (##11-14) — woven into status/architecture copy rather than own chapters.

## C. Copy method (per HR lessons)

Benefit-first headline + one concrete proof element per claim (executed snippet, real output,
real number); desire before mechanics (HR lessons 1, 4, 6, 8); pain-point positioning for the
differentiation chapter (HR lesson 8); agent chapter keeps Encore-style concreteness (HR lesson 3)
without holding the lead slot.
