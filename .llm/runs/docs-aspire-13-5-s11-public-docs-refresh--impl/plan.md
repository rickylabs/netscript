# Plan — S11 Public docs + README refresh for Aspire 13.5

## Scope & Contract
- Epic: #1712, Sub-issue: #1723 (S11)
- Closes #1642 (detached/non-TTY start how-to), #1000 (".NET Aspire" → "Aspire")
- Surface: 113 `doc:*` manifest rows owned by S11 + new #1642 how-to.

## Slices Breakdown

1. **Slice 1: Manifest sweep + plan** (This slice)
   - Regenerate `doc:*` row list and verify each row disposition.
   - Scaffold run artifacts (`supervisor.md`, `research.md`, `plan.md`, `worklog.md`, `drift.md`, `context-pack.md`).
   - Open draft PR targeting `test/aspire-13-5-s10-e2e-gate-upgrades` and post initial PR trail.

2. **Slice 2: Dedicated Aspire pages**
   - `docs/site/explanation/aspire.md`: snippet → 13.5.3, Browsers preview `13.5.3-preview.1.26425.3`.
   - `docs/site/quickstart/aspire.md`: update commands, descriptions.
   - `docs/site/reference/aspire/index.md`: health checks (`addHealthCheck`/`withHealthCheck`, listener readiness), typed resource commands (`CommandOptions.Arguments`, db-cli mode), `excludeFromMcp()` on `<db>-cli` helpers (MCP exposure only).
   - `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md`: line 58 + CLI/SDK pairing rule + `aspire update --self` npm note.

3. **Slice 3: #1642 how-to "Detached start for agents and CI"**
   - New page: `docs/site/orchestration-runtime/how-to/detached-start-agents-ci.md`.
   - `aspire start --format Json` fields, `aspire ps --format Json` (`logFilePath`, `dashboardUrl` with token redacted), `ASPIRE_CLI_START_TIMEOUT` vs `aspire wait --timeout`, `--isolated`.
   - Cite S2/S10 receipts.
   - Update navigation and index.

4. **Slice 4: Observability + skills + reference + tutorials + vto + README + CONTRIBUTING**
   - `docs/site/observability/*`: `aspire otel … --search timestamp:>=`, `aspire export` layout, D-17 dashboard endpoint precedence.
   - `docs/site/reference/ai/skills.md`: upstream workflow skills beside NetScript `aspire`, 14-tool MCP baseline (`get_integration_docs` documented-unobserved).
   - `docs/site/cli-reference.md`: Aspire commands, `aspire resources` alias, `stop --force`, `aspire docs api search … --language typescript`.
   - `docs/site/glossary.md`: Aspire terms.
   - Tutorial tracks' scaffold/deploy chapters.
   - `docs/site/quickstart.vto`, `docs/site/index.vto`, `docs/site/why.vto`, `docs/site/concepts.vto`.
   - `README.md` (~20 lines).
   - `CONTRIBUTING.md:57,86`.

5. **Slice 5: Terminology check (#1000) + Diagrams**
   - Verify no ".NET Aspire" regression in touched pages and anywhere else in `docs/site/`.
   - Dashboard: no AI-Assistant mentions; VS Code auto-launch note if present.
   - Diagram: `docs/site/_diagrams/aspire-resource-graph.mmd` (health checks, db-cli / commands) and render SVG.

6. **Slice 6: Regeneration + Gates**
   - `deno task gen:agent-docs-prose`.
   - `deno task gen:publish-assets`.
   - `deno task --cwd docs/site diagrams:render` and `diagrams:check`.
   - Gates: `check:agent-docs-prose`, `check:publish-assets`, `docs:links`, `deno task --cwd docs/site build`.
   - Parity gate check: 0 deferred `doc:*` rows.

## Manifest Sweep (113 rows owned by S11)

| Path | Class | Decision | Proof / Grep | Target Slice |
| ---- | ----- | -------- | ------------ | ------------ |
| `AGENTS.md` | `doc:root` | **No change needed** | grep aspire: skill paths and doctrine references are already current | Slice 1 sweep |
| `CONTRIBUTING.md` | `doc:root` | **Edit** | lines 57, 86 toolchain and Aspire CLI notes | Slice 4 |
| `docs/site/_data.ts` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/_data/xref.ts` | `doc:site-infra` | **No change needed** | grep -i "aspire": references plugin/config keys; no version literals or stale terms | Slice 1 sweep |
| `docs/site/_diagrams/architecture-overview.mmd` | `doc:diagram-source` | **Edit / Review** | diagram source review | Slice 5 |
| `docs/site/_diagrams/aspire-resource-graph.mmd` | `doc:diagram-source` | **Edit / Review** | grep ".NET Aspire" found (normalise to Aspire) | Slice 5 |
| `docs/site/_plugins/ai-tooling.ts` | `doc:site-infra` | **No change needed** | grep -i "aspire": references plugin/config keys; no version literals or stale terms | Slice 1 sweep |
| `docs/site/ai/agent-tooling.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/ai/engine.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/ai/how-to/build-a-durable-chat.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/ai/index.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/background-processing/how-to/tune-worker-runtime.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/background-processing/workers.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/cli-reference.md` | `doc:public-page` | **Edit** | grep ".NET Aspire" found | Slice 4 |
| `docs/site/concepts.vto` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/data-persistence/database.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/data-persistence/how-to/choose-a-queue-provider.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/data-persistence/how-to/database-migration.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/data-persistence/how-to/queue-kv-cron.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/data-persistence/how-to/use-a-second-database.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/data-persistence/index.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/data-persistence/kv-queues-cron.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/durable-workflows/sagas.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/durable-workflows/streams.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/durable-workflows/triggers.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/explanation/architecture.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/explanation/aspire.md` | `doc:aspire-dedicated` | **Edit** | grep 13.4 found (update snippets to 13.5.3) | Slice 2 |
| `docs/site/explanation/compared.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/explanation/contracts.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/explanation/durability-model.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/explanation/index.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/explanation/observability.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/explanation/plugin-system.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/glossary.md` | `doc:public-page` | **Edit** | grep ".NET Aspire" found | Slice 4 |
| `docs/site/how-to/index.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/identity-access/auth.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/identity-access/how-to/add-authentication.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/index.vto` | `doc:public-page` | **Edit** | grep ".NET Aspire" found | Slice 4 |
| `docs/site/observability/how-to/add-opentelemetry.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/observability/index.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/observability/telemetry.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/orchestration-runtime/cli-scaffold.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/orchestration-runtime/how-to/add-a-plugin.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/orchestration-runtime/how-to/author-a-plugin.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/orchestration-runtime/how-to/deploy-deno-deploy.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/orchestration-runtime/how-to/deploy-local-aspire.md` | `doc:aspire-dedicated` | **Edit** | grep 13.4 found (update snippets to 13.5.3) | Slice 2 |
| `docs/site/orchestration-runtime/how-to/deploy.md` | `doc:public-page` | **Edit** | grep ".NET Aspire" found | Slice 4 |
| `docs/site/orchestration-runtime/how-to/graceful-shutdown.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/orchestration-runtime/how-to/roll-out-runtime-overrides.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/orchestration-runtime/index.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/orchestration-runtime/runtime-config.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/quickstart.vto` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/quickstart/aspire.md` | `doc:aspire-dedicated` | **Edit** | aspire-dedicated reference page | Slice 2 |
| `docs/site/reference/ai/skills.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/reference/aspire/index.md` | `doc:aspire-dedicated` | **Edit** | aspire-dedicated reference page | Slice 2 |
| `docs/site/reference/cli/commands.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/reference/config/index.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/reference/mcp/index.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/reference/plugin/index.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/reference/queue/index.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/reference/sagas/index.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/reference/sdk/index.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/reference/streams/index.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/reference/triggers/index.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/reference/workers/index.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/services-sdk/how-to/add-a-service.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/services-sdk/how-to/discover-services.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/services-sdk/how-to/expose-openapi-scalar.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/services-sdk/sdk.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/services-sdk/services.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/tutorials/chat/01-scaffold.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/chat/02-durable-chat-route.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/chat/03-chat-ui.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/chat/04-tool-call.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/chat/05-mcp.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/chat/06-live-streaming.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/chat/index.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/erp-sync/01-scaffold.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/erp-sync/02-import-job.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/erp-sync/03-polyglot-transform.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/erp-sync/04-queue-and-cron.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/erp-sync/05-deploy.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/erp-sync/index.md` | `doc:public-page` | **Edit** | grep ".NET Aspire" found | Slice 4 |
| `docs/site/tutorials/index.md` | `doc:public-page` | **Edit** | grep ".NET Aspire" found | Slice 4 |
| `docs/site/tutorials/live-dashboard/01-scaffold.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/live-dashboard/02-contract-to-service.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/live-dashboard/05-live-stream.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/live-dashboard/06-deploy.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/live-dashboard/index.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/storefront/01-scaffold.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/storefront/02-catalog-service.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/storefront/03-cart-contracts.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/storefront/04-checkout-saga.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/storefront/05-shipping-webhook.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/storefront/06-storefront-ui.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/storefront/07-deploy.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/storefront/index.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/workspace/01-scaffold.md` | `doc:public-page` | **Edit** | grep ".NET Aspire" found | Slice 4 |
| `docs/site/tutorials/workspace/02-auth.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/workspace/03-workspace-data.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/workspace/04-provision-job.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/workspace/05-route-authz.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/workspace/06-deploy.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/tutorials/workspace/index.md` | `doc:public-page` | **Edit** | feature/command/precedence update for 13.5 | Slice 4 |
| `docs/site/web-layer/fresh-ui.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/web-layer/how-to/build-a-desktop-frontend.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/web-layer/how-to/customize-fresh-ui.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/web-layer/query.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/web-layer/server.md` | `doc:public-page` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `docs/site/why.vto` | `doc:public-page` | **Edit** | grep ".NET Aspire" found | Slice 4 |
| `packages/cli/src/kernel/assets/app/main.ts.template` | `template:other` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `packages/cli/src/kernel/assets/app/routes/_app.tsx.template` | `template:other` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `packages/cli/src/kernel/assets/app/routes/(design)/design/(_components)/components-view.tsx.template` | `template:other` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `packages/cli/src/kernel/assets/app/routes/health.tsx.template` | `template:other` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `packages/cli/src/kernel/assets/generated/workspace/netscript-config-1.ts.template` | `template:other` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `packages/cli/src/kernel/assets/manifest.ts` | `template:other` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `packages/cli/src/kernel/assets/windows/env.template` | `template:other` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `packages/cli/src/kernel/assets/workspace/gitignore.template` | `template:other` | **No change needed** | grep: no ".NET Aspire", no 13.4 literals, architectural references valid | Slice 1 sweep |
| `README.md` | `doc:root` | **Edit** | Aspire section refresh (~20 lines) + .NET Aspire normalisation | Slice 4 / Slice 5 |
