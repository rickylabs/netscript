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
- Cited S2 runtime verification receipts (`03-v2-cold-start-timing.time.txt`, `03-v3-isolated-starts.raw.txt`, `03-v4-detached-dashboard.raw.txt`) and S10 gate receipts.
- Wired xref and how-to index links; `deno task docs:links` passes clean (103 docs, 0 broken links).

### S4: Observability, skills, reference, tutorials, vto templates, README, CONTRIBUTING (2026-08-30)
- `docs/site/observability/how-to/add-opentelemetry.md`: documented `aspire:otel --search timestamp:>=`, `aspire:export` archive layout, exit 12 on bare `aspire otel` without running dashboard, and D-17 endpoint resolution precedence.
- `docs/site/reference/ai/skills.md`: documented upstream Aspire workflow skills co-existence alongside NetScript's diagnostic skill (OF-1a) and the 14-tool Aspire MCP baseline (D-15, D-45).
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

### Convergence Rebase onto S10' a46ea16d (2026-08-30)
- Rebased branch onto `a46ea16d` following Aspire stack rebase onto main `3e5cbabf` (D-54).
- Preserved main's merged prose in `docs/site/explanation/aspire.md` (`carry from Aspire's .NET AppHost:`).
- Preserved canonical `.agents/skills/help.md` playbook description in `docs/site/reference/ai/skills.md`; added upstream workflow skills (OF-1a) and exact 14-tool Aspire MCP baseline without `describe_resource`.
- Re-ran asset generators and verified all quality gates (`check:agent-docs-prose`, `check:publish-assets`, `check:assets-barrel`, `docs:links`, Lume build).
- Verified 0 occurrences of `describe_resource` and 0 `.NET Aspire` regressions across public docs.
- Force-pushed to `origin:docs/aspire-13-5-s11-public-docs-refresh` with lease (`088ca090`).






