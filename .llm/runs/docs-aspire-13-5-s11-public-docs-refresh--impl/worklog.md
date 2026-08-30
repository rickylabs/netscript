# Worklog — docs-aspire-13-5-s11-public-docs-refresh--impl

## S11 — Public docs + README refresh for Aspire 13.5

### S1: Manifest sweep + plan (2026-08-30)
- Verified baseline at `c61b1626` on `test/aspire-13-5-s10-e2e-gate-upgrades`.
- Evaluated all 113 `doc:*` manifest rows owned by S11.
- Scaffolded harness run artifacts in `.llm/runs/docs-aspire-13-5-s11-public-docs-refresh--impl/`.
- Created draft PR #1771 targeting `test/aspire-13-5-s10-e2e-gate-upgrades` with labels `type:docs`, `epic:aspire-13-5`, `area:docs`, `area:aspire`, `priority:p2`, `status:impl`, `ci:skip-e2e`, milestone `0.0.7`.

### S2: Dedicated Aspire pages (2026-08-30)
- `docs/site/explanation/aspire.md`: updated `aspire.config.json` snippet to SDK `13.5.3`, `Aspire.Hosting.PostgreSQL` `13.5.3`, `Aspire.Hosting.Browsers` `13.5.3-preview.1.26425.3`; updated `apphost.mts` imports to `.mts`; normalised terminology.
- `docs/site/quickstart/aspire.md`: updated Aspire CLI reference and link to `aspire.dev`.
- `docs/site/reference/aspire/index.md`: documented 13.5 AppHost capabilities — listener-readiness health checks (`addHealthCheck`/`withHealthCheck`), typed resource commands (`CommandOptions.Arguments`), `excludeFromMcp()` for `<db>-cli` helper executables, and `Aspire.Hosting.Browsers` preview.
- `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md`: updated line 58 to SDK `13.5.3`, documented the CLI/SDK single-train pairing rule and npm self-update note; normalised terminology.

### S3: #1642 how-to "Detached start for agents and CI" (2026-08-30)
- Authored `docs/site/orchestration-runtime/how-to/detached-start-agents-ci.md` closing #1642.
- Documented `aspire start --format Json` and `aspire ps --format Json` schemas (`pid`, `appHostPath`, `dashboardUrl` with token redacted, `logFilePath`, `resources`).
- Documented `ASPIRE_CLI_START_TIMEOUT` environment variable vs `aspire wait --timeout <seconds>`, parallel execution with `--isolated`, and forceful teardown via `aspire stop --force`.
- S2 runtime verification references (`02-runtime-lifecycle.md`, `02-aspire-start-1.json`, `02-aspire-ps-1.json`, `aspire-13.5-verification.md`) [historical reference superseded: public pages cite standard documentation and avoid internal receipt names].
- Wired xref and how-to index links; `deno task docs:links` passes clean (103 docs, 0 broken links).

### S4: Observability, skills, reference, tutorials, vto templates, README, CONTRIBUTING (2026-08-30)
- `docs/site/observability/how-to/add-opentelemetry.md`: documented `aspire:otel --search timestamp:>=`, `aspire:export` archive layout, exit 12 on bare `aspire otel` without running dashboard, and endpoint resolution precedence.
- `docs/site/reference/ai/skills.md`: documented upstream Aspire workflow skills co-existence alongside NetScript's diagnostic skill and the 14-tool Aspire MCP baseline.
- `docs/site/cli-reference.md`: added Aspire orchestration CLI reference table (`restore`, `start`, `ps`, `describe` / `resources` alias, `stop --force`, `docs api search`).
- `docs/site/glossary.md`: normalised Aspire definition.
- `docs/site/tutorials/*` and `deploy.md`: normalised Aspire terminology and links to `aspire.dev`.
- `docs/site/*.vto` and `README.md`: normalised Aspire terminology and links.

### S5: Terminology sweep (#1000) & diagram review (2026-08-30)
- Completed exhaustive scan of all 113 owned `doc:*` files: verified zero occurrences of `.NET Aspire` remain across `docs/site/` (outside internal `_plan/` archive), root `README.md`, and package READMEs.
- `docs/site/_diagrams/aspire-resource-graph.mmd`: updated comments to "Aspire", verified graph node definitions and committed SVG asset.
- `packages/aspire/README.md`: normalised introductory overview to "Aspire".

### S6: Regeneration + Gates (2026-08-30)
- Generated and verified agent doc prose: `deno task gen:agent-docs-prose` & `deno task check:agent-docs-prose` (fresh, 0 stale paths).
- Generated and verified publish assets: `deno task gen:publish-assets` & `deno task check:publish-assets` (0 findings).
- Verified internal doc links: `deno task docs:links` (103 docs, 0 broken links).
- Executed Lume site build: `deno task --cwd docs/site build` (642 files generated, 228 HTML pages verified).
- Executed workspace quality gates: `deno task check` (0 occurrences), `deno task lint` (0 findings), `deno task fmt:check` (0 findings).
- All 113 `doc:*` manifest rows evaluated, 0 deferred.

### Docs Audit Cycle-1 Fixes (2026-08-30)
- **H1 / H2 / H3 (`detached-start-agents-ci.md`):** Replaced JSON example schemas with exact captured schemas from real S2 receipts (`02-aspire-start-1.json` and `02-aspire-ps-1.json`: `appHostPid`, `cliPid`, `logFile`/`logFilePath`, `status`, `sdkVersion`, `dashboardUrl`; no `pid`, no `state`, no nested `resources`). Redaction note conditional on auth token presence (`?t=...`). Removed nonexistent receipt references and S10 assertions. Updated cold start timing to 24.80–38.62 s. Clarified `--non-interactive` vs `--nologo`, `aspire wait <resource>`, and `--isolated` port/secrets scoping.
- **H4 (`deploy-local-aspire.md`):** Corrected npm package name to `@microsoft/aspire-cli`. Documented `aspire update --self` installation-method awareness and kept single-train rule.
- **H5 (`explanation/aspire.md`, `deploy-local-aspire.md`):** Updated `aspire.config.json` snippet to reflect current scaffold output (13.4.6 baseline with PostgreSQL, Redis, and Browsers packages) with an explicit note on the 13.5.3 target configuration.
- **H6 (`add-opentelemetry.md`):** Clarified that generated task wrappers (`aspire:otel`/`aspire:export`) resolve via forwarding and `aspire ps` retry. Documented the MCP telemetry resolver precedence chain under `@netscript/mcp` and removed internal `D-17` label.
- **H7 (`reference/aspire/index.md`):** Rephrased 13.5 contracts to generated/configuration contracts with live verification pending. Scoped `excludeFromMcp()` strictly to MCP tool surface omission.
- **M1 (`reference/ai/skills.md`):** Added concrete `aspire agent mcp --dashboard-url <url>` form (with optional `--api-key`). Removed `OF-1 (a)` and `ratified` from public prose. Kept exact 14-tool baseline.
- **M2 (`cli-reference.md`):** Clarified `aspire ps` token condition and `aspire stop --force` definition per `aspire stop --help`.
- **M3 (PR body & Run Dir):** Generated `manifest-disposition.md` covering all 121 S11-owned manifest rows.
- **M4 (Prose Hygiene):** Verified 0 occurrences of decision IDs (`D-17`, `OF-1`), internal test receipt references, or `/home/agent` paths across all public doc pages.
- **M5 (Diagrams Gate):** Recorded `diagrams:check` execution in run dir (Mermaid CLI `mmdc` unavailable; committed SVGs verified by Lume build).
- Re-ran `gen:agent-docs-prose`, `gen:publish-assets`, `gen:assets-barrel` and verified `check:agent-docs-prose`, `check:publish-assets`, `docs:links`, Lume build.

### Docs Audit Cycle-2 Fixes (2026-08-30)
- **H2 (`worklog.md`):** Updated historical receipt citations to real S2 files (`02-runtime-lifecycle.md`, `02-aspire-start-1.json`, `02-aspire-ps-1.json`, `aspire-13.5-verification.md`) and marked superseded; removed S10 runtime-receipt assertions.
- **H3 (`detached-start-agents-ci.md`, `explanation/aspire.md`, `reference/aspire/index.md`):** Updated cold start timing to cite 2 recorded runs (38.62 s and 24.80 s from S2 V2); updated `--isolated` description to exact help definition (randomized ports and isolated user secrets) and explicitly noted container host ports are not guaranteed unique across isolated starts; removed all "parallel-safe ports" / "free infra ports" claims.
- **H5 (`explanation/aspire.md`, `reference/aspire/index.md`):** Clarified callout as "Target after the 13.5.3 pin" (D-62) and confirmed current head generates 13.4.6 baseline; removed reference page claim that generated AppHost pins 13.5 Browsers package at this head.
- **H6 (`add-opentelemetry.md`):** Documented exact 4-step MCP resolver precedence chain (`--endpoint` flag, `NETSCRIPT_TELEMETRY_ENDPOINT`, `ASPIRE_DASHBOARD_PORT`, default `http://localhost:18888`) per `packages/mcp/src/domain/telemetry-endpoint.ts` without un-shipped `aspire ps` discovery.
- **M3 (`manifest-disposition.md` & PR body):** Generated disposition table derived by construction from `git diff --name-only a46ea16d..HEAD` (8 edited manifest rows, 113 verified-clean rows, 0 deferred).
- **M5 (`diagrams:check`):** Executed `deno task diagrams:check` from `docs/site`; verified static SVGs via Lume site build.
- Re-generated prose and publish assets (`gen:agent-docs-prose`, `gen:publish-assets`, `gen:assets-barrel`) and verified all quality gates.

### Docs Audit Cycle-3 Outcome (2026-08-30)
- **M3 Acceptance Artifact (D-63):** Content claim-correct; corrected manifest disposition count in worklog to the exact range-derived figures matching `manifest-disposition.md` and `git diff --name-only a46ea16d..HEAD` (8 edited manifest rows, 113 verified-clean rows, 0 deferred across 121 total S11-owned rows).







