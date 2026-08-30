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
