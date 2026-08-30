# Worklog — docs-aspire-terminology--1723a

## Bootstrap (supervisor)

- Leaf cut from `origin/main` `13878a80` with `--no-track`; no upstream.
- Scope decided from a current-main evidence sweep plus Aspire-lane receipts; see `research.md`.
- PLAN-EVAL N/A recorded with justification in `plan.md`; IMPL-EVAL not waived.


## Design

- **Public surface:** published README and docs prose only; no API, CLI, package, or plugin contract
  changes.
- **Domain vocabulary:** use the current product name “Aspire” and the canonical documentation
  destination `https://aspire.dev`.
- **Ports / constants:** N/A for a prose-only terminology sweep.
- **Commit slices:** (1) scoped terminology/link edits, proven by zero-hit greps and docs gates;
  (2) regenerated derived assets, proven by the three generated-asset check gates.
- **Deferred scope:** all version- and behaviour-bound Aspire 13.5 documentation listed in
  `research.md` §4.
- **Contributor path:** public docs live under `docs/site`; generated corpus and publish assets
  follow via the three mandated generators.

## Implementation — S1 terminology sweep

- Replaced all 18 scoped `.NET Aspire` occurrences with natural “Aspire” phrasing.
- Repointed the four scoped Microsoft Learn links to `https://aspire.dev`.
- Protected `13.4.6` literals remain unchanged.
- `docs/site/_plan/**`, package/plugin source, telemetry, and the S13 cleanup set remain untouched.
- Reconcile: the exact scoped inventory resolved to 18 occurrences in 13 files, despite the brief’s
  “14 files” summary; the enumerated path list itself contains 13 files. Recorded as D-4 in
  `drift.md`; no scope expansion was made.

## Aspire surface manifest — S11 `doc:public-page`

Source:
`git show research/aspire-13.5-0.0.7:.llm/runs/research-aspire-13.5-adoption--0.0.7/aspire-surface-manifest.tsv`.
Every one of the 102 rows is assigned exactly once: **8 edited, 91 no change needed, 3 deferred**.

| Manifest row | Bucket | Change / proof / blocker |
| --- | --- | --- |
| `docs/site/_data.ts` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/_data.ts` → no hits |
| `docs/site/ai/agent-tooling.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/ai/agent-tooling.md` → no hits |
| `docs/site/ai/engine.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/ai/engine.md` → no hits |
| `docs/site/ai/how-to/build-a-durable-chat.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/ai/how-to/build-a-durable-chat.md` → no hits |
| `docs/site/ai/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/ai/index.md` → no hits |
| `docs/site/background-processing/how-to/tune-worker-runtime.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/background-processing/how-to/tune-worker-runtime.md` → no hits |
| `docs/site/background-processing/workers.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/background-processing/workers.md` → no hits |
| `docs/site/cli-reference.md` | edited | `.NET Aspire` → `Aspire`; legacy Learn URL → `aspire.dev` where present |
| `docs/site/concepts.vto` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/concepts.vto` → no hits |
| `docs/site/data-persistence/database.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/data-persistence/database.md` → no hits |
| `docs/site/data-persistence/how-to/choose-a-queue-provider.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/data-persistence/how-to/choose-a-queue-provider.md` → no hits |
| `docs/site/data-persistence/how-to/database-migration.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/data-persistence/how-to/database-migration.md` → no hits |
| `docs/site/data-persistence/how-to/queue-kv-cron.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/data-persistence/how-to/queue-kv-cron.md` → no hits |
| `docs/site/data-persistence/how-to/use-a-second-database.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/data-persistence/how-to/use-a-second-database.md` → no hits |
| `docs/site/data-persistence/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/data-persistence/index.md` → no hits |
| `docs/site/data-persistence/kv-queues-cron.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/data-persistence/kv-queues-cron.md` → no hits |
| `docs/site/durable-workflows/sagas.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/durable-workflows/sagas.md` → no hits |
| `docs/site/durable-workflows/streams.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/durable-workflows/streams.md` → no hits |
| `docs/site/durable-workflows/triggers.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/durable-workflows/triggers.md` → no hits |
| `docs/site/explanation/architecture.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/explanation/architecture.md` → no hits |
| `docs/site/explanation/compared.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/explanation/compared.md` → no hits |
| `docs/site/explanation/contracts.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/explanation/contracts.md` → no hits |
| `docs/site/explanation/durability-model.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/explanation/durability-model.md` → no hits |
| `docs/site/explanation/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/explanation/index.md` → no hits |
| `docs/site/explanation/observability.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/explanation/observability.md` → no hits |
| `docs/site/explanation/plugin-system.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/explanation/plugin-system.md` → no hits |
| `docs/site/glossary.md` | edited | `.NET Aspire` → `Aspire`; legacy Learn URL → `aspire.dev` where present |
| `docs/site/how-to/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/how-to/index.md` → no hits |
| `docs/site/identity-access/auth.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/identity-access/auth.md` → no hits |
| `docs/site/identity-access/how-to/add-authentication.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/identity-access/how-to/add-authentication.md` → no hits |
| `docs/site/index.vto` | edited | `.NET Aspire` → `Aspire`; legacy Learn URL → `aspire.dev` where present |
| `docs/site/observability/how-to/add-opentelemetry.md` | deferred | S3 #1741 / S10 #1722 — Aspire OTEL/export fixture and CLI surface have not been re-captured |
| `docs/site/observability/index.md` | deferred | S3 #1741 / S10 #1722 — Aspire OTEL/export fixture and CLI surface have not been re-captured |
| `docs/site/observability/telemetry.md` | deferred | S3 #1741 / S10 #1722 — Aspire OTEL/export fixture and CLI surface have not been re-captured |
| `docs/site/orchestration-runtime/cli-scaffold.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/orchestration-runtime/cli-scaffold.md` → no hits |
| `docs/site/orchestration-runtime/how-to/add-a-plugin.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/orchestration-runtime/how-to/add-a-plugin.md` → no hits |
| `docs/site/orchestration-runtime/how-to/author-a-plugin.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/orchestration-runtime/how-to/author-a-plugin.md` → no hits |
| `docs/site/orchestration-runtime/how-to/deploy-deno-deploy.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/orchestration-runtime/how-to/deploy-deno-deploy.md` → no hits |
| `docs/site/orchestration-runtime/how-to/deploy.md` | edited | `.NET Aspire` → `Aspire`; legacy Learn URL → `aspire.dev` where present |
| `docs/site/orchestration-runtime/how-to/graceful-shutdown.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/orchestration-runtime/how-to/graceful-shutdown.md` → no hits |
| `docs/site/orchestration-runtime/how-to/roll-out-runtime-overrides.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/orchestration-runtime/how-to/roll-out-runtime-overrides.md` → no hits |
| `docs/site/orchestration-runtime/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/orchestration-runtime/index.md` → no hits |
| `docs/site/orchestration-runtime/runtime-config.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/orchestration-runtime/runtime-config.md` → no hits |
| `docs/site/quickstart.vto` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/quickstart.vto` → no hits |
| `docs/site/reference/ai/skills.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/reference/ai/skills.md` → no hits |
| `docs/site/reference/cli/commands.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/reference/cli/commands.md` → no hits |
| `docs/site/reference/config/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/reference/config/index.md` → no hits |
| `docs/site/reference/mcp/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/reference/mcp/index.md` → no hits |
| `docs/site/reference/plugin/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/reference/plugin/index.md` → no hits |
| `docs/site/reference/queue/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/reference/queue/index.md` → no hits |
| `docs/site/reference/sagas/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/reference/sagas/index.md` → no hits |
| `docs/site/reference/sdk/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/reference/sdk/index.md` → no hits |
| `docs/site/reference/streams/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/reference/streams/index.md` → no hits |
| `docs/site/reference/triggers/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/reference/triggers/index.md` → no hits |
| `docs/site/reference/workers/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/reference/workers/index.md` → no hits |
| `docs/site/services-sdk/how-to/add-a-service.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/services-sdk/how-to/add-a-service.md` → no hits |
| `docs/site/services-sdk/how-to/discover-services.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/services-sdk/how-to/discover-services.md` → no hits |
| `docs/site/services-sdk/how-to/expose-openapi-scalar.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/services-sdk/how-to/expose-openapi-scalar.md` → no hits |
| `docs/site/services-sdk/sdk.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/services-sdk/sdk.md` → no hits |
| `docs/site/services-sdk/services.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/services-sdk/services.md` → no hits |
| `docs/site/tutorials/chat/01-scaffold.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/chat/01-scaffold.md` → no hits |
| `docs/site/tutorials/chat/02-durable-chat-route.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/chat/02-durable-chat-route.md` → no hits |
| `docs/site/tutorials/chat/03-chat-ui.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/chat/03-chat-ui.md` → no hits |
| `docs/site/tutorials/chat/04-tool-call.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/chat/04-tool-call.md` → no hits |
| `docs/site/tutorials/chat/05-mcp.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/chat/05-mcp.md` → no hits |
| `docs/site/tutorials/chat/06-live-streaming.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/chat/06-live-streaming.md` → no hits |
| `docs/site/tutorials/chat/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/chat/index.md` → no hits |
| `docs/site/tutorials/erp-sync/01-scaffold.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/erp-sync/01-scaffold.md` → no hits |
| `docs/site/tutorials/erp-sync/02-import-job.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/erp-sync/02-import-job.md` → no hits |
| `docs/site/tutorials/erp-sync/03-polyglot-transform.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/erp-sync/03-polyglot-transform.md` → no hits |
| `docs/site/tutorials/erp-sync/04-queue-and-cron.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/erp-sync/04-queue-and-cron.md` → no hits |
| `docs/site/tutorials/erp-sync/05-deploy.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/erp-sync/05-deploy.md` → no hits |
| `docs/site/tutorials/erp-sync/index.md` | edited | `.NET Aspire` → `Aspire`; legacy Learn URL → `aspire.dev` where present |
| `docs/site/tutorials/index.md` | edited | `.NET Aspire` → `Aspire`; legacy Learn URL → `aspire.dev` where present |
| `docs/site/tutorials/live-dashboard/01-scaffold.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/live-dashboard/01-scaffold.md` → no hits |
| `docs/site/tutorials/live-dashboard/02-contract-to-service.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/live-dashboard/02-contract-to-service.md` → no hits |
| `docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/live-dashboard/03-sdk-cache-first-query.md` → no hits |
| `docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/live-dashboard/04-definePage-QueryIsland.md` → no hits |
| `docs/site/tutorials/live-dashboard/05-live-stream.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/live-dashboard/05-live-stream.md` → no hits |
| `docs/site/tutorials/live-dashboard/06-deploy.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/live-dashboard/06-deploy.md` → no hits |
| `docs/site/tutorials/live-dashboard/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/live-dashboard/index.md` → no hits |
| `docs/site/tutorials/storefront/01-scaffold.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/storefront/01-scaffold.md` → no hits |
| `docs/site/tutorials/storefront/02-catalog-service.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/storefront/02-catalog-service.md` → no hits |
| `docs/site/tutorials/storefront/03-cart-contracts.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/storefront/03-cart-contracts.md` → no hits |
| `docs/site/tutorials/storefront/04-checkout-saga.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/storefront/04-checkout-saga.md` → no hits |
| `docs/site/tutorials/storefront/05-shipping-webhook.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/storefront/05-shipping-webhook.md` → no hits |
| `docs/site/tutorials/storefront/06-storefront-ui.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/storefront/06-storefront-ui.md` → no hits |
| `docs/site/tutorials/storefront/07-deploy.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/storefront/07-deploy.md` → no hits |
| `docs/site/tutorials/storefront/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/storefront/index.md` → no hits |
| `docs/site/tutorials/workspace/01-scaffold.md` | edited | `.NET Aspire` → `Aspire`; legacy Learn URL → `aspire.dev` where present |
| `docs/site/tutorials/workspace/02-auth.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/workspace/02-auth.md` → no hits |
| `docs/site/tutorials/workspace/03-workspace-data.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/workspace/03-workspace-data.md` → no hits |
| `docs/site/tutorials/workspace/04-provision-job.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/workspace/04-provision-job.md` → no hits |
| `docs/site/tutorials/workspace/05-route-authz.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/workspace/05-route-authz.md` → no hits |
| `docs/site/tutorials/workspace/06-deploy.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/workspace/06-deploy.md` → no hits |
| `docs/site/tutorials/workspace/index.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/tutorials/workspace/index.md` → no hits |
| `docs/site/web-layer/fresh-ui.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/web-layer/fresh-ui.md` → no hits |
| `docs/site/web-layer/how-to/build-a-desktop-frontend.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/web-layer/how-to/build-a-desktop-frontend.md` → no hits |
| `docs/site/web-layer/how-to/customize-fresh-ui.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/web-layer/how-to/customize-fresh-ui.md` → no hits |
| `docs/site/web-layer/query.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/web-layer/query.md` → no hits |
| `docs/site/web-layer/server.md` | no change needed | `git grep -nEi '\\.NET Aspire|learn\\.microsoft\\.com/dotnet/aspire|ai.assistant' -- docs/site/web-layer/server.md` → no hits |
| `docs/site/why.vto` | edited | `.NET Aspire` → `Aspire`; legacy Learn URL → `aspire.dev` where present |

## Pre-commit scope evidence

```text
$ git grep -n '\.NET Aspire' -- docs/site README.md CONTRIBUTING.md | grep -v '_plan/'
(no output; pipeline exit 1)

$ git grep -n 'https://learn.microsoft.com/dotnet/aspire/' -- docs/site README.md CONTRIBUTING.md | grep -v '_plan/'
(no output; pipeline exit 1)

$ git grep -n '13\.4\.6' -- docs/site/explanation/aspire.md docs/site/orchestration-runtime/how-to/deploy-local-aspire.md
docs/site/explanation/aspire.md:83: ... \"sdk\": { \"version\": \"13.4.6\" } ... \"Aspire.Hosting.PostgreSQL\": \"13.4.6\" ...
docs/site/orchestration-runtime/how-to/deploy-local-aspire.md:58:Aspire SDK version `13.4.6`.

$ git diff --check
(no output; exit 0)
```

## Implementation — S2 generated assets

```text
$ deno task gen:agent-docs-prose
Docs source format: OK
Site built into _site (638 files generated)
Rendered output: OK (homepage semantics; 227 HTML files; 4 documented-syntax allowances)
agent-docs provenance: sourceCommit=b835638e2, files=181,
sha256=4da2f64a678bbe6c3c2ef0aac0c92552954a50c59a0428fde1e439b27c66686d
exit 0

$ deno task gen:assets-barrel
Task gen:assets-barrel deno run --no-lock --allow-read --allow-write --allow-run=deno .llm/tools/generate-cli-assets-barrel.ts
exit 0

$ deno task gen:publish-assets
Task gen:publish-assets deno run --no-lock --allow-read --allow-write --allow-run=deno .llm/tools/generate-publish-assets.ts
exit 0
```

Rewritten outputs: `.llm/assets/agent-docs/prose.json.gz`,
`.llm/assets/agent-docs/provenance.json`,
`packages/cli/src/kernel/assets/agent-docs.generated.ts`, and
`packages/mcp/src/publish-assets.generated.ts`. Reconcile: all four are direct outputs of the
unconditional generator sequence specified by the slice; no source implementation was edited.

## Gate evidence

All commands were run from the repository root at `c632850c` unless a scoped retry is shown.

| Command | Exit | Decisive output |
| --- | ---: | --- |
| `deno task --cwd docs/site check:source-format` | 0 | `Docs source format: OK` |
| `deno task --cwd docs/site build` | 0 | `Site built into _site` (638 files); `Rendered output: OK` (227 HTML files) |
| `deno task --cwd docs/site check:links` | 0 | `35344 internal links across 227 pages — all resolve` |
| `deno task --cwd docs/site check:caveats` | 0 | `18 caveat markers across 14 pages — all references resolve` |
| `deno task --cwd docs/site diagrams:check` | 0 | after host-only Mermaid bootstrap: `rendered 16 diagram(s)`; `16 committed SVGs match Mermaid sources` |
| `deno task docs:links` | 0 | `docs=103 broken-links=0 broken-anchors=0 orphans=0` |
| `deno task docs:accuracy` | 0 | `docs accuracy: PASS` (199 published source pages; 181 shipped corpus files) |
| `deno task doc:lint` | 1 | task contract error: `--root is required`; exact requested command is not a valid invocation on this base (D-5) |
| `deno task doc:lint --root packages/cli --pretty` | 0 | 3 entrypoints; 0 private refs, missing JSDoc, or other errors |
| `deno task doc:lint --root packages/mcp --pretty` | 1 | existing private-type-ref findings in `cli.ts` and `mod.ts`; the changed generated publish-assets file is not an entrypoint and all three combined child exits are 0 (D-5) |
| `deno task check:agent-docs-prose` | 0 | `fresh: true`, `stalePaths: []`; source commit `b835638e2`; corpus SHA-256 `4da2f64a…c66686d` |
| `deno task check:assets-barrel` | 0 | generator rerun followed by zero diff on all enumerated generated barrels |
| `deno task check:publish-assets` | 0 | `gen:publish-assets --check` exited 0 |

The first two diagram attempts failed on host prerequisites (root-owned npm cache, then absent
Chromium/shared libraries/sandbox). The successful retry used Mermaid CLI 10.9.1 plus a temporary
Chromium and extracted runtime libraries under `/tmp`; no repository source, lock, or cache file was
changed. One run-owned 22,847,488-byte Chromium core dump was removed from `docs/site/core` after
the gate completed.

Final content assertions after gates:

```text
$ git grep -n '\.NET Aspire' -- docs/site README.md CONTRIBUTING.md | grep -v '_plan/'
(no output)
$ git grep -n 'https://learn.microsoft.com/dotnet/aspire/' -- docs/site README.md CONTRIBUTING.md | grep -v '_plan/'
(no output)
$ git grep -rniE 'ai.assistant' -- docs/site README.md
(no output)
$ git status --short
?? .llm/runs/docs-aspire-terminology--1723a/codex-thread-ids.md
```

The untracked thread-id artifact pre-existed implementation and is supervisor-owned; it was left
untouched and is not part of either slice.

## 2026-08-30 — IMPL-EVAL `FAIL_FIX` repair

S3 restores the AppHost contrast, adds the retroactive supervisor identity, and records D-7/D-8.
S4 regenerates only the four derived assets. In the final two-commit repair pair, S3 is `HEAD^` and
S4 is `HEAD`; the handoff reports their literal full SHAs. This relative notation keeps the
committed ledger truthful because a Git commit cannot contain its own final SHA.

| Command | Exit | Decisive output |
| --- | ---: | --- |
| `deno task --cwd docs/site check:source-format` | 0 | `Docs source format: OK` |
| `deno task --cwd docs/site build` | 0 | 638 files generated; rendered output OK across 227 HTML files |
| `deno task --cwd docs/site check:links` | 0 | 35,344 internal links across 227 pages all resolve |
| `deno task --cwd docs/site check:caveats` | 0 | 18 caveat markers across 14 pages all resolve |
| `deno task docs:links` | 0 | 103 docs; zero broken links, anchors, or orphans |
| `deno task docs:accuracy` | 0 | `docs accuracy: PASS` across 199 published pages and 181 corpus files |
| `deno task docs:snippets` | 0 | `docs snippets: PASS`; 581 scanned, zero malformed |
| `deno task docs:exports-drift` | 0 | `Exports & Symbols drift check: PASS` |
| `deno task check:agent-docs-prose` | 0 | `fresh: true`, `stalePaths: []`; source commit is S3 |
| `deno task check:assets-barrel` | 0 | generator completed and scoped `git diff --exit-code` stayed clean |
| `deno task check:publish-assets` | 0 | publish-assets `--check` completed with no stale paths |
| `deno task check:mcp-export-corpus` | 0 | schema 1 corpus emitted; 35 packages, 270 subpaths, 7,614 symbols |
| `deno check --unstable-kv packages/cli/src/kernel/assets/agent-docs.generated.ts packages/mcp/src/publish-assets.generated.ts` | 0 | both generated modules checked |

`diagrams:check` is not required for this repair delta: no `.mmd` or SVG changes were made. Root
`fmt:check` and `lint` do not govern the changed Markdown/run artifacts or these generated outputs;
the mutating root `deno task fmt` was not run.

Final invariant checks:

```text
$ git grep -n '\.NET Aspire' -- . ':!docs/site/_plan' ':!.llm'
.agents/docs/README.md:56:  aspire/                # .NET Aspire integration
packages/aspire/README.md:11:Orchestrating a polyglot workspace with .NET Aspire usually means writing against the Aspire SDK
resources/design/dashboard/reference/dashboard-design--orchestrator/design-prompts/01-shell-ia-routing.md:5:framework — a satellite that orbits the .NET Aspire dashboard (infra/telemetry) and Scalar

$ git grep -n '13\.4\.6' -- docs/site/explanation/aspire.md docs/site/orchestration-runtime/how-to/deploy-local-aspire.md
docs/site/explanation/aspire.md:83:    code: "{... \"sdk\": { \"version\": \"13.4.6\" } ... \"Aspire.Hosting.PostgreSQL\": \"13.4.6\" ...}"
docs/site/orchestration-runtime/how-to/deploy-local-aspire.md:58:Aspire SDK version `13.4.6`. The graph inside the AppHost is **derived from your installed

$ git status --porcelain
?? .llm/runs/docs-aspire-terminology--1723a/codex-thread-ids.md
?? .llm/runs/docs-aspire-terminology--1723a/impl-eval.md
```

The two untracked files are the protected evaluator evidence named in the repair brief. No generated
asset drift or unexpected product file remains, and `deno.lock` is unchanged.
